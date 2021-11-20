import React, { useMemo } from 'react';
import { nanoid } from 'nanoid';
import Cytoscape, { Stylesheet } from 'cytoscape';
import klay from 'cytoscape-klay';
import GraphVisualizer from 'react-cytoscapejs';
import { RecipeGraph, NODE_TYPE } from '../../../../utilities/production-solver';
import { items, recipes } from '../../../../data';

Cytoscape.use(klay);

const layout = {
  name: 'klay',
  padding: 50,
  klay: {
    direction: 'RIGHT',
    edgeRouting: 'POLYLINE',
    nodePlacement: 'LINEAR_SEGMENTS',
    spacing: 20,
    thoroughness: 3,
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
      'height': 'auto',
      'width': '140px',
      'text-max-width': '160px',
      'padding-top': '20px',
      'overlay-padding': 0,
      'overlay-opacity': 0,
      'text-wrap': 'wrap',
      'font-size': '16px',
    },
  },
  {
    selector: 'edge',
    style: {
      // 'label': 'data(label)',
      'width': 1,
      'curve-style': 'straight',
      'target-arrow-shape': 'triangle-backcurve',
      'arrow-scale': 1.2,
      'overlay-padding': 0,
      'overlay-opacity': 0,
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

const NODE_CLASS = {
  [NODE_TYPE.FINAL_PRODUCT]: 'final-product',
  [NODE_TYPE.SIDE_PRODUCT]: 'side-product',
  [NODE_TYPE.INTERMEDIATE_ITEM]: 'item',
  [NODE_TYPE.INPUT_ITEM]: 'input',
  [NODE_TYPE.RESOURCE]: 'resource',
  [NODE_TYPE.RECIPE]: 'recipe',
};

interface Props {
  activeGraph: RecipeGraph | null,
  errorMessage: string,
}

const RecipeGraphTab = (props: Props) => {
  const { activeGraph, errorMessage } = props;

  const graphProps = useMemo<any>(() => {
    if (activeGraph == null) {
      return null;
    }

    const key = nanoid();
    const elements: any[] = [];

    Object.entries(activeGraph.itemNodes).forEach(([key, node]) => {
      elements.push({
        group: 'nodes',
        data: {
          id: node.id,
          label: items[key].name,
        },
        classes: ['item-shape', NODE_CLASS[node.type]],
      });
    });
    Object.entries(activeGraph.recipeNodes).forEach(([key, node]) => {
      elements.push({
        group: 'nodes',
        data: {
          id: node.id,
          label: recipes[key].name,
        },
        classes: ['recipe-shape', NODE_CLASS[node.type]],
      });
    });
    activeGraph.edges.forEach((edge) => {
      elements.push({
        group: 'edges',
        data: {
          source: edge.from,
          target: edge.to,
        },
      });
    });

    return { key, elements };
  }, [activeGraph]);

  return (
    <div style={{ height: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid black' }}>
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
            wheelSensitivity={0.2}
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

export default RecipeGraphTab;
