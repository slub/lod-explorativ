import { derived } from 'svelte/store';
import {
  compact,
  countBy,
  entries,
  flatMap,
  keys,
  orderBy,
  pick,
  pickBy,
  toPairs,
  uniqBy,
  values
} from 'lodash';
import {
  GraphLink,
  GraphNode,
  Topic,
  NodeType,
  DatePublished
} from '../types/app';
import dataStore, {
  aggregationsPending,
  correlationsPending,
  topicRelationStore,
  topicsPending
} from './dataStore';
import { RelationMode, relationMode, search, searchMode } from './uiState';
import type { Subject, Resource } from '../types/backend';
import { areEqual } from '../utils';

const { PRIMARY_NODE, SECONDARY_NODE } = NodeType;

/**
 * The dataAPI combines the results of the DataStore and provides the UI components with data.
 */

export const ready = derived(
  [topicsPending, aggregationsPending, correlationsPending],
  ([$topicsPending, $aggsPending, $corrPending]) => {
    return !$topicsPending && !$aggsPending && !$corrPending;
  }
);

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
  const entityMap: Map<T, number> = new Map();
  const agg = subject.aggs[aggName];

  if (entityList) {
    for (let key in agg) {
      const entity = entityList[key];
      if (entity) {
        entityMap.set(entity, agg[key]);
      }
    }
  }

  return entityMap;
}

/** Combines results from topic search in topic index and associated resources in resource index */
export const topicsEnriched = derived(
  [dataStore, searchMode],
  ([$dataStore, $searchMode], set) => {
    const { aggregation } = $dataStore;

    if (aggregation) {
      const aggs = aggregation[$searchMode].subjects;
      const entities = aggregation.entityPool;

      const merged = $dataStore.topics
        // .filter((t) => t.mentionCount > 0)
        .map((topic) => {
          const agg = aggs[topic.name];
          // create topic model
          const enrichedTopic: Topic = {
            ...topic,
            count: agg.docCount,
            phraseCount: aggregation.phraseMatch.subjects[topic.name].docCount,
            topicCount: aggregation.topicMatch.subjects[topic.name].docCount,

            datePublished: entries(agg.aggs.datePublished).map(
              ([year, count]) => {
                const date: DatePublished = { year: parseInt(year), count };
                return date;
              }
            ),
            authors: getEntities(agg, entities.persons, 'topAuthors'),
            contributors: getEntities(agg, entities.persons, 'topContributors'),
            related: getEntities(agg, entities.topics, 'topMentionedTopics')
          };

          return enrichedTopic;
        });

      set(merged);
    }
  },
  <Topic[]>[]
);

export const relationsCount = derived(topicRelationStore, ($relations) => {
  const matrix = {};

  $relations.forEach(([key, doc_count]) => {
    const [source, t] = key.split('&');
    const target = t || source;

    if (!matrix[source]) matrix[source] = {};
    if (!matrix[target]) matrix[target] = {};

    matrix[source][target] = doc_count;
    matrix[target][source] = doc_count;
  });

  return matrix;
});

export const relationsMeetMin = derived(
  [relationsCount, relationMode],
  ([$relations, $relationsMode]) => {
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
          let score;

          if ($relationsMode === RelationMode.meetMin) {
            score = intersect / Math.min(sourceCount, targetCount);
          } else {
            score = intersect / (sourceCount + targetCount);
          }

          matrix[source][target] = matrix[target][source] = score;
        }
      }
    }

    return matrix;
  }
);

/**
 * Returns graph structure for the visualization
 */
export const graph = derived(
  [topicsEnriched, search, relationsMeetMin],
  ([$topicsEnriched, $search, $relations], set) => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    const query = $search.query;
    const selectedTopic = $topicsEnriched.find((t) => areEqual(t.name, query));
    const related = selectedTopic?.related;

    // create related topic nodes
    if (related) {
      related.forEach((count, relatedTopic) => {
        const { name, description } = relatedTopic;

        if (!areEqual(name, query)) {
          const secNode = {
            id: relatedTopic.name,
            count,
            type: SECONDARY_NODE,
            text: name,
            datePublished: [],
            description
          };

          nodes.push(secNode);
        }
      });
    }

    // create nodes for all top-level topics and collect related topics
    $topicsEnriched.forEach((primaryTopic) => {
      const { name, count, datePublished, description } = primaryTopic;

      const exists = nodes.find((n) => n.id === name);

      // create graph node
      if (!exists && count > 0) {
        const primaryNode: GraphNode = {
          id: name,
          count,
          type: PRIMARY_NODE,
          text: name,
          datePublished,
          description
        };

        nodes.push(primaryNode);
      }
    });

    for (let source in $relations) {
      for (let target in $relations[source]) {
        if (source !== target) {
          let sourceNode = nodes.find((x) => x.id === source);
          let targetNode = nodes.find((x) => x.id === target);

          if (
            sourceNode &&
            targetNode &&
            sourceNode.type === SECONDARY_NODE &&
            targetNode.type === SECONDARY_NODE &&
            !areEqual(source, query) &&
            !areEqual(target, query) &&
            !links.some((l) => l.id === target + '-' + source)
          ) {
            const id = source + '-' + target;
            const weight = $relations[source][target];

            const link: GraphLink = {
              id,
              source,
              target,
              weight
            };

            links.push(link);
          }
        }
      }
    }

    set({
      links: compact(links),
      nodes: orderBy(uniqBy(nodes, 'id'), (n) => n.type)
    });
  },
  <{ links: GraphLink[]; nodes: GraphNode[] }>{ links: [], nodes: [] }
);

/**
 * Returns the topic with same name as the current query
 */
export const selectedTopic = derived(
  [search, topicsEnriched],
  ([$search, $topicsEnriched]) => {
    return (
      $topicsEnriched.find(
        (t) => areEqual(t.name, $search.query) //&& t.count > 0
      ) || null
    );
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
  if (!$topic) return [];
  const { authors, contributors } = $topic;

  const all = uniqBy([...authors.keys(), ...contributors.keys()], 'id').map(
    (p) => {
      return {
        person: p,
        authorCount: authors.get(p),
        contribCount: contributors.get(p)
      };
    }
  );

  return orderBy(
    all,
    ({ authorCount, contribCount }) =>
      ((authorCount || 0) + (contribCount || 0)) / 2,
    'desc'
  ).slice(0, 10);
});

/**
 * Returns top genres for selected topic
 */
export const genres = derived(
  [dataStore, searchMode],
  ([$dataStore, $searchMode], set) => {
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

      const dateCounts = entries(pickBy(published, (count) => count > 0)).map(
        ([k, v]) => [parseInt(k), v]
      );

      // console.table(dateCounts);

      set(dateCounts);
    } else {
      set([]);
    }
  },
  <number[][]>[]
);
