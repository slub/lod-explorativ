import { derived } from 'svelte/store';
import base64 from 'base-64';
import { flatten, map, uniq, zip } from 'lodash';
import { query } from './uiState';
import {
  topicRelatedRessourcesQuery,
  topicRelationsQuery,
  topicRelatedRessourcesFilterQuery
} from '../queries/resources';
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
 * @param query        querystring
 * @returns            json result to the query
 */
export async function backendQuery(
  backendpoint: BackendpointType,
  query: string
) {
  const body = topicSearchQuery(query);

  const response = await fetch(`${config.backend}/${backendpoint}?q=${query}`, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify({ body })
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
    backendQuery(Backendpoint.topicsearch, $query).then((result) => {
      if (result.message) {
        console.warn(result.message);
      } else {
        set(result);
      }
    });
  },
  <Topic[]>[]
);

/**
 * Searches topic names in `mentions.name` field of `resources` index and returns aggregations.
 */
export const aggregationStore = derived(
  topicStore,
  ($topics, set) => {
    // array of topic names

    const topicNames: string[] = uniq(map($topics, 'name'));

    if (topicNames.length > 0) {
      // generate multiple queries from names
      const topicMatchQuery = multiQuery(
        topicNames,
        topicRelatedRessourcesFilterQuery,
        config.search.resources
      );

      const phraseMatchQuery = multiQuery(
        topicNames,
        topicRelatedRessourcesQuery,
        config.search.resources
      );

      let topicMatch;
      let phraseMatch;

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
 * @param index name of index
 * @param aggMap ElasticSearch aggregation result
 * @returns index documents
 */
async function getMentionsByIndex<T>(
  index: string,
  aggMap: Map<string, ResourceAggResponse>
): Promise<T[]> {
  const aggregations = Array.from(aggMap.values());

  const ids = uniq(
    flatten(
      aggregations.map((agg) =>
        agg.aggregations.mentions.buckets.map((mention) => mention.key)
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
export const relatedTopicStore = derived(
  aggregationStore,
  ($aggs, set) => {
    getMentionsByIndex<TopicES>('topics', $aggs.topicMatch).then((topics) => {
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
  [query, topicStore, relatedTopicStore],
  ([$query, $topics, $topicsRelatedMGetRequest], set) => {
    // array of topic names
    const topicNames: string[] = map($topics, (t) => t.name);
    const relatedNames = $topicsRelatedMGetRequest.map((t) => t.preferredName);
    const uniqNames = uniq([...topicNames, ...relatedNames]);

    if (uniqNames.length > 0) {
      // generate multiple queries from names
      const req = topicRelationsQuery(
        $query,
        uniqNames,
        config.search.resources
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
