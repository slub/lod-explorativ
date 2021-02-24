import { compact } from 'lodash';
import { derived } from 'svelte/store';
import type { Topic } from '../types/app';
import {
  topicRequest,
  topicRessourceRequest,
  authorRequest
} from './dataStore';

/**
 * The dataAPI combines the results of the DataStore and provides the UI components with data.
 */

/** Combines results from topic search in topic index and associated resources in resource index */
export const topicsEnriched = derived(
  [topicRequest, topicRessourceRequest, authorRequest],
  async ([$topicResult, $topicRelatedRessources, $authors]) => {
    // wait until all data is loaded
    const [topics, topicRessources, authors] = await Promise.all([
      $topicResult,
      $topicRelatedRessources,
      $authors
    ]);

    // merge results
    const merged = topics.map(({ _id, _score, _source }) => {
      const { preferredName, additionalType } = _source;
      // get aggregation results on resources index
      const aggregations = topicRessources?.get(preferredName);

      // TODO: add counts
      // get references to authors and search for the author object
      const topicAuthors = compact(
        aggregations?.topAuthors.map((authorRef) => {
          const author = authors.find(
            (author) => author['@id'] === authorRef.key
          );
          return author;
        })
      );

      // TODO: merge authors into topics (WIP)

      // create topic model
      const topic: Topic = {
        id: _id,
        score: _score,
        name: preferredName,
        // create additionalType model
        // TODO: replace references with topics
        additionalTypes: additionalType?.map(
          ({ name, description, ...rest }) => ({
            id: rest['@id'],
            name,
            description
          })
        ),
        aggregations,
        authors: topicAuthors
      };

      return topic;
    });

    return merged;
  }
);
