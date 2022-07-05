import { nanoid } from 'nanoid';
import { resources, recipes } from '../../data'
import { decodeState_v1_U5 } from './state-decoders/v1_U5';
import { decodeState_v2_U5 } from './state-decoders/v2_U5';
import { decodeState_v3_U5 } from './state-decoders/v3_U5';

export const GAME_VERSION = 'U5';
export const SHARE_QUERY_KEY = 'factory';
export const MAX_PRIORITY = 20;

// TYPES
export type ProductionItemOptions = {
  key: string,
  itemKey: string,
  mode: 'per-minute' | 'maximize' | string,
  value: string,
};

export type WeightingOptions = {
  resources: string,
  power: string,
  complexity: string,
  buildings: string,
};

export type InputItemOptions = {
  key: string,
  itemKey: string,
  value: string,
  weight: string,
  unlimited: boolean,
};

export type RecipeMap = {
  [key: string]: boolean,
};

export type FactoryOptions = {
  gameVersion: string,
  key: string,
  productionItems: ProductionItemOptions[],
  inputItems: InputItemOptions[],
  inputResources: InputItemOptions[],
  allowHandGatheredItems: boolean,
  weightingOptions: WeightingOptions,
  allowedRecipes: RecipeMap,
};


// DEFAULTS
function getDefaultProductionItem(): ProductionItemOptions {
  return ({
    key: nanoid(),
    itemKey: '',
    mode: 'per-minute',
    value: '10',
  });
}

function getDefaultInputItem(): InputItemOptions {
  return ({
    key: nanoid(),
    itemKey: '',
    value: '10',
    weight: '0',
    unlimited: false,
  });
}

const ORDERED_RESOURCES = [
  'Desc_OreIron_C',
  'Desc_OreCopper_C',
  'Desc_Stone_C',
  'Desc_Coal_C',
  'Desc_OreGold_C',
  'Desc_RawQuartz_C',
  'Desc_Sulfur_C',
  'Desc_LiquidOil_C',
  'Desc_OreBauxite_C',
  'Desc_OreUranium_C',
  'Desc_NitrogenGas_C',
  'Desc_Water_C',
];

function getInitialInputResources(): InputItemOptions[] {
  return Object.entries(resources)
    .map(([key, data]) => {
      let value = '0';
      let unlimited = false;
      if (key === 'Desc_Water_C') {
        unlimited = true;
      } else {
        value = String(data.maxExtraction);
      }
      return {
        key: key,
        itemKey: key,
        value,
        weight: String(data.relativeValue),
        unlimited,
      };
    })
    .sort((a, b) => {
      let aIndex = ORDERED_RESOURCES.findIndex((r) => r === a.itemKey);
      if (aIndex === -1) aIndex = Infinity;
      let bIndex = ORDERED_RESOURCES.findIndex((r) => r === b.itemKey);
      if (bIndex === -1) bIndex = Infinity;
      return aIndex < bIndex ? -1 : 1;
    });
}

function getInitialWeightingOptions(): WeightingOptions {
  return {
    resources: '1000',
    power: '1',
    complexity: '0',
    buildings: '0',
  };
}

function getInitialAllowedRecipes(): RecipeMap {
  const recipeMap: RecipeMap = {};
  Object.entries(recipes).forEach(([key, data]) => {
    recipeMap[key] = !data.isAlternate;
  });
  return recipeMap;
}

export function getInitialState(): FactoryOptions {
  return {
    gameVersion: GAME_VERSION,
    key: nanoid(),
    productionItems: [],
    inputItems: [],
    inputResources: getInitialInputResources(),
    allowHandGatheredItems: false,
    weightingOptions: getInitialWeightingOptions(),
    allowedRecipes: getInitialAllowedRecipes(),
  };
}


// REDUCER
export type FactoryAction =
  | { type: 'RESET_FACTORY' }
  | { type: 'ADD_PRODUCTION_ITEM' }
  | { type: 'DELETE_PRODUCTION_ITEM', key: string }
  | { type: 'SET_PRODUCTION_ITEM', data: { key: string, itemKey: string } }
  | { type: 'SET_PRODUCTION_ITEM_AMOUNT', data: { key: string, amount: string } }
  | { type: 'SET_PRODUCTION_ITEM_MODE', data: { key: string, mode: string } }
  | { type: 'ADD_INPUT_ITEM' }
  | { type: 'DELETE_INPUT_ITEM', key: string }
  | { type: 'UPDATE_INPUT_ITEM', data: InputItemOptions }
  | { type: 'UPDATE_INPUT_RESOURCE', data: InputItemOptions }
  | { type: 'SET_RESOURCES_TO_MAP_LIMITS' }
  | { type: 'SET_RESOURCES_TO_0' }
  | { type: 'SET_ALLOW_HAND_GATHERED_ITEMS', active: boolean }
  | { type: 'UPDATE_WEIGHTING_OPTIONS', data: WeightingOptions }
  | { type: 'SET_ALL_WEIGHTS_DEFAULT' }
  | { type: 'SET_RECIPE_ACTIVE', key: string, active: boolean }
  | { type: 'MASS_SET_RECIPES_ACTIVE', recipes: string[], active: boolean }
  | { type: 'LOAD_FROM_SHARED_FACTORY', data: any }
  | { type: 'LEGACY_LOAD_FROM_QUERY_PARAM' };

export function reducer(state: FactoryOptions, action: FactoryAction): FactoryOptions {
  switch (action.type) {
    case 'RESET_FACTORY': {
      return getInitialState();
    }
    case 'ADD_PRODUCTION_ITEM': {
      const newProductionItems = [
        ...state.productionItems,
        getDefaultProductionItem(),
      ];
      return { ...state, productionItems: newProductionItems };
    }
    case 'DELETE_PRODUCTION_ITEM': {
      const newProductionItems = state.productionItems
        .filter((i) => i.key !== action.key);
      return { ...state, productionItems: newProductionItems };
    }
    case 'SET_PRODUCTION_ITEM': {
      const newProductionItems = state.productionItems
        .map((item) => {
          if (item.key === action.data.key) {
            let newItem;
            if (item.mode === 'per-minute' || item.mode === 'maximize') {
              newItem = { ...item };
            } else {
              newItem = getDefaultProductionItem();
            }
            newItem.itemKey = action.data.itemKey;
            return newItem;
          }
          return item;
        });
      return { ...state, productionItems: newProductionItems };
    }
    case 'SET_PRODUCTION_ITEM_AMOUNT': {
      const newProductionItems = state.productionItems
        .map((item) => {
          if (item.key === action.data.key) {
            const newItem = { ...item };
            newItem.value = action.data.amount;
            return newItem;
          }
          return item;
        });
      return { ...state, productionItems: newProductionItems };
    }
    case 'SET_PRODUCTION_ITEM_MODE': {
      const newProductionItems = state.productionItems
        .map((item) => {
          if (item.key === action.data.key) {
            const newItem = { ...item };
            newItem.mode = action.data.mode;
            if (newItem.mode !== item.mode) {
              if (newItem.mode === 'per-minute') {
                newItem.value = '10';
              } else if (newItem.mode === 'maximize') {
                let nextPriority = MAX_PRIORITY;
                while (nextPriority && nextPriority > 0) {
                  // eslint-disable-next-line no-loop-func
                  const priorityTaken = !!state.productionItems.find((i) => i.mode === 'maximize' && i.value === String(nextPriority));
                  if (!priorityTaken) {
                    break;
                  }
                  nextPriority--;
                }
                if (nextPriority > 0) {
                  newItem.value = String(nextPriority);
                } else {
                  newItem.value = `${MAX_PRIORITY}`;
                }
              } else if (item.mode === 'per-minute' || item.mode === 'maximize') {
                newItem.value = '1';
              }
            }
            return newItem;
          }
          return item;
        });
      return { ...state, productionItems: newProductionItems };
    }
    case 'ADD_INPUT_ITEM': {
      const newInputItems = [
        ...state.inputItems,
        getDefaultInputItem(),
      ];
      return { ...state, inputItems: newInputItems };
    }
    case 'DELETE_INPUT_ITEM': {
      const newInputItems = state.inputItems
        .filter((i) => i.key !== action.key);
      return { ...state, inputItems: newInputItems };
    }
    case 'UPDATE_INPUT_ITEM': {
      const newInputItems = state.inputItems
        .map((i) => i.key === action.data.key ? action.data : i);
      return { ...state, inputItems: newInputItems };
    }
    case 'UPDATE_INPUT_RESOURCE': {
      const newInputResources = state.inputResources
        .map((i) => i.key === action.data.key ? action.data : i);
      return { ...state, inputResources: newInputResources };
    }
    case 'SET_RESOURCES_TO_MAP_LIMITS': {
      const newInputResources = getInitialInputResources();
      return { ...state, inputResources: newInputResources };
    }
    case 'SET_RESOURCES_TO_0': {
      const newInputResources = state.inputResources
        .map((data) => ({ ...data, value: '0', unlimited: false }));
      return { ...state, inputResources: newInputResources };
    }
    case 'SET_ALLOW_HAND_GATHERED_ITEMS': {
      return { ...state, allowHandGatheredItems: action.active };
    }
    case 'UPDATE_WEIGHTING_OPTIONS': {
      const newWeightingOptions = { ...action.data };
      return { ...state, weightingOptions: newWeightingOptions };
    }
    case 'SET_ALL_WEIGHTS_DEFAULT': {
      const newWeightingOptions = getInitialWeightingOptions();
      const newInputResources = state.inputResources
        .map((i) => ({ ...i, weight: String(resources[i.itemKey].relativeValue) }));
      return { ...state, weightingOptions: newWeightingOptions, inputResources: newInputResources };
    }
    case 'SET_RECIPE_ACTIVE': {
      const newAllowedRecipes = { ...state.allowedRecipes };
      newAllowedRecipes[action.key] = action.active;
      return { ...state, allowedRecipes: newAllowedRecipes };
    }
    case 'MASS_SET_RECIPES_ACTIVE': {
      const newAllowedRecipes = { ...state.allowedRecipes };
      action.recipes.forEach((recipeKey) => {
        newAllowedRecipes[recipeKey] = action.active;
      });
      return { ...state, allowedRecipes: newAllowedRecipes };
    }
    case 'LOAD_FROM_SHARED_FACTORY': {
      try {
        const newState: FactoryOptions = getInitialState();
        newState.gameVersion = action.data.gameVersion;
        newState.productionItems = (action.data.productionItems as any[]).map((i) => ({
          ...getDefaultProductionItem(),
          itemKey: i.itemKey,
          mode: i.mode,
          value: String(i.value),
        }));
        newState.inputItems = (action.data.inputItems as any[]).map((i) => ({
          ...getDefaultInputItem(),
          itemKey: i.itemKey,
          value: String(i.value),
          weight: String(i.weight),
          unlimited: i.unlimited,
        }));
        newState.inputResources.forEach((r) => {
          const resourceOptions = (action.data.inputResources as any[]).find((i) => r.itemKey === i.itemKey);
          r.value = String(resourceOptions.value);
          r.weight = String(resourceOptions.weight);
          r.unlimited = resourceOptions.unlimited;
        });
        newState.allowHandGatheredItems = action.data.allowHandGatheredItems;
        newState.weightingOptions.resources = String(action.data.weightingOptions.resources);
        newState.weightingOptions.power = String(action.data.weightingOptions.power);
        newState.weightingOptions.complexity = String(action.data.weightingOptions.complexity);
        newState.weightingOptions.buildings = String(action.data.weightingOptions.buildings);
        (action.data.allowedRecipes as any[]).forEach((key) => {
          if (newState.allowedRecipes[key] != null) {
            newState.allowedRecipes[key] = true;
          }
        });
        return newState;
      } catch (e) {
        console.error(e);
      }
      return state;
    }
    case 'LEGACY_LOAD_FROM_QUERY_PARAM': {
      const params = new URLSearchParams(window.location.search);
      const encodedState = params.get('f');
      if (encodedState) {
        try {
          return decodeState_LEGACY(encodedState);
        } catch (e) {
          console.error(e);
        }
      }
      return state;
    }
    default:
      return state;
  }
}


// ENCODE/DECODE STATE
function decodeState_LEGACY(stateStr: string): FactoryOptions {
  const version = stateStr.substring(0, 5);
  if (version === 'v1_U5') {
    return decodeState_v1_U5(stateStr);
  } else if (version === 'v2_U5') {
    return decodeState_v2_U5(stateStr);
  } else if (version === 'v3_U5') {
    return decodeState_v3_U5(stateStr);
  } else {
    throw new Error('INVALID VERSION');
  }
}
