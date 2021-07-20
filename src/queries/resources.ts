import { compact, take } from 'lodash';
import config from '../config';
import type { SearchMode as SearchModeType } from '../state/uiState';
import { SearchMode } from '../state/uiState';

const aggs = {
  topAuthors: {
    terms: {
      field: 'author.@id.keyword',
      size: 10
    }
  },
  topContributors: {
    terms: {
      field: 'contributor.@id.keyword',
      size: 10
    }
  },
  datePublished: {
    // auto_date_histogram: {
    //   field: 'datePublished.@value',
    //   buckets: 100,
    //   format: 'yyyy'
    // }
    date_histogram: {
      field: 'datePublished.@value',
      calendar_interval: 'year',
      min_doc_count: 1
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
      size: 20
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
    author: string;
  }
) {
  const { queryExtension, fields, filter, author } = args;
  return {
    size: 15,
    sort,
    query: {
      bool: {
        // add both query terms not only as filter, but also as phrase query to enable scoring
        must: phraseCondition([query, queryExtension], fields),
        filter: compact([
          ...(filter ? filterCondition([query, queryExtension]) : []),
          author
            ? {
                multi_match: {
                  fields: ['author.name.keyword', 'contributor.name.keyword'],
                  query: author
                }
              }
            : null
          // ,{
          //   range: {
          //     'datePublished.@value': {
          //       gte: 1860,
          //       lte: 2000
          //     }
          //   }
          // },
        ])
        // must_not: {
        //   terms: {
        //     'genre.Text.keyword': ['Konferenzschrift', 'Hochschulschrift']
        //   }
        // }
      }
    },
    aggs
  };
}

/**
 * Return an ES adjacency matrix query
 *
 * @param topics      list of topic names
 * @param searchMode  phrase or topic match
 * @returns           ES adjacency matrix query
 */
export function resourceMatrixQuery(
  topics: string[],
  searchMode: SearchModeType
) {
  const filters = {};

  if (topics.length > 100) {
    console.warn(
      `Adjacency matrix query is limited to 100 filters. ${topics.length} filters where passed.`
    );
  }

  take(topics, 100).forEach((ID) => {
    const filter =
      searchMode === SearchMode.topic
        ? { terms: { 'mentions.name.keyword': [ID] } }
        : {
            multi_match: {
              query: ID,
              fields: config.search.resources,
              type: 'phrase'
            }
          };
    filters[ID] = filter;
  });

  return {
    size: 0,
    aggs: {
      topicsAM: {
        adjacency_matrix: {
          filters
        }
      }
    }
  };
}
