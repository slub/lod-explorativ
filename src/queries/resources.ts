import { take } from 'lodash';

const aggs = {
  topAuthors: {
    terms: {
      field: 'author.@id.keyword',
      size: 10
    }
  },
  datePublished: {
    auto_date_histogram: {
      field: 'datePublished.@value',
      buckets: 100,
      format: 'yyyy'
    }
  },
  mentions: {
    terms: {
      field: 'mentions.@id.keyword',
      size: 10
    }
  },
  topRelatedTopics: {
    terms: {
      field: 'mentions.@id.keyword',
      include: '.*topics.*',
      size: 10
    }
  },
  genres: {
    terms: {
      field: 'genre.Text.keyword',
      // TODO: set number of genres
      size: 20
      // TODO: should we add number of missing values?
      // missing: 'Ohne Angabe'
    }
  }
};

const sort = [
  '_score',
  {
    'datePublished.@value': {
      order: 'desc'
    }
  }
];

export function topicRelatedRessourcesFilterQuery(
  query: string,
  fields: string[]
) {
  return {
    size: 15,
    sort,
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query,
              fields,
              type: 'phrase'
            }
          }
        ],
        filter: [
          {
            term: {
              'mentions.name.keyword': query
            }
          }
        ]
      }
    },
    aggs
  };
}

export function topicRelatedRessourcesQuery(query: string, fields: string[]) {
  return {
    size: 15,
    sort,
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

  if (topicIDs.length > 100) {
    console.warn(
      `Adjacency matrix query is limited to 100 filters. ${topicIDs.length} filters where passed.`
    );
  }

  take(topicIDs, 100).forEach(
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
