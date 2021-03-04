const aggs = {
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
      // TODO: use id
      // field: 'mentions.@id.keyword',
      field: 'mentions.name.keyword',
      size: 20
    }
  }
};

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
    aggs
  };
}

export function topicRelatedRessourcesCountQuery(
  query: string,
  fields: string[]
) {
  return {
    size: 0,
    query: {
      simple_query_string: {
        query,
        fields,
        default_operator: 'and'
      }
    }
  };
}
