import { derived } from 'svelte/store';
import type { Topic } from '../types/app';
import { topicResult, topicRelatedRessources, authors } from './dataStore';

/**
 * The dataAPI combines the results of the DataStore and provides the UI components with data.
 */

/** Combines results from topic search in topic index and associated resources in resource index */
export const topicsRequest = derived(
  [topicResult, topicRelatedRessources, authors],
  async ([$topicResult, $topicRelatedRessources, $authors]) => {
    const [result, topicRessources, authors] = await Promise.all([
      $topicResult,
      $topicRelatedRessources,
      $authors
    ]);

    // merge results
    const merged = result.map(({ _id, _score, _source }) => {
      const { preferredName, additionalType } = _source;
      const meta = topicRessources?.get(preferredName);
      const withAuthors = {
        ...meta,
        topAuthors: meta?.topAuthors.map((a) => {
          const author = authors.find((p) => p['@id'] === a.key);
          return {
            docCount: a.doc_count,
            ...author
          };
        })
      };

      // TODO: merge authors into topics (WIP)

      // create topic model
      const topic: Topic = {
        id: _id,
        score: _score,
        name: preferredName,
        // create additionalType model
        additionalTypes: additionalType?.map(
          ({ name, description, ...rest }) => ({
            id: rest['@id'],
            name,
            description
          })
        ),
        ...meta
      };

      return topic;
    });

    return merged;
  }
);
