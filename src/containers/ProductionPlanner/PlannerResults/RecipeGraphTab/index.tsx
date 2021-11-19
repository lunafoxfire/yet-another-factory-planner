import React, { useMemo, useState } from 'react';
import { nanoid } from 'nanoid';
import Cytoscape, { Stylesheet } from 'cytoscape';
import klay from 'cytoscape-klay';
import dagre from 'cytoscape-dagre';
import GraphVisualizer from 'react-cytoscapejs';
import { Checkbox } from 'semantic-ui-react';
import { RecipeGraph, ItemNode, RecipeNode, NODE_TYPE } from '../../../../utilities/production-solver';
import { items, recipes } from '../../../../data';

Cytoscape.use(klay);
Cytoscape.use(dagre);

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

// const layout = {
//   name: 'dagre',
//   padding: 50,
//   rankDir: 'LR',
//   ranker: 'tight-tree',
//   nodeSep: 20,
//   edgeSep: 1,
//   rankSep: 30,
// };

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
      'height': 'label',
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
      'label': 'data(label)',
      'width': 2,
      'curve-style': 'straight',
      'target-arrow-shape': 'triangle-backcurve',
      'arrow-scale': 1.5,
      'overlay-padding': 0,
      'overlay-opacity': 0,
    },
  },
  {
    selector: 'node.item',
    style: {
      'shape': 'ellipse',
    },
  },
  {
    selector: 'node.recipe',
    style: {
      'shape': 'round-rectangle',
    },
  },
];

interface Props {
  activeGraph: RecipeGraph | null,
  errorMessage: string,
}

const RecipeGraphTab = (props: Props) => {
  const { activeGraph, errorMessage } = props;
  const [fullRecipeGraph, setFullRecipeGraph] = useState(true);

  const graphProps = useMemo<any>(() => {
    if (activeGraph == null) {
      return null;
    }

    const key = nanoid();
    const itemDependencies: any[] = [];
    const recipeRelations: any[] = [];

    // ==== ITEM DEPENDENCIES ==== //
    Object.entries(activeGraph.itemNodes).forEach(([key, node]) => {
      itemDependencies.push({
        group: 'nodes',
        data: {
          id: node.id,
          label: items[key].name,
        },
        classes: ['item'],
      });
    });
    activeGraph.itemDependencyEdges.forEach((edge) => {
      itemDependencies.push({
        group: 'edges',
        data: {
          source: edge.from,
          target: edge.to,
        },
      });
    });

    // ==== RECIPE RELATIONS ==== //
    Object.entries(activeGraph.itemNodes).forEach(([key, node]) => {
      recipeRelations.push({
        group: 'nodes',
        data: {
          id: node.id,
          label: items[key].name,
        },
        classes: ['item'],
      });
    });
    Object.entries(activeGraph.recipeNodes).forEach(([key, node]) => {
      recipeRelations.push({
        group: 'nodes',
        data: {
          id: node.id,
          label: recipes[key].name,
        },
        classes: ['recipe'],
      });
    });
    activeGraph.recipeRelationEdges.forEach((edge) => {
      recipeRelations.push({
        group: 'edges',
        data: {
          source: edge.from,
          target: edge.to,
        },
      });
    });

    return { key, itemDependencies, recipeRelations };
  }, [activeGraph]);

  return (
    <div>
      <Checkbox
        label='Show full recipe graph'
        toggle
        checked={fullRecipeGraph}
        onChange={(e, { checked }) => { setFullRecipeGraph(!!checked); }}
        style={{ marginBottom: '10px' }}
      />
      <div style={{ height: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid black' }}>
        {
          graphProps != null
            ? (
              fullRecipeGraph
                ? (
                  <GraphVisualizer
                    key={`${graphProps.key}-recipeRelations`}
                    elements={graphProps.recipeRelations}
                    layout={layout}
                    stylesheet={stylesheet}
                    boxSelectionEnabled={false}
                    autounselectify={true}
                    wheelSensitivity={0.2}
                    style={{ height: '100%', width: '100%', overflow: 'hidden' }}
                  />
                )
                : (
                  <GraphVisualizer
                    key={`${graphProps.key}-itemDependencies`}
                    elements={graphProps.itemDependencies}
                    layout={layout}
                    stylesheet={stylesheet}
                    boxSelectionEnabled={false}
                    autounselectify={true}
                    wheelSensitivity={0.2}
                    style={{ height: '100%', width: '100%', overflow: 'hidden' }}
                  />
                )
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
    </div>
  );
};

export default RecipeGraphTab;
