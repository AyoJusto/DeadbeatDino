export const foodLists = {
	Carnivore: ['Raw Meat', 'Cooked Meat', 'Raw Fish Meat', 'Kibble'],
	Herbivore: ['Mejoberry', 'Berry', 'Vegetables', 'Kibble'],
	Omnivore: ['Raw Meat', 'Cooked Meat', 'Raw Fish Meat', 'Mejoberry', 'Berry', 'Kibble'],
	Microraptor: ['Raw Meat', 'Cooked Meat', 'Rare Flower'],
	Archaeopteryx: ['Chitin'],
	Sinomacrops: ['Chitin'],
	Vulture: ['Spoiled Meat'],
	Carrion: ['Spoiled Meat', 'Raw Meat (Carrion)', 'Raw Fish Meat (Carrion)'],
	Piscivore: ['Raw Fish Meat', 'Cooked Fish Meat'],
	Wyvern: ['Wyvern Milk'],
	CrystalWyvern: ['Primal Crystal'],
	Magmasaur: ['Ambergris', 'Sulfur'],
	RockDrake: ['Nameless Venom'],
	BloodStalker: ['Blood Pack', 'Raw Meat (Carrion)', 'Raw Fish Meat (Carrion)'],
	Archelon: ['Vegetables (Archelon)', 'Bio Toxin', 'Berry (Archelon)']
};

export const foodList = ['Raw Meat', 'Cooked Meat', 'Raw Fish Meat', 'Raw Fish Meat (Carrion)', 'Cooked Fish Meat', 'Mejoberry', 'Berry', 'Vegetables', 'Kibble', 'Rare Flower', 'Chitin', 'Spoiled Meat', 'Wyvern Milk', 'Mutagen', 'Primal Crystal', 'Ambergris', 'Nameless Venom', 'Raw Meat (Carrion)', 'Blood Pack', 'Sulfur', 'Vegetables (Archelon)', 'Bio Toxin', 'Berry (Archelon)'];

// foodorder = in-game eating priority (differs from display order above)
export const foodOrder = ['Raw Fish Meat', 'Raw Fish Meat (Carrion)', 'Cooked Fish Meat', 'Raw Meat', 'Berry', 'Cooked Meat', 'Mejoberry', 'Vegetables', 'Kibble', 'Rare Flower', 'Chitin', 'Spoiled Meat', 'Wyvern Milk', 'Mutagen', 'Primal Crystal', 'Ambergris', 'Nameless Venom', 'Raw Meat (Carrion)', 'Blood Pack', 'Sulfur', 'Vegetables (Archelon)', 'Bio Toxin', 'Berry (Archelon)'];

export const troughTypes = {
	Normal: 4,
	Tek: 100,
	Clicker: 1
};

export const foodRateTimeUnits = {
	Minute: 1,
	Hour: 60,
	Day: 60*24
};
