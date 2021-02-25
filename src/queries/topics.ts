export function topicSearchQuery(query: string) {
  return {
    size: 15,
    query: {
      // TOOD: multi_match types best_fields, most_fields, cross_fields, phrase, phrase_prefix, bool_prefix
      // https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html
      // multi_match: {
      //   query,
      //   fields: ['*'],
      //   // type: 'most_fields'
      // }
      simple_query_string: {
        query,
        fields: [
          'preferredName',
          'alternateName',
          'description',
          'additionalType.description',
          'additionalType.name'
        ],
        default_operator: 'and'
      }
    }
  };
}
