import React, { forwardRef } from 'react';
import styled from 'styled-components';
import { Paper, Title, Text, Divider, List, useMantineTheme } from '@mantine/core';
import { buildings, items, recipes } from '../../data';
import { truncateFloat } from '../../utilities/number';
import { NODE_TYPE } from '../../utilities/production-solver';
import { NodeData } from '../../containers/ProductionPlanner/PlannerResults/ProductionGraphTab';
import Portal from '../Portal';

interface Props {
  currentNode: any | null,
}

const GraphPopup = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { currentNode } = props;
  const theme = useMantineTheme();

  function renderInner() {
    const data = currentNode.data() as NodeData;
    if (data.type === NODE_TYPE.RECIPE) {
      return renderRecipeInfo(data);
    }
    if (data.type === NODE_TYPE.RESOURCE) {
      if (data.key === 'Desc_Water_C') {
        return renderWaterExtractorInfo(data);
      } else if (data.key === 'Desc_LiquidOil_C') {
        return renderOilExtractorInfo(data);
      } else if (data.key === 'Desc_NitrogenGas_C') {
        return null;
      }
      return renderMinerInfo(data);
    }
    return null;
  }

  function renderRecipeInfo(data: NodeData) {
    const recipeInfo = recipes[data.key];
    const primaryProduct = recipeInfo.products[0];

    const totalBuildings = Math.ceil(data.multiplier);
    const clockPercentage = data.multiplier / totalBuildings * 100;
    const itemsPerMinPerBuilding = primaryProduct.perMinute * data.multiplier / totalBuildings;

    return (
      <Popup>
        <PopupTitle order={3}>Recipe: [{recipeInfo.name}]</PopupTitle>
        <PopupDivider />
        <PopupText>
          <b>Buildings:</b> {totalBuildings}x {buildings[recipeInfo.producedIn].name}
        </PopupText>
        <PopupText>
          <b>Clock speed:</b> {truncateFloat(clockPercentage)}% each
        </PopupText>
        <PopupText>
          <b>Items per min:</b> {truncateFloat(itemsPerMinPerBuilding)} each
        </PopupText>
        <PopupDivider />
        <PopupText><b>Inputs:</b></PopupText>
        <List listStyleType='none' withPadding>
          {
            recipeInfo.ingredients.map((ingredient) => (
              <List.Item>
                <PopupText>{items[ingredient.itemClass].name}: {truncateFloat(ingredient.perMinute * data.multiplier)} / min</PopupText>
              </List.Item>
            ))
          }
        </List>
        <PopupText><b>Outputs:</b></PopupText>
        <List listStyleType='none' withPadding>
          {
            recipeInfo.products.map((product) => (
              <List.Item>
                <PopupText>{items[product.itemClass].name}: {truncateFloat(product.perMinute * data.multiplier)} / min</PopupText>
              </List.Item>
            ))
          }
        </List>
      </Popup>
    );
  }

  function renderMinerInfo(data: NodeData) {
    const itemInfo = items[data.key];
    const baseNumMiners = data.multiplier / 60;
    return (
      <Popup>
        <PopupTitle order={3}>Resource: [{itemInfo.name}]</PopupTitle>
        <PopupDivider />
        <PopupText><b>Miners required (assuming normal nodes):</b></PopupText>
        <Table>
          <thead>
            <tr>
              <th></th>
              <th>100%</th>
              <th>150%</th>
              <th>200%</th>
              <th>250%</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Mk. 1</th>
              <td>{truncateFloat(baseNumMiners, 2)}x</td>
              <td>{truncateFloat(baseNumMiners / 1.5, 2)}x</td>
              <td>{truncateFloat(baseNumMiners / 2.0, 2)}x</td>
              <td>{truncateFloat(baseNumMiners / 2.5, 2)}x</td>
            </tr>
            <tr>
              <th>Mk. 2</th>
              <td>{truncateFloat(0.5 * baseNumMiners, 2)}x</td>
              <td>{truncateFloat(0.5 * baseNumMiners / 1.5, 2)}x</td>
              <td>{truncateFloat(0.5 * baseNumMiners / 2.0, 2)}x</td>
              <td>{truncateFloat(0.5 * baseNumMiners / 2.5, 2)}x</td>
            </tr>
            <tr>
              <th>Mk. 3</th>
              <td>{truncateFloat(0.25 * baseNumMiners, 2)}x</td>
              <td>{truncateFloat(0.25 * baseNumMiners / 1.5, 2)}x</td>
              <td>{truncateFloat(0.25 * baseNumMiners / 2.0, 2)}x</td>
              <td>{truncateFloat(0.25 * baseNumMiners / 2.5, 2)}x</td>
            </tr>
          </tbody>
        </Table>
      </Popup>
    );
  }

  function renderWaterExtractorInfo(data: NodeData) {
    const itemInfo = items[data.key];
    return (
      <Popup>
        <PopupTitle order={3}>Resource: [{itemInfo.name}]</PopupTitle>
        <PopupDivider />
        <PopupText><b>Extractors required:</b> {truncateFloat(data.multiplier / 120, 2)}x Water Extractor</PopupText>
      </Popup>
    );
  }

  function renderOilExtractorInfo(data: NodeData) {
    const itemInfo = items[data.key];
    const baseNumExtractors = data.multiplier / 120;
    return (
      <Popup>
        <PopupTitle order={3}>Resource: [{itemInfo.name}]</PopupTitle>
        <PopupDivider />
        <PopupText><b>Extractors required:</b></PopupText>
        <Table>
          <thead>
            <tr>
              <th></th>
              <th>100%</th>
              <th>150%</th>
              <th>200%</th>
              <th>250%</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Impure</th>
              <td>{truncateFloat(2.0 * baseNumExtractors, 2)}x</td>
              <td>{truncateFloat(2.0 * baseNumExtractors / 1.5, 2)}x</td>
              <td>{truncateFloat(2.0 * baseNumExtractors / 2.0, 2)}x</td>
              <td>{truncateFloat(2.0 * baseNumExtractors / 2.5, 2)}x</td>
            </tr>
            <tr>
              <th>Normal</th>
              <td>{truncateFloat(baseNumExtractors, 2)}x</td>
              <td>{truncateFloat(baseNumExtractors / 1.5, 2)}x</td>
              <td>{truncateFloat(baseNumExtractors / 2.0, 2)}x</td>
              <td>{truncateFloat(baseNumExtractors / 2.5, 2)}x</td>
            </tr>
            <tr>
              <th>Pure</th>
              <td>{truncateFloat(0.5 * baseNumExtractors, 2)}x</td>
              <td>{truncateFloat(0.5 * baseNumExtractors / 1.5, 2)}x</td>
              <td>{truncateFloat(0.5 * baseNumExtractors / 2.0, 2)}x</td>
              <td>{truncateFloat(0.5 * baseNumExtractors / 2.5, 2)}x</td>
            </tr>
          </tbody>
        </Table>
      </Popup>
    );
  }

  return (
    <Portal ref={ref} createRoot style={{ zIndex: theme.other.tooltipZIndex, pointerEvents: 'none' }}>
      {currentNode ? renderInner() : null}
    </Portal>
  );
});

export default GraphPopup;

const Popup = styled(Paper)`
  position: relative;
  bottom: 50px;
  background: ${({ theme }) => theme.colors.background[2]};
  border: 1px solid #aaa;
  min-width: 300px;

  ::before {
    content: '';
    position: absolute;
    left: calc(50% - 10px);
    bottom: -12px;
    width: 20px;
    height: 20px;
    background: ${({ theme }) => theme.colors.background[2]};
    border-bottom: 1px solid #aaa;
    border-right: 1px solid #aaa;

    transform: rotate(45deg);
    z-index: 1;
  }
`;

const PopupTitle = styled(Title)`
  font-size: 16px;
`;

const PopupText = styled(Text)`
  font-size: 15px;
`;

const PopupDivider = styled(Divider)`
  margin-top: 10px;
  margin-bottom: 10px;
  border-top-color: ${({ theme }) => theme.colors.background[4]};
`;

const Table = styled.table`
  color: ${({ theme }) => theme.white};
  border-collapse: collapse;

  & th, td {
    padding: 10px;
    text-align: left;
    font-size: 15px;
  }

  & td {
    border: 1px solid ${({ theme }) => theme.colors.background[4]};
  }

  & tr:nth-child(2n) td {
    background: ${({ theme }) => theme.colors.background[3]};
  }
`;
