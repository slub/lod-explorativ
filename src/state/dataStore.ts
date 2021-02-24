import { derived } from 'svelte/store';
import base64 from 'base-64';
import { flatten, uniq } from 'lodash';
import { query } from './uiState';
import { topicSearchQuery } from '../queries/topics';
import { topicRelatedRessourcesQuery } from '../queries/resources';
import { multiQuery } from '../queries/helper';
import type {
  Endpoint as EndpointType,
  PersonSearchResult,
  ResourceAggResponse,
  Topic
} from '../types/es';
import { Endpoint } from '../types/es';
import type { TopicMeta } from '../types/app';
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

export async function search(
  index: string,
  body: object,
  endpoint: EndpointType = Endpoint.search
) {
  const response = await fetch(
    `${config.esHost}/${index}-explorativ/_${endpoint}`,
    {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(body)
    }
  );

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
export const topicRequest = derived(query, async ($query) => {
  const request = topicSearchQuery($query);
  const result = await search('topics', request);

  return <Topic[]>(result?.hits.hits ?? []);
});

/**
 * Retrieves topic-related information from `resource` index and enriches topics
 */
export const topicRessourceRequest = derived(
  topicRequest,
  async ($topicResult) => {
    const topics = await $topicResult;

    // array of topic names
    const topicNames = topics.map((t) => {
      const { preferredName, alternateName } = t._source;
      return preferredName;
      // TODO: results would be more specific when searching for the alternateName
      return alternateName ? alternateName[0] : preferredName;
    });

    if (topicNames.length === 0) return new Map();

    // generate multiple queries from names
    // TODO: make fields interactive
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
        topAuthors: aggregations.topAuthors.buckets,
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

export const authorRequest = derived(
  topicRessourceRequest,
  async ($aggRequest) => {
    const aggs = await $aggRequest;
    const entries = Array.from(aggs);

    // TODO: refactor
    const ids = uniq(
      flatten(
        Array.from(aggs.values()).map((agg) =>
          agg.topAuthors.map((author) =>
            author.key.replace('https://data.slub-dresden.de/persons/', '')
          )
        )
      )
    );

    if (ids.length === 0) return [];

    // property name must be `ids`
    const body = {
      ids
    };

    const result = await search('persons', body, Endpoint.mget);
    const docs: PersonSearchResult[] = result.docs;

    // only return found persons
    const persons = docs.filter((pDoc) => pDoc.found).map((d) => d._source);

    return persons;
  }
);
