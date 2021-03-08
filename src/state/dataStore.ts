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
  GeoGetResponse,
  PersonGetResponse,
  ResourceAggResponse,
  TopicGetResponse,
  TopicSearchResponse
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
 * Searches topics with a given query
 */
export const topicSearchRequest = derived(query, async ($query) => {
  const request = topicSearchQuery($query);
  const result = await search('topics', request);

  return <TopicSearchResponse[]>(result?.hits.hits ?? []);
});

/**
 * Searches topic names in `mentions.name` field of `resources` index and returns aggregations.
 */
export const resourcesExactMSearchRequest = derived(
  topicSearchRequest,
  async ($topicResult) => {
    const topics = await $topicResult;

    // array of topic names
    const topicIDs: string[] = map(topics, (t) => t._source['@id']);

    // generate multiple queries from names
    const multiReq = multiQuery(topicIDs, topicRelatedRessourcesQuery, [
      'mentions.@id'
    ]);

    const result = await search('resources', multiReq, Endpoint.msearch);
    const responses: ResourceAggResponse[] = result.responses;

    // relate responses with queries
    return new Map(zip(topicIDs, responses));
  }
);

/**
 * Searches topic names in multiple fields of `resources` index and returns aggregations.
 */
export const resourcesLooseMSearchRequest = derived(
  topicSearchRequest,
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

    const result = await search('resources', multiReq, Endpoint.msearch);
    const responses: ResourceAggResponse[] = result.responses;

    // relate responses with queries
    return new Map(zip(topicNames, responses));
  }
);

/**
 * Returns for topics alternate names the number of ressources with the given name
 */
export const resourcesAltMSearchRequest = derived(
  topicSearchRequest,
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

    const result = await search('resources', multiReq, Endpoint.msearch);
    const responses: ResourceAggResponse[] = result.responses;

    // relate responses with queries
    return new Map(zip(altNames, responses));
  }
);

export const authorMGetRequest = derived(
  resourcesExactMSearchRequest,
  async ($aggRequest) => {
    const aggMap = await $aggRequest;
    const aggregations = Array.from(aggMap.values());

    const ids = uniq(
      flatten(
        aggregations.map((agg) =>
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
    const docs: PersonGetResponse[] = result.docs;

    // only return found persons
    const persons = docs.filter((pDoc) => pDoc.found).map((d) => d._source);

    return persons;
  }
);

export const geoMGetRequest = derived(
  resourcesExactMSearchRequest,
  async ($aggRequest) => {
    const aggMap = await $aggRequest;
    const aggregations = Array.from(aggMap.values());

    const ids = uniq(
      flatten(
        aggregations.map((agg) =>
          agg.aggregations.mentions.buckets.map((mention) => mention.key)
        )
      )
    )
      .filter((x) => /geo/.test(x))
      .map((x) => x.replace('https://data.slub-dresden.de/geo/', ''));

    if (ids.length === 0) return [];

    // property name must be `ids`
    const body = {
      ids
    };

    const result = await search('geo', body, Endpoint.mget);
    const docs: GeoGetResponse[] = result.docs;

    const places = docs.filter((pDoc) => pDoc.found).map((d) => d._source);

    return places;
  }
);

export const topicsRelatedMGetRequest = derived(
  resourcesExactMSearchRequest,
  async ($aggRequest) => {
    const aggMap = await $aggRequest;
    const aggregations = Array.from(aggMap.values());

    const ids = uniq(
      flatten(
        aggregations.map((agg) =>
          agg.aggregations.mentions.buckets.map((mention) => mention.key)
        )
      )
    )
      .filter((x) => /topics/.test(x))
      .map((x) => x.replace('https://data.slub-dresden.de/topics/', ''));

    if (ids.length === 0) return [];

    // property name must be `ids`
    const body = {
      ids
    };

    const result = await search('topics', body, Endpoint.mget);
    const docs: TopicGetResponse[] = result.docs;

    const topics = docs.filter((pDoc) => pDoc.found).map((d) => d._source);

    return topics;
  }
);
