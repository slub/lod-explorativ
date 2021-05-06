import { derived, get } from 'svelte/store';
import base64 from 'base-64';
import { flatten, map, uniq, zip } from 'lodash';
import { query, SearchMode, searchMode, queryExtension } from './uiState';
import { resourceMatrixQuery, resourceAggQuery } from '../queries/resources';
import { multiQuery } from '../queries/helper';
import type {
  Endpoint as EndpointType,
  GeoES,
  EventES as EventES,
  GetResponse,
  PersonGetResponse,
  ResourceAggResponse,
  TopicES,
  PersonES
} from '../types/es';
import type { Topic } from '../types/app';
import type { Endpoint as BackendpointType } from '../types/backend';
import { Endpoint } from '../types/es';
import { Endpoint as Backendpoint } from '../types/backend';
import config from '../config';
import { topicSearchQuery } from '../queries/topics';

/**
 * The dataStore listens to UI state changes and fetches new data if required.
 * It is also responsible for parsing and transforming the responses.
 */

const apiMethod = 'POST';

/**
 * Returns object with basic request headers
 *
 * @param props object of additional headers
 */
export function createHeaders(props = {}) {
  return new Headers({
    Authorization: `Basic ${base64.encode('mclemente:jJabHw7XEpsjd3JwJRjX')}`,
    'Content-Type': 'Application/json',
    ...props
  });
}

/**
 * Send search or get query to ElasticSearch
 *
 * @param index     Index name
 * @param query     ElasticSearch query
 * @param endpoint  ElasticSearch endpoint
 */
export async function search(
  index: string,
  query: Object | string,
  endpoint: EndpointType = Endpoint.search
) {
  const headers =
    endpoint === Endpoint.msearch
      ? { 'Content-Type': 'Application/x-ndjson' }
      : {};

  const body = typeof query === 'object' ? JSON.stringify(query) : query;

  const response = await fetch(
    `${config.esHost}/${index}-explorativ/_${endpoint}`,
    {
      method: 'POST',
      headers: createHeaders(headers),
      body
    }
  );

  const result = await response.json();

  return result;
}
/**
 *
 * @param backendpoint available backend endpoint
 * @param query        query string or ES query object
 * @returns            json result to the query
 */
export async function backendQuery(
  backendpoint: BackendpointType,
  query: Object | string,
  isPost: boolean
) {
  const queryString = !isPost ? `?${query}` : '';
  const url = `${config.backend}/${backendpoint}${queryString}`;

  const response = await fetch(url, {
    method: isPost ? 'POST' : 'GET',
    headers: createHeaders(),
    body: isPost
      ? typeof query === 'object'
        ? JSON.stringify(query)
        : query
      : null
  });

  const results = await response.json();
  return results;
}

/**
 * Searches topics with a given query
 */
export const topicStore = derived(
  query,
  ($query, set) => {
    set({ pending: true, items: get(topicStore).items });

    // TODO: remove ES query, will automatically switch to GET endpoint
    const isPost = apiMethod === 'POST';
    const q = isPost ? { body: topicSearchQuery($query) } : `q=${$query}`;

    backendQuery(Backendpoint.topicsearch, q, isPost).then((result) => {
      if (result.message) {
        console.warn(result.message);
      } else {
        set({ pending: false, items: result });
      }
    });
  },
  { pending: false, items: <Topic[]>[] }
);

/**
 * Searches topic names in `mentions.name` field of `resources` index and returns aggregations.
 */
export const aggregationStore = derived(
  [topicStore, queryExtension],
  ([$topicsStore, $queryExtension], set) => {
    // array of topic names

    const topics = $topicsStore.items;
    const isPending = $topicsStore.pending;
    const topicNames: string[] = uniq(map(topics, 'name'));

    if (!isPending && topicNames.length > 0) {
      let topicMatch;
      let phraseMatch;

      const queryArgs = {
        fields: config.search.resources,
        queryExtension: $queryExtension
      };

      // generate multiple queries from names
      const topicMatchQuery = multiQuery(topicNames, resourceAggQuery, {
        ...queryArgs,
        filter: true
      });

      const phraseMatchQuery = multiQuery(topicNames, resourceAggQuery, {
        ...queryArgs,
        filter: false
      });

      // const backendQuery = {
      //   queries: {
      //     topicMatch: resourceAggQuery('$subject', {
      //       ...queryArgs,
      //       filter: true
      //     }),
      //     phraseMatch: resourceAggQuery('$subject', {
      //       ...queryArgs,
      //       filter: false
      //     })
      //   },
      //   topics: topicNames
      // };

      // console.log(JSON.stringify(backendQuery, null, 2));

      const topicReq = search(
        'resources',
        topicMatchQuery,
        Endpoint.msearch
      ).then((result) => {
        const responses: ResourceAggResponse[] = result.responses;
        // relate responses with queries
        topicMatch = new Map(zip(topicNames, responses));
      });

      const phraseReq = search(
        'resources',
        phraseMatchQuery,
        Endpoint.msearch
      ).then((result) => {
        const responses: ResourceAggResponse[] = result.responses;
        phraseMatch = new Map(zip(topicNames, responses));
      });

      Promise.all([topicReq, phraseReq]).then(() => {
        set({
          phraseMatch,
          topicMatch
        });
      });
    }
  },
  <
    {
      phraseMatch: Map<string, ResourceAggResponse>;
      topicMatch: Map<string, ResourceAggResponse>;
    }
  >{ phraseMatch: new Map(), topicMatch: new Map() }
);

// TODO: similar to `getMentionsByIndex` function, could be combined
export const authorStore = derived(
  [aggregationStore],
  ([$aggs], set) => {
    const aggsLoose = Array.from($aggs.phraseMatch.values());
    const aggsExact = Array.from($aggs.topicMatch.values());

    const getAuthorIDs = (aggs) =>
      uniq(
        flatten(
          aggs.map((agg) =>
            agg.aggregations.topAuthors.buckets.map((author) =>
              author.key.replace('https://data.slub-dresden.de/persons/', '')
            )
          )
        )
      );

    const looseIDs = getAuthorIDs(aggsLoose);
    const exactIDs = getAuthorIDs(aggsExact);
    const ids = [...looseIDs, ...exactIDs];

    if (ids.length > 0) {
      // property name must be `ids`
      const body = {
        ids
      };

      search('persons', body, Endpoint.mget).then((result) => {
        const docs: PersonGetResponse[] = result.docs;

        // only return found persons
        const persons = docs.filter((pDoc) => pDoc.found).map((d) => d._source);

        set(persons);
      });
    } else {
      set([]);
    }
  },
  <PersonES[]>[]
);

/**
 * Helper function that uses IDs from aggregation results to request the contained entities
 *
 * @param index   Name of index
 * @param aggMap  ElasticSearch aggregation result
 * @param aggName Name of the aggregation to use
 * @returns index documents
 */
async function getMentionsByIndex<T>(
  index: string,
  aggMap: Map<string, ResourceAggResponse>,
  aggName: string = 'mentions'
): Promise<T[]> {
  const aggregations = Array.from(aggMap.values());

  const ids = uniq(
    flatten(
      aggregations.map((agg) =>
        agg.aggregations[aggName].buckets.map((mention) => mention.key)
      )
    )
  )
    .filter((x) => new RegExp(index).test(x))
    .map((x) => x.replace(`https://data.slub-dresden.de/${index}/`, ''));

  if (ids.length === 0) return [];

  // property name must be `ids`
  const body = {
    ids
  };

  const result = await search(index, body, Endpoint.mget);
  const docs: GetResponse[] = result.docs;

  const foundItems = docs.filter((pDoc) => pDoc.found).map((d) => d._source);

  return foundItems;
}

/**
 * Derived store contains topic-related places (exact matching)
 */
export const geoStore = derived(
  aggregationStore,
  ($aggs, set) => {
    getMentionsByIndex<GeoES>('geo', $aggs.topicMatch).then((places) => {
      set(places);
    });
  },
  <GeoES[]>[]
);

/**
 * Derived store contains topic-related topics (exact matching)
 */
export const mentionedTopicStore = derived(
  [aggregationStore, searchMode],
  ([$aggs, $mode], set) => {
    getMentionsByIndex<TopicES>(
      'topics',
      $mode === SearchMode.topic ? $aggs.topicMatch : $aggs.phraseMatch,
      'topMentionedTopics'
    ).then((topics) => {
      set(topics);
    });
  },
  <TopicES[]>[]
);

/**
 * Derived store contains topic-related events (exact matching)
 */
export const eventStore = derived(
  aggregationStore,
  ($aggs, set) => {
    getMentionsByIndex<EventES>('events', $aggs.topicMatch).then((events) => {
      set(events);
    });
  },
  <EventES[]>[]
);

/**
 * Derived store contains relations between primary and secondary topics
 */
export const topicRelationStore = derived(
  [query, queryExtension, topicStore, mentionedTopicStore],
  ([$query, $queryExtension, $topicsStore, $mentionedTopics], set) => {
    // array of topic names
    const topics = $topicsStore.items;
    const topicNames: string[] = map(topics, (t) => t.name);
    const mentionedNames = $mentionedTopics.map((t) => t.preferredName);
    const uniqNames = uniq([...topicNames, ...mentionedNames]);

    if (uniqNames.length > 0) {
      // generate multiple queries from names
      const req = resourceMatrixQuery(
        $query,
        uniqNames,
        config.search.resources,
        $queryExtension
      );

      search('resources', req, Endpoint.search).then(
        (result: ResourceAggResponse) => {
          set(result.aggregations.topicsAM.buckets);
        }
      );
    } else {
      set([]);
    }
  },
  []
);
