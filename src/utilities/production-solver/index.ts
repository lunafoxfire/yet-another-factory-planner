import { FactoryOptions } from '../../contexts/production';
import { itemRecipeMap, recipes, resources, uncraftableItems, ItemRate } from '../../data';
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

export const NODE_TYPE = {
  ROOT: 'ROOT',
  FINAL_PRODUCT: 'FINAL_PRODUCT',
  SIDE_PRODUCT: 'SIDE_PRODUCT',
  INPUT: 'INPUT',
  RESOURCE: 'RESOURCE',
  RECIPE: 'RECIPE',
  ITEM: 'ITEM',
};

export type SolverResults = {
  productionGraph: ProductionGraph,
  recipeGraph: RecipeGraph,
};

export type ProductionGraph = {
  nodes: ProductionGraphNode[],
  edges: ProductionGraphEdge[],
};

export type ProductionGraphNode = {
  id: number,
  key: string,
  multiplier: number,
  type: string,
};

export type ProductionGraphEdge = {
  from: number,
  to: number,
  key: string,
  productionRate: number,
};

export type RecipeGraph = {
  nodes: RecipeGraphNode[],
  edges: RecipeGraphEdge[],
  maxDepth: number,
}

export type RecipeGraphNode = {
  id: number,
  key: string,
  type: string,
  depth: number
};

export type RecipeGraphEdge = {
  from: number,
  to: number,
};

export class ProductionSolver {
  private inputs: InputMap;
  private outputs: OutputMap;
  private allowedRecipes: RecipeMap;
  private itemRecipeTable: { [key: string]: string[] } = {};
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

  public exec(): SolverResults {
    const recipeGraph = this.generateRecipeGraph();
    const productionGraph = this.generateProductionGraph();
    return {
      productionGraph,
      recipeGraph,
    };
  }

  private nextId() {
    return this.currentId++;
  }

  private generateRecipeGraph(): RecipeGraph {
    const graph: RecipeGraph = {
      nodes: [],
      edges: [],
      maxDepth: 0,
    };

    const initialNode: RecipeGraphNode = {
      id: this.nextId(),
      key: NODE_TYPE.ROOT,
      type: NODE_TYPE.ROOT,
      depth: -1,
    }

    this.itemRecipeTable = {};
    this.buildRecipeTree(initialNode, graph, 0);

    return graph;
  }

  private generateProductionGraph(): ProductionGraph {
    const graph: ProductionGraph = {
      nodes: [],
      edges: [],
    };

    // const initialNode: ProductionGraphNode = {
    //   id: this.nextId(),
    //   recipe: NODE_TYPE.ROOT,
    //   multiplier: 1,
    //   type: NODE_TYPE.ROOT,
    // }
    // this.buildItemTree(initialNode, graph, 0);

    return graph;
  }

  private buildRecipeTree(parentNode: RecipeGraphNode, graph: RecipeGraph, depth: number) {
    if (depth > 20) {
      throw new Error('INFINITE LOOP DETECTED');
    }
    if (graph.maxDepth < depth) {
      graph.maxDepth = depth;
    }

    let ingredients: string[];
    if (parentNode.type === NODE_TYPE.ROOT) {
      ingredients = Object.keys(this.outputs);
    } else {
      const parentRecipeInfo = recipes[parentNode.key];
      ingredients = parentRecipeInfo.ingredients.map((ingredient) => ingredient.itemClass);
    }
    
    for (const item of ingredients) {
      if (this.inputs[item]) {
        const type = this.inputs[item].type;
        let itemNode = graph.nodes.find((n) => n.type === type && n.key === item);
        if (!itemNode) {
          itemNode = {
            id: this.nextId(),
            key: item,
            type,
            depth,
          };
          graph.nodes.push(itemNode);
        }
        graph.edges.push({
          from: itemNode.id,
          to: parentNode.id,
        });
        continue;
      }

      let itemNode = graph.nodes.find((n) => n.type === NODE_TYPE.ITEM && n.key === item);
      let nodeExists = !!itemNode;
      if (!itemNode) {
        itemNode = {
          id: this.nextId(),
          key: item,
          type: NODE_TYPE.ITEM,
          depth,
        };
        graph.nodes.push(itemNode);
      }
      if (parentNode.type !== NODE_TYPE.ROOT) {
        graph.edges.push({
          from: itemNode.id,
          to: parentNode.id,
        })
      }

      if (nodeExists) {
        continue;
      }

      const itemRecipes = itemRecipeMap[item].filter((r) => this.allowedRecipes[r]);
      this.itemRecipeTable[item] = itemRecipes;

      if (itemRecipes.length === 0) {
        throw new Error(`ITEM ${item} HAS NO VALID RECIPES`);
      }
      for (const recipe of itemRecipes) {
        const recipeNode = {
          id: this.nextId(),
          key: recipe,
          type: NODE_TYPE.RECIPE,
          depth,
        };
        graph.nodes.push(recipeNode);
        this.buildRecipeTree(recipeNode, graph, depth + 1);
        graph.edges.push({
          from: recipeNode.id,
          to: itemNode.id,
        });
      }
    }
  }

  // private buildItemTree(parentNode: ProductionGraphNode, graph: ProductionGraph, depth: number) {
  //   if (depth > 20) {
  //     throw new Error('INFINITE LOOP DETECTED');
  //   }

  //   let ingredients: ItemRate[];
  //   if (parentNode.type === NODE_TYPE.ROOT) {
  //     ingredients = Object.entries(this.outputs).map(([itemClass, outputTargets]) => {
  //       let perMinute;
  //       if (outputTargets.buildings != null) {
  //         perMinute = -1;
  //       } else if (outputTargets.productionRate === Infinity) {
  //         perMinute = 1;
  //       } else {
  //         perMinute = outputTargets.productionRate as number;
  //       }
  //       return {
  //         itemClass,
  //         perMinute,
  //       };
  //     });
  //   } else {
  //     const parentRecipeInfo = recipes[parentNode.key];
  //     ingredients = parentRecipeInfo.ingredients.map((ingredient) => ({
  //       itemClass: ingredient.itemClass,
  //       perMinute: ingredient.perMinute * parentNode.multiplier,
  //     }));
  //   }

  //   for (const ingredient of ingredients) {
  //     const item = ingredient.itemClass;
  //     let targetRate = ingredient.perMinute;

  //     if (this.inputs[item]) {
  //       const node: ProductionGraphNode = {
  //         id: this.nextId(),
  //         key: item,
  //         multiplier: 1,
  //         type: this.inputs[item].type,
  //       };
  //       graph.nodes.push(node);
  //       graph.edges.push({
  //         from: node.id,
  //         to: parentNode.id,
  //         key: item,
  //         productionRate: targetRate,
  //       });
  //       continue;
  //     }
      
  //     const bestRecipe = this.getBestRecipe(item);
  //     const recipeInfo = recipes[bestRecipe];

  //     const primaryProduct = recipeInfo.products.find((p) => p.itemClass === item)!;
  //     const sideProducts = recipeInfo.products.filter((p) => p.itemClass !== item);

  //     let multiplier: number;
  //     if (targetRate === -1) {
  //       multiplier = this.outputs[item].buildings as number;
  //       targetRate = primaryProduct.perMinute * multiplier;
  //     } else {
  //       multiplier = targetRate / primaryProduct.perMinute;
  //     }

  //     const node: ProductionGraphNode = {
  //       id: this.nextId(),
  //       key: bestRecipe,
  //       multiplier,
  //       type: NODE_TYPE.RECIPE,
  //     };

  //     if (parentNode.type === NODE_TYPE.ROOT) {
  //       const productNode = {
  //         id: this.nextId(),
  //         key: item,
  //         multiplier: 1,
  //         type: NODE_TYPE.FINAL_PRODUCT,
  //       };

  //       graph.nodes.push(node);
  //       graph.nodes.push(productNode);
  //       graph.edges.push({
  //         from: node.id,
  //         to: productNode.id,
  //         key: item,
  //         productionRate: targetRate,
  //       });
  //     } else {
  //       graph.nodes.push(node);
  //       graph.edges.push({
  //         from: node.id,
  //         to: parentNode.id,
  //         key: item,
  //         productionRate: targetRate,
  //       });
  //     }

  //     sideProducts.forEach((sideProduct) => {
  //       const productNode = {
  //         id: this.nextId(),
  //         key: sideProduct.itemClass,
  //         multiplier: 1,
  //         type: NODE_TYPE.SIDE_PRODUCT,
  //       };
  //       graph.nodes.push(productNode);
  //       graph.edges.push({
  //         from: node.id,
  //         to: productNode.id,
  //         key: sideProduct.itemClass,
  //         productionRate: sideProduct.perMinute * multiplier,
  //       });
  //     });

  //     this.buildItemTree(node, graph, depth + 1);
  //   }
  }
