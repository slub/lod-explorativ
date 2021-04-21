export function topicSearchQuery(query: string) {
  return {
    size: 15,
    query: {
      //  TODO: replace by multi_match?
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
