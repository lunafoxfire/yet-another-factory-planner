import itemsRaw from './json/items.json';
import itemRecipeMapRaw from './json/itemRecipeMap.json';
import uncraftableItemsRaw from './json/uncraftableItems.json';
import recipesRaw from './json/recipes.json';
import resourcesRaw from './json/resources.json';
import buildingsRaw from './json/buildings.json';

export type ItemRate = {
  itemClass: string,
  perMinute: number,
}

export type ItemInfo = {
  slug: string,
  name: string,
  sinkPoints: number,
};

export type RecipeInfo = {
  slug: string,
  name: string,
  isAlternate: boolean,
  ingredients: ItemRate[],
  products: ItemRate[],
  producedIn: string,
};

export type ResourceInfo = {
  itemClass: string,
  maxExtraction: number | null,
  relativeValue: number,
};

export type BuildingsInfo = {
  slug: string,
  name: string,
  power: number,
};

export type ItemMap = { [key in keyof typeof itemsRaw]: ItemInfo } & { [key: string]: ItemInfo };
export type ItemRecipeMap = { [key in keyof typeof itemRecipeMapRaw]: string[] } & { [key: string]: string[] };
export type UncraftableItemsMap = { [key in keyof typeof uncraftableItemsRaw]: string } & { [key: string]: string };
export type RecipeMap = { [key in keyof typeof recipesRaw]: RecipeInfo } & { [key: string]: RecipeInfo };
export type ResourceMap = { [key in keyof typeof resourcesRaw]: ResourceInfo } & { [key: string]: ResourceInfo };
export type BuildingMap = { [key in keyof typeof buildingsRaw]: BuildingsInfo } & { [key: string]: BuildingsInfo };

export const items = (itemsRaw as ItemMap);
export const itemRecipeMap = (itemRecipeMapRaw as ItemRecipeMap);
export const uncraftableItems = (uncraftableItemsRaw as UncraftableItemsMap);
export const recipes = (recipesRaw as RecipeMap);
export const resources = (resourcesRaw as ResourceMap);
export const buildings = (buildingsRaw as BuildingMap);
