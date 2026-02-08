<script>
  import { createEventDispatcher } from 'svelte';
  import { formatTime, blockAlpha } from '../lib/format.js';

  export let stats = null;
  export let maturation = null;
  export let totalFood = null;
  export let babyBuffer = null;
  export let desiredBabyBuffer = 30;
  export let foodUnit = '';

  const dispatch = createEventDispatcher();

  function onBufferInput(e) {
    dispatch('bufferchange', Number(e.target.value));
  }
</script>

<style>
  .stat small {
    color: var(--pico-muted-color);
    text-transform: uppercase;
    font-size: 0.7rem;
    letter-spacing: 0.5px;
  }

  .stat .val {
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--pico-color);
  }

  .buffer-input {
    margin-bottom: 0;
  }

  .buffer-input input {
    margin-bottom: 0;
  }
</style>

{#if stats}
  <article>
    <header><strong>Results</strong></header>
    {#if maturation}
      <div class="grid">
        <div class="stat">
          <small>Time to Juvenile</small>
          <div class="val">{formatTime(maturation.babyTimeRemaining)}</div>
        </div>
        <div class="stat">
          <small>Time to Adult</small>
          <div class="val">{formatTime(maturation.maturationTimeRemaining)}</div>
        </div>
        <div></div>
      </div>
    {/if}

    {#if totalFood}
      <hr />
      <div class="grid">
        <div class="stat">
          <small>To Juvenile ({foodUnit})</small>
          <div class="val">{Math.ceil(totalFood.toJuvFoodItems)} items</div>
        </div>
        <div class="stat">
          <small>Total to Adult ({foodUnit})</small>
          <div class="val">{Math.ceil(totalFood.toAdultFoodItems)} items</div>
        </div>
        <div class="stat">
          <small>Current Rate</small>
          <div class="val">{totalFood.nextFoodPerTimeUnit} items/min</div>
        </div>
      </div>
    {/if}

    {#if babyBuffer}
      <hr />
      <div class="grid">
        <div class="stat">
          <small>Food to Fill ({foodUnit})</small>
          <div class="val">{Math.ceil(babyBuffer.foodToFill)} items</div>
        </div>
        <div class="stat">
          <small>Current Buffer</small>
          <div class="val">{formatTime(babyBuffer.currentBabyBuffer)}</div>
        </div>
        <div class="stat">
          <small>Time to Desired Buffer</small>
          <div class="val">{formatTime(babyBuffer.timeUntilDesiredBabyBuffer)}</div>
        </div>
        <label class="stat buffer-input">
          <small>Desired Buffer (min)</small>
          <input type="number" inputmode="numeric" value={desiredBabyBuffer} on:input={onBufferInput} min="0" max="600" step="1" on:keydown={blockAlpha} />
        </label>
      </div>
    {/if}
  </article>
{/if}
