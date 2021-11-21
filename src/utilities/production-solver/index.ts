import loadGLPK, { LP, Var } from 'glpk.js';
import { nanoid } from 'nanoid';
import { FactoryOptions } from '../../contexts/production';
import { buildings, items, recipes, resources, handGatheredItems } from '../../data';
import { RecipeMap } from '../../contexts/production';

const EPSILON = 1e-8;
const MAXIMIZE_OBJECTIVE_WEIGHT = 1e6;

export const NODE_TYPE = {
  FINAL_PRODUCT: 'FINAL_PRODUCT',
  SIDE_PRODUCT: 'SIDE_PRODUCT',
  INPUT_ITEM: 'INPUT_ITEM',
  HAND_GATHERED_RESOURCE: 'HAND_GATHERED_RESOURCE',
  RESOURCE: 'RESOURCE',
  RECIPE: 'RECIPE',
};

type Inputs = {
  [key: string]: {
    amount: number,
    weight: number,
    type: string,
  }
};

type Outputs = {
  [key: string]: {
    value: number,
    maximize: boolean,
  }
};

type GlobalWeights = {
  resources: number,
  power: number,
  buildArea: number,
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

export type ProductionGraph = {
  nodes: { [key: string]: GraphNode },
  edges: GraphEdge[],
};

export type GraphNode = {
  id: string,
  key: string,
  type: string,
  multiplier: number,
};

export type GraphEdge = {
  key: string,
  from: string,
  to: string,
  productionRate: number,
};

export class ProductionSolver {
  private globalWeights: GlobalWeights;
  private inputs: Inputs;
  private outputs: Outputs;
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

    const maxGlobalWeight = Math.max(this.globalWeights.resources, this.globalWeights.power, this.globalWeights.buildArea);
    this.globalWeights.resources /= maxGlobalWeight;
    this.globalWeights.power /= maxGlobalWeight;
    this.globalWeights.buildArea /= maxGlobalWeight;

    this.inputs = {};

    options.inputResources.forEach((item) => {
      const resourceData = resources[item.itemKey];
      if (!resourceData) return;
      const amount = item.unlimited ? Infinity : Number(item.value);
      this.validateNumber(amount);
      if (!amount) return;
      const weight = Number(item.weight);
      this.validateNumber(weight);
      this.inputs[item.itemKey] = {
        amount,
        weight,
        type: NODE_TYPE.RESOURCE,
      }
    });

    const maxResourceWeight = Math.max(...Object.values(this.inputs).map((i) => i.weight));
    Object.values(this.inputs).forEach((i) => { i.weight /= maxResourceWeight });

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

    Object.keys(handGatheredItems).forEach((item) => {
      this.inputs[item] = {
        amount: Infinity,
        weight: 1000,
        type: NODE_TYPE.HAND_GATHERED_RESOURCE,
      };
    });

    this.outputs = {};
    const rateTargets: Outputs = {};
    const maximizeTargets: Outputs = {};
    const sortedMaximizeTargets: Outputs = {};
    options.productionItems.forEach((item) => {
      if (!item.itemKey) return;
      const amount = Number(item.value);
      this.validateNumber(amount);
      if (!amount) return;
      switch (item.mode) {
        case 'per-minute':
          if (rateTargets[item.itemKey]) {
            rateTargets[item.itemKey].value += amount;
          } else {
            rateTargets[item.itemKey] = {
              value: amount,
              maximize: false,
            };
          }
          break;
        case 'maximize':
          if (maximizeTargets[item.itemKey]) {
            if (maximizeTargets[item.itemKey].value < amount) {
              maximizeTargets[item.itemKey].value = amount;
            }
          } else {
            maximizeTargets[item.itemKey] = {
              value: amount,
              maximize: true,
            };
          }
          break;
        default:
          if (recipes[item.mode]) {
            const targetProduct = recipes[item.mode].products.find((p) => p.itemClass === item.itemKey)!;
            if (rateTargets[item.itemKey]) {
              rateTargets[item.itemKey].value += amount * targetProduct.perMinute;
            } else {
              rateTargets[item.itemKey] = {
                value: amount * targetProduct.perMinute,
                maximize: false,
              };
            }
          } else {
            throw new Error('INVALID OUTPUT MODE SELECTION');
          }
      }
    });

    Object.entries(maximizeTargets)
      .sort((a, b) => {
        if (a[1].value > b[1].value) return 1;
        if (a[1].value < b[1].value) return -1;
        return 0;
      })
      .forEach(([key, val], index) => {
        sortedMaximizeTargets[key] = {
          ...val,
          value: index + 1,
        }
      });

    this.outputs = {
      ...rateTargets,
      ...sortedMaximizeTargets,
    };
    if (Object.keys(this.outputs).length === 0) {
      throw new Error('NO OUTPUTS SET');
    }

    this.allowedRecipes = options.allowedRecipes;
  }

  private validateNumber(num: Number) {
    if (Number.isNaN(num)) {
      throw new Error('INVALID VALUE: NOT A NUMBER');
    } else if (num < 0) {
      throw new Error('INVALID VALUE: NEGATIVE NUMBER');
    }
  }

  public async exec(): Promise<SolverResults> {
    const timestamp = performance.now();
    try {
      const productionSolution = await this.solveProduction();
      if (Object.keys(productionSolution).length === 0) {
        throw new Error('NO POSSIBLE SOLUTION. INSUFFICIENT CONSTRAINTS.');
      }
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

  private async solveProduction(): Promise<ProductionSolution> {
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

    for (const [recipeKey, recipeInfo] of Object.entries(recipes)) {
      if (!this.allowedRecipes[recipeKey]) continue;
      const buildingInfo = buildings[recipeInfo.producedIn];
      model.objective.vars.push({
        name: recipeKey,
        coef: buildingInfo.power * this.globalWeights.power + buildingInfo.area * this.globalWeights.buildArea,
      });
    }

    for (const [itemKey, itemInfo] of Object.entries(items)) {
      const vars: Var[] = [];

      for (const recipe of itemInfo.usedInRecipes) {
        const recipeInfo = recipes[recipe];
        const target = recipeInfo.ingredients.find((i) => i.itemClass === itemKey)!;
        vars.push({ name: recipe, coef: target.perMinute });
      }

      for (const recipe of itemInfo.producedFromRecipes) {
        const recipeInfo = recipes[recipe];
        const target = recipeInfo.products.find((p) => p.itemClass === itemKey)!;
        const existingVar = vars.find((v) => v.name === recipe);
        if (existingVar) {
          existingVar.coef -= target.perMinute;
        } else {
          vars.push({ name: recipe, coef: -target.perMinute });
        }
      }

      if (this.inputs[itemKey]) {
        const inputInfo = this.inputs[itemKey];
        if (inputInfo.amount !== Infinity) {
          model.subjectTo.push({
            name: `${itemKey} resource constraint`,
            vars,
            bnds: { type: glpk.GLP_UP, ub: inputInfo.amount, lb: NaN },
          });
        }

        if (inputInfo.type === NODE_TYPE.RESOURCE || inputInfo.type === NODE_TYPE.HAND_GATHERED_RESOURCE) {
          const objectiveVars = vars.map<Var>((v) => ({
            name: v.name,
            coef: v.coef * inputInfo.weight * this.globalWeights.resources,
          }));
          model.objective.vars.push(...objectiveVars);
        }
      }

      else if (this.outputs[itemKey]) {
        const outputInfo = this.outputs[itemKey];
        if (outputInfo.maximize) {
          model.subjectTo.push({
            name: `${itemKey} final product constraint`,
            vars,
            bnds: { type: glpk.GLP_UP, ub: 0, lb: NaN },
          });

          const objectiveVars = vars.map<Var>((v) => ({
            name: v.name,
            coef: v.coef * Math.pow(MAXIMIZE_OBJECTIVE_WEIGHT, outputInfo.value),
          }));
          model.objective.vars.push(...objectiveVars);

        } else {
          model.subjectTo.push({
            name: `${itemKey} final product constraint`,
            vars,
            bnds: { type: glpk.GLP_UP, ub: -outputInfo.value, lb: NaN },
          });
        }
      }

      else {
        model.subjectTo.push({
          name: `${itemKey} intermediates constraint`,
          vars,
          bnds: { type: glpk.GLP_UP, ub: 0, lb: NaN },
        });
      }
    }

    const solution = await glpk.solve(model, { msglev: glpk.GLP_MSG_DBG });
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
