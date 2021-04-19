import { derived } from 'svelte/store';
import base64 from 'base-64';
import { compact, flatten, map, set, uniq, zip } from 'lodash';
import { query } from './uiState';
import {
  topicRelatedRessourcesQuery,
  topicRelatedRessourcesCountQuery,
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
  const response = await fetch(`${config.backend}/${backendpoint}?q=${query}`, {
    method: 'GET'
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
export const resourcesExact = derived(
  topicStore,
  ($topics, set) => {
    // array of topic names
    const topicIDs: string[] = uniq(map($topics, (t) => t.id));
    const topicNames: string[] = uniq(map($topics, 'name'));

    if (topicNames.length > 0) {
      // generate multiple queries from names
      const multiReq = multiQuery(
        topicNames,
        topicRelatedRessourcesFilterQuery,
        config.search.resources
      );

      search('resources', multiReq, Endpoint.msearch).then((result) => {
        const responses: ResourceAggResponse[] = result.responses;

        // relate responses with queries
        set(new Map(zip(topicNames, responses)));
      });
    } else {
      set(new Map());
    }
  },
  <Map<string, ResourceAggResponse>>new Map()
);

/**
 * Searches topic names in multiple fields of `resources` index and returns aggregations.
 */
export const resourcesLoose = derived(
  topicStore,
  ($topics, set) => {
    // array of topic names
    const topicNames: string[] = uniq(map($topics, 'name'));

    if (topicNames.length > 0) {
      // generate multiple queries from namesresult
      const multiReq = multiQuery(
        topicNames,
        topicRelatedRessourcesQuery,
        config.search.resources
      );

      search('resources', multiReq, Endpoint.msearch).then((result) => {
        const responses: ResourceAggResponse[] = result.responses;

        // relate responses with queries
        set(new Map(zip(topicNames, responses)));
      });
    } else {
      set(new Map());
    }
  },
  <Map<string, ResourceAggResponse>>new Map()
);

/**
 * Returns the number of ressources which contain the topic alternate name
 */
export const resourcesLooseByAltName = derived(
  topicStore,
  ($topics, set) => {
    const altNames: string[] = uniq(
      compact(flatten(map($topics, 'alternateName')))
    );

    if (altNames.length > 0) {
      // generate multiple queries and make broad search
      const multiReq = multiQuery(
        altNames,
        topicRelatedRessourcesCountQuery,
        config.search.resources
      );

      search('resources', multiReq, Endpoint.msearch).then((result) => {
        const responses: ResourceAggResponse[] = result.responses;

        // relate responses with queries
        set(new Map(zip(altNames, responses)));
      });
    } else {
      set(new Map());
    }
  },
  <Map<string, ResourceAggResponse>>new Map()
);

// TODO: similar to `getMentionsByIndex` function, could be combined
export const authorStore = derived(
  resourcesExact,
  ($resourcesExact, set) => {
    const aggregations = Array.from($resourcesExact.values());

    const ids = uniq(
      flatten(
        aggregations.map((agg) =>
          agg.aggregations.topAuthors.buckets.map((author) =>
            author.key.replace('https://data.slub-dresden.de/persons/', '')
          )
        )
      )
    );

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
  resourcesExact,
  ($resourcesExact, set) => {
    getMentionsByIndex<GeoES>('geo', $resourcesExact).then((places) => {
      set(places);
    });
  },
  <GeoES[]>[]
);

/**
 * Derived store contains topic-related topics (exact matching)
 */
export const relatedTopicStore = derived(
  resourcesExact,
  ($resourcesExact, set) => {
    getMentionsByIndex<TopicES>('topics', $resourcesExact).then((topics) => {
      set(topics);
    });
  },
  <TopicES[]>[]
);

/**
 * Derived store contains topic-related events (exact matching)
 */
export const eventStore = derived(
  resourcesExact,
  ($resourcesExact, set) => {
    getMentionsByIndex<EventES>('events', $resourcesExact).then((events) => {
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
