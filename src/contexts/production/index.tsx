import React, { createContext, useContext, useReducer, useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { usePrevious } from '../../hooks/usePrevious';
import { resources, recipes, items } from '../../data'
import { POINTS_ITEM_KEY } from '../../utilities/production-solver';

export const FACTORY_SETTINGS_VERSION = 'v1_U5';
export const MAX_PRIORITY = 20;

// TYPES
export type ProductionItemOptions = {
  key: string,
  itemKey: string,
  mode: 'per-minute'|'maximize'|string,
  value: string,
};

export type WeightingOptions = {
  resources: string,
  power: string,
  complexity: string,
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
  version: string,
  key: string,
  productionItems: ProductionItemOptions[],
  inputItems: InputItemOptions[],
  inputResources: InputItemOptions[],
  allowHandGatheredItems: boolean,
  weightingOptions: WeightingOptions,
  allowedRecipes: RecipeMap,
};

export type ProductionContextType = {
  state: FactoryOptions,
  loaded: boolean,
  dispatch: React.Dispatch<FactoryAction>,
}


// CONTEXT
export const ProductionContext = createContext<ProductionContextType | null>(null);
ProductionContext.displayName = 'ProductionContext';


// HELPER HOOK
export function useProductionContext() {
  const ctx = useContext(ProductionContext);
  if (!ctx) {
    throw new Error('ProductionContext is null');
  }
  return ctx;
}


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
    power: '5',
    complexity: '1',
  };
}

function getInitialAllowedRecipes(): RecipeMap {
  const recipeMap: RecipeMap = {};
  Object.entries(recipes).forEach(([key, data]) => {
    recipeMap[key] = !data.isAlternate;
  });
  return recipeMap;
}

function getInitialState(): FactoryOptions {
  return {
    version: FACTORY_SETTINGS_VERSION,
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
  | { type: 'MASS_SET_RECIPES_ACTIVE', alternates: boolean, active: boolean }
  | { type: 'LOAD_FROM_QUERY_PARAM' };

function reducer(state: FactoryOptions, action: FactoryAction): FactoryOptions {
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
            const newItem = { ...item };
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
      Object.keys(newAllowedRecipes).forEach((key) => {
        if (action.alternates && recipes[key].isAlternate) {
          newAllowedRecipes[key] = action.active;
        } else if (!action.alternates && !recipes[key].isAlternate) {
          newAllowedRecipes[key] = action.active;
        }
      })
      return { ...state, allowedRecipes: newAllowedRecipes };
    }
    case 'LOAD_FROM_QUERY_PARAM': {
      const params = new URLSearchParams(window.location.search);
      const encodedState = params.get('f');
      if (encodedState) {
        try {
          return decodeState(encodedState);
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

function getItemSlug(itemKey: string) {
  if (itemKey === POINTS_ITEM_KEY) {
    return 'points';
  }
  return items[itemKey].slug;
}

function getItemBySlug(slug: string) {
  if (slug === 'points') {
    return POINTS_ITEM_KEY;
  }
  const itemEntry = Object.entries(items).find(([key, item]) => item.slug === slug);
  if (itemEntry) {
    return itemEntry[0];
  }
  throw new Error('INVALID ITEM SLUG');
}

function getModeSlug(mode: string) {
  if (mode === 'per-minute') return 'per_minute';
  if (mode === 'maximize') return 'maximize';
  const recipeKey = mode;
  const recipeInfo = recipes[recipeKey];
  if (recipeInfo) {
    return recipeInfo.slug;
  } else {
    return 'null';
  }
}

function getModeBySlug(slug: string) {
  if (slug === 'per_minute') return 'per-minute';
  if (slug === 'maximize') return 'maximize';
  const recipeEntry = Object.entries(recipes).find(([key, recipe]) => recipe.slug === slug);
  if (recipeEntry) {
    return recipeEntry[0];
  }
  throw new Error('INVALID RECIPE SLUG');
}

const SEP0 = ',';
const SEP1 = '|';
const SEP2 = ':';

// ENCODE/DECODE
function encodeState(state: FactoryOptions): string {
  const fields: string[] = [];

  fields.push(state.version);

  const allowedRecipesBits = Object.keys((state.allowedRecipes))
    .sort((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    })
    .map((key) => state.allowedRecipes[key] ? '1' : '0')
    .join('');
  fields.push(BigInt(`0b${allowedRecipesBits}`).toString(16));

  const productionItemsField: string[] = [];
  state.productionItems.forEach((item) => {
    if (!item.itemKey) return;
    productionItemsField.push(`${getItemSlug(item.itemKey)}${SEP2}${getModeSlug(item.mode)}${SEP2}${item.value}`);
  });
  fields.push(productionItemsField.join(SEP1));

  const inputItemsField: string[] = [];
  state.inputItems.forEach((item) => {
    if (!item.itemKey) return;
    inputItemsField.push(`${getItemSlug(item.itemKey)}${SEP2}${item.value}${SEP2}${item.weight}${SEP2}${item.unlimited ? '1' : '0'}`);
  });
  fields.push(inputItemsField.join(SEP1));

  const inputResourcesField: string[] = [];
  state.inputResources.forEach((item) => {
    inputResourcesField.push(`${item.value}${SEP2}${item.weight}${SEP2}${item.unlimited ? '1' : '0'}`);
  });
  fields.push(inputResourcesField.join(SEP1));

  fields.push(`${state.allowHandGatheredItems ? '1' : '0'}`);

  fields.push(`${state.weightingOptions.resources}${SEP2}${state.weightingOptions.power}${SEP2}${state.weightingOptions.complexity}`);

  return fields.join(SEP0);
}

function decodeState(stateStr: string): FactoryOptions {
  const newState: FactoryOptions = getInitialState();

  const fields = stateStr.split(SEP0);
  if (fields[0] !== FACTORY_SETTINGS_VERSION) throw new Error('VERSION MISMATCH');
  if (fields.length !== 7) throw new Error('INVALID DATA [BAD FIELDS]');

  const allowedRecipesBits = BigInt(`0x${fields[1]}`)
    .toString(2)
    .padStart(Object.keys(newState.allowedRecipes).length, '0')
    .split('')
    .map((b) => !!parseInt(b));
  Object.keys(newState.allowedRecipes)
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
        itemKey: getItemBySlug(values[0]),
        mode: getModeBySlug(values[1]),
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
        itemKey: getItemBySlug(values[0]),
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

  return newState;
}


// PROVIDER
type PropTypes = { children: React.ReactNode };
export const ProductionProvider = ({ children }: PropTypes) => {
  const [state, dispatch] = useReducer(reducer, getInitialState());
  const [loaded, setLoaded] = useState(false);

  const prevState = usePrevious(state);

  useEffect(() => {
    if (!loaded) {
      dispatch({ type: 'LOAD_FROM_QUERY_PARAM' });
      setLoaded(true);
    }
  }, [loaded]);

  useEffect(() => {
    if (prevState !== state) {
      const encodedState = encodeState(state);
      window.history.replaceState(null, '', window.location.pathname + '?f=' + encodedState);
    }
  }, [prevState, state]);

  return (
    <ProductionContext.Provider value={{ state, loaded, dispatch }}>
      {children}
    </ProductionContext.Provider>
  );
}
