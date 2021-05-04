import { compact, take } from 'lodash';

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
  topMentionedTopics: {
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

function phraseCondition(queries, fields) {
  return compact(queries).map((query) => ({
    multi_match: {
      query,
      fields,
      type: 'phrase'
    }
  }));
}

function filterCondition(queries) {
  return compact(queries).map((query) => ({
    term: {
      'mentions.name.keyword': query
    }
  }));
}

export function resourceAggQuery(
  query: string,
  args: {
    fields: string[];
    queryExtension: string;
    filter: boolean;
  }
) {
  const { queryExtension, fields, filter } = args;
  return {
    size: 15,
    sort,
    query: {
      bool: {
        // add both query terms not only as filter, but also as phrase query to enable scoring
        must: phraseCondition([query, queryExtension], fields),
        filter: filter ? filterCondition([query, queryExtension]) : null
      }
    },
    aggs
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
export function resourceMatrixQuery(
  query: string,
  topicIDs: string[],
  fields: string[],
  queryExtension: string
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
      bool: {
        must: phraseCondition([query, queryExtension], fields)
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
