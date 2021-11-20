import React, { useMemo } from 'react';
import { nanoid } from 'nanoid';
import Cytoscape, { Stylesheet } from 'cytoscape';
import klay from 'cytoscape-klay';
import GraphVisualizer from 'react-cytoscapejs';
import { ProductionGraph, ProductionNode, ProductionEdge, NODE_TYPE } from '../../../../utilities/production-solver';
import { items, recipes, buildings } from '../../../../data';

Cytoscape.use(klay);

const layout = {
  name: 'klay',
  padding: 40,
  klay: {
    direction: 'RIGHT',
    edgeRouting: 'ORTHOGONAL',
    nodePlacement: 'LINEAR_SEGMENTS',
    edgeSpacingFactor: 0.2,
    inLayerSpacingFactor: 0.7,
    spacing: 70,
    thoroughness: 10,
  },
};

const stylesheet: Stylesheet[] = [
  {
    selector: 'core',
    style: {
      'active-bg-color': '#000',
      'active-bg-opacity': 0,
      'active-bg-size': 0,
      'selection-box-color': '#000',
      'selection-box-border-color': '#000',
      'selection-box-border-width': 0,
      'selection-box-opacity': 0,
      'outside-texture-bg-color': '#000',
      'outside-texture-bg-opacity': 0,
    },
  },
  {
    selector: 'node',
    style: {
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'height': '30px',
      'width': '140px',
      'text-max-width': '160px',
      'padding-top': '20px',
      'overlay-padding': 0,
      'overlay-opacity': 0,
      'text-wrap': 'wrap',
      'font-size': '14px',
    },
  },
  {
    selector: 'edge',
    style: {
      'label': 'data(label)',
      'width': 1,
      'curve-style': 'bezier',
      'target-arrow-shape': 'triangle-backcurve',
      'arrow-scale': 1.2,
      'overlay-padding': 0,
      'overlay-opacity': 0,
      'text-wrap': 'wrap',
      'font-size': '13px',
    },
  },
  {
    selector: 'edge.loop',
    style: {
      'loop-direction': '180deg',
      'loop-sweep': '-40deg',
      'edge-distances': 'node-position',
      'source-endpoint': '-15% 50%',
      'target-endpoint': '15% 50%',
    },
  },
  {
    selector: 'node.item-shape',
    style: {
      'shape': 'ellipse',
    },
  },
  {
    selector: 'node.recipe-shape',
    style: {
      'shape': 'round-rectangle',
    },
  },
  {
    selector: 'node.final-product',
    style: {
      'background-color': '#61e873',
    },
  },
  {
    selector: 'node.side-product',
    style: {
      'background-color': '#e1e861',
    },
  },
  {
    selector: 'node.input',
    style: {
      'background-color': '#e86161',
    },
  },
  {
    selector: 'node.resource',
    style: {
      'background-color': '#e8a761',
    },
  },
  {
    selector: 'node.recipe',
    style: {
      'background-color': '#61c2e8',
    },
  },
  {
    selector: 'node.item',
    style: {
      'background-color': '#61c2e8',
    },
  },
];

const NODE_COLOR_CLASS = {
  [NODE_TYPE.FINAL_PRODUCT]: 'final-product',
  [NODE_TYPE.SIDE_PRODUCT]: 'side-product',
  [NODE_TYPE.INTERMEDIATE_ITEM]: 'item',
  [NODE_TYPE.INPUT_ITEM]: 'input',
  [NODE_TYPE.RESOURCE]: 'resource',
  [NODE_TYPE.RECIPE]: 'recipe',
};


function truncateFloat(n: number) {
  return n.toFixed(4).replace(/\.?0+$/, '');
}

function getNodeLabel(node: ProductionNode) {
  let label = '';
  let amountText = '';
  if (node.type === NODE_TYPE.RECIPE) {
    const recipe = recipes[node.key];
    label = recipe.name;
    amountText = `${truncateFloat(node.multiplier)}x ${buildings[recipe.producedIn].name}`;
  } else {
    const item = items[node.key];
    label = item.name;
    amountText = `${truncateFloat(node.multiplier)} / min`;
  }
  return `${label}\n${amountText}`;
}

function getEdgeLabel(edge: ProductionEdge) {
  const item = items[edge.key];
  const label = item.name;
  const amountText = `${truncateFloat(edge.productionRate)} / min`;
  return `${label}\n${amountText}`;
}

interface Props {
  activeGraph: ProductionGraph | null,
  errorMessage: string,
}

const ProductionGraphTab = (props: Props) => {
  const { activeGraph, errorMessage } = props;

  const graphProps = useMemo<any>(() => {
    if (activeGraph == null) {
      return null;
    }

    const key = nanoid();
    const elements: any[] = [];

    Object.entries(activeGraph.nodes).forEach(([key, node]) => {
      elements.push({
        group: 'nodes',
        data: {
          id: node.id,
          label: getNodeLabel(node),
        },
        classes: [node.type === NODE_TYPE.RECIPE ? 'recipe-shape' : 'item-shape', NODE_COLOR_CLASS[node.type]],
      });
    });
    activeGraph.edges.forEach((edge) => {
      elements.push({
        group: 'edges',
        data: {
          source: edge.from,
          target: edge.to,
          label: getEdgeLabel(edge),
        },
        classes: edge.from === edge.to ? ['loop'] : undefined,
      });
    });
    
    return { key, elements };
  }, [activeGraph]);

  return (
    <div style={{ height: '900px', display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center', border: '1px solid black' }}>
      {
        graphProps != null
        ? (
            <GraphVisualizer
              key={graphProps.key}
              elements={graphProps.elements}
              layout={layout}
              stylesheet={stylesheet}
              boxSelectionEnabled={false}
              autounselectify={true}
              wheelSensitivity={0.1}
              maxZoom={3.0}
              minZoom={0.1}
              style={{ height: '100%', width: '100%', overflow: 'hidden' }}
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

export default ProductionGraphTab;
