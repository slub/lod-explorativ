import { random } from 'lodash';
import { writable } from 'svelte/store';

const url = new URL(window.location.href);
const queryParam = url.searchParams.get('q');
const queries = [
  'Festival',
  'Kobold',
  'Jugendkultur',
  'Pandemie',
  'Klima',
  'Cyber'
];

export const query = writable(
  queryParam || queries[random(0, queries.length - 1)]
);

query.subscribe((value) => {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(`q=${value}`);
  url.search = params.toString();
  window.history.replaceState({}, value, url.href);
});
