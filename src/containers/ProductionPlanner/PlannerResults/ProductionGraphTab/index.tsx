import React, { useMemo } from 'react';
import { ProductionGraph, ProductionGraphNode, ProductionGraphEdge, NODE_TYPE } from '../../../../utilities/production-solver';
import { items, recipes, buildings } from '../../../../data';

const graphOptions = {
  autoResize: true,
  layout: {
    hierarchical: {
      enabled: true,
      direction: 'LR',
      sortMethod: 'directed',
      shakeTowards: 'leaves',
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

function getNodeLabel(node: ProductionGraphNode, edges: ProductionGraphEdge[]) {
  let label = '';
  let amountText = '';
  if (node.type === NODE_TYPE.RECIPE) {
    const recipe = recipes[node.key];
    label = `${recipe.name}`;
    amountText = `${truncateFloat(node.multiplier)}x ${buildings[recipe.producedIn].name}`;
  } else if (node.type === NODE_TYPE.FINAL_PRODUCT || node.type === NODE_TYPE.SIDE_PRODUCT) {
    let val = 0;
    edges.forEach((edge) => {
      if (edge.to === node.id) {
        val += edge.productionRate;
      }
    });
    const item = items[node.key];
    label = `${item.name}`;
    amountText = `${truncateFloat(val)} / min`;
  } else if (node.type === NODE_TYPE.INPUT || node.type === NODE_TYPE.RESOURCE) {
    let val = 0;
    edges.forEach((edge) => {
      if (edge.from === node.id) {
        val += edge.productionRate;
      }
    });
    const item = items[node.key];
    label = `${item.name}`;
    amountText = `${truncateFloat(val)} / min`;
  } else if (node.type === NODE_TYPE.ROOT) {
    label = 'ROOT';
  }
  return `${label}\n${amountText}`;
}

function getEdgeLabel(edge: ProductionGraphEdge) {
  const item = items[edge.key];
  const label = `${item.name}`;
  const amountText = `${truncateFloat(edge.productionRate)} / min`;
  return `${label}\n${amountText}`;
}

interface Props {
  activeGraph: ProductionGraph | null,
  errorMessage: string,
}

const ProductionGraphTab = (props: Props) => {
  const { activeGraph, errorMessage } = props;

  const graphData = useMemo<any>(() => {
    if (activeGraph == null) {
      return null;
    }
    const graphData: any = {};
    graphData.nodes = activeGraph.nodes.map((node) => ({
      id: node.id,
      label: getNodeLabel(node, activeGraph.edges),
      shape: (node.type === NODE_TYPE.RECIPE) ? 'box' : 'ellipse',
      heightConstraint: (node.type === NODE_TYPE.RECIPE) ?  50 : 30,
      widthConstraint: (node.type === NODE_TYPE.RECIPE) ?  150: 120,
    }));
    graphData.edges = activeGraph.edges.map((edge) => ({
      from: edge.from,
      to: edge.to,
      label: getEdgeLabel(edge),
    }));
    return graphData;
  }, [activeGraph]);

  return (
    <div style={{ height: '800px', display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center', border: '1px solid black' }}>
      {
        graphData != null
        ? (
          null
          // <GraphVis
          //   graph={graphData}
          //   options={graphOptions}
          //   style={{ height: '100%', width: '100%' }}
          // />
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

export default ProductionGraphTab;
