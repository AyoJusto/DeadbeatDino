<script>
  import ThemeToggle from './components/ThemeToggle.svelte';
  import CreatureSelector from './components/CreatureSelector.svelte';
  import ServerSettings from './components/ServerSettings.svelte';
  import Results from './components/Results.svelte';
  import FoodPerDay from './components/FoodPerDay.svelte';
  import FoodSelector from './components/FoodSelector.svelte';
  import { creatures } from './data/creatures.js';
  import { defaultFoods } from './data/foods.js';
  import { foodLists, foodOrder, troughTypes, foodRateTimeUnits } from './data/foodlists.js';
  import { calcStats, calcMaturation, calcTotalFood, calcFinalBuffer, calcDesiredBuffer, calcBabyBuffer } from './lib/calc.js';
  import { formatTime, formatPercent, blockAlpha } from './lib/format.js';
  import { defaultSettings, loadState, saveState } from './lib/storage.js';

  const saved = loadState(creatures);

  let creatureName = saved?.creatureName || '';
  let maturationProgress = saved?.maturationProgress || 0;
  let finalWeight = saved?.finalWeight || 0;
  let desiredBabyBuffer = saved?.desiredBabyBuffer || 30;
  let settings = saved?.settings ? { ...defaultSettings, ...saved.settings } : { ...defaultSettings };

  $: creatureName, maturationProgress, finalWeight, desiredBabyBuffer, settings,
    saveState({ creatureName, maturationProgress, finalWeight, desiredBabyBuffer, settings });

  $: creatureData = creatureName ? creatures[creatureName] : null;
  let foodUnit = creatureName && creatures[creatureName] ? foodLists[creatures[creatureName].type]?.[0] || '' : '';
  $: stats = creatureData ? calcStats(creatureData, settings) : null;
  $: maturation = stats ? calcMaturation(maturationProgress, stats) : null;

  $: totalFood = stats && maturation && foodUnit
    ? calcTotalFood(stats, maturation.maturationTimeComplete, creatureData, foodUnit, defaultFoods, foodRateTimeUnits[settings.foodRateTimeUnits], settings.lossFactor)
    : null;

  $: deps = { creatures, foods: defaultFoods, foodLists, foodOrder, settings, troughTypes };

  $: finalBuffer = stats && creatureName && foodUnit && finalWeight > 0
    ? calcFinalBuffer(creatureName, maturationProgress, stats, creatureData, finalWeight, foodUnit, defaultFoods, foodOrder, deps)
    : null;

  $: desiredBuffer = stats && creatureName && foodUnit && finalWeight > 0
    ? calcDesiredBuffer(creatureName, maturationProgress, stats, creatureData, desiredBabyBuffer, finalWeight, foodUnit, defaultFoods, foodOrder, deps)
    : null;

  $: babyBuffer = stats && finalBuffer && desiredBuffer && creatureName && foodUnit && finalWeight > 0
    ? calcBabyBuffer(creatureName, maturationProgress, stats, creatureData, finalWeight, finalBuffer, desiredBuffer, foodUnit, defaultFoods, foodOrder, deps)
    : null;

  function onCreatureSelect(e) {
    creatureName = e.detail;
    maturationProgress = 0;
    const cd = creatures[creatureName];
    finalWeight = cd.weight;
    desiredBabyBuffer = 30;
    foodUnit = foodLists[cd.type]?.[0] || '';
  }

  function onSettingsChange() {
    settings = settings;
  }

  function onLossFactorChange(e) {
    settings.lossFactor = e.detail;
    settings = settings;
  }

</script>

<main class="container">
  <nav>
    <ul>
      <li>
        <strong>ARK Baby Food Calculator</strong>
        <br />
        <small>Pick a creature, see when you can be a deadbeat dad.</small>
      </li>
    </ul>
    <ul>
      <li><ThemeToggle /></li>
    </ul>
  </nav>

  <ServerSettings {settings} on:change={onSettingsChange} />

  <CreatureSelector {creatures} selected={creatureName} on:select={onCreatureSelect} />

  {#if stats}
    <p class="creature-stats">
      {stats.birthLabel}: {formatTime(stats.birthTime)} | Maturation: {formatTime(stats.maturationTime)} | Baby: {formatTime(stats.babyTime)}
    </p>
  {/if}

  {#if creatureName}
    <div class="grid inputs-grid">
      <label>
        Maturation %
        <div class="maturation-slider">
          <input
            id="maturation-range"
            name="maturation-range"
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round(maturationProgress * 100)}
            on:input={(e) => maturationProgress = Number(e.target.value) / 100}
          />
          <input
            id="maturation-number"
            name="maturation-number"
            type="number"
            inputmode="decimal"
            min="0"
            max="100"
            step="0.1"
            value={maturationProgress * 100}
            on:input={(e) => maturationProgress = Math.min(100, Math.max(0, Number(e.target.value))) / 100}
            on:keydown={blockAlpha}
          />
        </div>
      </label>
      <label>
        Weight
        <input id="weight" name="weight" type="number" inputmode="decimal" bind:value={finalWeight} min="1" step="1" on:keydown={blockAlpha} />
      </label>
      {#if creatureData}
        <FoodSelector options={foodLists[creatureData.type] || []} selected={foodUnit} on:select={(e) => foodUnit = e.detail} />
      {/if}
    </div>
  {/if}

  {#if finalBuffer}
    <div class="hero-answer">
      <span class="hero-label">Stop hand-feeding at</span>
      <div class="hero-value">{formatPercent(finalBuffer.lastHandFeedMaturation)}%</div>
      <div class="hero-subtext">
        Hand-feed for {formatTime(finalBuffer.lastHandFeed)}
      </div>
    </div>
  {/if}

  <Results {stats} {maturation} {totalFood} {babyBuffer} {desiredBabyBuffer} foodUnit={foodUnit} on:bufferchange={(e) => desiredBabyBuffer = e.detail} />

  <FoodPerDay {totalFood} lossFactor={settings.lossFactor} foodUnit={foodUnit} on:lossfactor={onLossFactorChange} />

</main>
