import React, { useMemo } from 'react';
import GraphVis from '../../../../components/GraphVis';
import { RecipeGraph, RecipeGraphNode, NODE_TYPE } from '../../../../utilities/production-solver';
import { items, recipes } from '../../../../data';

interface Props {
  activeGraph: RecipeGraph | null,
  errorMessage: string,
}

const graphOptions = {
  autoResize: true,
  layout: {
    hierarchical: {
      enabled: true,
      direction: 'LR',
      sortMethod: 'directed',
      shakeTowards: 'leaves',
      blockShifting: true,
      edgeMinimization: true,
      parentCentralization: true,
      levelSeparation: 280,
      nodeSpacing: 100,
      treeSpacing: 100,
    },
  },
  physics: {
    enabled: false,
  },
  interaction: {
    selectConnectedEdges: false,
    zoomSpeed: 0.8,
  },
  nodes: {
    borderWidth: 1,
    chosen: false,
  },
  edges: {
    arrows: {
      to: {
        enabled: true,
        scaleFactor: 0.8,
      }
    },
    chosen: false,
  }
}

function truncateFloat(n: number) {
  return n.toFixed(4).replace(/\.?0+$/, '');
}

function getNodeLabel(node: RecipeGraphNode) {
  let label = '';
  let score = '';
  if (node.type === NODE_TYPE.RECIPE) {
    const recipe = recipes[node.key];
    score = '\n' + Object.entries(node.recipeScore)
      .map(([itemKey, itemScore]) => {
        const item = items[itemKey];
        return `${item.name}: ${truncateFloat(itemScore)}`;
      })
      .join('\n');
    label = recipe.name;
  } else if (node.type === NODE_TYPE.INPUT || node.type === NODE_TYPE.RESOURCE || node.type === NODE_TYPE.ITEM) {
    const item = items[node.key];
    label = item.name;
    score = `Score: ${node.itemScore == null ? 'null' : truncateFloat(node.itemScore)}`;
  } else if (node.type === NODE_TYPE.ROOT) {
    label = 'ROOT';
  }
  return `${label}\n${score}`;
}

function getNodeLevel(node: RecipeGraphNode, graph: RecipeGraph) {
  let level = 2 * (graph.maxDepth - node.depth);
  if (node.type === NODE_TYPE.RESOURCE) {
    level = 1;
  } else if (node.type === NODE_TYPE.ITEM || node.type === NODE_TYPE.INPUT) {
    level += 1;
  }
  return level;
}

const RecipeGraphTab = (props: Props) => {
  const { activeGraph, errorMessage } = props;

  const graphData = useMemo<any>(() => {
    if (activeGraph == null) {
      return null;
    }
    const graphData: any = {};
    graphData.nodes = Object.entries(activeGraph.nodes).map(([key, node]) => ({
      id: key,
      label: getNodeLabel(node),
      level: getNodeLevel(node, activeGraph),
      shape: (node.type === NODE_TYPE.RECIPE) ? 'box' : 'ellipse',
      heightConstraint: (node.type === NODE_TYPE.RECIPE) ? 50 : 30,
      widthConstraint: (node.type === NODE_TYPE.RECIPE) ? 150 : 120,
    }));
    graphData.edges = activeGraph.edges.map((edge) => ({
      from: edge.from.key,
      to: edge.to.key,
    }));
    return graphData;
  }, [activeGraph]);

  return (
    <div style={{ height: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid black' }}>
      {
        graphData != null
          ? (
            <GraphVis
              graph={graphData}
              options={graphOptions}
              style={{ height: '100%', width: '100%' }}
            />
          )
          : (
            <>
              <div>
                No graph available
              </div>
              {errorMessage
                ? (
                  <div>
                    {`\nERROR: ${errorMessage}`}
                  </div>
                )
                : null}
            </>
          )
      }
    </div>
  );
};

export default RecipeGraphTab;
