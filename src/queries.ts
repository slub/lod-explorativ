export function buildResourcesQuery(query: string, fields: string[]) {
    return JSON.stringify({
      size: 0,
      query: {
        simple_query_string: {
          query,
          fields,
          default_operator: "and",
        },
      },
      aggs: {
        topAuthors: {
          terms: {
            field: "author.@id.keyword",
            size: 10,
          },
        },
        datePublished: {
          date_histogram: {
            field: "datePublished.@value",
            calendar_interval: "year",
            min_doc_count: 1,
          },
        },
        mentions: {
          terms: {
            field: "mentions.name.keyword",
            size: 20,
          },
        },
      },
    });
  }
