import { derived } from 'svelte/store';
import {
  compact,
  debounce,
  flatten,
  isArray,
  maxBy,
  uniq,
  uniqBy
} from 'lodash';
import type { PersonES, ResourceAggResponse } from 'types/es';
import {
  GraphLink,
  GraphNode,
  ResourceAggregation,
  Topic,
  NodeType,
  LinkType,
  Resource
} from '../types/app';
import {
  authorStore,
  aggregationStore,
  geoStore,
  mentionedTopicStore,
  topicRelationStore,
  topicStore,
  eventStore
} from './dataStore';
import { query, queryExtension, SearchMode, searchMode } from './uiState';

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
 * Replaces references to entities of different indices with real entity objects
 *
 * @param aggs          ElasticSearch aggregation result
 * @param entityList    List of entity objects
 * @param aggName       Name of the aggregation
 */
function getEntities<T>(
  aggs: ResourceAggResponse,
  entityList: T[],
  aggName: string
): Map<T, number> {
  if (!aggs) return null;

  const entries: [T, number][] = compact(
    aggs.aggregations[aggName].buckets.map(({ key, doc_count }) => {
      const entity = entityList.find((p) => p['@id'] === key);
      if (!entity) return null;
      return [entity, doc_count];
    })
  );

  return new Map(entries);
}

/**
 * Transforms ElasticSearch aggregation result to internal representation
 *
 * @param aggs ElasticSearch aggregation object
 */
function convertAggs(aggs: ResourceAggResponse) {
  const { hits, aggregations } = aggs;

  const meta: ResourceAggregation = {
    docCount: hits.total.value,
    topAuthors: aggregations.topAuthors.buckets,
    datePublished: aggregations.datePublished.buckets.map(
      ({ key, key_as_string, doc_count }) => ({
        year: new Date(key).getFullYear(),
        count: doc_count
      })
    ),
    mentions: aggregations.mentions.buckets.map(({ key, doc_count }) => ({
      name: key,
      docCount: doc_count
    }))
  };

  return meta;
}

/**
 * Returns all additionalTypes derived from topics
 */
export const additionalTypes = derived(topicStore, ($topicStore) => {
  const addTypes = uniq(
    compact(
      flatten(
        $topicStore.items.map((topic) =>
          topic.additionalTypes?.map((type) => type.name)
        )
      )
    )
  ).sort();

  return addTypes;
});

/**
 * Returns top genres for selected topic
 */
export const genres = derived(
  [query, aggregationStore],
  ([$query, $aggs], set) => {
    const agg = $aggs.phraseMatch.get($query);

    if (agg) {
      const genres = agg.aggregations.genres;
      const other = genres.sum_other_doc_count;
      const genreCounts = genres.buckets.map(({ key, doc_count }) => [
        key,
        doc_count
      ]);

      const result = [...genreCounts, ['Weitere ...', other]];

      set(<[string, number][]>result);
    } else {
      set([]);
    }
  },
  <[string, number][]>[]
);

/**
 * Return the number of resources per year for selected topic
 */
export const datePublished = derived(
  [query, aggregationStore],
  ([$query, $aggs], set) => {
    const queryAgg = $aggs.phraseMatch.get($query);

    if (queryAgg) {
      const published = queryAgg.aggregations.datePublished;

      const dateCounts = published.buckets.map(({ key, doc_count }) => [
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

/** Combines results from topic search in topic index and associated resources in resource index */
export const topicsEnriched = derived(
  [
    authorStore,
    aggregationStore,
    geoStore,
    mentionedTopicStore,
    eventStore,
    topicStore,
    searchMode
  ],
  (
    [$authors, $aggs, $geo, $relatedTopics, $events, $topicStore, $searchMode],
    set
  ) => {
    const merged = $topicStore.items.map(
      ({ name, additionalTypes, alternateName, description, id, score }) => {
        // get aggregation results on resources index
        const aggTopicMatch = $aggs.topicMatch.get(name);
        const aggPhraseMatch = $aggs.phraseMatch.get(name);
        const agg =
          $searchMode === SearchMode.topic ? aggTopicMatch : aggPhraseMatch;

        // TODO: preserve all alternateNames?
        const altName = alternateName?.[0];

        // create topic model
        const topic: Topic = {
          id,
          score,
          name,
          count: agg?.hits.total.value ?? 0,
          alternateName: altName,
          additionalTypes,
          description,
          aggregations: aggTopicMatch ? convertAggs(aggTopicMatch) : null,
          aggregationsLoose: aggPhraseMatch
            ? convertAggs(aggPhraseMatch)
            : null,
          authors: getEntities(agg, $authors, 'topAuthors'),
          locations: getEntities(agg, $geo, 'mentions'),
          related: getEntities(agg, $relatedTopics, 'topMentionedTopics'),
          events: getEntities(agg, $events, 'mentions')
        };

        return topic;
      }
    );

    // init debounced setter
    if (!debounceTopics) {
      debounceTopics = debounce((x) => {
        set(x);
      }, waitTopics);
    }

    debounceTopics(merged);
  },
  <Topic[]>[]
);

/**
 * Returns graph structure for the visualization
 */
export const graph = derived(
  [topicRelationStore, topicsEnriched, query, queryExtension],
  ([$topicRelations, $topicsEnriched, $query, $queryExtension], set) => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    let relatedTopics: { name: string; count: number }[] = [];

    // create nodes for all top-level topics and collect related topics
    $topicsEnriched.forEach((primaryTopic) => {
      const { name, count, related, authors } = primaryTopic;

      if (count > 0) {
        // create graph node
        const primaryNode: GraphNode = {
          id: name,
          count,
          doc: primaryTopic,
          type: PRIMARY_NODE,
          text: name
        };

        nodes.push(primaryNode);

        // create author nodes
        // if (name === $query || name === $queryExtension) {
        //   for (let [{ preferredName: name }, count] of authors) {
        //     let node = nodes.find((n) => n.id === name);

        //     if (!node) {
        //       const authorNode: GraphNode = {
        //         id: name,
        //         count,
        //         doc: primaryTopic,
        //         type: AUTHOR_NODE,
        //         text: name.split(',')[0]
        //       };

        //       nodes.push(authorNode);
        //       node = authorNode;
        //     }

        //     // link author to topic
        //     const link: GraphLink = {
        //       id: primaryNode.id + '-' + node.id,
        //       source: primaryNode.id,
        //       target: node.id,
        //       weight: count,
        //       type: LinkType.TOPIC_AUTHOR
        //     };

        //     links.push(link);
        //   }
        // }
      }

      if (related) {
        const topicCounts = Array.from(related).map(([topic, count]) => ({
          name: topic.preferredName,
          count
        }));

        // collect related topics to create these topics later,
        // so that we can give precedence to top-level topics
        // only add related nodes if conncted to the topic that matches the query
        if (name === $query) {
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
          text: name
        };

        nodes.push(secNode);
      }
    });

    // TODO: only add relation if it does not already exist (from top-level to related)

    $topicRelations.forEach(({ key, doc_count }) => {
      const [source, target] = key.split('&');

      // target is undefined for cells ij with i == j
      if (target) {
        let sourceNode = nodes.find((x) => x.id === source);
        let targetNode = nodes.find((x) => x.id === target);

        // FIXME: prevent bi-directional links (duplicates)
        if (
          sourceNode &&
          targetNode &&
          sourceNode.type === SECONDARY_NODE &&
          targetNode.type === SECONDARY_NODE &&
          source !== $query &&
          target !== $query
        ) {
          const link: GraphLink = {
            id: source + '-' + target,
            source,
            target,
            // TODO: use scale for mapping
            weight: doc_count,
            type: LinkType.MENTIONS_NAME_LINK
          };

          links.push(link);
        }
      }
    });

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
    const topic = $topicsEnriched.find((t) => t.name === $query);
    return topic;
  }
);

/**
 * Returns the aggregation results for the current query depending on the search mode (phrase/topic match)
 */
export const selectedTopicAggregations = derived(
  [selectedTopic, aggregationStore, searchMode],
  ([$topic, $aggs, $mode]) => {
    if ($topic) {
      const agg =
        $mode === SearchMode.topic ? $aggs.topicMatch : $aggs.phraseMatch;
      const topicName = $topic.name;
      return agg.get(topicName);
    }
    return null;
  }
);

/**
 * Returns top resources for the selected topic
 */
export const resources = derived(
  selectedTopicAggregations,
  ($agg, set) => {
    if ($agg) {
      const appResources = $agg.hits.hits.map(({ _score, _source }) => {
        const {
          preferredName,
          author,
          datePublished: dp,
          inLanguage,
          description,
          mentions = []
        } = _source;

        // TODO: simplify in backend?
        const date = !!dp
          ? isArray(dp)
            ? dp[0]['@value']
            : dp['@value']
          : null;

        const appResource: Resource = {
          title: preferredName,
          yearPublished: date ? new Date(date).getFullYear() : null,
          authors: author,
          description: description ? description.join(';') : null,
          inLanguage,
          score: _score,
          topics: uniq(
            mentions.filter((m) => /topics/.test(m['@id'])).map((m) => m.name)
          )
        };

        return appResource;
      });

      set({ total: $agg.hits.total.value, items: appResources });
    } else {
      // reset store if topic wasn't found
      set({ total: 0, items: [] });
    }
  },
  {
    total: <number>null,
    items: <Resource[]>[]
  }
);

/**
 * Return the authors for the current query or the selected topic
 */
export const authors = derived(
  [selectedTopicAggregations, authorStore],
  ([$aggs, $authorStore], set) => {
    if ($aggs) {
      const authorEnt = getEntities($aggs, $authorStore, 'topAuthors');
      set(authorEnt);
    } else {
      // reset store if no topic is selected
      set(new Map());
    }
  },
  <Map<PersonES, number>>new Map()
);
