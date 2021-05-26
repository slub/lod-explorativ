import { derived } from 'svelte/store';
import {
  compact,
  countBy,
  debounce,
  entries,
  flatMap,
  keys,
  orderBy,
  pick,
  round,
  toPairs,
  uniqBy,
  values
} from 'lodash';
import {
  GraphLink,
  GraphNode,
  Topic,
  NodeType,
  LinkType,
  DatePublished
} from '../types/app';
import dataStore, { topicRelationStore } from './dataStore';
import { query, queryExtension, searchMode } from './uiState';
import type { Subject, Resource } from '../types/backend';
import { areEqual } from '../utils';

const { PRIMARY_NODE, SECONDARY_NODE, AUTHOR_NODE } = NodeType;

/**
 * The dataAPI combines the results of the DataStore and provides the UI components with data.
 */

// TODO: debouncing shouldn't be necessary anymore if we get atomic updates from the server
const waitTopics = 100;
const waitGraph = 500;
let debounceTopics;
let debounceGraph;

/**
 * Returns all additionalTypes derived from topics
 */
export const additionalTypes = derived(
  dataStore,
  ($dataStore, set) => {
    const { topics } = $dataStore;

    const types = flatMap(topics, (topic) =>
      topic.additionalTypes.map((type) => type.name)
    );
    const counts = countBy(types);
    const sortedPairs = orderBy(toPairs(counts), '1', 'desc');
    const selection = sortedPairs.slice(0, 10);

    set(selection);
  },
  <[key: string, count: number][]>{}
);

/**
 * Replaces references to entities of different indices with real entity objects
 *
 * @param subject          ElasticSearch aggregation result
 * @param entityList    List of entity objects
 * @param aggName       Name of the aggregation
 */
function getEntities<T>(
  subject: Subject,
  entityList: T[],
  aggName: string
): Map<T, number> {
  if (!subject) return null;

  const agg = subject.aggs[aggName];
  const entries: [T, number][] = compact(
    Object.entries(agg).map(([key, doc_count]) => {
      const entity = entityList[key];
      if (!entity) return null;
      return [entity, doc_count];
    })
  );

  return new Map(entries);
}

/** Combines results from topic search in topic index and associated resources in resource index */
export const topicsEnriched = derived(
  [dataStore, searchMode],
  ([$dataStore, $searchMode], set) => {
    const { aggregation } = $dataStore;

    // init debounced setter
    if (!debounceTopics) {
      debounceTopics = debounce((x) => {
        set(x);
      }, waitTopics);
    }

    if (aggregation) {
      const aggs = aggregation[$searchMode].subjects;
      const entities = aggregation.entityPool;

      const merged = $dataStore.topics.map((topic) => {
        const agg = aggs[topic.name];
        // create topic model
        const enrichedTopic: Topic = {
          ...topic,
          count: agg.docCount,
          // aggregations: aggTopicMatch ? convertAggs(aggTopicMatch) : null,
          // aggregationsLoose: aggPhraseMatch
          //   ? convertAggs(aggPhraseMatch)
          //   : null,
          datePublished: entries(agg.aggs.datePublished).map(
            ([year, count]) => {
              const date: DatePublished = { year: parseInt(year), count };
              return date;
            }
          ),
          authors: getEntities(agg, entities.persons, 'topAuthors'),
          // locations: getEntities(agg, entities.geo, 'mentions'),
          related: getEntities(agg, entities.topics, 'topMentionedTopics')
          // events: getEntities(agg, entities.events, 'mentions')
        };

        return enrichedTopic;
      });

      debounceTopics(merged);
    } else {
      console.log('API: waiting for topics');
    }
  },
  <Topic[]>[]
);

export const relationsCount = derived(topicRelationStore, ($relations) => {
  const matrix = {};

  $relations.forEach(({ key, doc_count }) => {
    const [source, t] = key.split('&');
    const target = t || source;

    if (!matrix[source]) matrix[source] = {};
    if (!matrix[target]) matrix[target] = {};

    matrix[source][target] = doc_count;
    matrix[target][source] = doc_count;
  });

  return matrix;
});

export const relationsMeetMin = derived(relationsCount, ($relations) => {
  const matrix = {};

  for (let source in $relations) {
    if (!matrix[source]) matrix[source] = {};

    for (let target in $relations[source]) {
      if (!matrix[target]) matrix[target] = {};

      // only calculate values for half of matrix (matrix is symmetric)
      if (!matrix[source][target]) {
        matrix[source][target] = {};
        if (!matrix[target][source]) matrix[target][source] = {};

        const sourceCount = $relations[source][source];
        const targetCount = $relations[target][target];
        const intersect = $relations[source][target];
        const score = round(intersect / Math.min(sourceCount, targetCount), 2);

        matrix[source][target] = matrix[target][source] = score;
      }
    }
  }

  console.table(matrix);

  return matrix;
});

/**
 * Returns graph structure for the visualization
 */
export const graph = derived(
  [topicsEnriched, query, queryExtension, relationsMeetMin],
  ([$topicsEnriched, $query, $queryExtension, $relations], set) => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    let relatedTopics: { name: string; count: number }[] = [];

    // create nodes for all top-level topics and collect related topics
    $topicsEnriched.forEach((primaryTopic) => {
      const { name, count, related, authors, datePublished } = primaryTopic;

      if (count > 0) {
        // create graph node
        const primaryNode: GraphNode = {
          id: name,
          count,
          doc: primaryTopic,
          type: PRIMARY_NODE,
          text: name,
          datePublished
        };

        nodes.push(primaryNode);

        // create author nodes
        if (areEqual(name, $query) || areEqual(name, $queryExtension)) {
          const a = authors.entries();
          for (let [author, count] of a) {
            let node = nodes.find((n) => n.id === author.name);

            if (!node) {
              const authorNode: GraphNode = {
                id: name,
                count,
                doc: primaryTopic,
                type: AUTHOR_NODE,
                text: name.split(',')[0],
                datePublished: null
              };

              nodes.push(authorNode);
              node = authorNode;
            }

            // link author to topic
            // const link: GraphLink = {
            //   id: primaryNode.id + '-' + node.id,
            //   source: primaryNode.id,
            //   target: node.id,
            //   weight: count,
            //   type: LinkType.TOPIC_AUTHOR
            // };

            // links.push(link);
          }
        }
      }

      if (related) {
        const topicCounts = Array.from(related).map(([topic, count]) => ({
          name: topic.name,
          count
        }));

        // collect related topics to create these topics later,
        // so that we can give precedence to top-level topics
        // only add related nodes if conncted to the topic that matches the query
        if (areEqual(name, $query)) {
          relatedTopics = [...relatedTopics, ...topicCounts];
        }

        // create links from top-level topics to related topics
        // related.forEach((weight, relatedTopic) => {
        //   const link: GraphLink = {
        //     id: `${primaryNode.id}-${relatedTopic.preferredName}`,
        //     source: primaryNode.id,
        //     target: relatedTopic.preferredName,
        //     type: LinkType.MENTIONS_ID_LINK,
        //     // TODO: use proper metric
        //     weight
        //   };

        //   links.push(link);
        // });
      }
    });

    // create related topic nodes if they haven't been created on the top-level
    relatedTopics.forEach(({ name, count }) => {
      // check if node already exists
      const exists = nodes.find((x) => x.id === name);

      if (!exists) {
        const secNode = {
          id: name,
          // TODO: decide whether this count should derived from the aggregation
          // or from global ressource search
          count,
          // TODO: add topic document
          doc: null,
          type: SECONDARY_NODE,
          text: name,
          datePublished: []
        };

        nodes.push(secNode);
      }
    });

    // TODO: only add relation if it does not already exist (from top-level to related)

    for (let source in $relations) {
      for (let target in $relations[source]) {
        if (source !== target) {
          let sourceNode = nodes.find((x) => x.id === source);
          let targetNode = nodes.find((x) => x.id === target);

          // FIXME: prevent bi-directional links (duplicates)
          if (
            sourceNode &&
            targetNode &&
            sourceNode.type === SECONDARY_NODE &&
            targetNode.type === SECONDARY_NODE &&
            !areEqual(source, $query) &&
            !areEqual(target, $query)
          ) {
            const link: GraphLink = {
              id: source + '-' + target,
              source,
              target,
              // TODO: use scale for mapping
              weight: $relations[source][target],
              type: LinkType.MENTIONS_NAME_LINK
            };

            links.push(link);
          }
        }
      }
    }

    // init debounced setter
    if (!debounceGraph) {
      debounceGraph = debounce((x) => {
        set(x);
      }, waitGraph);
    }

    debounceGraph({ links: compact(links), nodes: uniqBy(nodes, 'id') });
  },
  <{ links: GraphLink[]; nodes: GraphNode[] }>{ links: [], nodes: [] }
);

/**
 * Returns the topic with same name as the current query
 */
export const selectedTopic = derived(
  [query, topicsEnriched],
  ([$query, $topicsEnriched]) => {
    return $topicsEnriched.find((t) => areEqual(t.name, $query)) || null;
  }
);

/**
 * Returns the aggregation results for the current query depending on the search mode (phrase/topic match)
 */
export const selectedTopicAggregations = derived(
  [selectedTopic, dataStore, searchMode],
  ([$topic, $dataStore, $mode], set) => {
    const { aggregation } = $dataStore;

    if ($topic && aggregation) {
      const subject = aggregation[$mode].subjects[$topic.name];
      set(subject);
    } else {
      set(null);
    }
  },
  <Subject>null
);

/**
 * Returns top resources for the selected topic
 */
export const resources = derived(
  [selectedTopicAggregations, dataStore],
  ([$agg, $dataStore], set) => {
    if ($agg) {
      const { topResources, docCount } = $agg;

      const entities = $dataStore.aggregation.entityPool.resources;
      const resources = values(pick(entities, keys(topResources)));

      set({ total: docCount, items: resources });
    } else {
      // reset store if topic wasn't found
      set({ total: 0, items: [] });
    }
  },
  {
    total: <number>0,
    items: <Resource[]>[]
  }
);

/**
 * Return the authors for the current query or the selected topic
 */
export const authors = derived(selectedTopic, ($topic) => {
  return $topic
    ? orderBy(Array.from($topic.authors), ([author, count]) => count, 'desc')
    : [];
});

/**
 * Returns top genres for selected topic
 */
export const genres = derived(
  [dataStore, searchMode],
  ([$dataStore, $searchMode], set) => {
    // TODO: use global resource aggregation
    const { aggregation } = $dataStore;

    if (aggregation) {
      const genres = aggregation[$searchMode].superAgg.genres;
      const counts = orderBy(Object.entries(genres), '1', 'desc');

      set(<[string, number][]>counts);
    } else {
      set([]);
    }
  },
  <[genre: string, count: number][]>[]
);

/**
 * Return the number of resources per year for selected topic
 */
export const datePublished = derived(
  [dataStore, searchMode],
  ([$dataStore, $searchMode], set) => {
    const { aggregation } = $dataStore;

    if (aggregation) {
      const published = aggregation[$searchMode].superAgg.datePublished;

      const dateCounts = Object.entries(published).map(([key, doc_count]) => [
        new Date(key).getFullYear(),
        doc_count
      ]);

      set(dateCounts);
    } else {
      set([]);
    }
  },
  <number[][]>[]
);
