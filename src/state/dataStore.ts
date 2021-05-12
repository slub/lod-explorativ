import { derived, get, writable } from 'svelte/store';
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

enum Method {
  POST = 'POST',
  GET = 'GET'
}

const apiMethod = Method.POST;

const topicsPending = writable(false);
const aggsPending = writable(false);

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
export async function esSearch(
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
export async function backendSearch(
  backendpoint: BackendpointType,
  query: Object | string,
  method: Method
) {
  const isPost = method === Method.POST;
  const queryString = isPost ? '' : `?${query}`;
  const url = `${config.backend}/${backendpoint}${queryString}`;

  const response = await fetch(url, {
    method,
    headers: createHeaders(),
    body: isPost ? JSON.stringify(query) : null
  });

  const results = await response.json();
  return results;
}

export const isPending = derived(
  [topicsPending, aggsPending],
  ([$topicsPending, $aggsPending]) => {
    console.log(
      'STORE: pending, topics:',
      $topicsPending,
      'aggs:',
      $aggsPending
    );
    return [$topicsPending, $aggsPending].some((x) => x === true);
  }
);

/**
 * Searches topics with a given query
 */
export const topicStore = derived(
  query,
  ($query, set) => {
    topicsPending.set(true);
    console.log('STORE: requesting topics, query:', $query);
    // TODO: remove ES query, will automatically switch to GET endpoint

    const q =
      apiMethod === Method.POST
        ? { body: topicSearchQuery($query) }
        : `q=${$query}`;

    backendSearch(Backendpoint.topicsearch, q, Method.POST).then((result) => {
      if (result.message) {
        console.warn(result.message);
      } else {
        set(result);
        topicsPending.set(false);
        console.log('STORE: received topics', result.length);
      }
    });
  },
  <Topic[]>[]
);

/**
 * Searches topic names in `mentions.name` field of `resources` index and returns aggregations.
 */
export const aggregationStore = derived(
  [topicStore, queryExtension, topicsPending],
  ([$topicsStore, $queryExtension, $topicsPending], set) => {
    // array of topic names

    const topics = $topicsStore;
    const topicNames: string[] = uniq(map(topics, 'name'));

    if (!$topicsPending && topicNames.length > 0) {
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

      // TODO: use backend
      const backendQuery = {
        queryTemplate: {
          topicMatch: resourceAggQuery('$subject', {
            ...queryArgs,
            filter: true
          }),
          phraseMatch: resourceAggQuery('$subject', {
            ...queryArgs,
            filter: false
          })
        },
        topics: topicNames
      };

      console.log('STORE: requesting aggregations');
      aggsPending.set(true);
      const topicReq = esSearch(
        'resources',
        topicMatchQuery,
        Endpoint.msearch
      ).then((result) => {
        const responses: ResourceAggResponse[] = result.responses;
        // relate responses with queries
        topicMatch = new Map(zip(topicNames, responses));
      });

      const phraseReq = esSearch(
        'resources',
        phraseMatchQuery,
        Endpoint.msearch
      ).then((result) => {
        const responses: ResourceAggResponse[] = result.responses;
        phraseMatch = new Map(zip(topicNames, responses));
      });

      // console.log(backendQuery);
      // backendSearch(Backendpoint.aggregations, backendQuery, apiMethod).then(
      //   (result) => {
      //     console.log('STORE: INTEGRATION TEST', result);
      //   }
      // );

      Promise.all([topicReq, phraseReq]).then(() => {
        console.log('STORE: received aggregations', topicNames.length);
        aggsPending.set(false);
        set({
          phraseMatch,
          topicMatch
        });
      });
    } else {
      console.log('STORE: Aggregations waiting for topic results');
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

      esSearch('persons', body, Endpoint.mget).then((result) => {
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

  const result = await esSearch(index, body, Endpoint.mget);
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
    const topics = $topicsStore;
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

      esSearch('resources', req, Endpoint.search).then(
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
