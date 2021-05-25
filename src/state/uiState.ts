import { random } from 'lodash';
import { writable } from 'svelte/store';

export enum SearchMode {
  phrase = 'phraseMatch',
  topic = 'topicMatch'
}

/**
 * Returns the search query from the URL. Function returns a random query if no query is set.
 */
function getQuery() {
  const url = new URL(window.location.href);
  const q = url.searchParams.get('q');

  return q || queries[random(0, queries.length - 1)];
}

window.onpopstate = function () {
  query.set(getQuery());
};

export const queries = [
  'Festival',
  'Kobold',
  'Jugendkultur',
  'Pandemie',
  'Klima',
  'Journalist',
  'Abenteuer',
  'Comic',
  'Medienkunst',
  'Zootiere',
  'Malerei',
  'D3.js',
  'Belagerung',
  'Sakralbau',
  'Visualisierung'
];

export const query = writable(getQuery());

query.subscribe((value) => {
  console.log('UI: update query:', value);
  const url = new URL(window.location.href);
  const params = new URLSearchParams(`q=${value}`);
  url.search = params.toString();
  window.history.pushState({}, value, url.href);
});

export const searchMode = writable(SearchMode.topic);
export const queryExtension = writable(null);
