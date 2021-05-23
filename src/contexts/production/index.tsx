import React, { createContext, useContext, useReducer } from 'react';
import { nanoid } from 'nanoid';
import { resources, recipes } from '../../data'

// TYPES
export type ProductionItemOptions = {
  key: string,
  itemKey: string,
  mode: 'rate-target'|'building-target'|'maximize',
  value: string,
};

export type InputItemOptions = {
  key: string,
  itemKey: string,
  value: string,
  unlimited: boolean,
};

export type RecipeMap = {
  [key: string]: boolean,
};

export type FactoryOptions = {
  key: string,
  name: string,
  productionItems: ProductionItemOptions[],
  inputItems: InputItemOptions[],
  inputResources: InputItemOptions[],
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
    mode: 'rate-target',
    value: '10',
  });
}

function getDefaultInputItem(): InputItemOptions {
  return ({
    key: nanoid(),
    itemKey: '',
    value: '0',
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

function getInitialAllowedRecipes(): RecipeMap {
  const recipeMap: RecipeMap = {};
  Object.entries(recipes).forEach(([key, data]) => {
    recipeMap[key] = !data.isAlternate;
  });
  return recipeMap;
}

function getInitialState(): FactoryOptions {
  return {
    key: nanoid(),
    name: 'New Factory',
    productionItems: [],
    inputItems: [],
    inputResources: getInitialInputResources(),
    allowedRecipes: getInitialAllowedRecipes(),
  };
}


// REDUCER
export type FactoryAction = 
  | { type: 'SET_NAME', name: string }
  | { type: 'ADD_PRODUCTION_ITEM' }
  | { type: 'DELETE_PRODUCTION_ITEM', key: string }
  | { type: 'UPDATE_PRODUCTION_ITEM', data: ProductionItemOptions }
  | { type: 'ADD_INPUT_ITEM' }
  | { type: 'DELETE_INPUT_ITEM', key: string }
  | { type: 'UPDATE_INPUT_ITEM', data: InputItemOptions }
  | { type: 'UPDATE_INPUT_RESOURCE', data: InputItemOptions }
  | { type: 'SET_RESOURCES_TO_MAP_LIMITS' }
  | { type: 'SET_RESOURCES_TO_0' }
  | { type: 'SET_RECIPE_ACTIVE', key: string, active: boolean }
  | { type: 'MASS_SET_RECIPES_ACTIVE', alternates: boolean, active: boolean };

function reducer(state: FactoryOptions, action: FactoryAction): FactoryOptions {
  switch (action.type) {
    case 'SET_NAME': {
      return { ...state, name: action.name };
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
    default:
      return state;
  }
}


// PROVIDER
type PropTypes = { children: React.ReactNode };
export const ProductionProvider = ({ children }: PropTypes) => {
  const [state, dispatch] = useReducer(reducer, getInitialState());

  return (
    <ProductionContext.Provider value={{ state, dispatch }}>
      {children}
    </ProductionContext.Provider>
  );
}
