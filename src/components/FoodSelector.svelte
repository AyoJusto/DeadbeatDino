<script>
  import { createEventDispatcher } from 'svelte';

  export let options = [];
  export let selected = '';

  const dispatch = createEventDispatcher();

  let open = false;
  let highlightIndex = -1;

  function select(name) {
    selected = name;
    open = false;
    highlightIndex = -1;
    dispatch('select', name);
  }

  function handleFocus() {
    open = true;
    highlightIndex = options.indexOf(selected);
  }

  function handleBlur() {
    setTimeout(() => { open = false; highlightIndex = -1; }, 200);
  }

  function handleKeydown(e) {
    if (!open || options.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightIndex = highlightIndex < options.length - 1 ? highlightIndex + 1 : 0;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightIndex = highlightIndex > 0 ? highlightIndex - 1 : options.length - 1;
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      select(options[highlightIndex]);
    } else if (e.key === 'Escape') {
      open = false;
      highlightIndex = -1;
    }
  }
</script>

<label class="food-select-wrap">
  Food Type
  <input
    id="food-type"
    name="food-type"
    type="text"
    value={selected}
    readonly
    on:focus={handleFocus}
    on:blur={handleBlur}
    on:keydown={handleKeydown}
    on:mousedown|preventDefault={() => { open = !open; }}
    style="cursor: pointer;"
  />
  {#if open && options.length > 0}
    <ul class="food-dropdown" role="listbox">
      {#each options as name, i}
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
    </ul>
  {/if}
</label>

<style>
  .food-select-wrap {
    position: relative;
  }
  .food-dropdown {
    list-style: none;
    margin: 0;
    padding: 0;
    border: 1px solid var(--pico-muted-border-color);
    border-radius: var(--pico-border-radius);
    max-height: 15rem;
    overflow-y: auto;
    background: var(--pico-background-color);
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 10;
  }
  .food-dropdown li {
    padding: 0.5rem 0.75rem;
    cursor: pointer;
  }
  .food-dropdown li:hover,
  .food-dropdown li.highlighted {
    background: var(--pico-primary-focus);
  }
</style>
