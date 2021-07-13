import { derived } from 'svelte/store';
import base64 from 'base-64';
import { keys, map, orderBy, uniq, upperFirst } from 'lodash';
import { author, search as searchState, searchMode } from './uiState';
import { resourceMatrixQuery } from '../queries/resources';
import type { Topic } from '../types/app';
import type {
  BackendAggregation,
  Endpoint as BackendpointType
} from '../types/backend';
import { Endpoint as Backendpoint } from '../types/backend';
import type { Endpoint as EndpointESType } from '../types/es';
import { Endpoint as EndpointES, ResourceAggResponse } from '../types/es';
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
async function search(backendpoint: BackendpointType, query: Object | string) {
  const url = `${config.backend}/${backendpoint}?${query}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: createHeaders()
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
  searchState,
  ($search, set) => {
    const { query } = $search;

    search(Backendpoint.topicsearch, `q=${query}`).then((result) => {
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
  [topicStore, searchState, author],
  ([$topics, $search, $author], set) => {
    if ($topics.length > 0) {
      const params = new URLSearchParams();
      $topics.forEach((t) => {
        params.append('topics', t.name);
      });

      // TODO: add author
      params.set('restrict', $search.restrict || '');

      search(Backendpoint.aggregations, params.toString()).then((result) => {
        if (result.message) {
          console.warn(result.message);
        } else {
          set({ aggregation: result, topics: $topics });
        }
      });
    } else {
      set({ topics: [], aggregation: null });
    }
  },

  <{ aggregation: BackendAggregation; topics: Topic[] }>{
    aggregation: null,
    topics: []
  }
);

/**
 * Derived store contains relations between the selected and mentioned topics
 */
export const topicRelationStore = derived(
  [dataStore, searchState, searchMode],
  ([$dataStore, $search, $searchMode], set) => {
    const { topics, aggregation } = $dataStore;

    if (aggregation) {
      // array of topic names
      const topicsSorted = orderBy(topics, 'score', 'desc');
      let topicNames: string[] = map(topicsSorted, (t) => t.name);

      const quc = upperFirst($search.query);
      const selectedTopic = aggregation[$searchMode].subjects[quc];

      if (selectedTopic) {
        const mentions = keys(selectedTopic.aggs.topMentionedTopics);
        const mentionedNames = mentions.map(
          (id) => aggregation.entityPool.topics[id].name
        );
        topicNames = [...mentionedNames, ...topicNames].slice(0, 100);
      }

      // TODO: add mentioned names for all topics?
      // const mentionedNames = values(
      //   aggregation.entityPool.topics
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
