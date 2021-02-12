import { derived } from "svelte/store";
import base64 from "base-64";
import { query } from './UIState'
import { buildResourcesQuery } from "./queries";

export function createHeaders(props = {}) {
  return new Headers({
    Authorization: `Basic ${base64.encode("mclemente:jJabHw7XEpsjd3JwJRjX")}`,
    "Content-Type": "Application/json",
    ...props,
  })
}

export const topicResult = derived(query, async ($query) => {
  const body = JSON.stringify({
    size: 10,
    query: {
      // TOOD: multi_match types best_fields, most_fields, cross_fields, phrase, phrase_prefix, bool_prefix
      // https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html
      // multi_match: {
      //   query,
      //   fields,
      //   type: "phrase",
      // },
      simple_query_string: {
        query: $query,
        fields: ['*'],
        default_operator: "and",
      },
    },
  });

  const response = await fetch(
    "https://es.data.slub-dresden.de/topics-explorativ/_search",
    {
      method: "POST",
      body,
      headers: createHeaders(),
    }
  );

  const result = await response.json();
  return result?.hits.hits ?? []
});

export const topicRessourcesResult = derived(topicResult, async ($topicResult) => {
  const topics = await $topicResult
  const names = topics.map((t) => t._source.preferredName);

  return names.length ? await multiSearch(names, '*') : null
});

export async function multiSearch(queries: string[], field: string) {
  if (!queries) {
    console.warn("no queries passed");
    return null;
  }

  const body = queries
    .map((q) => `{}\n${buildResourcesQuery(q, [field])}\n`)
    .join("");

  const response = await fetch(
    `https://es.data.slub-dresden.de/resources-explorativ/_msearch`,
    {
      method: "POST",
      body,
      headers: createHeaders({ "Content-Type": "Application/x-ndjson" }),
    }
  );

  const { took, responses } = await response.json();

  const result = new Map(
    queries.map((query, i) => {
      const { hits, aggregations } = responses[i];

      return [
        query,
        {
          resources: hits.total.value,
          topAuthors: aggregations.topAuthors.buckets.map(
            ({ key, doc_count }) => ({
              name: key.replace("https://data.slub-dresden.de/persons/", ""),
              docCount: doc_count,
            })
          ),
          datePublished: aggregations.datePublished.buckets.map(
            ({ key, key_as_string, doc_count }) => ({
              year: new Date(key).getFullYear(),
              count: doc_count,
            })
          ),
          mentions: aggregations.mentions.buckets.map(({ key, doc_count }) => ({
            name: key,
            docCount: doc_count,
          })),
        },
      ];
    })
  );

  return result;
}

