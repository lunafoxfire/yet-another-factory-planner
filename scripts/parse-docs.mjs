import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import parseDocs from 'satisfactory-docs-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DOCS_PATH = path.join(ROOT_DIR, 'data/Docs.json');
const OUTPUT_DIR = path.join(ROOT_DIR, 'src/data/json');

const data = parseDocs(fs.readFileSync(DOCS_PATH));

const recipes = {};
Object.entries((data.itemRecipes)).forEach(([recipeKey, recipeData]) => {
  if (!recipeData.producedIn.length) {
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

  recipes[recipeKey] = {
    slug: recipeData.slug,
    name: recipeData.name,
    isAlternate: recipeData.isAlternate,
    ingredients,
    products,
    producedIn: recipeData.producedIn,
  };
});

const resources = {};
Object.entries(data.resources).forEach(([resourceKey, resourceData]) => {
  resources[resourceKey] = {
    itemClass: resourceData.itemClass,
    maxExtraction: resourceData.maxExtraction,
  };
});

const items = {};
const itemRecipeMap = {};
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
  if (itemRecipes.length > 0) {
    itemRecipeMap[itemKey] = itemRecipes;
  }
  if (usedInProduction) {
    items[itemKey] = {
      slug: itemData.slug,
      name: itemData.name,
      sinkPoints: itemData.sinkPoints,
    };
  }
});

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
  buildings[buildingKey] = {
    slug: buildingData.slug,
    name: buildingData.name,
    power,
  }
});

writeFileSafe(path.join(OUTPUT_DIR, 'recipes.json'), recipes);
writeFileSafe(path.join(OUTPUT_DIR, 'resources.json'), resources);
writeFileSafe(path.join(OUTPUT_DIR, 'items.json'), items);
writeFileSafe(path.join(OUTPUT_DIR, 'itemRecipeMap.json'), itemRecipeMap);
writeFileSafe(path.join(OUTPUT_DIR, 'buildings.json'), buildings);

function writeFileSafe(filePath, data) {
  const json = JSON.stringify(data, null, 2);
  const pathInfo = path.parse(filePath);
  fs.mkdirSync(pathInfo.dir, { recursive: true });
  fs.writeFileSync(filePath, json);
}
