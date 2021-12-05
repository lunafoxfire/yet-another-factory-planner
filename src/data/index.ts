import buildingsRaw from './json/buildings.json';
import recipesRaw from './json/recipes.json';
import resourcesRaw from './json/resources.json';
import itemsRaw from './json/items.json';
import handGatheredItemsRaw from './json/handGatheredItems.json';


export type ItemRate = {
  itemClass: string,
  perMinute: number,
};

export type ItemQuantity = {
  itemClass: string,
  quantity: number,
};

export type BuildingsInfo = {
  slug: string,
  name: string,
  power: number,
  area: number,
  buildCost: ItemQuantity[],
  isFicsmas: boolean,
};

export type RecipeInfo = {
  slug: string,
  name: string,
  isAlternate: boolean,
  ingredients: ItemRate[],
  products: ItemRate[],
  producedIn: string,
  isFicsmas: boolean,
};

export type ResourceInfo = {
  itemClass: string,
  maxExtraction: number | null,
  relativeValue: number,
};

export type ItemInfo = {
  slug: string,
  name: string,
  sinkPoints: number,
  usedInRecipes: string[],
  producedFromRecipes: string[],
  isFicsmas: boolean,
};

export type BuildingMap = { [key in keyof typeof buildingsRaw]: BuildingsInfo } & { [key: string]: BuildingsInfo };
export type RecipeMap = { [key in keyof typeof recipesRaw]: RecipeInfo } & { [key: string]: RecipeInfo };
export type ResourceMap = { [key in keyof typeof resourcesRaw]: ResourceInfo } & { [key: string]: ResourceInfo };
export type ItemMap = { [key in keyof typeof itemsRaw]: ItemInfo } & { [key: string]: ItemInfo };
export type HandGatheredItemMap = { [key in keyof typeof handGatheredItemsRaw]: string } & { [key: string]: string };

export const buildings = (buildingsRaw as BuildingMap);
export const recipes = (recipesRaw as RecipeMap);
export const resources = (resourcesRaw as ResourceMap);
export const items = (itemsRaw as ItemMap);
export const handGatheredItems = (handGatheredItemsRaw as HandGatheredItemMap);
