const STORAGE_KEY = 'deadbeatdino';

export const defaultSettings = {
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

export function loadState(creatures) {
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

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}
