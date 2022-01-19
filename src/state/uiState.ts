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

/**
 * Updates the browser URL and window history
 *
 * @param name The name of the search parameter
 * @param push If 'true' the state will be pushed onto the stack, otherwise the current state will be replaced
 */
function updateURL(name, push = true) {
  return (value) => {
    const url = new URL(window.location.href);
    const state = window.history.state || {};
    url.searchParams.set(name, value);

    // prevent update loop if triggered by pop state event
    if (value !== state[name]) {
      const newState = { ...state, [name]: value };
      const title = `${name}: ${value}`;
      const href = url.href;

      if (push) {
        window.history.pushState(newState, title, href);
      } else {
        window.history.replaceState(newState, title, href);
      }
    }
  };
}

// update state when user uses the browser navigation
window.onpopstate = ({ state }) => {
  const { query: q, restrict: r } = state;
  query.set(q);
  restrict.set(r);

  // The UI state and the browser history state are updated on every change of
  // 'query' and 'restrict'. If 'query' is set to the value of 'restrict' and
  // 'restrict' set to null, an intermediate state will saved to the history,
  // which we'll skip
  if (q === r) window.history.back();
};

// ************************************************
// SEARCH STORE
// ************************************************

export const query = writable(
  getParam('query') || queries[random(0, queries.length - 1)]
);

export const restrict = writable(getParam('restrict') || null);

query.subscribe(updateURL('query'));
restrict.subscribe(updateURL('restrict'));

// ************************************************
// MODE STORE
// ************************************************

export const searchMode = writable(
  <SearchMode>getParam('mode') || SearchMode.topic
);

searchMode.subscribe(updateURL('mode', false));

// ************************************************
// OTHER STORES
// ************************************************

export const author = writable(null);
export const relationMode = writable(RelationMode.jaccard);
export const relationContext = writable(RelationContext.relative);
