import { random } from 'lodash';
import { writable } from 'svelte/store';

export enum SearchMode {
  phrase = 'phraseMatch',
  topic = 'topicMatch'
}

/**
 * Returns search param from URL
 *
 * @param name param
 * @returns    value
 */
function getParam(name) {
  const url = new URL(window.location.href);
  const value = url.searchParams.get(name);
  return value === 'null' ? null : value;
}

/**
 * Returns the search query or a random string
 */
function getQuery() {
  const q = getParam('q');
  return q || queries[random(0, queries.length - 1)];
}

const updateParam = (name) => (value) => {
  const url = new URL(window.location.href);
  url.searchParams.set(name, value);
  window.history.pushState({}, value, url.href);
};

window.onpopstate = function () {
  query.set(getQuery());
  queryExtension.set(getParam('restrict'));
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
  'Visualisierung',
  'Betriebssystem'
];

export const query = writable(getQuery());
export const queryExtension = writable(getParam('restrict'));
export const searchMode = writable(SearchMode.topic);

query.subscribe(updateParam('q'));
queryExtension.subscribe(updateParam('restrict'));
