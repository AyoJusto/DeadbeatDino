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
  import { formatTime, formatPercent } from './lib/format.js';
  import { onMount } from 'svelte';

  const STORAGE_KEY = 'deadbeatdino';

  const defaultSettings = {
    consumptionSpeed: 1,
    maturationSpeed: 1,
    hatchSpeed: 1,
    baseMinFoodRate: 0.000155,
    gen2HatchEffect: false,
    gen2GrowthEffect: false,
    lossFactor: 0,
    foodRateTimeUnits: 'Minute'
  };

  const SETTINGS_MIGRATION = {
    consumptionspeed: 'consumptionSpeed',
    maturationspeed: 'maturationSpeed',
    hatchspeed: 'hatchSpeed',
    baseminfoodrate: 'baseMinFoodRate',
    gen2hatcheffect: 'gen2HatchEffect',
    gen2growtheffect: 'gen2GrowthEffect',
    lossfactor: 'lossFactor',
    foodrate_time_units: 'foodRateTimeUnits'
  };

  function migrateSettings(settings) {
    const migrated = {};
    for (const [key, value] of Object.entries(settings)) {
      const newKey = SETTINGS_MIGRATION[key] || key;
      migrated[newKey] = value;
    }
    return migrated;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      if (saved.creatureName && !creatures[saved.creatureName]) {
        saved.creatureName = '';
      }
      if (saved.settings) {
        saved.settings = migrateSettings(saved.settings);
      }
      // Migrate old variable names
      if (saved.finalweight !== undefined && saved.finalWeight === undefined) {
        saved.finalWeight = saved.finalweight;
        delete saved.finalweight;
      }
      if (saved.desiredbabybuffer !== undefined && saved.desiredBabyBuffer === undefined) {
        saved.desiredBabyBuffer = saved.desiredbabybuffer;
        delete saved.desiredbabybuffer;
      }
      return saved;
    } catch { return null; }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        creatureName, maturationProgress, finalWeight, desiredBabyBuffer, settings
      }));
    } catch {}
  }

  const saved = loadState();

  let creatureName = saved?.creatureName || '';
  let maturationProgress = saved?.maturationProgress || 0;
  let finalWeight = saved?.finalWeight || 0;
  let desiredBabyBuffer = saved?.desiredBabyBuffer || 30;
  let settings = saved?.settings ? { ...defaultSettings, ...saved.settings } : { ...defaultSettings };

  $: creatureName, maturationProgress, finalWeight, desiredBabyBuffer, settings, saveState();

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
            min="0"
            max="100"
            step="1"
            value={Math.round(maturationProgress * 100)}
            on:input={(e) => maturationProgress = Math.min(100, Math.max(0, Number(e.target.value))) / 100}
          />
        </div>
      </label>
      <label>
        Weight
        <input id="weight" name="weight" type="number" bind:value={finalWeight} min="1" step="1" />
      </label>
      <label>
        Desired Buffer (min)
        <input id="desired-buffer" name="desired-buffer" type="number" bind:value={desiredBabyBuffer} min="0" max="600" step="1" />
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

  <ServerSettings {settings} on:change={onSettingsChange} />

  <Results {stats} {maturation} {totalFood} {babyBuffer} foodUnit={foodUnit} />

  <FoodPerDay {totalFood} lossFactor={settings.lossFactor} foodUnit={foodUnit} on:lossfactor={onLossFactorChange} />

</main>
