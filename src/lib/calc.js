function clamp(value, min, max) {
	if (isNaN(value)) return min;
	return Math.min(max, Math.max(min, value));
}

export function getFoodMult(creatureData, foodName) {
	return creatureData.foodMult?.[foodName] ?? 1;
}

export function getWasteMult(creatureData, foodName) {
	return creatureData.wasteMult?.[foodName] ?? 1;
}

export function calcStats(creatureData, settings) {
	let maturationTime = 1 / creatureData.ageSpeed / creatureData.ageSpeedMult / settings.maturationSpeed;
	if (settings.gen2GrowthEffect) {
		maturationTime /= 2;
	}
	const babyTime = maturationTime / 10;

	let birthTime;
	let birthLabel;
	if (creatureData.birthType === 'Incubation') {
		birthTime = 100 / creatureData.eggSpeed / creatureData.eggSpeedMult / settings.hatchSpeed;
		if (settings.gen2HatchEffect) birthTime /= 1.5;
		birthLabel = 'Incubation';
	} else {
		birthTime = 1 / creatureData.gestationSpeed / creatureData.gestationSpeedMult / settings.hatchSpeed;
		if (settings.gen2HatchEffect) birthTime /= 1.5;
		birthLabel = 'Gestation';
	}

	const maxFoodRate = creatureData.baseFoodRate * creatureData.babyFoodRate * creatureData.extraBabyFoodRate * settings.consumptionSpeed;
	const minFoodRate = settings.baseMinFoodRate * creatureData.babyFoodRate * creatureData.extraBabyFoodRate * settings.consumptionSpeed;
	const foodRateDecay = (maxFoodRate - minFoodRate) / maturationTime;

	return { maturationTime, babyTime, birthTime, birthLabel, maxFoodRate, minFoodRate, foodRateDecay };
}

export function calcMaturation(progress, stats) {
	const maturationTimeComplete = stats.maturationTime * progress;
	const maturationTimeRemaining = stats.maturationTime - maturationTimeComplete;
	const babyTimeRemaining = Math.max(0, stats.babyTime - maturationTimeComplete);
	return { maturationTimeComplete, maturationTimeRemaining, babyTimeRemaining };
}

// Trapezoid integral — food rate decays linearly over maturation
export function getFoodForPeriod(start, end, maturationTime, maxFoodRate, foodRateDecay) {
	end = Math.min(maturationTime, end);
	end = Math.max(start, end);
	const startFoodRate = maxFoodRate - foodRateDecay * start;
	const endFoodRate = maxFoodRate - foodRateDecay * end;
	const totalTime = end - start;
	return 0.5 * totalTime * (startFoodRate - endFoodRate) + endFoodRate * totalTime;
}

export function calcTotalFood(stats, maturationTimeComplete, creatureData, foodUnit, foods, foodRateTimeUnit, lossFactor) {
	const { maturationTime, babyTime, maxFoodRate, foodRateDecay } = stats;
	const foodMult = getFoodMult(creatureData, foodUnit);
	const foodValue = foods[foodUnit].food * foodMult;

	const totalFood = getFoodForPeriod(0, maturationTime, maturationTime, maxFoodRate, foodRateDecay);
	const babyFood = getFoodForPeriod(0, babyTime, maturationTime, maxFoodRate, foodRateDecay);
	const toJuvFood = getFoodForPeriod(maturationTimeComplete, babyTime, maturationTime, maxFoodRate, foodRateDecay);
	const toAdultFood = getFoodForPeriod(maturationTimeComplete, maturationTime, maturationTime, maxFoodRate, foodRateDecay);

	const nextMinFood = Math.ceil(getFoodForPeriod(maturationTimeComplete, maturationTimeComplete + 60, maturationTime, maxFoodRate, foodRateDecay) * foodRateTimeUnit * 100) / 100;
	const nextFoodPerTimeUnit = Math.ceil((nextMinFood / foodValue) * 100) / 100;

	const foodForDay = {};
	const foodItemsForDay = {};
	let day = 1;
	let food = getFoodForPeriod((day - 1) * 86400, day * 86400, maturationTime, maxFoodRate, foodRateDecay);
	while (food > 0 && day < 20) {
		foodForDay[day] = food + food * lossFactor / 100;
		foodItemsForDay[day] = (food + food * (lossFactor / 100)) / foodValue;
		day++;
		food = getFoodForPeriod((day - 1) * 86400, day * 86400, maturationTime, maxFoodRate, foodRateDecay);
	}

	return {
		totalFood, babyFood, toJuvFood, toAdultFood,
		totalFoodItems: totalFood / foodValue,
		babyFoodItems: babyFood / foodValue,
		toJuvFoodItems: toJuvFood / foodValue,
		toAdultFoodItems: toAdultFood / foodValue,
		nextMinFood, nextFoodPerTimeUnit,
		foodForDay, foodItemsForDay
	};
}

// 1-second-per-tick trough simulation, max 3 days
export function troughSim(creatureList, troughStacks, troughMultiplier, deps) {
	const { creatures, foods, foodLists, foodOrder, settings } = deps;
	const troughCreatures = [];

	if (creatureList.length === 0) {
		return { time: 0, times: {}, totalFood: 0, totalPoints: 0, eatenFood: 0, eatenPoints: 0, spoiledFood: 0, spoiledPoints: 0, wastedPoints: 0 };
	}

	const stacks = [];
	const totalStacks = { all: 0 };
	const times = {};

	for (let i = 0; i < foodOrder.length; i++) {
		const foodName = foodOrder[i];
		if (troughStacks[foodName] === undefined) {
			continue;
		}
		totalStacks.all += Math.ceil(troughStacks[foodName]);
		totalStacks[foodName] = Math.ceil(troughStacks[foodName]);
		const fullStacks = Math.floor(troughStacks[foodName]);
		const partialStack = troughStacks[foodName] - fullStacks;
		let j;
		for (j = 0; j < troughStacks[foodName]; j++) {
			stacks.push({
				type: foodName,
				stackSize: foods[foodName].stack,
				stackSpoil: foods[foodName].spoil * troughMultiplier,
				foodSpoil: foods[foodName].spoil * troughMultiplier,
				food: foods[foodName].food,
				waste: foods[foodName].waste
			});
		}
		if (stacks.length > 0 && partialStack > 0) {
			stacks[j - 1].stackSize = Math.floor(stacks[j - 1].stackSize * partialStack);
			if (stacks[j - 1].stackSize === 0) {
				totalStacks[foodName]--;
				totalStacks.all--;
			}
		}
	}

	for (let i = 0; i < creatureList.length; i++) {
		for (let j = 0; j < creatureList[i].quantity; j++) {
			const name = creatureList[i].name;
			const cd = creatures[name];
			let maturationTime = 1 / cd.ageSpeed / cd.ageSpeedMult / settings.maturationSpeed;
			// BUG preserved: should be gen2GrowthEffect but original uses gen2HatchEffect
			if (settings.gen2HatchEffect === true) {
				maturationTime = 1 / cd.ageSpeed / cd.ageSpeedMult / settings.maturationSpeed / 1.5;
			}
			const maxFoodRate = cd.baseFoodRate * cd.babyFoodRate * cd.extraBabyFoodRate * settings.consumptionSpeed;
			const minFoodRate = settings.baseMinFoodRate * cd.babyFoodRate * cd.extraBabyFoodRate * settings.consumptionSpeed;
			const foodRateDecay = (maxFoodRate - minFoodRate) / maturationTime;

			troughCreatures.push({
				name: name,
				maturation: creatureList[i].maturation,
				maturationTime: maturationTime,
				maturationTimeComplete: maturationTime * creatureList[i].maturation,
				maxFoodRate: maxFoodRate,
				minFoodRate: minFoodRate,
				foodRateDecay: foodRateDecay,
				foodRate: maxFoodRate - foodRateDecay * creatureList[i].maturation * maturationTime,
				hunger: 0,
				foods: foodLists[cd.type],
				foodMult: cd.foodMult,
				wasteMult: cd.wasteMult
			});
			times[cd.type] = 0;
		}
	}

	let spoiledPoints = 0;
	let spoiledFood = 0;
	let eatenPoints = 0;
	let eatenFood = 0;
	let wastedPoints = 0;

	let time = 0;
	while (totalStacks.all > 0 && time < 60 * 60 * 24 * 3) {
		time++;

		for (let i = 0; i < troughCreatures.length; i++) {
			if (troughCreatures[i].foodRate < troughCreatures[i].minFoodRate) {
				continue;
			}

			troughCreatures[i].foodRate -= troughCreatures[i].foodRateDecay;
			troughCreatures[i].hunger += troughCreatures[i].foodRate;

			if (troughCreatures[i].hunger < 20) {
				continue; // Can't eat until 20+ hunger accumulated
			}

			for (let currentStack = 0; currentStack < stacks.length; currentStack++) {
				if (stacks[currentStack].stackSize > 0 && troughCreatures[i].foods.indexOf(stacks[currentStack].type) > -1) {
					const fm = troughCreatures[i].foodMult?.[stacks[currentStack].type] ?? 1;
					const wm = troughCreatures[i].wasteMult?.[stacks[currentStack].type] ?? 1;
					if (stacks[currentStack].food * fm < troughCreatures[i].hunger) {
						times[creatures[troughCreatures[i].name].type] = time;
						stacks[currentStack].stackSize--;
						eatenFood++;
						eatenPoints += stacks[currentStack].food * fm;
						wastedPoints += stacks[currentStack].waste * wm;
						troughCreatures[i].hunger -= stacks[currentStack].food * fm;
						if (stacks[currentStack].stackSize === 0) {
							totalStacks.all--;
							totalStacks[stacks[currentStack].type]--;
						}
					}
					break;
				}
			}
		}

		for (let i = 0; i < stacks.length; i++) {
			stacks[i].stackSpoil--;
			if (stacks[i].stackSpoil <= 0 && stacks[i].stackSize > 0) {
				stacks[i].stackSize--;
				stacks[i].stackSpoil = stacks[i].foodSpoil;
				spoiledFood++;
				spoiledPoints += stacks[i].food;
				wastedPoints += stacks[i].waste;
				if (stacks[i].stackSize === 0) {
					totalStacks.all--;
					totalStacks[stacks[i].type]--;
				}
			}
		}
	}

	return {
		time,
		times,
		totalFood: eatenFood + spoiledFood,
		totalPoints: eatenPoints + spoiledPoints + wastedPoints,
		eatenFood,
		eatenPoints,
		spoiledFood,
		spoiledPoints,
		wastedPoints
	};
}

// Binary search for the last maturation % where trough carries to juvenile
export function calcFinalBuffer(creatureName, maturationProgress, stats, creatureData, finalWeight, foodUnit, foods, foodOrder, deps) {
	const food = foods[foodUnit];
	const foodMult = getFoodMult(creatureData, foodUnit);

	const creatureList = [{ name: creatureName, maturation: maturationProgress, quantity: 1 }];
	const stackList = {};
	for (let i = 0; i < foodOrder.length; i++) {
		stackList[foodOrder[i]] = 0;
	}

	let estimate = (food.weight * stats.maxFoodRate * stats.maturationTime) / (10 * finalWeight * food.food * foodMult + 10 * food.weight * stats.maxFoodRate * stats.maturationTime);
	stackList[foodUnit] = 0;

	while (troughSim(creatureList, stackList, deps.troughTypes['Normal'], deps).time < stats.maturationTime * (0.1 - estimate)) {
		estimate += 0.01;
		stackList[foodUnit] = finalWeight * estimate / food.weight / food.stack;
		creatureList[0].maturation = estimate;
	}
	while (troughSim(creatureList, stackList, deps.troughTypes['Normal'], deps).time > stats.maturationTime * (0.1 - estimate)) {
		estimate -= 0.001;
		stackList[foodUnit] = finalWeight * estimate / food.weight / food.stack;
		creatureList[0].maturation = estimate;
	}
	estimate += 0.001;
	stackList[foodUnit] = finalWeight * estimate / food.weight / food.stack;
	creatureList[0].maturation = estimate;

	const maxBabyBuffer = troughSim(creatureList, stackList, deps.troughTypes['Normal'], deps).time;
	const lastHandFeed = Math.max(0, stats.maturationTime * (estimate - maturationProgress));
	const lastHandFeedMaturation = estimate;

	return { lastHandFeedMaturation, maxBabyBuffer, lastHandFeed };
}

// Binary search for the maturation % that gives the desired buffer minutes
export function calcDesiredBuffer(creatureName, maturationProgress, stats, creatureData, desiredBabyBuffer, finalWeight, foodUnit, foods, foodOrder, deps) {
	desiredBabyBuffer = clamp(desiredBabyBuffer, 0, 600);
	const food = foods[foodUnit];
	const foodMult = getFoodMult(creatureData, foodUnit);

	const creatureList = [{ name: creatureName, maturation: maturationProgress, quantity: 1 }];
	const stackList = {};
	for (let i = 0; i < foodOrder.length; i++) {
		stackList[foodOrder[i]] = 0;
	}

	let estimate = (food.weight * stats.maxFoodRate * desiredBabyBuffer * 60) / (finalWeight * food.food * foodMult + food.weight * stats.foodRateDecay * stats.maturationTime * desiredBabyBuffer * 60);
	stackList[foodUnit] = 0;

	while (troughSim(creatureList, stackList, deps.troughTypes['Normal'], deps).time < desiredBabyBuffer * 60) {
		estimate += 0.01;
		stackList[foodUnit] = finalWeight * estimate / food.weight / food.stack;
		creatureList[0].maturation = estimate;
	}
	while (troughSim(creatureList, stackList, deps.troughTypes['Normal'], deps).time > desiredBabyBuffer * 60) {
		estimate -= 0.001;
		stackList[foodUnit] = finalWeight * estimate / food.weight / food.stack;
		creatureList[0].maturation = estimate;
	}
	estimate += 0.001;
	stackList[foodUnit] = finalWeight * estimate / food.weight / food.stack;
	creatureList[0].maturation = estimate;

	const timeUntilDesiredBabyBuffer = Math.max(0, stats.maturationTime * (estimate - maturationProgress));
	const timeUntilDesiredBabyBufferMaturation = estimate;

	return { timeUntilDesiredBabyBufferMaturation, timeUntilDesiredBabyBuffer };
}

export function calcBabyBuffer(creatureName, maturationProgress, stats, creatureData, finalWeight, finalBufferResult, desiredBufferResult, foodUnit, foods, foodOrder, deps) {
	const food = foods[foodUnit];

	const currentWeight = finalWeight * maturationProgress;

	const creatureList = [{ name: creatureName, maturation: maturationProgress, quantity: 1 }];
	const stackList = {};
	for (let i = 0; i < foodOrder.length; i++) {
		stackList[foodOrder[i]] = 0;
	}

	stackList[foodUnit] = currentWeight / food.weight / food.stack;
	const foodToFill = currentWeight / food.weight;
	const currentBabyBuffer = troughSim(creatureList, stackList, deps.troughTypes['Normal'], deps).time;

	const lastHandFeed = Math.max(0, stats.maturationTime * (finalBufferResult.lastHandFeedMaturation - maturationProgress));
	const timeUntilDesiredBabyBuffer = Math.max(0, stats.maturationTime * (desiredBufferResult.timeUntilDesiredBabyBufferMaturation - maturationProgress));

	// Iteratively estimate food needed from current maturation to 10%
	let foodToFinishBaby = 'N/A';
	const foodMult = getFoodMult(creatureData, foodUnit);
	let estimate = ((stats.maxFoodRate - stats.foodRateDecay * maturationProgress * stats.maturationTime) - (stats.maxFoodRate - stats.foodRateDecay * 0.1 * stats.maturationTime)) * (stats.maturationTime * (0.1 - maturationProgress)) / 2;
	estimate += (stats.maxFoodRate - stats.foodRateDecay * 0.1 * stats.maturationTime) * stats.maturationTime * (0.1 - maturationProgress);
	estimate = estimate / food.food;

	creatureList[0].maturation = maturationProgress;
	let troughData = troughSim(creatureList, stackList, deps.troughTypes['Normal'], deps);
	while (maturationProgress > finalBufferResult.lastHandFeedMaturation && troughData.time < stats.maturationTime * (0.1 - maturationProgress)) {
		estimate = estimate * Math.max(1.01, (stats.maturationTime * (0.1 - maturationProgress)) / troughData.time);
		stackList[foodUnit] = estimate / food.stack;
		troughData = troughSim(creatureList, stackList, deps.troughTypes['Normal'], deps);
	}
	if (maturationProgress > finalBufferResult.lastHandFeedMaturation && maturationProgress < 0.1) {
		foodToFinishBaby = Math.ceil(estimate);
	}

	return { currentBabyBuffer, foodToFill, foodToFinishBaby, lastHandFeed, timeUntilDesiredBabyBuffer };
}
