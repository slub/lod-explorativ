import { derived } from 'svelte/store';
import type { Topic } from '../types/app';
import {
  createHeaders,
  topicResult,
  topicRelatedRessources
} from './dataStore';

/**
 * The dataAPI combines the results of the DataStore and provides the UI components with data.
 */

/** Combines results from topic search in topic index and associated resources in resource index */
export const topicsRequest = derived(
  [topicResult, topicRelatedRessources],
  async ([$topicResult, $topicRelatedRessources]) => {
    const [result, topicRessources] = await Promise.all([
      $topicResult,
      $topicRelatedRessources
    ]);

    // merge results
    const merged = result.map(({ _id, _score, _source }) => {
      const { preferredName, additionalType } = _source;

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
        ...topicRessources?.get(preferredName)
      };

      return topic;
    });

    return merged;
  }
);

export async function searchPersons(ids) {
  // if (!ids || ids.length === 0) return [];

  const body = JSON.stringify({
    ids
  });

  const response = await fetch(
    `https://es.data.slub-dresden.de/persons-explorativ/_mget`,
    {
      method: 'POST',
      body,
      headers: createHeaders()
    }
  );

  const result = await response.json();
  const persons = result.docs.filter((d) => d.found).map((d) => d._source);

  return persons;
}
