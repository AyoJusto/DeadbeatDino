<script>
  import { createEventDispatcher } from 'svelte';

  export let creatures;
  export let selected = '';

  const dispatch = createEventDispatcher();
  const names = Object.keys(creatures).sort();

  let search = selected;
  let open = false;
  let highlightIndex = -1;
  let inputEl;

  $: filtered = search
    ? names.filter(n => n.toLowerCase().includes(search.toLowerCase()))
    : names;

  $: visibleItems = filtered.slice(0, 20);

  $: filtered, highlightIndex = -1;

  function select(name) {
    selected = name;
    search = name;
    open = false;
    highlightIndex = -1;
    dispatch('select', name);
    inputEl?.blur();
  }

  function handleInput() {
    open = true;
    const exact = names.find(n => n.toLowerCase() === search.toLowerCase());
    if (exact) select(exact);
  }

  function handleFocus() {
    open = true;
    search = '';
  }

  function handleBlur() {
    setTimeout(() => { open = false; highlightIndex = -1; }, 200);
  }

  function handleKeydown(e) {
    if (!open || visibleItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightIndex = highlightIndex < visibleItems.length - 1 ? highlightIndex + 1 : 0;
      scrollToHighlighted();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightIndex = highlightIndex > 0 ? highlightIndex - 1 : visibleItems.length - 1;
      scrollToHighlighted();
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      select(visibleItems[highlightIndex]);
    } else if (e.key === 'Escape') {
      open = false;
      highlightIndex = -1;
    }
  }

  function scrollToHighlighted() {
    setTimeout(() => {
      const el = document.querySelector('.creature-dropdown li.highlighted');
      if (el) el.scrollIntoView({ block: 'nearest' });
    }, 0);
  }
</script>

<label for="creature-search">
  Creature
  <input
    id="creature-search"
    name="creature-search"
    type="search"
    placeholder="Search creatures..."
    bind:this={inputEl}
    bind:value={search}
    on:input={handleInput}
    on:focus={handleFocus}
    on:blur={handleBlur}
    on:keydown={handleKeydown}
    autocomplete="off"
  />
</label>

{#if open && filtered.length > 0 && search !== selected}
  <ul class="creature-dropdown" role="listbox">
    {#each visibleItems as name, i}
      <li
        role="option"
        aria-selected={name === selected}
        class:highlighted={i === highlightIndex}
        on:mousedown={() => select(name)}
        on:mouseenter={() => highlightIndex = i}
      >
        {name}
      </li>
    {/each}
    {#if filtered.length > 20}
      <li class="more">...{filtered.length - 20} more</li>
    {/if}
  </ul>
{/if}

<style>
  .creature-dropdown {
    list-style: none;
    margin: -0.5rem 0 0 0;
    padding: 0;
    border: 1px solid var(--pico-muted-border-color);
    border-radius: var(--pico-border-radius);
    max-height: 15rem;
    overflow-y: auto;
    background: var(--pico-background-color);
    position: relative;
    z-index: 10;
  }
  .creature-dropdown li {
    padding: 0.5rem 0.75rem;
    cursor: pointer;
  }
  .creature-dropdown li:hover,
  .creature-dropdown li.highlighted {
    background: var(--pico-primary-focus);
  }
  .creature-dropdown li.more {
    color: var(--pico-muted-color);
    cursor: default;
    font-size: 0.875rem;
  }
</style>
