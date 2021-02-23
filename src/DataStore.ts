import { derived } from 'svelte/store';
import base64 from 'base-64';
import { query } from './uiState';
import {
  multiQuery,
  topicRelatedRessourcesQuery,
  topicSearchQuery
} from './queries';
import config from './config';
import type { ResourceAggResponse, Topic } from './esTypes';
import type { TopicMeta } from './appTypes';

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

export async function search(index: string, body: object) {
  const response = await fetch(`${config.esHost}/${index}-explorativ/_search`, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify(body)
  });

  const result = await response.json();

  return result;
}

export async function msearch(index: string, body: string) {
  const response = await fetch(
    `${config.esHost}/${index}-explorativ/_msearch`,
    {
      method: 'POST',
      headers: createHeaders({ 'Content-Type': 'Application/x-ndjson' }),
      body
    }
  );

  const { responses } = await response.json();

  return responses;
}

/**
 * Searches topics with a given query
 */
export const topicResult = derived(query, async ($query) => {
  const request = topicSearchQuery($query);
  const result = await search('topics', request);

  return <Topic[]>(result?.hits.hits ?? []);
});

/**
 * Retrieves topic-related information from `resource` index and enriches topics
 */
export const topicRelatedRessources = derived(
  topicResult,
  async ($topicResult) => {
    const topics = await $topicResult;

    // array of topic names
    const topicNames = topics.map((t) => t._source.preferredName);

    // generate multiple queries from names
    const multiReq = multiQuery(topicNames, topicRelatedRessourcesQuery, ['*']);

    const responses: ResourceAggResponse[] = await msearch(
      'resources',
      multiReq
    );

    // responses do not contain the query
    // that is why we relate the queries with the results before returning anything
    const mapEntries: [string, TopicMeta][] = topicNames.map((topicName, i) => {
      const res = responses[i];
      const { hits, aggregations } = res;
      const meta = {
        resourcesCount: hits.total.value,
        topAuthors: aggregations.topAuthors.buckets.map(
          ({ key, doc_count }) => ({
            name: key.replace('https://data.slub-dresden.de/persons/', ''),
            docCount: doc_count
          })
        ),
        datePublished: aggregations.datePublished.buckets.map(
          ({ key, key_as_string, doc_count }) => ({
            year: new Date(key).getFullYear(),
            count: doc_count
          })
        ),
        mentions: aggregations.mentions.buckets.map(({ key, doc_count }) => ({
          name: key,
          docCount: doc_count
        }))
      };

      return [topicName, meta];
    });

    return new Map(mapEntries);
  }
);
