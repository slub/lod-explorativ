import { random } from 'lodash';
import { writable, get } from 'svelte/store';

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

window.onpopstate = ({ state }) => {
  search.set(state);
};

export const { set, update, subscribe } = writable({
  query: getParam('q') || queries[random(0, queries.length - 1)],
  restrict: null
});

export const search = {
  set,
  subscribe,
  update,
  setQuery: (val) => update((s) => ({ ...s, query: val })),
  setRestrict: (val) => update((s) => ({ ...s, restrict: val }))
};
export const searchMode = writable(SearchMode.topic);
export const author = writable(null);

// update query string in URL
search.subscribe((state) => {
  const url = new URL(window.location.href);

  if (window.history.state !== state) {
    const { query, restrict } = state;
    url.searchParams.set('q', query);
    url.searchParams.set('restrict', restrict);

    window.history.pushState(state, null, url.href);
  }
});
