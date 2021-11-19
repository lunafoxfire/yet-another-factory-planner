import React, { useMemo, useState } from 'react';
import GraphVis from '../../../../components/GraphVis';
import { Checkbox } from 'semantic-ui-react';
import { RecipeGraph, ItemNode, RecipeNode, NODE_TYPE } from '../../../../utilities/production-solver';
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

const RecipeGraphTab = (props: Props) => {
  const { activeGraph, errorMessage } = props;
  const [fullRecipeGraph, setFullRecipeGraph] = useState(false);

  const graphData = useMemo<any>(() => {
    if (activeGraph == null) {
      return null;
    }

    const itemDependencies: any = {}
    const recipeRelations: any = {}

    itemDependencies.nodes = Object.entries(activeGraph.itemNodes).map(([key, node]) => ({
      id: node.id,
      label: items[key].name,
      shape: 'ellipse',
      heightConstraint: 30,
      widthConstraint: 120,
    }));
    itemDependencies.edges = activeGraph.itemDependencyEdges;

    recipeRelations.nodes = Object.entries({ ...activeGraph.itemNodes, ...activeGraph.recipeNodes }).map(([key, node]) => ({
      id: node.id,
      label: (node.type === NODE_TYPE.RECIPE) ? recipes[key].name : items[key].name,
      shape: (node.type === NODE_TYPE.RECIPE) ? 'box' : 'ellipse',
      heightConstraint: (node.type === NODE_TYPE.RECIPE) ? 50 : 30,
      widthConstraint: (node.type === NODE_TYPE.RECIPE) ? 150 : 120,
    }));
    recipeRelations.edges = activeGraph.recipeRelationEdges;

    return { itemDependencies, recipeRelations };
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
          graphData != null
            ? (
              fullRecipeGraph
                ? (
                  <GraphVis
                    key="recipeRelations"
                    graph={graphData.recipeRelations}
                    options={graphOptions}
                    style={{ height: '100%', width: '100%' }}
                  />
                )
                : (
                  <GraphVis
                    key="itemDependencies"
                    graph={graphData.itemDependencies}
                    options={graphOptions}
                    style={{ height: '100%', width: '100%' }}
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
