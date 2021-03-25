import { random } from 'lodash';
import { writable } from 'svelte/store';

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
  'Cyber',
  'Journalist'
];

export const query = writable(getQuery());

query.subscribe((value) => {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(`q=${value}`);
  url.search = params.toString();
  window.history.pushState({}, value, url.href);
});
