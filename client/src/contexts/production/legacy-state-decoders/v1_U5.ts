import { nanoid } from 'nanoid';
import { POINTS_ITEM_KEY } from '../../../utilities/production-solver';
import { GameData, ItemMap, RecipeMap } from '../../gameData/types';
import { getInitialState } from '../reducer';
import { FactoryOptions } from '../types';

const FACTORY_SETTINGS_VERSION = 'v1_U5';

const SEP0 = ',';
const SEP1 = '|';
const SEP2 = ':';

function getItemBySlug(slug: string, items: ItemMap) {
  if (slug === 'points') {
    return POINTS_ITEM_KEY;
  }
  const itemEntry = Object.entries(items).find(([key, item]) => item.slug === slug);
  if (itemEntry) {
    return itemEntry[0];
  }
  throw new Error('INVALID ITEM SLUG');
}

function getModeBySlug(slug: string, recipes: RecipeMap) {
  if (slug === 'per_minute') return 'per-minute';
  if (slug === 'maximize') return 'maximize';
  const recipeEntry = Object.entries(recipes).find(([key, recipe]) => recipe.slug === slug);
  if (recipeEntry) {
    return recipeEntry[0];
  }
  throw new Error('INVALID RECIPE SLUG');
}

export function decodeState_v1_U5(stateStr: string, gameData: GameData): FactoryOptions {
  const newState: FactoryOptions = getInitialState(gameData);

  const fields = stateStr.split(SEP0);
  if (fields[0] !== FACTORY_SETTINGS_VERSION) throw new Error('VERSION MISMATCH');
  if (fields.length !== 7) throw new Error('INVALID DATA [BAD FIELDS]');

  const allowedRecipes = Object.keys(newState.allowedRecipes)
    .filter((recipeKey) => {
      const recipeInfo = gameData.recipes[recipeKey];
      if (recipeInfo.isFicsmas) {
        newState.allowedRecipes[recipeKey] = false;
        return false;
      }
      return true;
    });

  const allowedRecipesBits = BigInt(`0x${fields[1]}`)
    .toString(2)
    .padStart(allowedRecipes.length, '0')
    .split('')
    .map((b) => !!parseInt(b));
  allowedRecipes
    .sort((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    })
    .forEach((key, i) => {
      newState.allowedRecipes[key] = !!allowedRecipesBits[i];
    });

  const productionItemsStrings = fields[2].split(SEP1);
  if (productionItemsStrings[0]) {
    productionItemsStrings.forEach((str) => {
      const values = str.split(SEP2);
      if (values.length !== 3) throw new Error('INVALID DATA [productionItems]');
      newState.productionItems.push({
        key: nanoid(),
        itemKey: getItemBySlug(values[0], gameData.items),
        mode: getModeBySlug(values[1], gameData.recipes),
        value: values[2],
      });
    });
  }

  const inputItemsStrings = fields[3].split(SEP1);
  if (inputItemsStrings[0]) {
    inputItemsStrings.forEach((str) => {
      const values = str.split(SEP2);
      if (values.length !== 4) throw new Error('INVALID DATA [inputItems]');
      newState.inputItems.push({
        key: nanoid(),
        itemKey: getItemBySlug(values[0], gameData.items),
        value: values[1],
        weight: values[2],
        unlimited: !!parseInt(values[3]),
      });
    });
  }

  const inputResourcesStrings = fields[4].split(SEP1);
  newState.inputResources.forEach((resourceOptions, i) => {
    const values = inputResourcesStrings[i].split(SEP2);
    if (values.length !== 3) throw new Error('INVALID DATA [inputResources]');
    resourceOptions.value = values[0];
    resourceOptions.weight = values[1];
    resourceOptions.unlimited = !!parseInt(values[2]);
  });

  newState.allowHandGatheredItems = !!parseInt(fields[5]);

  const weightingOptionsStrings = fields[6].split(SEP2);
  if (weightingOptionsStrings.length !== 3) throw new Error('INVALID DATA [weightingOptions]');
  newState.weightingOptions.resources = weightingOptionsStrings[0];
  newState.weightingOptions.power = weightingOptionsStrings[1];
  newState.weightingOptions.complexity = weightingOptionsStrings[2];
  newState.weightingOptions.buildings = '0';

  return newState;
}
