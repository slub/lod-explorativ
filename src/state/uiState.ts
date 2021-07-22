import { random } from 'lodash';
import { writable } from 'svelte/store';

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
  'Betriebssystem',
  'Musikerziehung'
];

export enum SearchMode {
  phrase = 'phraseMatch',
  topic = 'topicMatch'
}

export enum RelationMode {
  jaccard = 'jaccard',
  meetMin = 'meetMin'
}

export enum RelationContext {
  relative = 'relative',
  absolute = 'absolute'
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

// update state when user uses the browser navigation
window.onpopstate = ({ state }) => {
  if (state?.query) search.set(state);
};

// ************************************************
// SEARCH STORE
// ************************************************

export const { set, update, subscribe } = writable({
  query: getParam('query') || queries[random(0, queries.length - 1)],
  restrict: getParam('restrict') || null
});

export const search = {
  set,
  setQuery: (val) => update((prev) => ({ ...prev, query: val })),
  setRestrict: (val) => update((prev) => ({ ...prev, restrict: val })),
  update,
  subscribe
};

search.subscribe((state) => {
  const url = new URL(window.location.href);
  const { query, restrict } = state;
  url.searchParams.set('query', query);
  url.searchParams.set('restrict', restrict);

  // prevent update loop if triggered by pop state event
  if (state !== window.history.state) {
    window.history.pushState(state, '', url.href);
  }
});

// ************************************************
// MODE STORE
// ************************************************

export const searchMode = writable(
  <SearchMode>getParam('mode') || SearchMode.topic
);

searchMode.subscribe((val) => {
  const url = new URL(window.location.href);
  url.searchParams.set('mode', val);
  window.history.replaceState(window.history.state, '', url.href);
});

export const author = writable(null);

export const relationMode = writable(RelationMode.jaccard);
export const relationContext = writable(RelationContext.relative);
