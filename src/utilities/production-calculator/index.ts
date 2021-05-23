import { FactoryOptions } from '../../contexts/production';
import { items, itemRecipeMap, recipes, resources, buildings } from '../../data';
import { RecipeMap } from '../../contexts/production';

type InputMap = { [key: string]: number };
type OutputTargets = { rate: number | null, buildings: number | null };
type OutputMap = { [key: string]: OutputTargets };

type Graph = {
  nodes: GraphNode[],
  edges: GraphEdge[],
};

type GraphNode = {
  id: number,
  item: string,
  rate: number,
  recipe: string,
};

type GraphEdge = {
  input: number,
  output: number,
};

export class ProductionGraphAlgorithm {
  private inputs: InputMap;
  private outputs: OutputMap;
  private allowedRecipes: RecipeMap;
  private currentId: number = 0;

  public constructor(options: FactoryOptions) {
    console.clear();
    // TODO
    // check NaN
    // check output not zero
    // sum multiple in/out of same item

    this.inputs = {};
    options.inputItems.forEach((item) => {
      if (!item.itemKey) return;
      this.inputs[item.itemKey] = item.unlimited ? Infinity : Number(item.value);
    });
    options.inputResources.forEach((item) => {
      this.inputs[item.itemKey] = item.unlimited ? Infinity : Number(item.value);
    });

    this.outputs = {};
    options.productionItems.forEach((item) => {
      if (!item.itemKey) return;
      const targets: OutputTargets = {
        rate: null,
        buildings: null,
      };
      switch (item.mode) {
        case 'building-target':
          targets.buildings = Number(item.value);
          break;
        case 'rate-target':
          targets.rate = Number(item.value);
          break;
        case 'maximize':
          targets.rate = Infinity;
          break;
        default:
          // Panic
          break;
      }
      this.outputs[item.itemKey] = targets;
    });

    this.allowedRecipes = options.allowedRecipes;
  }

  public exec() {
    Object.keys(this.outputs).forEach((key) => {
      const graphs = this.buildItemTree(this.nextId(), key, 10, 0);
      graphs.forEach((g) => console.log(g));
      console.log(`GRAPHS: ${graphs.length}`);
    });
  }

  private nextId() {
    return this.currentId++;
  }

  private buildItemTree(nodeId: number, item: string, rate: number, depth: number): Graph[] {
    if (depth > 80) {
      throw new Error("MAX DEPTH EXCEEDED");
    }
    if (this.inputs[item] || !itemRecipeMap[item]) {
      // this is an input item (i.e. root node)
      const node: GraphNode = {
        id: nodeId,
        item,
        rate,
        recipe: 'INPUT',
      };
      const graph: Graph = {
        nodes: [node],
        edges: [],
      };
      return [graph];
    } else {
      // TODO: cache this recipe list
      // TODO: check if no recipes
      const itemRecipes = itemRecipeMap[item].filter((r) => this.allowedRecipes[r]);

      const allRecipeGraphs: Graph[] = [];
      itemRecipes.forEach((recipeKey) => {
        // TODO: error if recipe or primary product doesnt exist
        // TODO: figure out how the heck to do side products
        const recipeInfo = recipes[recipeKey];
        const primaryProduct = recipeInfo.products.find((p) => p.itemClass === item);
        const sideProducts = recipeInfo.products.filter((p) => p.itemClass !== item);

        const rateScaleFactor = rate / primaryProduct!.perMinute;

        const outputNode: GraphNode = {
          id: nodeId,
          item,
          rate,
          recipe: recipeKey,
        };

        const indexes: number[] = [];
        const indexLimits: number[] = [];
        const allIngredientGraphs = recipeInfo.ingredients.map((ingredient) => {
          const topNodeId = this.nextId();
          const ingredientGraphs = this.buildItemTree(topNodeId, ingredient.itemClass, ingredient.perMinute * rateScaleFactor, depth + 1);
          indexes.push(0);
          indexLimits.push(ingredientGraphs.length);
          return {
            topNodeId,
            graphs: ingredientGraphs,
          };
        });

        // This part chooses all combinations of pathways for each ingredient
        let done = false;
        let iter = 0;
        while (!done && iter < 10000) {
          // choose one graph from each ingredient
          const newGraph: Graph = {
            edges: [],
            nodes: [],
          };
          for (let i = 0; i < indexes.length; i++) {
            const idx = indexes[i];
            const topNodeId = allIngredientGraphs[i].topNodeId;
            const graph = allIngredientGraphs[i].graphs[idx];
            newGraph.edges.push(...graph.edges, { input: topNodeId, output: nodeId });
            newGraph.nodes.push(...graph.nodes);
          }
          newGraph.nodes.push(outputNode);
          allRecipeGraphs.push(newGraph);

          // Increment indices with rollover
          iter++;
          indexes[0]++;
          for (let i = 0; i < indexes.length; i++) {
            if (indexes[i] < indexLimits[i]) {
              break;
            }
            indexes[i] = 0;
            if (i >= indexes.length - 1) {
              done = true;
              break;
            }
            indexes[i + 1]++;
          }
        }
      });

      return allRecipeGraphs;
    }
  }
}
