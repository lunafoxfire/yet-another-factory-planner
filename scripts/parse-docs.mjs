import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import parseDocs from 'satisfactory-docs-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DOCS_PATH = path.join(ROOT_DIR, 'data/Docs.json');
const OUTPUT_DIR = path.join(ROOT_DIR, 'src/data/json');

const EXCLUDED_RECIPES = [
  'Recipe_UnpackageBioFuel_C',
  'Recipe_UnpackageFuel_C',
  'Recipe_UnpackageOil_C',
  'Recipe_UnpackageOilResidue_C',
  'Recipe_UnpackageWater_C',
  'Recipe_UnpackageAlumina_C',
  'Recipe_UnpackageTurboFuel_C',
  'Recipe_UnpackageSulfuricAcid_C',
  'Recipe_UnpackageNitrogen_C',
  'Recipe_UnpackageNitricAcid_C',

  // TODO: Figure out how to properly handle these
  'Recipe_Alternate_Plastic_1_C',
  'Recipe_Alternate_RecycledRubber_C',
];

const data = parseDocs(fs.readFileSync(DOCS_PATH));

const buildings = {};
Object.entries(data.buildings).forEach(([buildingKey, buildingData]) => {
  if (!buildingData.isProduction) {
    return;
  }
  let power = null;
  if (buildingData.meta.powerConsumption) {
    power = buildingData.meta.powerConsumption;
  } else if (buildingData.meta.powerConsumptionCycle) {
    // for now be lazy
    power = (buildingData.meta.powerConsumptionCycle.minimumConsumption + buildingData.meta.powerConsumptionCycle.maximumConsumption) / 2;
  }

  // TODO: Fix in parse-docs lib
  const FIXED_KEY = buildingKey.replace('Desc_', 'Build_');
  buildings[FIXED_KEY] = {
    slug: buildingData.slug,
    name: buildingData.name,
    power,
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
    slug: recipeData.slug,
    name: recipeData.name,
    isAlternate: recipeData.isAlternate,
    ingredients,
    products,
    producedIn: producedIn,
  };
});

const resources = {};
// let totalExtraction = 0;
let maxExtraction = 0;
Object.entries(data.resources).forEach(([resourceKey, resourceData]) => {
  if (resourceData.maxExtraction !== Infinity) {
    // totalExtraction += resourceData.maxExtraction;
    if (resourceData.maxExtraction > maxExtraction) {
      maxExtraction = resourceData.maxExtraction;
    }
  }
  resources[resourceKey] = {
    itemClass: resourceData.itemClass,
    maxExtraction: resourceData.maxExtraction,
    relativeValue: 0,
  };
});

Object.entries(resources).forEach(([resourceKey, resourceData]) => {
  if (resourceData.maxExtraction) {
    resourceData.relativeValue = maxExtraction / resourceData.maxExtraction;
  }
});

const items = {};
const itemRecipeMap = {};
const uncraftableItems = {};
Object.entries(data.items).forEach(([itemKey, itemData]) => {
  let usedInProduction = false;
  const itemRecipes = [];
  Object.entries(recipes).forEach(([recipeKey, recipeData]) => {
    if (recipeData.ingredients.find((i) => i.itemClass === itemKey)) {
      usedInProduction = true;
    }
    if (recipeData.products.find((p) => p.itemClass === itemKey)) {
      usedInProduction = true;
      itemRecipes.push(recipeKey);
    }
  });
  if (usedInProduction) {
    if (itemRecipes.length > 0) {
      itemRecipeMap[itemKey] = itemRecipes;
    } else if (!resources[itemKey]) {
      uncraftableItems[itemKey] = itemKey;
    }
    items[itemKey] = {
      slug: itemData.slug,
      name: itemData.name,
      sinkPoints: itemData.sinkPoints,
    };
  }
});

writeFileSafe(path.join(OUTPUT_DIR, 'buildings.json'), buildings);
writeFileSafe(path.join(OUTPUT_DIR, 'recipes.json'), recipes);
writeFileSafe(path.join(OUTPUT_DIR, 'resources.json'), resources);
writeFileSafe(path.join(OUTPUT_DIR, 'items.json'), items);
writeFileSafe(path.join(OUTPUT_DIR, 'itemRecipeMap.json'), itemRecipeMap);
writeFileSafe(path.join(OUTPUT_DIR, 'uncraftableItems.json'), uncraftableItems);

function writeFileSafe(filePath, data) {
  const json = JSON.stringify(data, null, 2);
  const pathInfo = path.parse(filePath);
  fs.mkdirSync(pathInfo.dir, { recursive: true });
  fs.writeFileSync(filePath, json);
}
