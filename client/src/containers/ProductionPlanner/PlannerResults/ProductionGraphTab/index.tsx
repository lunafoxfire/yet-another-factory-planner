import React, { useMemo, useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { nanoid } from 'nanoid';
import Cytoscape, { Stylesheet } from 'cytoscape';
import klay from 'cytoscape-klay';
import GraphVisualizer from 'react-cytoscapejs';
import popper from 'cytoscape-popper';
import { Text, Container, Center, Group, Loader } from '@mantine/core';
import { AlertCircle } from 'react-feather';
import { GraphNode, GraphEdge, NODE_TYPE } from '../../../../utilities/production-solver';
import { graphColors } from '../../../../theme';
import GraphTooltip from '../../../../components/GraphTooltip';
import { truncateFloat } from '../../../../utilities/number';
import { useProductionContext } from '../../../../contexts/production';
import { GameData } from '../../../../contexts/gameData/types';
import { NodeInfo } from '../../../../contexts/production/types';

Cytoscape.use(popper);
Cytoscape.use(klay);

if (process.env.NODE_ENV !== 'development') {
  Cytoscape.warnings(false);
}

const stylesheet: Stylesheet[] = [
  {
    // ====== BASE ====== //
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
      'width': '150px',
      'text-max-width': '157px',
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
      'color': graphColors.edge.label,
      'line-color': graphColors.edge.line,
      'target-arrow-color': graphColors.edge.line,
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


  // ====== NODES ====== //
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
    selector: 'node.selected, node.grabbed',
    style: {
      'z-index': 100,
      'height': '45px',
      'width': '195px',
      'text-max-width': '192px',
      'font-size': '16px',
      'font-weight': 'bold',
      'border-width': 2,
    },
  },
  {
    selector: 'node.item-shape.selected, node.item-shape.grabbed',
    style: {
      'height': '55px',
      'width': '170px',
    },
  },
  {
    selector: 'node.resource',
    style: { 'background-color': graphColors.resource.base },
  },
  {
    selector: 'node.resource.selected, node.resource.grabbed',
    style: { 'background-color': graphColors.resource.selected },
  },
  {
    selector: 'node.input',
    style: { 'background-color': graphColors.input.base },
  },
  {
    selector: 'node.input.selected, node.input.grabbed',
    style: { 'background-color': graphColors.input.selected },
  },
  {
    selector: 'node.hand-gathered',
    style: { 'background-color': graphColors.handGathered.base },
  },
  {
    selector: 'node.hand-gathered.selected, node.hand-gathered.grabbed',
    style: { 'background-color': graphColors.handGathered.selected },
  },
  {
    selector: 'node.side-product',
    style: { 'background-color': graphColors.sideProduct.base },
  },
  {
    selector: 'node.side-product.selected, node.side-product.grabbed',
    style: { 'background-color': graphColors.sideProduct.selected },
  },
  {
    selector: 'node.final-product',
    style: { 'background-color': graphColors.finalProduct.base },
  },
  {
    selector: 'node.final-product.selected, node.final-product.grabbed',
    style: { 'background-color': graphColors.finalProduct.selected },
  },
  {
    selector: 'node.recipe',
    style: { 'background-color': graphColors.recipe.base },
  },
  {
    selector: 'node.recipe.selected, node.recipe.grabbed',
    style: { 'background-color': graphColors.recipe.selected },
  },
  {
    selector: 'node.nuclear',
    style: { 'background-color': graphColors.nuclear.base },
  },
  {
    selector: 'node.nuclear.selected, node.nuclear.grabbed',
    style: { 'background-color': graphColors.nuclear.selected },
  },

  
  // ====== EDGES ====== //
  {
    selector: 'edge.selected, edge.grabbed',
    style: {
      'width': 4,
      'font-size': '14px',
      'font-weight': 'bold',
      'text-outline-width': 2,
      'z-index': 100,
    },
  },
  {
    selector: 'edge.selected-incoming, edge.grabbed-incoming',
    style: {
      'color': graphColors.incoming.label,
      'line-color': graphColors.incoming.line,
      'target-arrow-color': graphColors.incoming.line,
    },
  },
  {
    selector: 'edge.selected-outgoing, edge.grabbed-outgoing',
    style: {
      'color': graphColors.outgoing.label,
      'line-color': graphColors.outgoing.line,
      'target-arrow-color': graphColors.outgoing.line,
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

function getNodeLabel(node: GraphNode, gameData: GameData) {
  let label = '';
  let amountText = '';
  if (node.type === NODE_TYPE.RECIPE) {
    const recipe = gameData.recipes[node.key];
    label = recipe.name;
    amountText = `${truncateFloat(node.multiplier)}x ${gameData.buildings[recipe.producedIn].name}`;
  } else {
    const item = gameData.items[node.key];
    if (node.type === NODE_TYPE.SIDE_PRODUCT) {
      label = `Side Product:\n${item.name}`;
    } else {
      label = item.name;
    }
    amountText = `${truncateFloat(node.multiplier)} / min`;
  }
  return `${label}\n${amountText}`;
}

function getNodeClasses(node: GraphNode, gameData: GameData) {
  const classes = [];
  if (node.type === NODE_TYPE.RECIPE) {
    classes.push('recipe-shape');
    const recipe = gameData.recipes[node.key];
    if (recipe.producedIn === 'Desc_GeneratorNuclear_C') {
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

function getEdgeLabel(edge: GraphEdge, gameData: GameData) {
  const item = gameData.items[edge.key];
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

interface PopperRef {
  popper: any,
  nodeId: string,
}

export interface NodeData extends GraphNode {
  label: string,
}

export interface EdgeData extends GraphEdge {
  source: string,
  target: string,
  label: string,
}

const ProductionGraphTab = () => {
  const [doFirstRender, setDoFirstRender] = useState(false);
  const graphRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Cytoscape.Core | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const popperRef = useRef<PopperRef | null>(null);
  const [popupNode, setPopupNode] = useState<any | null>(null);
  const ctx = useProductionContext();
  const resultsGraph = ctx.solverResults?.productionGraph || null;
  const graphError = ctx.solverResults?.error || null;
  const isLoading = ctx.calculating;
  const nodesPositions = ctx.state.nodesPositions;
  let currentNodePosition: NodeInfo | undefined;

  const layout = {
    name: 'klay',
    padding: 40,
    transform: modifyNodePositions,
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
  
function modifyNodePositions(node: any, pos: any){
  let savedNode = nodesPositions?.find(n => n.key === node.data('key'));
  if (savedNode){
    return {x: savedNode.x, y:savedNode.y};
  }
  return pos;
}

  function setGraphRef(instance: HTMLDivElement | null) {
    if (instance && !graphRef.current) {
      graphRef.current = instance;
      _resizeListener(graphRef);
      setDoFirstRender(true);
    }
  }

  function setCyRef(instance: Cytoscape.Core | null) {
    if (instance && cyRef.current !== instance) {
      cyRef.current = instance;
      setCyListeners(cyRef.current);
    }
  }

  function setCyListeners(cy: Cytoscape.Core) {
    cy.on('select', 'node', function (e) {
      e.target.addClass('selected');
      e.target.outgoers('edge').addClass('selected').addClass('selected-outgoing');
      e.target.incomers('edge').addClass('selected').addClass('selected-incoming');
    });

    cy.on('unselect', 'node', function (e) {
      e.target.removeClass('selected');
      e.target.outgoers('edge').removeClass('selected').removeClass('selected-outgoing');
      e.target.incomers('edge').removeClass('selected').removeClass('selected-incoming');
    });

    cy.on('grab', 'node', function (e) {
      e.target.addClass('grabbed');
      e.target.outgoers('edge').addClass('grabbed').addClass('grabbed-outgoing');
      e.target.incomers('edge').addClass('grabbed').addClass('grabbed-incoming');
      registerNodePosition(e.target.data('key'), e.target.position('x'), e.target.position('y'));
    });

    cy.on('free', 'node', function (e) {
      e.target.removeClass('grabbed');
      e.target.outgoers('edge').removeClass('grabbed').removeClass('grabbed-outgoing');
      e.target.incomers('edge').removeClass('grabbed').removeClass('grabbed-incoming');
      if (currentNodePosition && !areNodesSame(currentNodePosition, { key: e.target.data('key'), x: e.target.position('x'), y: e.target.position('y') })){
        updateStateNodePosition(e.target.data('key'), e.target.position('x'), e.target.position('y'));
        ctx.dispatch({ type: 'UPDATE_NODES_POSTIONS', nodesPositions: nodesPositions });
        currentNodePosition = undefined;
      }
    });

    cy.on('mouseover', 'node', function (e) {
      const nodeId = e.target.id() as string;
      if (popperRef.current?.nodeId === nodeId) return;
      deactivatePopper(cy);
      activatePopper(cy, e.target);
    });

    cy.on('mouseout', 'node', function (e) {
      const nodeId = e.target.id() as string;
      if (popperRef.current?.nodeId === nodeId) {
        deactivatePopper(cy);
      }
    });
  }

  function registerNodePosition(key: string, x: number, y: number){
      currentNodePosition = { key: key, x: x, y: y };
  }

  function areNodesSame(node1: NodeInfo, node2: NodeInfo): boolean {
     console.log(node1 == node2);
     console.log(node1 === node2);
    return false;
  }
  function updateStateNodePosition(key: string, x: number, y: number){
    let existingNode = nodesPositions?.find(node => node.key === key);
    if (existingNode){
      if (existingNode.x !== x || existingNode.y !== y){
        existingNode.x = x;
        existingNode.y = y;
      }
    }
    else{
      nodesPositions.push({key: key, x: x, y: y });
    }
  }

  function activatePopper(cy: Cytoscape.Core, node: any) {
    const popper = node.popper({
      content: () => popupRef.current || undefined,
      popper: {
        placement: 'top',
      }
    });
    popperRef.current = { popper, nodeId: node.id() };
    node.on('position', () => { popper.update(); });
    cy.on('pan zoom resize', () => { popper.update(); });
    setPopupNode(node);
  }

  function deactivatePopper(cy: Cytoscape.Core) {
    if (!popperRef.current) return;
    const node = cy.getElementById(popperRef.current.nodeId);
    node.off('position');
    cy.off('pan zoom resize');
    popperRef.current.popper.destroy();
    popperRef.current = null;
    setPopupNode(null);
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
    if (resultsGraph == null) {
      return null;
    }

    const key = nanoid();
    const elements: any[] = [];

    Object.entries(resultsGraph.nodes).forEach(([key, node]) => {
      elements.push({
        group: 'nodes',
        data: {
          ...node,
          label: getNodeLabel(node, ctx.gameData),
        },
        classes: getNodeClasses(node, ctx.gameData),
      });
    });
    resultsGraph.edges.forEach((edge) => {
      elements.push({
        group: 'edges',
        data: {
          ...edge,
          source: edge.from,
          target: edge.to,
          label: getEdgeLabel(edge, ctx.gameData),
        },
        classes: edge.from === edge.to ? ['loop'] : undefined,
      });
    });
    
    return { key, elements };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultsGraph]);

  return (
    <>
      <GraphContainer fluid ref={setGraphRef}>
        {
          isLoading && (
            <Center style={{ position: 'absolute', height: '100%', width: '100%' }}>
              <Loader size={50} />
            </Center>
          )
        }
        {
          doFirstRender && !isLoading && (
            graphProps != null
            ? (
                <GraphVisualizer
                  key={graphProps.key}
                  elements={graphProps.elements}
                  layout={layout}
                  stylesheet={stylesheet}
                  boxSelectionEnabled={false}
                  wheelSensitivity={0.13}
                  maxZoom={3.0}
                  minZoom={0.1}
                  style={{ position: 'absolute', height: '100%', width: '100%', overflow: 'hidden' }}
                  cy={setCyRef}
                />
            )
            : (
              <Center style={{ position: 'absolute', height: '100%', width: '100%' }}>
                <Group>
                  <AlertCircle color="#eee" size={85} style={{ position: 'relative', top: '3px' }} />
                  <Group direction='column' style={{ gap: '0px' }}>
                    <Text style={{ fontSize: '28px' }}>
                      Could not build graph
                    </Text>
                      {graphError
                      ? (
                        <Text style={{ maxWidth: '600px', fontSize: '14px' }}>
                            {`ERROR: ${graphError.message}`}<br />
                            {graphError?.helpText || ''}
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
      <GraphTooltip ref={popupRef} currentNode={popupNode} />
    </>
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
