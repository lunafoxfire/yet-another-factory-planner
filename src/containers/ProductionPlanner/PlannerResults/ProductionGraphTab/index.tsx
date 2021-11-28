import React, { useMemo, useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { nanoid } from 'nanoid';
import Cytoscape, { Stylesheet } from 'cytoscape';
import klay from 'cytoscape-klay';
import GraphVisualizer from 'react-cytoscapejs';
import { Text, Container, Center, Group } from '@mantine/core';
import { AlertCircle } from 'react-feather';
import { ProductionGraph, GraphNode, GraphEdge, NODE_TYPE } from '../../../../utilities/production-solver';
import { items, recipes, buildings } from '../../../../data';

Cytoscape.use(klay);
if (process.env.NODE_ENV !== 'development') {
  Cytoscape.warnings(false);
}

const layout = {
  name: 'klay',
  padding: 40,
  klay: {
    direction: 'RIGHT',
    edgeRouting: 'ORTHOGONAL',
    nodePlacement: 'LINEAR_SEGMENTS',
    edgeSpacingFactor: 0.2,
    inLayerSpacingFactor: 0.7,
    spacing: 90,
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
      'control-point-step-size': 100,
      'target-arrow-shape': 'triangle-backcurve',
      'arrow-scale': 1.2,
      'overlay-padding': 0,
      'overlay-opacity': 0,
      'text-wrap': 'wrap',
      'font-size': '14px',
      'color': '#eee',
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
      'height': '40px',
      'width': '130px',
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
      'background-color': '#f371e2',
    },
  },
  {
    selector: 'node.input',
    style: {
      'background-color': '#e86161',
    },
  },
  {
    selector: 'node.hand-gathered',
    style: {
      'background-color': '#9061e8',
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
    selector: 'node.nuclear',
    style: {
      'background-color': '#f0ed4c',
    },
  },
];

const NODE_COLOR_CLASS = {
  [NODE_TYPE.FINAL_PRODUCT]: 'final-product',
  [NODE_TYPE.SIDE_PRODUCT]: 'side-product',
  [NODE_TYPE.INPUT_ITEM]: 'input',
  [NODE_TYPE.HAND_GATHERED_RESOURCE]: 'hand-gathered',
  [NODE_TYPE.RESOURCE]: 'resource',
  [NODE_TYPE.RECIPE]: 'recipe',
};

function truncateFloat(n: number) {
  return n.toFixed(4).replace(/\.?0+$/, '');
}

function getNodeLabel(node: GraphNode) {
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

function getNodeClasses(node: GraphNode) {
  const classes = [];
  if (node.type === NODE_TYPE.RECIPE) {
    classes.push('recipe-shape');
    const recipe = recipes[node.key];
    if (recipe.producedIn === 'Build_GeneratorNuclear_C') {
      classes.push('nuclear');
    } else {
      classes.push(NODE_COLOR_CLASS[node.type]);
    }
  } else {
    classes.push('item-shape');
    classes.push(NODE_COLOR_CLASS[node.type]);
  }
  return classes;
}

function getEdgeLabel(edge: GraphEdge) {
  const item = items[edge.key];
  const label = item.name;
  const amountText = `${truncateFloat(edge.productionRate)} / min`;
  return `${label}\n${amountText}`;
}

function _resizeListener(graphRef: React.RefObject<HTMLDivElement | null>) {
  if (graphRef?.current) {
    const bounds = graphRef.current.getBoundingClientRect();
    graphRef.current.style.height = `${window.innerHeight - bounds.top - 40}px`;
  }
}

interface Props {
  activeGraph: ProductionGraph | null,
  errorMessage: string,
}

const ProductionGraphTab = (props: Props) => {
  const { activeGraph, errorMessage } = props;
  const graphRef = useRef<HTMLDivElement | null>(null);
  const [doFirstRender, setDoFirstRender] = useState(false);

  function setRef(instance: HTMLDivElement | null) {
    if (instance && !graphRef.current) {
      graphRef.current = instance;
      _resizeListener(graphRef);
      setDoFirstRender(true);
    }
  }

  useEffect(() => {
    function resizeListener() {
      _resizeListener(graphRef);
    }
    window.addEventListener('resize', resizeListener);
    return () => {
      window.removeEventListener('resize', resizeListener);
    }
  }, []);

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
        classes: getNodeClasses(node),
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
    <GraphContainer fluid ref={setRef}>
      {
        doFirstRender && (
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
                style={{ position: 'absolute', height: '100%', width: '100%', overflow: 'hidden' }}
              />
          )
          : (
            <Center style={{ position: 'absolute', height: '100%', width: '100%' }}>
              <Group>
                <AlertCircle color="#eee" size={75} />
                <Group direction='column' style={{ gap: '0px' }}>
                  <Text size='xl'>
                    No graph available
                  </Text>
                  {errorMessage
                    ? (
                      <Text size='sm'>
                        {`ERROR: ${errorMessage}`}
                      </Text>
                    )
                    : null}
                </Group>
              </Group>
            </Center>
          )
        )
      }
    </GraphContainer>
  );
};

export default ProductionGraphTab;

const GraphContainer = styled(Container)`
  position: relative;
  min-height: 600px;
  min-width: 800px;
  border: 1px solid #fff;
  border-top-width: 0px;
  margin: 0px;
  padding: 0px;
`;
