import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import parseDocs from 'satisfactory-docs-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DOCS_PATH = path.join(ROOT_DIR, 'data/Docs.json');
const OUTPUT_DIR = path.join(ROOT_DIR, 'src/data/json');

const EXCLUDED_RECIPES = [];
// TODO: do this in parse-docs
const BUILDING_AREAS = {
  'Build_ConstructorMk1_C': 80,
  'Build_SmelterMk1_C': 54,
  'Build_FoundryMk1_C': 90,
  'Build_OilRefinery_C': 200,
  'Build_AssemblerMk1_C': 150,
  'Build_Packager_C': 64,
  'Build_Blender_C': 288,
  'Build_ManufacturerMk1_C': 342,
  'Build_HadronCollider_C': 912,
  'Build_GeneratorNuclear_C': 1634,
};

const data = parseDocs(fs.readFileSync(DOCS_PATH));

const buildings = {};
Object.entries(data.buildings).forEach(([buildingKey, buildingData]) => {
  // TODO: Add nuclear generator to production buildings?
  if (!buildingData.isProduction && buildingKey !== 'Desc_GeneratorNuclear_C') {
    return;
  }
  let power = 0;
  if (buildingData.meta.powerProduction) {
    power = -buildingData.meta.powerProduction;
  } else if (buildingData.meta.powerConsumption) {
    power = buildingData.meta.powerConsumption;
  } else if (buildingData.meta.powerConsumptionCycle) {
    power = (buildingData.meta.powerConsumptionCycle.minimumConsumption + buildingData.meta.powerConsumptionCycle.maximumConsumption) / 2;
  }
  // TODO: Fix in parse-docs lib
  const fixedKey = buildingKey.replace('Desc_', 'Build_');
  const area = BUILDING_AREAS[fixedKey] || 0;

  let buildCost = [];
  const recipeData = Object.values(data.buildRecipes).find((br) => br.product === buildingKey);
  if (recipeData) {
    buildCost = recipeData.ingredients;
  } else {
    console.warn(`BUILDING ${fixedKey} HAS NO BUILD COST`);
  }

  buildings[fixedKey] = {
    slug: buildingData.slug.replaceAll('-', '_'),
    name: buildingData.name,
    power,
    area,
    buildCost,
  }
});

const recipes = {};
Object.entries((data.itemRecipes)).forEach(([recipeKey, recipeData]) => {
  if (!recipeData.producedIn.length || EXCLUDED_RECIPES.includes(recipeKey)) {
    return;
  }
  const craftTime = recipeData.craftTime;
  const ingredients = recipeData.ingredients.map(({ itemClass, quantity }) => {
    const perMinute = 60 * quantity / craftTime;
    return {
      itemClass,
      perMinute,
    };
  });
  const products = recipeData.products.map(({ itemClass, quantity }) => {
    const perMinute = 60 * quantity / craftTime;
    return {
      itemClass,
      perMinute,
    };
  });
  const productBuildings = recipeData.producedIn.filter((buildingKey) => !!buildings[buildingKey]);
  let producedIn = null;
  if (productBuildings.length === 0) {
    console.warn(`RECIPE [${recipeKey}] HAS NO PRODUCTION BUILDING`);
  } else if (productBuildings.length > 1) {
    console.warn(`RECIPE [${recipeKey}] HAS MULTIPLE PRODUCTION BUILDINGS`);
  } else {
    producedIn = productBuildings[0];
  }

  recipes[recipeKey] = {
    slug: recipeData.slug.replaceAll('-', '_'),
    name: recipeData.name,
    isAlternate: recipeData.isAlternate,
    ingredients,
    products,
    producedIn: producedIn,
  };
});

// TODO: Add to parse docs
recipes['Recipe_CUSTOM_NuclearPower_C'] = {
  slug: 'uranium_power_recipe',
  name: 'Uranium Power',
  isAlternate: false,
  ingredients: [{ itemClass: 'Desc_NuclearFuelRod_C', perMinute: 0.2 }, { itemClass: 'Desc_Water_C', perMinute: 300 }],
  products: [{ itemClass: 'Desc_NuclearWaste_C', perMinute: 10 }],
  producedIn: 'Build_GeneratorNuclear_C',
};
recipes['Recipe_CUSTOM_PlutoniumPower_C'] = {
  slug: 'plutonium_power_recipe',
  name: 'Plutonium Power',
  isAlternate: false,
  ingredients: [{ itemClass: 'Desc_PlutoniumFuelRod_C', perMinute: 0.1 }, { itemClass: 'Desc_Water_C', perMinute: 300 }],
  products: [{ itemClass: 'Desc_CUSTOM_PlutoniumWaste_C', perMinute: 1 }],
  producedIn: 'Build_GeneratorNuclear_C',
};

const resources = {};
let maxExtraction = 0;
Object.entries(data.resources).forEach(([resourceKey, resourceData]) => {
  if (resourceData.maxExtraction !== Infinity) {
    if (resourceData.maxExtraction > maxExtraction) {
      maxExtraction = resourceData.maxExtraction;
    }
  }
  resources[resourceKey] = {
    itemClass: resourceData.itemClass,
    maxExtraction: resourceData.maxExtraction,
    relativeValue: 1,
  };
});

Object.entries(resources).forEach(([resourceKey, resourceData]) => {
  if (resourceData.maxExtraction && resourceData.maxExtraction !== Infinity) {
    resourceData.relativeValue = Math.floor(maxExtraction / resourceData.maxExtraction * 100);
  }
});

const items = {};
const handGatheredItems = {};
Object.entries(data.items).forEach(([itemKey, itemData]) => {
  const usedInRecipes = [];
  const producedFromRecipes = [];
  Object.entries(recipes).forEach(([recipeKey, recipeData]) => {
    if (recipeData.ingredients.find((i) => i.itemClass === itemKey)) {
      usedInRecipes.push(recipeKey);
    }
    if (recipeData.products.find((p) => p.itemClass === itemKey)) {
      producedFromRecipes.push(recipeKey);
    }
  });

  if (usedInRecipes.length === 0 && producedFromRecipes.length === 0) return;
  if (producedFromRecipes.length === 0 && !resources[itemKey]) {
    handGatheredItems[itemKey] = itemKey;
  }
  items[itemKey] = {
    slug: itemData.slug.replaceAll('-', '_'),
    name: itemData.name,
    sinkPoints: itemData.isFluid ? 0 : itemData.sinkPoints,
    usedInRecipes,
    producedFromRecipes,
  };
});

// TODO: Missing from docs
items['Desc_CUSTOM_PlutoniumWaste_C'] = {
  slug: 'plutonium_waste',
  name: 'Plutonium Waste',
  sinkPoints: 0,
  usedInRecipes: [],
  producedFromRecipes: ['Recipe_CUSTOM_PlutoniumPower_C'],
};

writeFileSafe(path.join(OUTPUT_DIR, 'buildings.json'), buildings);
writeFileSafe(path.join(OUTPUT_DIR, 'recipes.json'), recipes);
writeFileSafe(path.join(OUTPUT_DIR, 'resources.json'), resources);
writeFileSafe(path.join(OUTPUT_DIR, 'items.json'), items);
writeFileSafe(path.join(OUTPUT_DIR, 'handGatheredItems.json'), handGatheredItems);

function writeFileSafe(filePath, data) {
  const json = JSON.stringify(data, null, 2);
  const pathInfo = path.parse(filePath);
  fs.mkdirSync(pathInfo.dir, { recursive: true });
  fs.writeFileSync(filePath, json);
}
