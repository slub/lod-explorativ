import { derived, writable } from 'svelte/store';
import { keys, map, orderBy, upperFirst } from 'lodash';
import { author, search as searchState, searchMode } from './uiState';
import type { Topic } from '../types/app';
import type {
  BackendAggregation,
  Endpoint as BackendpointType
} from '../types/backend';
import { Endpoint as Backendpoint } from '../types/backend';
import config from '../config';

/**
 * The dataStore listens to UI state changes and fetches new data if required.
 * It is also responsible for parsing and transforming the responses.
 */

function getParams(values: string[], name: string) {
  const params = new URLSearchParams();
  values.forEach((val) => {
    params.append(name, val);
  });

  return params.toString();
}

/**
 *
 * @param backendpoint available backend endpoint
 * @param query        query string or ES query object
 * @returns            json result to the query
 */
async function search(backendpoint: BackendpointType, query: string) {
  const url = `${config.backend}/${backendpoint}?${query}`;
  const response = await fetch(url);
  const results = await response.json();

  return results;
}

export const topicsPending = writable(false);
export const aggregationsPending = writable(false);
export const correlationsPending = writable(false);

/**
 * Searches topics with a given query
 */
export const topicStore = derived(
  searchState,
  ($search, set) => {
    const { query } = $search;

    const fieldParams = getParams(config.topicSearchFields, 'fields');

    topicsPending.set(true);
    search(Backendpoint.topicsearch, `q=${query}&size=20&${fieldParams}`).then(
      (result) => {
        if (result.message) {
          console.warn(result.message);
        } else {
          set(result);
        }
        topicsPending.set(false);
      }
    );
  },
  <Topic[]>[]
);

const dataStore = derived(
  [topicStore, searchState, author],
  ([$topics, $search, $author], set) => {
    if ($topics.length > 0) {
      let queryString = getParams(
        $topics.map((t) => t.name),
        'topics'
      );

      if ($search.restrict) {
        queryString += `&restrict=${$search.restrict}`;
      }

      if ($author) {
        queryString += `&author=${$author}`;
      }

      aggregationsPending.set(true);
      search(Backendpoint.aggregations, queryString).then((result) => {
        if (result.message) {
          console.warn(result.message);
        } else {
          set({ aggregation: result, topics: $topics });
        }
        aggregationsPending.set(false);
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

      if (topicNames.length > 0) {
        // generate multiple queries from names
        const params = getParams(topicNames, 'topics');

        correlationsPending.set(true);
        search(Backendpoint.correlations, params).then((result) => {
          const relationMap = result[$searchMode].topicAM;
          set(Object.entries(relationMap));
          correlationsPending.set(false);
        });
      } else {
        set([]);
      }
    }
  },
  <[key: string, doc_count: number][]>[]
);

export default dataStore;
