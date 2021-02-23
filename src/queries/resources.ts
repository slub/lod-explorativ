export function topicRelatedRessourcesQuery(query: string, fields: string[]) {
  return {
    size: 0,
    query: {
      simple_query_string: {
        query,
        fields,
        default_operator: 'and'
      }
    },
    aggs: {
      topAuthors: {
        terms: {
          field: 'author.@id.keyword',
          size: 10
        }
      },
      datePublished: {
        date_histogram: {
          field: 'datePublished.@value',
          calendar_interval: 'year',
          min_doc_count: 1
        }
      },
      mentions: {
        terms: {
          field: 'mentions.name.keyword',
          size: 20
        }
      }
    }
  };
}

/**
 *
 * @param queries list of queries
 * @param queryFn function returns sub query object
 * @param fields  fields in which to search
 */
export function multiQuery(
  queries: string[],
  queryFn: Function,
  fields: string[]
) {
  return queries
    .map((q) => `{}\n${JSON.stringify(queryFn(q, fields))}\n`)
    .join('');
}
