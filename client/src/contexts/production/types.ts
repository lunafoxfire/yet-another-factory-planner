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

export type RecipeSelectionMap = {
  [key: string]: boolean,
};

export type FactoryOptions = {
  key: string,
  productionItems: ProductionItemOptions[],
  inputItems: InputItemOptions[],
  inputResources: InputItemOptions[],
  allowHandGatheredItems: boolean,
  weightingOptions: WeightingOptions,
  allowedRecipes: RecipeSelectionMap,
};

export type NodeInformation = {
  x: number,
  y: number,
  key: string,
}

export type FactoryGraphChanges = {
  nodes: NodeInformation[],
}
