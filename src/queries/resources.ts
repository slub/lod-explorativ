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
      field: 'mentions.@id.keyword',
      // field: 'mentions.name.keyword',
      size: 20
    }
  }
};

export function topicRelatedRessourcesQuery(query: string, fields: string[]) {
  return {
    size: 0,
    query: {
      multi_match: {
        query,
        fields,
        type: 'phrase'
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
      multi_match: {
        query,
        fields,
        type: 'phrase'
      }
    }
  };
}

/**
 * Return an ES adjacency matrix query
 *
 * @param query search term
 * @param topicIDs list of topic names
 * @param fields fields in which to search `query`
 * @returns ES adjacency matrix query
 */
export function topicRelationsQuery(
  query: string,
  topicIDs: string[],
  fields: string[]
) {
  const filters = {};

  topicIDs.forEach(
    (ID) =>
      (filters[ID] = {
        terms: { 'mentions.name.keyword': [ID] }
      })
  );

  return {
    size: 0,
    query: {
      multi_match: {
        query,
        fields,
        type: 'phrase'
      }
    },
    aggs: {
      topicsAM: {
        adjacency_matrix: {
          filters
        }
      }
    }
  };
}
