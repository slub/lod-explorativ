import { take } from 'lodash';

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
      size: 10
    }
  },
  genres: {
    terms: {
      field: 'genre.Text.keyword',
      size: 40,
      missing: 'Ohne Angabe'
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
