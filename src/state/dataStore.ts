import { derived } from 'svelte/store';
import base64 from 'base-64';
import { compact, flatten, map, uniq, zip } from 'lodash';
import { query } from './uiState';
import { topicSearchQuery } from '../queries/topics';
import {
  topicRelatedRessourcesQuery,
  topicRelatedRessourcesCountQuery
} from '../queries/resources';
import { multiQuery } from '../queries/helper';
import type {
  Endpoint as EndpointType,
  PersonSearchResult,
  ResourceAggResponse,
  Topic
} from '../types/es';
import { Endpoint } from '../types/es';
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
 * Searches topic names in `mentions.name` field of `resources` index and returns aggregations.
 */
export const topicRessourceExactAggregationRequest = derived(
  topicRequest,
  async ($topicResult) => {
    const topics = await $topicResult;

    // array of topic names
    const topicIDs: string[] = map(topics, (t) => t._source['@id']);

    // generate multiple queries from names
    const multiReq = multiQuery(topicIDs, topicRelatedRessourcesQuery, [
      'mentions.@id'
    ]);

    const responses: ResourceAggResponse[] = await msearch(
      'resources',
      multiReq
    );

    // relate responses with queries
    const resultMap = new Map(zip(topicIDs, responses));

    return resultMap;
  }
);

/**
 * Searches topic names in multiple fields of `resources` index and returns aggregations.
 */
export const topicRessourceAggregationRequest = derived(
  topicRequest,
  async ($topicResult) => {
    const topics = await $topicResult;

    // array of topic names
    const topicNames: string[] = map(topics, '_source.preferredName');

    // generate multiple queries from names
    const multiReq = multiQuery(
      topicNames,
      topicRelatedRessourcesQuery,
      config.search.resources
    );

    const responses: ResourceAggResponse[] = await msearch(
      'resources',
      multiReq
    );

    // relate responses with queries
    const resultMap = new Map(zip(topicNames, responses));

    return resultMap;
  }
);

/**
 * Returns for topics alternate names the number of ressources with the given name
 */
export const topicRessourceAltNameRequest = derived(
  topicRequest,
  async ($topicResult) => {
    const topics = await $topicResult;

    const altNames: string[] = compact(
      flatten(map(topics, '_source.alternateName'))
    );

    // generate multiple queries and make broad search
    const multiReq = multiQuery(
      altNames,
      topicRelatedRessourcesCountQuery,
      config.search.resources
    );

    const responses: ResourceAggResponse[] = await msearch(
      'resources',
      multiReq
    );

    // relate responses with queries
    return new Map(zip(altNames, responses));
  }
);

export const authorRequest = derived(
  topicRessourceExactAggregationRequest,
  async ($aggRequest) => {
    const aggs = await $aggRequest;

    // TODO: refactor
    const ids = uniq(
      flatten(
        Array.from(aggs.values()).map((agg) =>
          agg.aggregations.topAuthors.buckets.map((author) =>
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
