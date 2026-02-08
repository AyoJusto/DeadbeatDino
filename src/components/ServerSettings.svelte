<script>
  import { createEventDispatcher } from 'svelte';
  import { blockAlpha } from '../lib/format.js';

  export let settings;

  const dispatch = createEventDispatcher();

  function changed() {
    dispatch('change', settings);
  }
</script>

<details>
  <summary>Server Settings</summary>
  <div class="grid inputs-grid">
    <label>
      Maturation Speed
      <input id="maturation-speed" name="maturation-speed" type="number" inputmode="decimal" bind:value={settings.maturationSpeed} on:input={changed} min="0.1" step="0.1" on:keydown={blockAlpha} />
    </label>
    <label for="hatch-speed">
      Hatch/Gestation Speed
      <input id="hatch-speed" name="hatch-speed" type="number" inputmode="decimal" bind:value={settings.hatchSpeed} on:input={changed} min="0.1" step="0.1" on:keydown={blockAlpha} />
    </label>
    <label for="consumption-speed">
      Consumption Speed
      <input id="consumption-speed" name="consumption-speed" type="number" inputmode="decimal" bind:value={settings.consumptionSpeed} on:input={changed} min="0.1" step="0.1" on:keydown={blockAlpha} />
    </label>
  </div>
</details>
