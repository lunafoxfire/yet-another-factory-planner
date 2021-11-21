import React, { createContext, useContext, useReducer, useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { usePrevious } from '../../hooks/usePrevious';
import { resources, recipes } from '../../data'

const FACTORY_SETTINGS_VERSION = 'v1';
const LOCAL_STORAGE_KEY = 'factory-data';

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
  buildArea: string,
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
  weightingOptions: WeightingOptions,
  allowedRecipes: RecipeMap,
};

export type ProductionContextType = {
  state: FactoryOptions,
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
    value: '0',
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
    resources: '10',
    power: '1',
    buildArea: '0',
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
    weightingOptions: getInitialWeightingOptions(),
    allowedRecipes: getInitialAllowedRecipes(),
  };
}


// REDUCER
export type FactoryAction = 
  | { type: 'ADD_PRODUCTION_ITEM' }
  | { type: 'DELETE_PRODUCTION_ITEM', key: string }
  | { type: 'UPDATE_PRODUCTION_ITEM', data: ProductionItemOptions }
  | { type: 'ADD_INPUT_ITEM' }
  | { type: 'DELETE_INPUT_ITEM', key: string }
  | { type: 'UPDATE_INPUT_ITEM', data: InputItemOptions }
  | { type: 'UPDATE_INPUT_RESOURCE', data: InputItemOptions }
  | { type: 'SET_RESOURCES_TO_MAP_LIMITS' }
  | { type: 'SET_RESOURCES_TO_0' }
  | { type: 'UPDATE_WEIGHTING_OPTIONS', data: WeightingOptions }
  | { type: 'SET_ALL_WEIGHTS_DEFAULT' }
  | { type: 'SET_RECIPE_ACTIVE', key: string, active: boolean }
  | { type: 'MASS_SET_RECIPES_ACTIVE', alternates: boolean, active: boolean }
  | { type: 'LOAD_LOCAL_STORAGE' };

function reducer(state: FactoryOptions, action: FactoryAction): FactoryOptions {
  switch (action.type) {
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
    case 'UPDATE_PRODUCTION_ITEM': {
      const newProductionItems = state.productionItems
        .map((i) => i.key === action.data.key ? action.data : i);
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
    case 'LOAD_LOCAL_STORAGE': {
      const data = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (data) {
        try {
          const loadedState = JSON.parse(data);
          if (loadedState.version === FACTORY_SETTINGS_VERSION) {
            return loadedState;
          }
        } catch (e) {
          console.error('LOAD FROM LOCAL STORAGE FAILED');
        }
      }
      return state;
    }
    default:
      return state;
  }
}


// PROVIDER
type PropTypes = { children: React.ReactNode };
export const ProductionProvider = ({ children }: PropTypes) => {
  const [state, dispatch] = useReducer(reducer, getInitialState());
  const [loaded, setLoaded] = useState(false);

  const prevState = usePrevious(state);

  useEffect(() => {
    if (!loaded) {
      dispatch({ type: 'LOAD_LOCAL_STORAGE' });
      setLoaded(true);
    }
  }, [loaded]);

  useEffect(() => {
    if (prevState !== state) {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    }
  }, [prevState, state]);

  return (
    <ProductionContext.Provider value={{ state, dispatch }}>
      {children}
    </ProductionContext.Provider>
  );
}
