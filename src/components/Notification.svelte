<!--
TODO: remove

Edge cases:

http://localhost:5000/explore/?query=sfadsfasdfa&restrict=null&mode=topicMatch
http://localhost:5000/explore/?query=abc&restrict=null&mode=topicMatch
http://localhost:5000/explore/?query=Tonfolge&restrict=null&mode=topicMatch
http://localhost:5000/explore/?query=Markenname&restrict=Alpen&mode=topicMatch
http://localhost:5000/explore/?query=Google&restrict=Google+Earth&mode=topicMatch
http://localhost:5000/explore/?query=Produkt-Recycling&restrict=null&mode=topicMatch

 -->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import { ready, selectedTopic, topicsEnriched } from '../state/dataAPI';
  import { search, SearchMode, searchMode } from '../state/uiState';
  import Message from './Message.svelte';

  let text = null;
  let hide = [];
  let actionPhrase = false;
  let actionAlternate = false;
  let actionNoRestrict = false;

  $: ({ query, restrict } = $search);
  $: alternateTopics = $topicsEnriched.filter((t) => t.count > 0).length;

  $: caseNoTopics = $topicsEnriched.length === 0;
  $: caseNoSelected = !$selectedTopic;
  $: caseNoResources = !!$selectedTopic && $selectedTopic.count === 0;
  $: casePhraseHits =
    $searchMode === SearchMode.topic && $selectedTopic?.phraseCount > 0;
  $: caseNoRestrictHits = restrict && $selectedTopic?.mentionCount > 0;

  $: isLinked = $searchMode === SearchMode.topic ? 'verknüpften' : '';

  $: if ($ready) {
    if (caseNoTopics) {
      text = `Keine Themen zu „${query}“ gefunden.`;
      actionPhrase = false;
      actionAlternate = false;
      actionNoRestrict = false;
    } else if (caseNoSelected) {
      text = `Das Thema „${query}“ existiert leider nicht. `;
      actionPhrase = false;
      actionAlternate = alternateTopics > 0;
      actionNoRestrict = false;
    } else if (caseNoResources) {
      actionPhrase = casePhraseHits;
      actionAlternate = alternateTopics > 0;
      actionNoRestrict = caseNoRestrictHits;

      if (restrict) {
        text = `Keine ${isLinked} Titeldaten zu „${query}“ und „${restrict}“ gefunden.`;
      } else {
        text = `Keine ${isLinked} Titeldaten zu „${query}“ gefunden.`;
      }
    }
  } else {
    text = null;
  }

  function dismiss() {
    hide = [...hide, window.location.href];
    console.log(hide);
  }

  function switchToPhraseFn() {
    searchMode.set(SearchMode.phrase);
  }

  function removeRestrictFn() {
    search.setRestrict(null);
  }
</script>

{#if text && !hide.includes(window.location.href)}
  <div in:fade={{ delay: 2000 }} out:fade>
    <Message
      {text}
      switchToPhrase={actionPhrase && switchToPhraseFn}
      selectAlternate={actionAlternate && dismiss}
      removeRestrict={actionNoRestrict && removeRestrictFn}
    />
  </div>
{/if}

<style>
  div {
    position: absolute;
    z-index: 2;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -100%);
    font-size: 1.5rem;
    font-weight: 500;
    font-style: italic;
    background: rgba(255, 255, 255, 0.97);
    border-radius: 4px;
    padding: 2rem 1rem;
    max-width: 800px;
    box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.2);
  }
</style>
