export function topicSearchQuery(query: string) {
  return {
    size: 15,
    query: {
      multi_match: {
        query,
        fields: [
          'preferredName^2',
          'alternateName',
          'description',
          'additionalType.description',
          'additionalType.name'
        ],
        type: 'phrase'
      }
    }
  };
}
