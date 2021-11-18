import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import itemRecipeMap from '../src/data/json/itemRecipeMap.json';
import recipes from '../src/data/json/recipes.json';
import resources from '../src/data/json/resources.json';
import uncraftableItems from '../src/data/json/uncraftableItems.json';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'src/data/json');

const baseResources = [...Object.keys(resources), ...Object.keys(uncraftableItems)];
const evaluatedItems = {};


let iterations = 0;
let noUpdates = false;
while (!noUpdates && iterations < 50) {
  iterations++;
  noUpdates = true;

  nextItem:
  for (const [itemKey, recipeKeys] of Object.entries(itemRecipeMap)) {
    if (evaluatedItems[itemKey]) {
      continue;
    }

    const itemEval = {
      recipes: {},
      minCost: {},
    };

    for (const recipeKey of recipeKeys) {
      const recipe = recipes[recipeKey];
      const primaryProduct = recipe.products.find((p) => p.itemClass === itemKey);
      const recipeEval = { minCost: {} };

      for (const ingredient of recipe.ingredients) {
        if (ingredient.itemClass === itemKey) {
          // Fix for Recipe_UraniumCell_C
          continue;
        }
        let cost = {};
        if (baseResources.includes(ingredient.itemClass)) {
          cost[ingredient.itemClass] = ingredient.perMinute / primaryProduct.perMinute;
        } else if (evaluatedItems[ingredient.itemClass]) {
          const ingredientItemEval = evaluatedItems[ingredient.itemClass];
          for (const [resource, resourceCost] of Object.entries(ingredientItemEval.minCost)) {
            cost[resource] = (ingredient.perMinute / primaryProduct.perMinute) * resourceCost;
          }
        } else {
          continue nextItem;
        }

        for (const [resource, resourceCost] of Object.entries(cost)) {
          if (recipeEval.minCost[resource] == null) {
            recipeEval.minCost[resource] = resourceCost;
          } else {
            recipeEval.minCost[resource] += resourceCost;
          }
        }
      }

      itemEval.recipes[recipeKey] = recipeEval;
      for (const [resource, resourceCost] of Object.entries(recipeEval.minCost)) {
        if (itemEval.minCost[resource] == null || resourceCost < itemEval.minCost[resource]) {
          itemEval.minCost[resource] = resourceCost;
        }
      }
    }

    evaluatedItems[itemKey] = itemEval;
    noUpdates = false;
  }
}

const missingItems = [];
for (const itemKey of Object.keys(itemRecipeMap)) {
  if (!evaluatedItems[itemKey]) {
    missingItems.push(itemKey);
  }
}

console.log(`COMPLETED: ${noUpdates}`);
console.log(`ITERATIONS: ${iterations}`);
console.log('MISSING ITEMS:');
console.log(missingItems);

writeFileSafe(path.join(OUTPUT_DIR, 'itemCostBounds.json'), evaluatedItems);

function writeFileSafe(filePath, data) {
  const json = JSON.stringify(data, null, 2);
  const pathInfo = path.parse(filePath);
  fs.mkdirSync(pathInfo.dir, { recursive: true });
  fs.writeFileSync(filePath, json);
}
