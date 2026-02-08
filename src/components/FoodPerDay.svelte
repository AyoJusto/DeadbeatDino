<script>
  import { createEventDispatcher } from 'svelte';
  import { blockAlpha } from '../lib/format.js';

  export let totalFood = null;
  export let lossFactor = 0;
  export let foodUnit = '';

  const dispatch = createEventDispatcher();

  function changed() {
    dispatch('lossfactor', lossFactor);
  }
</script>

{#if totalFood && Object.keys(totalFood.foodItemsForDay).length > 0}
  <article>
    <header><strong>Food Per Day ({foodUnit})</strong></header>
    <label>
      Loss Factor %
      <input id="loss-factor" name="loss-factor" type="number" inputmode="numeric" bind:value={lossFactor} on:input={changed} min="0" max="100" step="1" on:keydown={blockAlpha} />
    </label>
    <figure>
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th>Food Items</th>
          </tr>
        </thead>
        <tbody>
          {#each Object.entries(totalFood.foodItemsForDay) as [day, items]}
            <tr>
              <td>Day {day}</td>
              <td>{Math.ceil(items)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </figure>
  </article>
{/if}
