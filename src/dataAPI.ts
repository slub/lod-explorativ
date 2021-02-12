import { derived } from "svelte/store";
import { createHeaders, topicResult, topicRessourcesResult } from "./DataStore";

/** Combines results from topic search in topic index and associated resources in resource index */
export const topics = derived([topicResult, topicRessourcesResult],
  async ([$topicTest, $topicRessourcesResult]) => {

  const [result, topicRessources] = await Promise.all([$topicTest, $topicRessourcesResult])

  // merge results
  const merged = result.map(({ _id, _score, _source }) => {
    const { preferredName, additionalType } = _source;
    const data = topicRessources.get(preferredName) ?? {}

    // create topic model
    return {
      id: _id,
      score: _score,
      name: preferredName,
      // create additionalType model
      additionalTypes: additionalType?.map(
        ({ name, description, ...rest }) => ({
          id: rest["@id"],
          name,
          description,
        })
      ),
      ...data
    };
  });

  console.log(merged)

  return merged
});

export async function searchPersons(ids) {
  // if (!ids || ids.length === 0) return [];

  const body = JSON.stringify({
    ids,
  });

  const response = await fetch(
    `https://es.data.slub-dresden.de/persons-explorativ/_mget`,
    {
      method: "POST",
      body,
      headers: createHeaders(),
    }
  );

  const result = await response.json();
  const persons = result.docs.filter((d) => d.found).map((d) => d._source);

  return persons;
}
