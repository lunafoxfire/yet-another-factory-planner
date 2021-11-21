import loadGLPK, { LP, Var } from 'glpk.js';
import { nanoid } from 'nanoid';
import { FactoryOptions } from '../../contexts/production';
import { buildings, itemRecipeMap, recipes, resources, uncraftableItems } from '../../data';
import { RecipeMap } from '../../contexts/production';

const EPSILON = 1e-8;

type InputMap = {
  [key: string]: {
    amount: number,
    weight: number,
    type: string,
  }
};

type OutputMap = { [key: string]: number };

type GlobalWeights = {
  resources: number,
  power: number,
  buildArea: number,
};

export const NODE_TYPE = {
  NONE: 'NONE',
  ROOT: 'ROOT',
  FINAL_PRODUCT: 'FINAL_PRODUCT',
  SIDE_PRODUCT: 'SIDE_PRODUCT',
  INTERMEDIATE_ITEM: 'INTERMEDIATE_ITEM',
  INPUT_ITEM: 'INPUT_ITEM',
  RESOURCE: 'RESOURCE',
  RECIPE: 'RECIPE',
};

type ProductionSolution = { [key: string]: number };
type ProductionAmount = { recipeKey: string, amount: number };
type ItemProductionTotals = {
  [key: string]: {
    producedBy: ProductionAmount[],
    usedBy: ProductionAmount[],
  }
};

export type SolverResults = {
  productionGraph: ProductionGraph | null,
  timestamp: number,
  error: string,
};

export type RecipeGraph = {
  itemNodes: { [key: string]: ItemNode },
  recipeNodes: { [key: string]: RecipeNode },
  edges: GraphEdge[],
};

export type ItemNode = {
  id: string,
  itemKey: string,
  type: string,
  outputFrom: string[],
  inputTo: string[],
  depth: number,
};

export type RecipeNode = {
  id: string,
  recipeKey: string,
  type: string,
  ingredients: string[],
  products: string[],
  depth: number,
};

export type GraphEdge = {
  from: string,
  to: string,
};

export type ProductionGraph = {
  nodes: { [key: string]: ProductionNode },
  edges: ProductionEdge[],
};

export type ProductionNode = {
  id: string,
  key: string,
  type: string,
  multiplier: number,
};

export type ProductionEdge = {
  key: string,
  from: string,
  to: string,
  productionRate: number,
};

export class ProductionSolver {
  private globalWeights: GlobalWeights;
  private inputs: InputMap;
  private outputs: OutputMap;
  private allowedRecipes: RecipeMap;

  public constructor(options: FactoryOptions) {

    this.globalWeights = {
      resources: Number(options.weightingOptions.resources),
      power: Number(options.weightingOptions.power),
      buildArea: Number(options.weightingOptions.buildArea),
    };

    this.validateNumber(this.globalWeights.resources);
    this.validateNumber(this.globalWeights.power);
    this.validateNumber(this.globalWeights.buildArea);

    this.inputs = {};

    options.inputItems.forEach((item) => {
      if (!item.itemKey) return;
      const amount = item.unlimited ? Infinity : Number(item.value);
      this.validateNumber(amount);
      if (!amount) return;
      if (!this.inputs[item.itemKey]) {
        this.inputs[item.itemKey] = {
          amount,
          weight: 0,
          type: NODE_TYPE.INPUT_ITEM,
        }
      } else {
        this.inputs[item.itemKey].amount += amount;
      }
    });

    options.inputResources.forEach((item) => {
      const resourceData = resources[item.itemKey];
      if (!resourceData) return;
      const amount = item.unlimited ? Infinity : Number(item.value);
      this.validateNumber(amount);
      if (!amount) return;
      const weight = Number(item.weight) / 100;
      this.validateNumber(weight);
      this.inputs[item.itemKey] = {
        amount,
        weight,
        type: NODE_TYPE.RESOURCE,
      }
    });

    Object.keys(uncraftableItems).forEach((item) => {
      this.inputs[item] = {
        amount: Infinity,
        weight: 1000,
        type: NODE_TYPE.RESOURCE,
      };
    });

    this.outputs = {};
    options.productionItems.forEach((item) => {
      if (!item.itemKey) return;
      let amount = 0;
      switch (item.mode) {
        case 'per-minute':
          amount = Number(item.value);
          break;
        case 'maximize':
          amount = Infinity;
          break;
        default:
          if (recipes[item.mode]) {
            const targetProduct = recipes[item.mode].products.find((p) => p.itemClass === item.itemKey)!;
            amount = Number(item.value) * targetProduct.perMinute;
          } else {
            throw new Error('INVALID OUTPUT MODE SELECTION');
          }
      }
      this.validateNumber(amount);
      if (amount) {
        if (!this.outputs[item.itemKey]) {
          this.outputs[item.itemKey] = amount;
        } else {
          this.outputs[item.itemKey] += amount;
        }
      }
    });

    this.allowedRecipes = options.allowedRecipes;

    this.validate();
  }

  public async exec(): Promise<SolverResults> {
    const timestamp = performance.now();
    try {
      const recipeGraph = this.generateRecipeGraph();
      const productionSolution = await this.solverPass_targetRate(recipeGraph);
      const productionGraph = this.generateProductionGraph(productionSolution);
      return {
        productionGraph,
        timestamp: timestamp,
        error: '',
      };
    } catch (e: any) {
      return {
        productionGraph: null,
        timestamp: timestamp,
        error: e.message,
      };
    }
  }

  private validate() {
    if (Object.keys(this.outputs).length === 0) {
      throw new Error('NO INPUTS SET');
    }
  }

  private validateNumber(num: Number) {
    if (Number.isNaN(num)) {
      throw new Error('INVALID VALUE: NOT A NUMBER');
    } else if (num < 0) {
      throw new Error('INVALID VALUE: NEGATIVE NUMBER');
    }
  }

  private generateRecipeGraph(): RecipeGraph {
    const graph: RecipeGraph = {
      itemNodes: {},
      recipeNodes: {},
      edges: [],
    };

    const initialNode: RecipeNode = {
      id: nanoid(),
      recipeKey: NODE_TYPE.ROOT,
      type: NODE_TYPE.ROOT,
      ingredients: Object.keys(this.outputs),
      products: [],
      depth: -1,
    }

    this.buildRecipeTree(initialNode, graph, 0);
    this.classifyNodes(graph);

    return graph;
  }

  private buildRecipeTree(parentNode: RecipeNode, graph: RecipeGraph, depth: number) {
    if (depth > 50) {
      throw new Error('INFINITE LOOP DETECTED');
    }


    // ==== PRODUCT NODES ==== //
    for (const product of parentNode.products) {
      let productNode = graph.itemNodes[product];
      if (!productNode) {
        productNode = {
          id: nanoid(),
          itemKey: product,
          type: NODE_TYPE.NONE,
          outputFrom: [],
          inputTo: [],
          depth,
        };
        graph.itemNodes[product] = productNode;
      }
      productNode.outputFrom.push(parentNode.recipeKey);
      graph.edges.push({
        from: parentNode.id,
        to: productNode.id,
      });
    }


    // ==== INGREDIENT NODES ==== //
    for (const ingredient of parentNode.ingredients) {
      let ingredientNode = graph.itemNodes[ingredient];
      if (!ingredientNode) {
        ingredientNode = {
          id: nanoid(),
          itemKey: ingredient,
          type: NODE_TYPE.NONE,
          outputFrom: [],
          inputTo: [],
          depth,
        };
        graph.itemNodes[ingredient] = ingredientNode;
      }
      if (parentNode.type !== NODE_TYPE.ROOT) {
        ingredientNode.inputTo.push(parentNode.recipeKey);
        graph.edges.push({
          from: ingredientNode.id,
          to: parentNode.id,
        });
      }


      // ==== NEXT RECIPE NODES ==== //
      let recipeList: string[];
      if (this.inputs[ingredient]) {
        recipeList = [];
        if (this.inputs[ingredient].type === NODE_TYPE.INPUT_ITEM) {
          recipeList = itemRecipeMap[ingredient].filter((r) => this.allowedRecipes[r]);
        }
      } else {
        recipeList = itemRecipeMap[ingredient].filter((r) => this.allowedRecipes[r]);
        if (recipeList.length === 0) {
          throw new Error(`ITEM ${ingredient} HAS NO VALID RECIPES`);
        }
      }

      for (const recipe of recipeList) {
        let recipeNode = graph.recipeNodes[recipe];
        if (!recipeNode) {
          const recipeInfo = recipes[recipe];
          recipeNode = {
            id: nanoid(),
            recipeKey: recipe,
            type: NODE_TYPE.RECIPE,
            ingredients: recipeInfo.ingredients.map((i) => i.itemClass),
            products: recipeInfo.products.map((p) => p.itemClass),
            depth,
          };
          graph.recipeNodes[recipe] = recipeNode;
          this.buildRecipeTree(recipeNode, graph, depth + 1);
        }
      }
    }
  }
  
  private classifyNodes(graph: RecipeGraph) {
    for (const [key, node] of Object.entries(graph.itemNodes)) {
      if (this.outputs[key]) {
        node.type = NODE_TYPE.FINAL_PRODUCT;
      } else if (this.inputs[key]) {
        const inputInfo = this.inputs[key];
        node.type = inputInfo.type;
      } else if (node.inputTo.length === 0) {
        node.type = NODE_TYPE.SIDE_PRODUCT;
      } else {
        node.type = NODE_TYPE.INTERMEDIATE_ITEM;
      }
    }
  }

  private async solverPass_targetRate(graph: RecipeGraph): Promise<ProductionSolution> {
    const glpk = await loadGLPK();
    const model: LP = {
      name: 'production',
      objective: {
        name: 'score',
        direction: glpk.GLP_MIN,
        vars: [],
      },
      subjectTo: [],
    };

    for (const recipeKey of Object.keys(graph.recipeNodes)) {
      const recipeInfo = recipes[recipeKey];
      const buildingInfo = buildings[recipeInfo.producedIn];
      model.objective.vars.push({
        name: recipeKey,
        coef: buildingInfo.power * this.globalWeights.power + buildingInfo.area * this.globalWeights.buildArea,
      });
    }

    for (const [key, itemNode] of Object.entries(graph.itemNodes)) {
      if (itemNode.type === NODE_TYPE.SIDE_PRODUCT) continue;

      const vars: Var[] = [];

      for (const recipe of itemNode.inputTo) {
        const recipeInfo = recipes[recipe];
        const target = recipeInfo.ingredients.find((i) => i.itemClass === key)!;
        vars.push({ name: recipe, coef: target.perMinute });
      }

      for (const recipe of itemNode.outputFrom) {
        const recipeInfo = recipes[recipe];
        const target = recipeInfo.products.find((p) => p.itemClass === key)!;
        const existingVar = vars.find((v) => v.name === recipe);
        if (existingVar) {
          existingVar.coef -= target.perMinute;
        } else {
          vars.push({ name: recipe, coef: -target.perMinute });
        }
      }

      if (itemNode.type === NODE_TYPE.RESOURCE) {
        const inputInfo = this.inputs[key];
        model.subjectTo.push({
          name: `${key} resource constraint`,
          vars,
          bnds: { type: glpk.GLP_UP, ub: inputInfo.amount, lb: NaN },
        });

        const objectiveVars = vars.map<Var>((v) => ({
          name: v.name,
          coef: v.coef * inputInfo.weight * this.globalWeights.resources,
        }));
        model.objective.vars.push(...objectiveVars);
      }

      else if (itemNode.type === NODE_TYPE.INPUT_ITEM) {
        const inputInfo = this.inputs[key];
        model.subjectTo.push({
          name: `${key} input constraint`,
          vars,
          bnds: { type: glpk.GLP_UP, ub: inputInfo.amount, lb: NaN },
        });
      }

      else if (itemNode.type === NODE_TYPE.INTERMEDIATE_ITEM) {
        model.subjectTo.push({
          name: `${key} intermediates constraint`,
          vars,
          bnds: { type: glpk.GLP_UP, ub: 0, lb: NaN },
        });
      }

      else if (itemNode.type === NODE_TYPE.FINAL_PRODUCT) {
        const productionTarget = this.outputs[key];
        model.subjectTo.push({
          name: `${key} final product constraint`,
          vars,
          bnds: { type: glpk.GLP_UP, ub: -productionTarget, lb: NaN },
        });
      }
    }

    const solution = await glpk.solve(model, { msglev: glpk.GLP_MSG_OFF });
    if (solution.result.status !== glpk.GLP_OPT) {
      throw new Error("NO POSSIBLE SOLUTION");
    }

    const result: ProductionSolution = {};
    Object.entries(solution.result.vars).forEach(([key, val]) => {
      if (Math.abs(val) > EPSILON) {
        result[key] = val;
      }
    });
    return result;
  }

  private generateProductionGraph(productionSolution: ProductionSolution): ProductionGraph {
    const itemProductionTotals: ItemProductionTotals = {};
    const graph: ProductionGraph = {
      nodes: {},
      edges: [],
    };

    for (const [recipeKey, multiplier] of Object.entries(productionSolution)) {
      const recipeInfo = recipes[recipeKey];

      for (const product of recipeInfo.products) {
        const amount = multiplier * product.perMinute;
        if (!itemProductionTotals[product.itemClass]) {
          itemProductionTotals[product.itemClass] = {
            producedBy: [],
            usedBy: [],
          };
        }
        itemProductionTotals[product.itemClass].producedBy.push({ recipeKey, amount });
      }

      for (const ingredient of recipeInfo.ingredients) {
        const amount = multiplier * ingredient.perMinute;
        if (!itemProductionTotals[ingredient.itemClass]) {
          itemProductionTotals[ingredient.itemClass] = {
            producedBy: [],
            usedBy: [],
          };
        }
        itemProductionTotals[ingredient.itemClass].usedBy.push({ recipeKey, amount });
      }

      graph.nodes[recipeKey] = {
        id: nanoid(),
        key: recipeKey,
        type: NODE_TYPE.RECIPE,
        multiplier,
      };
    }

    for (const [itemKey, productionTotals] of Object.entries(itemProductionTotals)) {
      const { producedBy, usedBy } = productionTotals;
      let i = 0, j = 0;
      nextDemand:
      while (i < usedBy.length) {
        const usageInfo = usedBy[i];
        const usageNode = graph.nodes[usageInfo.recipeKey];

        while (j < producedBy.length) {
          const productionInfo = producedBy[j];
          const productionNode = graph.nodes[productionInfo.recipeKey];

          if (productionInfo.amount < EPSILON) {
            j++
            continue;
          }

          if (usageInfo.amount <= productionInfo.amount || j === producedBy.length - 1) {
            graph.edges.push({
              key: itemKey,
              from: productionNode.id,
              to: usageNode.id,
              productionRate: usageInfo.amount,
            });
            productionInfo.amount -= usageInfo.amount;
            usageInfo.amount = 0;
            i++;
            continue nextDemand;
          } else {
            graph.edges.push({
              key: itemKey,
              from: productionNode.id,
              to: usageNode.id,
              productionRate: productionInfo.amount,
            });
            usageInfo.amount -= productionInfo.amount;
            productionInfo.amount = 0;
          }
          j++;
        }
        break;
      }

      while (i < usedBy.length) {
        const usageInfo = usedBy[i];
        const usageNode = graph.nodes[usageInfo.recipeKey];
        if (usageInfo.amount > EPSILON && this.inputs[itemKey]) {
          let itemNode = graph.nodes[itemKey];
          if (!itemNode) {
            const inputInfo = this.inputs[itemKey];
            itemNode = {
              id: nanoid(),
              key: itemKey,
              type: inputInfo.type,
              multiplier: usageInfo.amount,
            };
            graph.nodes[itemKey] = itemNode;
          } else {
            itemNode.multiplier += usageInfo.amount;
          }
          graph.edges.push({
            key: itemKey,
            from: itemNode.id,
            to: usageNode.id,
            productionRate: usageInfo.amount,
          });
          usageInfo.amount = 0;
        }
        i++;
      }

      while (j < producedBy.length) {
        const productionInfo = producedBy[j];
        const productionNode = graph.nodes[productionInfo.recipeKey];
        if (productionInfo.amount > EPSILON) {
          let itemNode = graph.nodes[itemKey];
          if (!itemNode) {
            itemNode = {
              id: nanoid(),
              key: itemKey,
              type: this.outputs[itemKey] ? NODE_TYPE.FINAL_PRODUCT : NODE_TYPE.SIDE_PRODUCT,
              multiplier: productionInfo.amount
            };
            graph.nodes[itemKey] = itemNode;
          } else {
            itemNode.multiplier += productionInfo.amount;
          }
          graph.edges.push({
            key: itemKey,
            from: productionNode.id,
            to: itemNode.id,
            productionRate: productionInfo.amount,
          });
          productionInfo.amount = 0;
        }
        j++;
      }
    }

    return graph;
  }
}
