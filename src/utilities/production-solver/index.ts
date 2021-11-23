import loadGLPK, { GLPK, LP, Var } from 'glpk.js';
import { nanoid } from 'nanoid';
import { FactoryOptions } from '../../contexts/production';
import { buildings, items, recipes, resources, handGatheredItems } from '../../data';
import { RecipeMap } from '../../contexts/production';

const EPSILON = 1e-8;

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
  report: Report | null,
  timestamp: number,
  error: string,
};

export type Report = {
  pointsProduced: number,
  powerUsageEstimate: number,
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

export class ProductionSolver {
  private globalWeights: GlobalWeights;
  private inputs: Inputs;
  private rateTargets: RateTargets;
  private maximizeTargets: MaximizeTargets[];
  private hasPointsTarget: boolean;
  private allowedRecipes: RecipeMap;

  public constructor(options: FactoryOptions) {
    this.allowedRecipes = options.allowedRecipes;
    
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
    this.globalWeights.buildArea /= (10 * maxGlobalWeight); // Extra factor of 10 to be closer to power numbers

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

    if (options.allowHandGatheredItems) {
      Object.keys(handGatheredItems).forEach((item) => {
        this.inputs[item] = {
          amount: Infinity,
          weight: 1000,
          type: NODE_TYPE.HAND_GATHERED_RESOURCE,
        };
      });
    }

    this.rateTargets = {};
    this.maximizeTargets = [];
    this.hasPointsTarget = false;

    const perMinTargets: RateTargets = {};
    const recipeTargets: RateTargets = {};
    options.productionItems.forEach((item) => {
      if (!item.itemKey) return;
      const amount = Number(item.value);
      this.validateNumber(amount);
      if (!amount) return;
      const isPoints = item.itemKey === POINTS_ITEM_KEY;
      if (isPoints) {
        this.hasPointsTarget = true;
      }
      switch (item.mode) {
        case 'per-minute':
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
          const recipeInfo = recipes[recipeKey];
          if (recipeInfo) {
            if (!this.allowedRecipes[recipeKey]) {
              throw new Error('CANNOT TARGET A DISABLED RECIPE');
            }
            const target = recipeInfo.products.find((p) => p.itemClass === item.itemKey)!;
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
            throw new Error('INVALID OUTPUT MODE SELECTION');
          }
      }
    });

    this.maximizeTargets
      .sort((a, b) => {
        if (a.priority > b.priority) return -1;
        if (a.priority < b.priority) return 1;
        throw new Error('TWO TARGET ITEMS HAVE THE SAME MAXIMIZATION PRIORITY');
      });

    this.rateTargets = {
      ...perMinTargets,
      ...recipeTargets,
    };
    if (Object.keys(this.rateTargets).length === 0 && this.maximizeTargets.length === 0) {
      throw new Error('NO OUTPUTS SET');
    }
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
      const glpk = await loadGLPK();
      const productionSolution = await this.solveProduction_rateTargetsPass(glpk);
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
        const solution = await this.solveProduction_maximizePass(target.key, remainingInputs, glpk);
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
        throw new Error('SOLUTION IS EMPTY');
      }
      const report = this.generateProductionReport(productionGraph);

      return {
        productionGraph,
        report,
        timestamp: timestamp,
        error: '',
      };
    } catch (e: any) {
      return {
        productionGraph: null,
        report: null,
        timestamp: timestamp,
        error: e.message,
      };
    }
  }

  private async solveProduction_rateTargetsPass(glpk: GLPK): Promise<ProductionSolution> {
    const model: LP = {
      name: 'production',
      objective: {
        name: 'score',
        direction: glpk.GLP_MIN,
        vars: [],
      },
      subjectTo: [],
    };

    const pointsVars: Var[] = [];

    for (const [recipeKey, recipeInfo] of Object.entries(recipes)) {
      if (!this.allowedRecipes[recipeKey]) continue;
      const buildingInfo = buildings[recipeInfo.producedIn];
      const powerScore = buildingInfo.power > 0 ? buildingInfo.power * this.globalWeights.power : 0;
      const areaScore = buildingInfo.area * this.globalWeights.buildArea;
      model.objective.vars.push({
        name: recipeKey,
        coef: powerScore + areaScore,
      });

      if (this.rateTargets[recipeKey]) {
        model.subjectTo.push({
          name: `${recipeKey} recipe constraint`,
          vars: [{ name: recipeKey, coef: 1 }],
          bnds: { type: glpk.GLP_LO, ub: 0, lb: this.rateTargets[recipeKey].value },
        });
      }

      if (this.rateTargets[POINTS_ITEM_KEY]) {
        let pointCoef = 0;
        for (const product of recipeInfo.products) {
          if (!this.inputs[product.itemClass]) {
            pointCoef -= product.perMinute * items[product.itemClass].sinkPoints / 1000;
          }
        }
        for (const ingredient of recipeInfo.ingredients) {
          if (!this.inputs[ingredient.itemClass]) {
            pointCoef += ingredient.perMinute * items[ingredient.itemClass].sinkPoints / 1000;
          } 
        }
        pointsVars.push({ name: recipeKey, coef: pointCoef });
      }
    }

    if (this.rateTargets[POINTS_ITEM_KEY]) {
      model.subjectTo.push({
        name: 'AWESOME Sink Points constraint',
        vars: pointsVars,
        bnds: { type: glpk.GLP_UP, ub: -this.rateTargets[POINTS_ITEM_KEY].value, lb: NaN },
      });
    }

    for (const [itemKey, itemInfo] of Object.entries(items)) {
      const vars: Var[] = [];

      for (const recipeKey of itemInfo.usedInRecipes) {
        if (!this.allowedRecipes[recipeKey]) continue;
        const recipeInfo = recipes[recipeKey];
        const target = recipeInfo.ingredients.find((i) => i.itemClass === itemKey)!;
        vars.push({ name: recipeKey, coef: target.perMinute });
      }

      for (const recipeKey of itemInfo.producedFromRecipes) {
        if (!this.allowedRecipes[recipeKey]) continue;
        const recipeInfo = recipes[recipeKey];
        const target = recipeInfo.products.find((p) => p.itemClass === itemKey)!;
        const existingVar = vars.find((v) => v.name === recipeKey);
        if (existingVar) {
          existingVar.coef -= target.perMinute;
        } else {
          vars.push({ name: recipeKey, coef: -target.perMinute });
        }
      }

      if (vars.length === 0) continue;

      let objectiveVars: Var[] = [];

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
          objectiveVars = vars
            .filter((v) => v.coef > 0)
            .map<Var>((v) => ({
              name: v.name,
              coef: v.coef * inputInfo.weight * this.globalWeights.resources,
            }));
        }
      }

      else if (this.rateTargets[itemKey]) {
        const outputInfo = this.rateTargets[itemKey];
        model.subjectTo.push({
          name: `${itemKey} final product constraint`,
          vars,
          bnds: { type: glpk.GLP_UP, ub: -outputInfo.value, lb: NaN },
        });
      }

      else {
        model.subjectTo.push({
          name: `${itemKey} intermediates constraint`,
          vars,
          bnds: { type: glpk.GLP_UP, ub: 0, lb: NaN },
        });
      }

      objectiveVars.forEach((v) => {
        const existingVar = model.objective.vars.find((ov) => ov.name === v.name);
        if (existingVar) {
          existingVar.coef += v.coef;
        } else {
          model.objective.vars.push(v);
        }
      });
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


  async solveProduction_maximizePass(targetKey: string, remainingInputs: Inputs, glpk: GLPK): Promise<ProductionSolution> {
    const model: LP = {
      name: 'production',
      objective: {
        name: 'score',
        direction: glpk.GLP_MIN,
        vars: [],
      },
      subjectTo: [],
    };

    const pointsVars: Var[] = [];

    for (const [recipeKey, recipeInfo] of Object.entries(recipes)) {
      if (!this.allowedRecipes[recipeKey]) continue;
      const buildingInfo = buildings[recipeInfo.producedIn];
      const powerScore = buildingInfo.power > 0 ? buildingInfo.power * this.globalWeights.power : 0;
      const areaScore = buildingInfo.area * this.globalWeights.buildArea;
      model.objective.vars.push({
        name: recipeKey,
        coef: powerScore + areaScore,
      });

      if (targetKey === POINTS_ITEM_KEY) {
        let pointCoef = 0;
        for (const product of recipeInfo.products) {
          if (!this.inputs[product.itemClass]) {
            pointCoef -= product.perMinute * items[product.itemClass].sinkPoints / 1000;
          }
        }
        for (const ingredient of recipeInfo.ingredients) {
          if (!this.inputs[ingredient.itemClass]) {
            pointCoef += ingredient.perMinute * items[ingredient.itemClass].sinkPoints / 1000;
          }
        }
        pointsVars.push({ name: recipeKey, coef: pointCoef });
      }
    }

    if (targetKey === POINTS_ITEM_KEY) {
      pointsVars
        .forEach((v) => {
          const existingVar = model.objective.vars.find((ov) => ov.name === v.name);
          if (existingVar) {
            existingVar.coef += v.coef;
          } else {
            model.objective.vars.push(v);
          }
        });
    }

    for (const [itemKey, itemInfo] of Object.entries(items)) {
      const vars: Var[] = [];

      for (const recipeKey of itemInfo.usedInRecipes) {
        if (!this.allowedRecipes[recipeKey]) continue;
        const recipeInfo = recipes[recipeKey];
        const target = recipeInfo.ingredients.find((i) => i.itemClass === itemKey)!;
        vars.push({ name: recipeKey, coef: target.perMinute });
      }

      for (const recipeKey of itemInfo.producedFromRecipes) {
        if (!this.allowedRecipes[recipeKey]) continue;
        const recipeInfo = recipes[recipeKey];
        const target = recipeInfo.products.find((p) => p.itemClass === itemKey)!;
        const existingVar = vars.find((v) => v.name === recipeKey);
        if (existingVar) {
          existingVar.coef -= target.perMinute;
        } else {
          vars.push({ name: recipeKey, coef: -target.perMinute });
        }
      }

      if (vars.length === 0) continue;

      let objectiveVars: Var[] = [];

      if (remainingInputs[itemKey]) {
        const inputInfo = remainingInputs[itemKey];
        if (inputInfo.amount !== Infinity) {
          model.subjectTo.push({
            name: `${itemKey} resource constraint`,
            vars,
            bnds: { type: glpk.GLP_UP, ub: inputInfo.amount, lb: NaN },
          });
        }

        if (inputInfo.type === NODE_TYPE.RESOURCE || inputInfo.type === NODE_TYPE.HAND_GATHERED_RESOURCE) {
          objectiveVars = vars
            .filter((v) => v.coef > 0)
            .map<Var>((v) => ({
              name: v.name,
              coef: v.coef * inputInfo.weight * this.globalWeights.resources,
            }));
        }
      }

      else if (targetKey === itemKey) {
        model.subjectTo.push({
          name: `${itemKey} final product constraint`,
          vars,
          bnds: { type: glpk.GLP_UP, ub: 0, lb: NaN },
        });

        objectiveVars = vars;
      }

      else {
        model.subjectTo.push({
          name: `${itemKey} intermediates constraint`,
          vars,
          bnds: { type: glpk.GLP_UP, ub: 0, lb: NaN },
        });
      }

      objectiveVars.forEach((v) => {
        const existingVar = model.objective.vars.find((ov) => ov.name === v.name);
        if (existingVar) {
          existingVar.coef += v.coef;
        } else {
          model.objective.vars.push(v);
        }
      });
    }

    const solution = await glpk.solve(model, { msglev: glpk.GLP_MSG_OFF });
    if (solution.result.status !== glpk.GLP_OPT) {
      throw new Error("SOLUTION IS UNBOUNDED");
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

          const outputRecipe = this.rateTargets[itemKey]?.recipe;
          if (outputRecipe && outputRecipe === productionInfo.recipeKey) {
            const outputInfo = this.rateTargets[itemKey];
            const recipeInfo = recipes[outputRecipe];
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
            } else if (this.hasPointsTarget && items[itemKey].sinkPoints > 0) {
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
      powerUsageEstimate: 0,
      resourceEfficiencyScore: 0,
      totalBuildArea: 0,
      estimatedFoundations: 0,
      buildingsUsed: {},
      totalMaterialCost: {},
    };

    for (const [key, node] of Object.entries(productionGraph.nodes)) {
      if (node.type === NODE_TYPE.RECIPE) {
        const recipeInfo = recipes[key];
        const buildingKey = recipeInfo.producedIn;
        const buildingInfo = buildings[buildingKey];

        report.powerUsageEstimate += node.multiplier * buildingInfo.power;
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

      const itemInfo = items[key];
      if (node.type === NODE_TYPE.FINAL_PRODUCT) {
        report.pointsProduced += node.multiplier * itemInfo.sinkPoints;
      } else if (node.type === NODE_TYPE.RESOURCE) {
        report.resourceEfficiencyScore += node.multiplier * this.inputs[key].weight;
      }
    }

    report.estimatedFoundations = Math.ceil(2 * (report.totalBuildArea / 64));

    return report;
  }
}
