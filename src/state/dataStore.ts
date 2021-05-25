import { derived } from 'svelte/store';
import base64 from 'base-64';
import { keys, map, uniq } from 'lodash';
import { query, queryExtension, searchMode } from './uiState';
import { resourceAggQuery, resourceMatrixQuery } from '../queries/resources';
import type { Topic } from '../types/app';
import type {
  BackendAggregation,
  Endpoint as BackendpointType
} from '../types/backend';
import { Endpoint as Backendpoint } from '../types/backend';
import type { Endpoint as EndpointESType } from '../types/es';
import { Endpoint as EndpointES, ResourceAggResponse } from '../types/es';
import { topicSearchQuery } from '../queries/topics';
import config from '../config';

/**
 * The dataStore listens to UI state changes and fetches new data if required.
 * It is also responsible for parsing and transforming the responses.
 */

enum Method {
  POST = 'POST',
  GET = 'GET'
}

const apiMethod = Method.POST;

/**
 * Returns object with basic request headers
 *
 * @param props object of additional headers
 */
function createHeaders(props = {}) {
  return new Headers({
    Authorization: `Basic ${base64.encode('mclemente:jJabHw7XEpsjd3JwJRjX')}`,
    'Content-Type': 'Application/json',
    ...props
  });
}

/**
 *
 * @param backendpoint available backend endpoint
 * @param query        query string or ES query object
 * @returns            json result to the query
 */
async function search(
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
  endpoint: EndpointESType = EndpointES.search
) {
  const headers =
    endpoint === EndpointES.msearch
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
 * Searches topics with a given query
 */
const topicStore = derived(
  query,
  ($query, set) => {
    // TODO: remove ES query, will automatically switch to GET endpoint
    const q =
      apiMethod === Method.POST
        ? { body: topicSearchQuery($query) }
        : `q=${$query}`;

    search(Backendpoint.topicsearch, q, Method.POST).then((result) => {
      if (result.message) {
        console.warn(result.message);
      } else {
        set(result);
      }
    });
  },
  <Topic[]>[]
);

const dataStore = derived(
  [topicStore, queryExtension],
  ([$topics, $queryExtension], set) => {
    if ($topics.length > 0) {
      const queryArgs = {
        fields: config.search.resources,
        queryExtension: $queryExtension
      };

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
        topics: uniq(map($topics, 'name'))
      };

      search(Backendpoint.aggregations, backendQuery, apiMethod).then(
        (result) => {
          set({ aggregation: result, topics: $topics });
        }
      );
    } else {
      set(null);
    }
  },

  <{ aggregation: BackendAggregation; topics: Topic[] }>null
);

/**
 * Derived store contains relations between the selected and mentioned topics
 */
export const topicRelationStore = derived(
  [dataStore, query, searchMode],
  ([$dataStore, $query, $searchMode], set) => {
    if ($dataStore) {
      // array of topic names
      let topicNames: string[] = map($dataStore.topics, (t) => t.name);

      const selectedTopic =
        $dataStore.aggregation[$searchMode].subjects[$query];

      if (selectedTopic) {
        const mentions = keys(selectedTopic.aggs.topMentionedTopics);
        const mentionedNames = mentions.map(
          (id) => $dataStore.aggregation.entityPool.topics[id].name
        );
        topicNames = [...topicNames, ...mentionedNames];
      }

      // TODO: add mentioned names for all topics?
      // const mentionedNames = values(
      //   $dataStore.aggregation.entityPool.topics
      // ).map((t) => t.name);

      if (topicNames.length > 0) {
        // generate multiple queries from names
        const req = resourceMatrixQuery(uniq(topicNames), $searchMode);

        esSearch('resources', req, EndpointES.search).then(
          (result: ResourceAggResponse) => {
            set(result.aggregations.topicsAM.buckets);
          }
        );
      } else {
        set([]);
      }
    }
  },
  <{ key: string; doc_count: number }[]>[]
);

export default dataStore;
