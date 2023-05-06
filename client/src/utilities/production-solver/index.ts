import loadGLPK, { GLPK, LP, Var } from 'glpk.js';
import { nanoid } from 'nanoid';
import { FactoryOptions, RecipeSelectionMap } from '../../contexts/production/types';
import { GameData } from '../../contexts/gameData/types';
import { GraphError } from '../error/GraphError';
import { forEach } from 'lodash';

const EPSILON = 1e-8;
const MIN_RESOURCE_WEIGHT = 0.0001;
const MAXIMIZE_WEIGHT = 1e5;
const ENFORCE_BIN_WEIGHT = 1000;
const TIME_LIMIT = 3.0;
const RATE_TARGET_KEY = 'RATE_TARGET_PASS';

export const NODE_TYPE = {
  FINAL_PRODUCT: 'FINAL_PRODUCT',
  SIDE_PRODUCT: 'SIDE_PRODUCT',
  INPUT_ITEM: 'INPUT_ITEM',
  HAND_GATHERED_RESOURCE: 'HAND_GATHERED_RESOURCE',
  RESOURCE: 'RESOURCE',
  RECIPE: 'RECIPE',
};

export const POINTS_ITEM_KEY = 'POINTS_ITEM_KEY';

type Inputs = {
  [key: string]: {
    amount: number,
    weight: number,
    type: string,
  }
};

type RateTargets = {
  [key: string]: {
    value: number,
    recipe: string | null,
    isPoints: boolean,
  }
};

type MaximizeTargets = { key: string, priority: number };

type GlobalWeights = {
  resources: number,
  power: number,
  complexity: number,
  buildings: number
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
  report: Report | null,
  timestamp: number,
  computeTime: number,
  error: GraphError | null,
};

export type ProducedItemInformation = {
  key: string,
  name: string,
  amount: number,
  step: number,

}

export type Report = {
  pointsProduced: number,
  powerUsageEstimate: {
    production: number,
    extraction: number,
    generators: number,
    total: number,
  },
  resourceEfficiencyScore: number,
  totalBuildArea: number,
  estimatedFoundations: number,
  buildingsUsed: {
    [key: string]: {
      count: number,
      materialCost: {
        [key: string]: number,
      }
    },
  },
  totalMaterialCost: {
    [key: string]: number,
  },
  totalRawResources: {
    [key: string]: number,
  },
  totalItemsRecap: ProducedItemInformation[]
}

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

type ItemMap = {
  [key: string]: boolean;
}

export class ProductionSolver {
  private gameData: GameData;
  private globalWeights: GlobalWeights;
  private inputs: Inputs;
  private rateTargets: RateTargets;
  private maximizeTargets: MaximizeTargets[];
  private hasPointsTarget: boolean;
  private allowedRecipes: RecipeSelectionMap;
  private allowedItems: ItemMap;
  private scale: number;

  public constructor(options: FactoryOptions, gameData: GameData) {
    this.gameData = gameData;

    this.allowedRecipes = options.allowedRecipes;
    this.allowedItems = {};

    Object.entries(this.allowedRecipes).forEach(([recipeKey, allowed]) => {
      if (!allowed) return;
      const recipeInfo = this.gameData.recipes[recipeKey];
      recipeInfo.ingredients.forEach((i) => {
        this.allowedItems[i.itemClass] = true;
      });
      recipeInfo.products.forEach((p) => {
        this.allowedItems[p.itemClass] = true;
      });
    });
    
    this.globalWeights = {
      resources: Number(options.weightingOptions.resources),
      power: Number(options.weightingOptions.power),
      complexity: Number(options.weightingOptions.complexity),
      buildings: Number(options.weightingOptions.buildings),
    };

    this.validateNumber(this.globalWeights.resources);
    this.validateNumber(this.globalWeights.power);
    this.validateNumber(this.globalWeights.complexity);
    this.validateNumber(this.globalWeights.buildings);

    const maxGlobalWeight = Math.max(
      this.globalWeights.resources,
      this.globalWeights.power,
      this.globalWeights.complexity,
      this.globalWeights.buildings
    );

    this.globalWeights.resources = (this.globalWeights.resources / maxGlobalWeight) + MIN_RESOURCE_WEIGHT;
    this.globalWeights.power = (this.globalWeights.power / maxGlobalWeight);
    this.globalWeights.complexity = 1000 * (this.globalWeights.complexity / maxGlobalWeight);
    this.globalWeights.buildings = (this.globalWeights.buildings / maxGlobalWeight);

    this.inputs = {};

    options.inputResources.forEach((item) => {
      const resourceData = this.gameData.resources[item.itemKey];
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

    if (options.allowHandGatheredItems) {
      Object.keys(this.gameData.handGatheredItems).forEach((item) => {
        this.inputs[item] = {
          amount: Infinity,
          weight: 1000,
          type: NODE_TYPE.HAND_GATHERED_RESOURCE,
        };
      });
    }

    this.inputs['Desc_Gift_C'] = {
      amount: Infinity,
      weight: 1000,
      type: NODE_TYPE.HAND_GATHERED_RESOURCE,
    };

    this.rateTargets = {};
    this.maximizeTargets = [];
    this.hasPointsTarget = false;
    this.scale = 0;

    const perMinTargets: RateTargets = {};
    const recipeTargets: RateTargets = {};
    options.productionItems.forEach((item) => {
      if (!item.itemKey) return;
      const amount = Number(item.value);
      this.validateNumber(amount);
      if (!amount) return;
      if (this.inputs[item.itemKey]) throw new GraphError('INVALID INPUT', 'You can\'t set the same item as both an input and an output. Double check your factory settings.');
      const isPoints = item.itemKey === POINTS_ITEM_KEY;
      if (isPoints) {
        this.hasPointsTarget = true;
      }
      switch (item.mode) {
        case 'per-minute':
          this.scale += amount;
          if (perMinTargets[item.itemKey]) {
            perMinTargets[item.itemKey].value += amount;
          } else {
            perMinTargets[item.itemKey] = {
              value: amount,
              recipe: null,
              isPoints,
            };
          }
          break;
        case 'maximize':
          const existingTarget = this.maximizeTargets.find((t) => t.key === item.itemKey);
          if (existingTarget) {
            if (existingTarget.priority < amount) {
              existingTarget.priority = amount;
            }
          } else {
            this.maximizeTargets.push({
              key: item.itemKey,
              priority: amount,
            });
          }
          break;
        default:
          const recipeKey = item.mode;
          const recipeInfo = this.gameData.recipes[recipeKey];
          if (recipeInfo) {
            if (!this.allowedRecipes[recipeKey]) {
              throw new GraphError('CANNOT TARGET DISABLED RECIPE', 'Make sure the recipe you are targeting is enabled in the Recipes tab.');
            }
            const target = recipeInfo.products.find((p) => p.itemClass === item.itemKey)!;
            this.scale += target.perMinute * amount;
            if (perMinTargets[item.itemKey]) {
              perMinTargets[item.itemKey].value += target.perMinute * amount;
            } else {
              perMinTargets[item.itemKey] = {
                value: target.perMinute * amount,
                recipe: null,
                isPoints: false,
              };
            }
            if (recipeTargets[recipeKey]) {
              recipeTargets[recipeKey].value += amount;
            } else {
              recipeTargets[recipeKey] = {
                value: amount,
                recipe: recipeKey,
                isPoints: false,
              };
            }
          } else {
            throw new GraphError('INVALID OUTPUT MODE SELECTION', 'Something really broke... Try refreshing or resetting your factory.');
          }
      }
    });

    if (this.scale === 0) {
      this.scale = 1;
    }

    this.maximizeTargets
      .sort((a, b) => {
        if (a.priority > b.priority) return -1;
        if (a.priority < b.priority) return 1;
        throw new GraphError('DUPLICATE MAXIMIZATION PRIORITY', 'Two items have the same maximization priority, which is currently not allowed.');
      });

    this.rateTargets = {
      ...perMinTargets,
      ...recipeTargets,
    };
    if (Object.keys(this.rateTargets).length === 0 && this.maximizeTargets.length === 0) {
      throw new GraphError('NO OUTPUTS SET', 'Open the control panel to get started.');
    }
  }

  private validateNumber(num: number) {
    if (Number.isNaN(num)) {
      throw new GraphError('INVALID VALUE: NOT A NUMBER', 'Double check your factory settings.');
    } else if (num < 0) {
      throw new GraphError('INVALID VALUE: NEGATIVE NUMBER', 'Double check your factory settings.');
    }
  }

  public async exec(): Promise<SolverResults> {
    const timestamp = performance.now();
    try {
      const glpk = await loadGLPK();
      const productionSolution = await this.productionSolverPass(RATE_TARGET_KEY, this.inputs, glpk);
      let productionGraph = this.generateProductionGraph(productionSolution);

      for (const target of this.maximizeTargets) {
        const remainingInputs: Inputs = {};
        for (const [inputKey, input] of Object.entries(this.inputs)) {
          const inputNode = Object.values(productionGraph.nodes).find((n) => n.key === inputKey);
          let usedAmount = 0;
          if (inputNode) {
            usedAmount = inputNode.multiplier;
          }
          const diff = input.amount - usedAmount;
          if (diff > EPSILON) {
            remainingInputs[inputKey] = {
              ...input,
              amount: diff,
            };
          }
        }
        const solution = await this.productionSolverPass(target.key, remainingInputs, glpk);
        for (const [key, multiplier] of Object.entries(solution)) {
          if (productionSolution[key]) {
            productionSolution[key] += multiplier;
          } else {
            productionSolution[key] = multiplier;
          }
        }
        productionGraph = this.generateProductionGraph(productionSolution);
      }

      if (Object.keys(productionGraph.nodes).length === 0) {
        throw new GraphError('SOLUTION IS EMPTY', 'For some reason the solution for your parameters is an empty factory. Double check that your factory settings make sense.');
      }
      const report = this.generateProductionReport(productionGraph);

      return {
        productionGraph,
        report,
        timestamp,
        computeTime: performance.now() - timestamp,
        error: null,
      };
    } catch (e: unknown) {
      return {
        productionGraph: null,
        report: null,
        timestamp,
        computeTime: performance.now() - timestamp,
        error: e as GraphError,
      };
    }
  }

  private getItemPoints(itemKey: string) {
    const itemInfo = this.gameData.items[itemKey];
    return itemInfo.isFicsmas ? 0 : itemInfo.sinkPoints;
  }

  private async productionSolverPass(targetKey: string, remainingInputs: Inputs, glpk: GLPK): Promise<ProductionSolution> {
    const model: LP = {
      name: 'production',
      objective: {
        name: 'score',
        direction: glpk.GLP_MIN,
        vars: [],
      },
      subjectTo: [],
      binaries: [],
    };

    const doPoints = (targetKey === RATE_TARGET_KEY && this.rateTargets[POINTS_ITEM_KEY]) || targetKey === POINTS_ITEM_KEY;
    const pointsVars: Var[] = [];

    for (const [recipeKey, recipeInfo] of Object.entries(this.gameData.recipes)) {
      if (!this.allowedRecipes[recipeKey]) continue;
      const buildingInfo = this.gameData.buildings[recipeInfo.producedIn];
      const powerScore = buildingInfo.power > 0 ? buildingInfo.power * this.globalWeights.power : 0;
      const buildingsScore = this.globalWeights.buildings;
      let resourceScore = 0;

      for (const ingredient of recipeInfo.ingredients) {
        const inputInfo = this.inputs[ingredient.itemClass];
        if (inputInfo) {
          resourceScore += inputInfo.weight * ingredient.perMinute * this.globalWeights.resources;
        }
      }

      
      model.objective.vars.push({
        name: recipeKey,
        coef: powerScore + resourceScore + buildingsScore,
      });


      if (targetKey === RATE_TARGET_KEY) {
        if (this.rateTargets[recipeKey]) {
          model.subjectTo.push({
            name: `${recipeKey} recipe constraint`,
            vars: [{ name: recipeKey, coef: 1 }],
            bnds: { type: glpk.GLP_LO, ub: 0, lb: this.rateTargets[recipeKey].value },
          });
        }
      }

      if (doPoints) {
        let pointCoef = 0;
        for (const product of recipeInfo.products) {
          if (!this.inputs[product.itemClass] || this.inputs[product.itemClass].type === NODE_TYPE.INPUT_ITEM) {
            pointCoef -= product.perMinute * this.getItemPoints(product.itemClass) / 1000;
          }
        }
        for (const ingredient of recipeInfo.ingredients) {
          if (!this.inputs[ingredient.itemClass] || this.inputs[ingredient.itemClass].type === NODE_TYPE.INPUT_ITEM) {
            pointCoef += ingredient.perMinute * this.getItemPoints(ingredient.itemClass) / 1000;
          }
        }
        pointsVars.push({ name: recipeKey, coef: pointCoef });
      }
    }

  
    if (doPoints) {
      let intrinsicPoints = 0;
      for (const [itemKey, inputInfo] of Object.entries(remainingInputs)) {
        if (inputInfo.type === NODE_TYPE.INPUT_ITEM) {
          intrinsicPoints += this.getItemPoints(itemKey) * inputInfo.amount;
        }
      }
      if (targetKey === RATE_TARGET_KEY) {
        for (const [itemKey, targetInfo] of Object.entries(this.rateTargets)) {
          if (itemKey !== POINTS_ITEM_KEY) {
            intrinsicPoints -= this.getItemPoints(itemKey) * targetInfo.value;
          }
        }
        model.subjectTo.push({
          name: 'AWESOME Sink Points constraint',
          vars: pointsVars,
          bnds: { type: glpk.GLP_UP, ub: -this.rateTargets[POINTS_ITEM_KEY].value - intrinsicPoints, lb: NaN },
        });
      } else if (targetKey === POINTS_ITEM_KEY) {
        pointsVars.forEach((v) => {
          const existingVar = model.objective.vars.find((ov) => ov.name === v.name);
          if (existingVar) {
            existingVar.coef += v.coef * MAXIMIZE_WEIGHT;
          } else {
            model.objective.vars.push({
              name: v.name,
              coef: v.coef * MAXIMIZE_WEIGHT,
            });
          }
        });
      }
    }


    for (const [itemKey, itemInfo] of Object.entries(this.gameData.items)) {
      if (!this.allowedItems[itemKey]) continue;
      const vars: Var[] = [];
      
      const binKey = `${itemKey}_BIN`;
      const binVars: Var[] = [];

      for (const recipeKey of itemInfo.usedInRecipes) {
        if (!this.allowedRecipes[recipeKey]) continue;
        const recipeInfo = this.gameData.recipes[recipeKey];
        const target = recipeInfo.ingredients.find((i) => i.itemClass === itemKey)!;
        vars.push({ name: recipeKey, coef: target.perMinute });

        if (!this.gameData.handGatheredItems[itemKey]) {
          binVars.push({ name: recipeKey, coef: -1 });
        }
      }

      for (const recipeKey of itemInfo.producedFromRecipes) {
        if (!this.allowedRecipes[recipeKey]) continue;
        const recipeInfo = this.gameData.recipes[recipeKey];
        const target = recipeInfo.products.find((p) => p.itemClass === itemKey)!;

        const existingVar = vars.find((v) => v.name === recipeKey);
        if (existingVar) {
          existingVar.coef -= target.perMinute;
        } else {
          vars.push({ name: recipeKey, coef: -target.perMinute });
        }
      }

      if (targetKey === RATE_TARGET_KEY) {
        if (this.globalWeights.complexity > 0 && binVars.length > 0) {
          model.binaries!.push(binKey);
          model.objective.vars.push({ name: binKey, coef: this.globalWeights.complexity });
          model.subjectTo.push({
            name: `${binKey} constraint`,
            vars: [
              { name: binKey, coef: ENFORCE_BIN_WEIGHT * Math.sqrt(this.scale) },
              ...binVars,
            ],
            bnds: { type: glpk.GLP_LO, ub: NaN, lb: 0 },
          });
        }
      }

      if (vars.length === 0) continue;

      if (remainingInputs[itemKey]) {
        const inputInfo = remainingInputs[itemKey];
        if (inputInfo.amount !== Infinity) {
          model.subjectTo.push({
            name: `${itemKey} resource constraint`,
            vars,
            bnds: { type: glpk.GLP_UP, ub: inputInfo.amount, lb: NaN },
          });
        }
      }

      else if (targetKey === RATE_TARGET_KEY && this.rateTargets[itemKey]) {
        const outputInfo = this.rateTargets[itemKey];
        model.subjectTo.push({
          name: `${itemKey} final product constraint`,
          vars,
          bnds: { type: glpk.GLP_UP, ub: -outputInfo.value, lb: NaN },
        });
      }

      else if (targetKey === itemKey) {
        model.subjectTo.push({
          name: `${itemKey} final product constraint`,
          vars,
          bnds: { type: glpk.GLP_UP, ub: 0, lb: NaN },
        });

        vars.forEach((v) => {
          const existingVar = model.objective.vars.find((ov) => ov.name === v.name);
          if (existingVar) {
            existingVar.coef += v.coef * MAXIMIZE_WEIGHT;
          } else {
            model.objective.vars.push({
              name: v.name,
              coef: v.coef * MAXIMIZE_WEIGHT,
            });
          }
        });
      }

      else {
        model.subjectTo.push({
          name: `${itemKey} intermediates constraint`,
          vars,
          bnds: { type: glpk.GLP_UP, ub: 0, lb: NaN },
        });
      }
    }

    const solution = await glpk.solve(model, { msglev: glpk.GLP_MSG_OFF, tmlim: TIME_LIMIT });
    if (solution.time > TIME_LIMIT) {
      throw new GraphError('TIMED OUT', 'Try setting the complexity weight to 0. Unfortunately it is currently very slow for large factories. For complex factories, you might try the Buildings optimizer instead.');
    }
    if (solution.result.status !== glpk.GLP_OPT && solution.result.status !== glpk.GLP_FEAS) {
      if (targetKey === RATE_TARGET_KEY) {
        throw new GraphError('NO SOLUTION', 'This could be due to missing recipes, impossible demands, or any number of reasons. Double check your factory settings.');
      } else {
        throw new GraphError('SOLUTION IS UNBOUNDED', 'Somehow an infinite amount of items can be produced. Double check the inputs tab for infinite resources (including the hand gathered resources option).');
      }
    }


    const result: ProductionSolution = {};
    Object.entries(solution.result.vars).forEach(([key, val]) => {
      if (val > EPSILON) {
        if (this.gameData.recipes[key]) {
          result[key] = val;
        }
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
      const recipeInfo = this.gameData.recipes[recipeKey];

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

          const outputRecipe = this.rateTargets[itemKey]?.recipe;
          if (outputRecipe && outputRecipe === productionInfo.recipeKey) {
            const outputInfo = this.rateTargets[itemKey];
            const recipeInfo = this.gameData.recipes[outputRecipe];
            const target = recipeInfo.products.find((p) => p.itemClass === itemKey)!;
            const recipeAmount = outputInfo.value * target.perMinute;
            productionInfo.amount -= recipeAmount;

            let itemNode = graph.nodes[itemKey];
            if (!itemNode) {
              itemNode = {
                id: nanoid(),
                key: itemKey,
                type: NODE_TYPE.FINAL_PRODUCT,
                multiplier: recipeAmount,
              }
              graph.nodes[itemKey] = itemNode;
            } else {
              graph.nodes[itemKey].multiplier += recipeAmount;
            }
            graph.edges.push({
              key: itemKey,
              from: productionNode.id,
              to: itemNode.id,
              productionRate: recipeAmount,
            });
          } 

          if (productionInfo.amount < EPSILON) {
            j++
            continue;
          }

          if (usageInfo.amount <= productionInfo.amount) {
            graph.edges.push({
              key: itemKey,
              from: productionNode.id,
              to: usageNode.id,
              productionRate: usageInfo.amount,
            });
            productionInfo.amount -= usageInfo.amount;
            usageInfo.amount = 0;
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
          
          if (usageInfo.amount < EPSILON) {
            i++;
            continue nextDemand;
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
            let nodeType = NODE_TYPE.SIDE_PRODUCT;
            if (this.rateTargets[itemKey] || this.maximizeTargets.find((t) => t.key === itemKey)) {
              nodeType = NODE_TYPE.FINAL_PRODUCT;
            } else if (this.hasPointsTarget && this.getItemPoints(itemKey) > 0) {
              nodeType = NODE_TYPE.FINAL_PRODUCT;
            }
            itemNode = {
              id: nanoid(),
              key: itemKey,
              type: nodeType,
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

  private generateProductionReport(productionGraph: ProductionGraph): Report {
    const report: Report = {
      pointsProduced: 0,
      powerUsageEstimate: {
        production: 0,
        extraction: 0,
        generators: 0,
        total: 0,
      },
      resourceEfficiencyScore: 0,
      totalBuildArea: 0,
      estimatedFoundations: 0,
      buildingsUsed: {},
      totalMaterialCost: {},
      totalRawResources: {},
      totalItemsRecap: []
    };

    report.totalItemsRecap = this.generateItemsPerStep(productionGraph);

    for (const [key, node] of Object.entries(productionGraph.nodes)) {
      if (this.gameData.resources[node.key])
      {
        report.totalRawResources[this.gameData.items[node.key].name] = node.multiplier;
      }
    }
    for (const [key, node] of Object.entries(productionGraph.nodes)) {
      if (node.type === NODE_TYPE.RECIPE) {
        const recipeInfo = this.gameData.recipes[key];
        const buildingKey = recipeInfo.producedIn;
        const buildingInfo = this.gameData.buildings[buildingKey];
        const power = node.multiplier * buildingInfo.power;
        if (power < 0) {
          report.powerUsageEstimate.generators += -power;
        } else {
          report.powerUsageEstimate.production += power;
        }
        report.powerUsageEstimate.total += power;
        report.totalBuildArea += Math.ceil(node.multiplier) * buildingInfo.area;
        if (!report.buildingsUsed[buildingKey]) {
          report.buildingsUsed[buildingKey] = {
            count: Math.ceil(node.multiplier),
            materialCost: {},
          };
        } else {
          report.buildingsUsed[buildingKey].count += Math.ceil(node.multiplier);
        }

        for (const ingredient of buildingInfo.buildCost) {
          const amount = Math.ceil(node.multiplier) * ingredient.quantity;
          if (!report.buildingsUsed[buildingKey].materialCost[ingredient.itemClass]) {
            report.buildingsUsed[buildingKey].materialCost[ingredient.itemClass] = amount;
          } else {
            report.buildingsUsed[buildingKey].materialCost[ingredient.itemClass] += amount;
          }
          if (!report.totalMaterialCost[ingredient.itemClass]) {
            report.totalMaterialCost[ingredient.itemClass] = amount;
          } else {
            report.totalMaterialCost[ingredient.itemClass] += amount;
          }
        }
        continue;
      }

      if (node.type === NODE_TYPE.FINAL_PRODUCT) {
        report.pointsProduced += node.multiplier * this.getItemPoints(key);
      } else if (node.type === NODE_TYPE.RESOURCE) {
        report.resourceEfficiencyScore += node.multiplier * this.inputs[key].weight;
        let power = 0;
        if (key === 'Desc_Water_C') {
          power = node.multiplier / 120 * this.gameData.buildings['Desc_WaterPump_C'].power;

          const numExtractors = Math.ceil(node.multiplier / 120);
          report.buildingsUsed['Desc_WaterPump_C'] = {
            count: numExtractors,
            materialCost: {},
          };
          for (const ingredient of this.gameData.buildings['Desc_WaterPump_C'].buildCost) {
            const amount = numExtractors * ingredient.quantity;
            report.buildingsUsed['Desc_WaterPump_C'].materialCost[ingredient.itemClass] = amount;
            if (!report.totalMaterialCost[ingredient.itemClass]) {
              report.totalMaterialCost[ingredient.itemClass] = amount;
            } else {
              report.totalMaterialCost[ingredient.itemClass] += amount;
            }
          }

        } else if (key === 'Desc_LiquidOil_C') {
          power = node.multiplier / 120 * this.gameData.buildings['Desc_OilPump_C'].power;
        } else if (key === 'Desc_NitrogenGas_C') {
          // SKIP
        } else {
          power = node.multiplier / 240 * this.gameData.buildings['Desc_MinerMk3_C'].power;
        }
        report.powerUsageEstimate.extraction += power;
        report.powerUsageEstimate.total += power;
      }
    }

    report.estimatedFoundations = Math.ceil(2 * (report.totalBuildArea / 64));

    return report;
  }

  //Sort all items/resources involved in the factory by the MINIMUM number of steps needed to produce them in the chain
  private generateItemsPerStep(productionGraph: ProductionGraph) : ProducedItemInformation[] {
    let itemsList = [] as ProducedItemInformation[];
    let step = 1;
    let nodes = productionGraph.nodes;
    let keys = Object.keys(nodes);
    let usedKeys = [] as string[];

    //We only need raw resources and recipes, remove final products and side products
    keys = keys.filter((key) => nodes[key].type === 'RESOURCE' || nodes[key].type === 'RECIPE');

    //First get all the items used and produced
    for (var edge of productionGraph.edges){
      this.AddItemAndAmountToItemList(itemsList, edge.key, edge.productionRate, step);
    }

    //Preload raw resources since no recipe produces them
    for (var key of keys){
      if (this.gameData.resources[key])
      {
        usedKeys.push(key);
      }
    }

    keys = keys.filter((key) => !usedKeys.includes(key));

    while (keys.length > 0){
      for (var key of keys){
        const recipe = this.gameData.recipes[key];
        const applicableIngredientsAmount = recipe.ingredients.filter((ingredient) => usedKeys.includes(ingredient.itemClass)).length;
        if (applicableIngredientsAmount == recipe.ingredients.length){
          // for (var ingredient of recipe.ingredients){
          //   this.UpdateStepInItemList(itemsList, ingredient.itemClass, step);
          // }
          for (var product of recipe.products){
            if (!this.gameData.resources[product.itemClass])
            {
              this.UpdateStepInItemList(itemsList, product.itemClass, step+1);
            }
            if (!usedKeys.includes(product.itemClass)){
              usedKeys.push(product.itemClass);
            }
          }
          usedKeys.push(key);
        }
      }
      
      keys = keys.filter((key) => !usedKeys.includes(key));
      step++;
    }

    return itemsList;
  }

  private AddItemAndAmountToItemList(itemsList: ProducedItemInformation[], key: string, amount: number, step: number) {
    let existingItems = itemsList.filter(item => item.key === key);
    if (existingItems && existingItems.length > 0){
      existingItems[0].amount += amount;
    } 
    else {
      itemsList.push({
        key: key,
        amount: amount,
        name: this.gameData.items[key].name,
        step: step
      });
    }
  }

  private UpdateStepInItemList(itemsList: ProducedItemInformation[], key: string, step: number){
    let item = itemsList.find(item => item.key === key);
    if (item){
      item.step = step;
    }
  }
}
