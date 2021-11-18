import { FactoryOptions } from '../../contexts/production';
import { items, itemRecipeMap, recipes, resources, uncraftableItems, buildings, ItemRate } from '../../data';
import { RecipeMap } from '../../contexts/production';

type InputMap = {
  [key: string]: {
    amount: number,
    value: number,
    type: string,
  }
};
type OutputTargets = { productionRate: number | null, buildings: number | null };
type OutputMap = { [key: string]: OutputTargets };

type RecipeEval = { scoreBound: number };
type RecipeEvalMap = { [key: string]: RecipeEval };
type ItemEval = { recipes: RecipeEvalMap, scoreBound: number };
type ItemEvalMap = { [key: string]: ItemEval };

export const NODE_TYPE = {
  ROOT: 'ROOT',
  FINAL_PRODUCT: 'FINAL_PRODUCT',
  SIDE_PRODUCT: 'SIDE_PRODUCT',
  INPUT: 'INPUT',
  RESOURCE: 'RESOURCE',
  RECIPE: 'RECIPE',
};

export type ProductionGraph = {
  nodes: GraphNode[],
  edges: GraphEdge[],
};

export type GraphNode = {
  id: number,
  recipe: string,
  multiplier: number,
  type: string,
};

export type GraphEdge = {
  from: number,
  to: number,
  item: string,
  productionRate: number,
};

export class ProductionGraphAlgorithm {
  private inputs: InputMap;
  private outputs: OutputMap;
  private allowedRecipes: RecipeMap;
  private itemEvaluations: ItemEvalMap = {};
  private currentId: number = 0;

  public constructor(options: FactoryOptions) {
    // TODO
    // check NaN
    // check output not zero
    // sum multiple in/out of same item

    this.inputs = {};

    options.inputItems.forEach((item) => {
      if (!item.itemKey) return;
      const amount = item.unlimited ? Infinity : Number(item.value);
      if (!amount) return;
      this.inputs[item.itemKey] = {
        amount,
        value: 0,
        type: NODE_TYPE.INPUT,
      }
    });

    let maxResourceAmount = 0;
    options.inputResources.forEach((item) => {
      const amount = item.unlimited ? Infinity : Number(item.value);
      if (amount && !item.unlimited) {
        maxResourceAmount += amount;
      }
    });
    options.inputResources.forEach((item) => {
      const resourceData = resources[item.itemKey];
      if (!resourceData) return;
      const amount = item.unlimited ? Infinity : Number(item.value);
      if (!amount) return;
      let value = 0;
      if (!item.unlimited) {
        value = amount / maxResourceAmount;
      }
      this.inputs[item.itemKey] = {
        amount,
        value,
        type: NODE_TYPE.RESOURCE,
      }
    });

    Object.keys(uncraftableItems).forEach((item) => {
      this.inputs[item] = {
        amount: Infinity,
        value: 0,
        type: NODE_TYPE.RESOURCE,
      };
    });

    this.outputs = {};
    options.productionItems.forEach((item) => {
      if (!item.itemKey) return;
      const targets: OutputTargets = {
        productionRate: null,
        buildings: null,
      };
      switch (item.mode) {
        case 'building-target':
          targets.buildings = Number(item.value);
          break;
        case 'rate-target':
          targets.productionRate = Number(item.value);
          break;
        case 'maximize':
          targets.productionRate = Infinity;
          break;
        default:
          throw new Error(`ITEM ${item.itemKey} HAS AN INVALID TARGET TYPE`);
      }
      this.outputs[item.itemKey] = targets;
    });

    this.allowedRecipes = options.allowedRecipes;
  }

  public exec(): ProductionGraph {
    this.evalItemScoreBounds();
    const graph = this.solve();
    if (graph.nodes.length === 0) {
      throw new Error('EMPTY GRAPH');
    }
    return graph;
  }

  private nextId() {
    return this.currentId++;
  }

  // Find bounds for item scores for branch-and-bound algorithm
  private evalItemScoreBounds() {
    this.itemEvaluations = {};

    let iterations = 0;
    let noUpdates = false;
    while (!noUpdates && iterations < 20) {
      iterations++;
      noUpdates = true;

      nextItem:
      for (const [itemKey, recipeKeys] of Object.entries(itemRecipeMap)) {
        if (this.itemEvaluations[itemKey]) {
          continue;
        }

        const itemEval: ItemEval = {
          recipes: {},
          scoreBound: Infinity,
        };

        for (const recipeKey of recipeKeys) {
          const recipe = recipes[recipeKey];
          const targetProduct = recipe.products.find((p) => p.itemClass === itemKey)!;
          const recipeEval: RecipeEval = { scoreBound: 0 };

          for (const ingredient of recipe.ingredients) {
            // Fix for Recipe_UraniumCell_C
            if (ingredient.itemClass === itemKey) {
              continue;
            }
            let score: number;

            if (this.inputs[ingredient.itemClass]) {
              score = this.inputs[ingredient.itemClass].value * (ingredient.perMinute / targetProduct.perMinute);
            } else if (this.itemEvaluations[ingredient.itemClass]) {
              score = this.itemEvaluations[ingredient.itemClass].scoreBound * (ingredient.perMinute / targetProduct.perMinute);
            } else {
              continue nextItem;
            }

            recipeEval.scoreBound += score;
          }

          itemEval.recipes[recipeKey] = recipeEval;
          if (recipeEval.scoreBound < itemEval.scoreBound) {
            itemEval.scoreBound = recipeEval.scoreBound;
          }
        }

        this.itemEvaluations[itemKey] = itemEval;
        noUpdates = false;
      }
    }
  }

  private solve(): ProductionGraph {
    const initialGraph: ProductionGraph = {
      nodes: [],
      edges: [],
    };

    const initialNode: GraphNode = {
      id: this.nextId(),
      recipe: NODE_TYPE.ROOT,
      multiplier: 1,
      type: NODE_TYPE.ROOT,
    }
    this.buildItemTree(initialNode, initialGraph, 0);

    return initialGraph;
  }

  private buildItemTree(parentNode: GraphNode, graph: ProductionGraph, depth: number) {
    if (depth > 20) {
      throw new Error('INFINITE LOOP DETECTED');
    }

    // Ingredients needed to create parent node
    let ingredients: ItemRate[];
    if (parentNode.type === NODE_TYPE.ROOT) {
      ingredients = Object.entries(this.outputs).map(([itemClass, outputTargets]) => {
        let perMinute;
        if (outputTargets.buildings != null) {
          perMinute = -1;
        } else if (outputTargets.productionRate === Infinity) {
          perMinute = 1;
        } else {
          perMinute = outputTargets.productionRate as number;
        }
        return {
          itemClass,
          perMinute,
        };
      });
    } else {
      const parentRecipeInfo = recipes[parentNode.recipe];
      ingredients = parentRecipeInfo.ingredients.map((ingredient) => ({
        itemClass: ingredient.itemClass,
        perMinute: ingredient.perMinute * parentNode.multiplier,
      }));
    }

    for (const ingredient of ingredients) {
      const item = ingredient.itemClass;
      let targetRate = ingredient.perMinute;

      if (this.inputs[item]) {
        const node: GraphNode = {
          id: this.nextId(),
          recipe: item,
          multiplier: 1,
          type: this.inputs[item].type,
        };
        graph.nodes.push(node);
        graph.edges.push({
          from: node.id,
          to: parentNode.id,
          item,
          productionRate: targetRate,
        });
        continue;
      }
      
      const bestRecipe = this.getBestRecipe(item);
      const recipeInfo = recipes[bestRecipe];

      const primaryProduct = recipeInfo.products.find((p) => p.itemClass === item)!;
      const sideProducts = recipeInfo.products.filter((p) => p.itemClass !== item);

      let multiplier: number;
      if (targetRate === -1) {
        multiplier = this.outputs[item].buildings as number;
        targetRate = primaryProduct.perMinute * multiplier;
      } else {
        multiplier = targetRate / primaryProduct.perMinute;
      }

      const node: GraphNode = {
        id: this.nextId(),
        recipe: bestRecipe,
        multiplier,
        type: NODE_TYPE.RECIPE,
      };

      if (parentNode.type === NODE_TYPE.ROOT) {
        const productNode = {
          id: this.nextId(),
          recipe: item,
          multiplier: 1,
          type: NODE_TYPE.FINAL_PRODUCT,
        };

        graph.nodes.push(node);
        graph.nodes.push(productNode);
        graph.edges.push({
          from: node.id,
          to: productNode.id,
          item,
          productionRate: targetRate,
        });
      } else {
        graph.nodes.push(node);
        graph.edges.push({
          from: node.id,
          to: parentNode.id,
          item,
          productionRate: targetRate,
        });
      }

      sideProducts.forEach((sideProduct) => {
        const productNode = {
          id: this.nextId(),
          recipe: sideProduct.itemClass,
          multiplier: 1,
          type: NODE_TYPE.SIDE_PRODUCT,
        };
        graph.nodes.push(productNode);
        graph.edges.push({
          from: node.id,
          to: productNode.id,
          item: sideProduct.itemClass,
          productionRate: sideProduct.perMinute * multiplier,
        });
      });

      this.buildItemTree(node, graph, depth + 1);
    }
  }

  private getBestRecipe(item: string): string {
    let itemEval = this.itemEvaluations[item];
    if (!itemEval) {
      throw new Error(`ITEM ${item} HAS NO VALID PRODUCTION PATH`);
    }
    const itemRecipes = itemRecipeMap[item].filter((r) => this.allowedRecipes[r]);
    let bestRecipe: string | undefined;
    let bestRecipeScore: number = Infinity;
    for (const itemRecipe of itemRecipes) {
      let recipeEval = itemEval.recipes[itemRecipe];
      if (recipeEval && recipeEval.scoreBound < bestRecipeScore) {
        bestRecipe = itemRecipe;
      }
    }
    if (bestRecipe == null) {
      throw new Error(`ITEM ${item} HAS NO VALID RECIPES`);
    }
    return bestRecipe;
  }
}
