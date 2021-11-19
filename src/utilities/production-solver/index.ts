import { FactoryOptions } from '../../contexts/production';
import { itemRecipeMap, recipes, resources, uncraftableItems, ItemRate } from '../../data';
import { RecipeMap } from '../../contexts/production';

const MAX_ITERATIONS = 100;

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
  recipeSelection: { [key: string]: string },
  usedItems: { [key: string]: boolean },
  score: number,
};

export type ProductionGraphNode = {
  id: number,
  key: string,
  type: string,
  multiplier: number,
  depth: number,
};

export type ProductionGraphEdge = {
  from: number,
  to: number,
  key: string,
  productionRate: number,
};

export type RecipeGraph = {
  nodes: { [key: string]: RecipeGraphNode },
  edges: RecipeGraphEdge[],
  maxDepth: number,
  complexity: number;
}

export type RecipeGraphNode = {
  key: string,
  type: string,
  itemScore: number | null,
  recipeScore: { [key: string]: number },
  depth: number,
  edges: { from: RecipeGraphEdge[], to: RecipeGraphEdge[] },
};

export type RecipeGraphEdge = {
  from: RecipeGraphNode,
  to: RecipeGraphNode,
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
        if (amount > maxResourceAmount) {
          maxResourceAmount = amount;
        }
      }
    });
    options.inputResources.forEach((item) => {
      const resourceData = resources[item.itemKey];
      if (!resourceData) return;
      const amount = item.unlimited ? Infinity : Number(item.value);
      if (!amount) return;
      this.inputs[item.itemKey] = {
        amount,
        value: resourceData.relativeValue,
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
    console.log('============================');
    console.log('SOLVER START');
    const t0 = performance.now();
    const recipeGraph = this.generateRecipeGraph();
    const productionGraph = this.generateProductionGraph();
    const t = performance.now();
    console.log(`SOLVER DONE IN ${t - t0}ms`);
    console.log(`SCORE: ${productionGraph.score}`);
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
      nodes: {},
      edges: [],
      maxDepth: 0,
      complexity: 1,
    };

    const initialNode: RecipeGraphNode = {
      key: NODE_TYPE.ROOT,
      type: NODE_TYPE.ROOT,
      itemScore: null,
      recipeScore: {},
      depth: -1,
      edges: { from: [], to: [] },
    }

    this.buildRecipeTree(initialNode, graph, 0);
    this.scoreRecipes(graph);

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
        let itemNode = graph.nodes[item];
        if (!itemNode) {
          itemNode = {
            key: item,
            type,
            itemScore: null,
            recipeScore: {},
            depth,
            edges: { from: [], to: [] },
          };
          graph.nodes[item] = itemNode;
        }
        const edge = {
          from: itemNode,
          to: parentNode,
        };
        graph.edges.push(edge);
        itemNode.edges.from.push(edge);
        parentNode.edges.to.push(edge);
        continue;
      }

      let itemNode = graph.nodes[item];
      let nodeExists = !!itemNode;
      if (!itemNode) {
        itemNode = {
          key: item,
          type: NODE_TYPE.ITEM,
          itemScore: null,
          recipeScore: {},
          depth,
          edges: { from: [], to: [] },
        };
        graph.nodes[item] = itemNode;
      }
      if (parentNode.type !== NODE_TYPE.ROOT) {
        const edge = {
          from: itemNode,
          to: parentNode,
        };
        graph.edges.push(edge);
        itemNode.edges.from.push(edge);
        parentNode.edges.to.push(edge);
      }

      if (nodeExists) {
        continue;
      }

      const itemRecipes = itemRecipeMap[item]
        .filter((r) => this.allowedRecipes[r])
        .filter((r) => !recipes[r].ingredients.find((i) => i.itemClass === item));

      if (itemRecipes.length === 0) {
        throw new Error(`ITEM ${item} HAS NO VALID RECIPES`);
      }
      for (const recipe of itemRecipes) {
        let recipeNode = graph.nodes[recipe];
        if (!recipeNode) {
          recipeNode = {
            key: recipe,
            type: NODE_TYPE.RECIPE,
            itemScore: null,
            recipeScore: {},
            depth,
            edges: { from: [], to: [] },
          };
          graph.nodes[recipe] = recipeNode;
          this.buildRecipeTree(recipeNode, graph, depth + 1);
        }
        const edge = {
          from: recipeNode,
          to: itemNode,
        };
        graph.edges.push(edge);
        recipeNode.edges.from.push(edge);
        itemNode.edges.to.push(edge);
      }
    }
  }

  private scoreRecipes(graph: RecipeGraph) {
    this.itemRecipeTable = {};
    let iterations = 0;
    let noUpdates = false;

    const inputNodes = Object.entries(graph.nodes).filter(([key, node]) => node.type === NODE_TYPE.RESOURCE || node.type === NODE_TYPE.INPUT);
    const itemNodes = Object.entries(graph.nodes).filter(([key, node]) => node.type === NODE_TYPE.ITEM);

    for (const [key, node] of inputNodes) {
      node.itemScore = this.inputs[key].value;
    }

    while (!noUpdates && iterations < 20) {
      iterations++;

      nextItem:
      for (const [itemKey, itemNode] of itemNodes) {
        if (itemNode.itemScore != null) {
          continue;
        }

        const recipeList = [];

        let minRecipeScore = Infinity;
        for (const recipeEdge of itemNode.edges.to) {
          const recipeNode = recipeEdge.from;
          const recipeInfo = recipes[recipeNode.key];
          const targetProduct = recipeInfo.products.find((p) => p.itemClass === itemKey)!;
          let recipeScore = 0;

          for (const ingredientEdge of recipeNode.edges.to) {
            const ingredientNode = ingredientEdge.from;
            if (ingredientNode.itemScore == null) {
              continue nextItem;
            }
            const ingredient = recipeInfo.ingredients.find((i) => i.itemClass === ingredientNode.key)!;
            recipeScore += ingredientNode.itemScore * (ingredient.perMinute / targetProduct.perMinute);
          }

          recipeNode.recipeScore[itemKey] = recipeScore;
          recipeList.push(recipeNode.key);

          if (recipeScore < minRecipeScore) {
            minRecipeScore = recipeScore;
          }
        }

        recipeList.sort((a, b) => {
          const scoreA = graph.nodes[a].recipeScore[itemKey];
          const scoreB = graph.nodes[b].recipeScore[itemKey];
          if (scoreA < scoreB) return -1;
          if (scoreA > scoreB) return 1;
          return 0;
        });
        this.itemRecipeTable[itemKey] = recipeList;

        graph.complexity *= recipeList.length;

        itemNode.itemScore = minRecipeScore;
        noUpdates = false;
      }
    }
  }

  private generateProductionGraph(): ProductionGraph {
    const adjustableItems = Object.keys(this.itemRecipeTable).filter((key) => this.itemRecipeTable[key].length > 1);
    const initialRecipeSelection: { [key: string]: string } = {};
    Object.entries(this.itemRecipeTable).forEach(([item, recipeList]) => initialRecipeSelection[item] = recipeList[0]);

    let currentGraph = this.buildProductionGraphFromRecipeSelection(initialRecipeSelection);
    let iterations = 0;

    nextPass:
    while (iterations < MAX_ITERATIONS) {
      // eslint-disable-next-line no-loop-func
      const itemList = [...adjustableItems].filter((key) => currentGraph.usedItems[key]);

      while (itemList.length > 0) {
        const testItemIdx = Math.floor(Math.random() * itemList.length);
        const testItem = itemList.splice(testItemIdx, 1)[0];
        // eslint-disable-next-line no-loop-func
        const testRecipeList = this.itemRecipeTable[testItem].filter((key) => key !== currentGraph.recipeSelection[testItem]);
        const testRecipeSelection = { ...currentGraph.recipeSelection };

        while (testRecipeList.length > 0 && iterations < MAX_ITERATIONS) {
          const testRecipeIdx = Math.floor(Math.random() * testRecipeList.length);
          testRecipeSelection[testItem] = testRecipeList.splice(testRecipeIdx, 1)[0];

          let testGraph = this.buildProductionGraphFromRecipeSelection(testRecipeSelection);
          iterations++;
          if (testGraph.score < currentGraph.score) {
            currentGraph = testGraph;
            continue nextPass;
          }
        }
      }

      break;
    }
    return currentGraph;
  }

  private buildProductionGraphFromRecipeSelection(recipeSelection: { [key: string]: string }): ProductionGraph {
    const graph: ProductionGraph = {
      nodes: [],
      edges: [],
      recipeSelection,
      usedItems: {},
      score: 0,
    };

    const initialNode: ProductionGraphNode = {
      id: this.nextId(),
      key: NODE_TYPE.ROOT,
      type: NODE_TYPE.ROOT,
      multiplier: 1,
      depth: -1,
    }
    this.buildItemTree(initialNode, graph, 0);

    const collapsedGraph: ProductionGraph = {
      nodes: [],
      edges: [],
      recipeSelection,
      usedItems: graph.usedItems,
      score: 0,
    };
    
    const newEdges = graph.edges.map((e) => ({ ...e }));
    for (const node of graph.nodes) {
      let collapsedNode = collapsedGraph.nodes.find((n) => n.type === node.type && n.key === node.key);
      if (!collapsedNode) {
        collapsedNode = { ...node };
        collapsedGraph.nodes.push(collapsedNode);
      } else {
        if (node.type === NODE_TYPE.RECIPE) {
          collapsedNode.multiplier += node.multiplier;
        }
      }
      for (const edge of newEdges) {
        if (edge.to === node.id) {
          edge.to = collapsedNode.id;
        }
        if (edge.from === node.id) {
          edge.from = collapsedNode.id;
        }
      }
    }

    for (const edge of newEdges) {
      let collapsedEdge = collapsedGraph.edges.find((e) => e.key === edge.key && e.to === edge.to && e.from === edge.from);
      if (!collapsedEdge) {
        collapsedEdge = { ...edge };
        collapsedGraph.edges.push(collapsedEdge);
      } else {
        collapsedEdge.productionRate += edge.productionRate;
      }
    }

    collapsedGraph.nodes.forEach((node) => {
      if (node.type === NODE_TYPE.RESOURCE) {
        let perMinute = 0;
        collapsedGraph.edges.forEach((edge) => {
          if (edge.from === node.id) {
            perMinute += edge.productionRate;
          }
        });
        collapsedGraph.score += this.inputs[node.key].value * perMinute;
      }
    });

    return collapsedGraph;
  }

  private buildItemTree(parentNode: ProductionGraphNode, graph: ProductionGraph, depth: number) {
    if (depth > 20) {
      throw new Error('INFINITE LOOP DETECTED');
    }

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
      const parentRecipeInfo = recipes[parentNode.key];
      ingredients = parentRecipeInfo.ingredients.map((ingredient) => ({
        itemClass: ingredient.itemClass,
        perMinute: ingredient.perMinute * parentNode.multiplier,
      }));
    }

    for (const ingredient of ingredients) {
      const item = ingredient.itemClass;
      let targetRate = ingredient.perMinute;
      graph.usedItems[item] = true;

      if (this.inputs[item]) {
        const node: ProductionGraphNode = {
          id: this.nextId(),
          key: item,
          type: this.inputs[item].type,
          multiplier: 1,
          depth,
        };
        graph.nodes.push(node);
        graph.edges.push({
          from: node.id,
          to: parentNode.id,
          key: item,
          productionRate: targetRate,
        });
        continue;
      }
      
      const selectedRecipe = graph.recipeSelection[item];
      const recipeInfo = recipes[selectedRecipe];

      const primaryProduct = recipeInfo.products.find((p) => p.itemClass === item)!;
      const sideProducts = recipeInfo.products.filter((p) => p.itemClass !== item);

      let multiplier: number;
      if (targetRate === -1) {
        multiplier = this.outputs[item].buildings as number;
        targetRate = primaryProduct.perMinute * multiplier;
      } else {
        multiplier = targetRate / primaryProduct.perMinute;
      }

      const node: ProductionGraphNode = {
        id: this.nextId(),
        key: selectedRecipe,
        multiplier,
        type: NODE_TYPE.RECIPE,
        depth,
      };

      if (parentNode.type === NODE_TYPE.ROOT) {
        const productNode: ProductionGraphNode = {
          id: this.nextId(),
          key: item,
          multiplier: 1,
          type: NODE_TYPE.FINAL_PRODUCT,
          depth,
        };

        graph.nodes.push(node);
        graph.nodes.push(productNode);
        graph.edges.push({
          from: node.id,
          to: productNode.id,
          key: item,
          productionRate: targetRate,
        });
      } else {
        graph.nodes.push(node);
        graph.edges.push({
          from: node.id,
          to: parentNode.id,
          key: item,
          productionRate: targetRate,
        });
      }

      sideProducts.forEach((sideProduct) => {
        const productNode: ProductionGraphNode = {
          id: this.nextId(),
          key: sideProduct.itemClass,
          multiplier: 1,
          type: NODE_TYPE.SIDE_PRODUCT,
          depth,
        };
        graph.nodes.push(productNode);
        graph.edges.push({
          from: node.id,
          to: productNode.id,
          key: sideProduct.itemClass,
          productionRate: sideProduct.perMinute * multiplier,
        });
      });

      this.buildItemTree(node, graph, depth + 1);
    }
  }
}
