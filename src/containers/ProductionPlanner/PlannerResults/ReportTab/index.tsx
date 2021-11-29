import React from 'react';
import styled from 'styled-components';
import { Title, List, Divider, Text, Container, Group } from '@mantine/core';
import { buildings, items } from '../../../../data';
import { Report } from '../../../../utilities/production-solver';
import { AlertCircle } from 'react-feather';

function formatFloat(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

interface Props {
  report: Report | null,
}

const ReportTab = (props: Props) => {
  const { report } = props;

  // TODO: Use stylesheets ya dingus
  function renderReport() {
    return (
      <>
        <Title order={2}>Statistics</Title>
        <SDivider />
        <List listStyleType='none'>
          <List.Item>
            <SmallerTitle order={3}>Points Produced</SmallerTitle>
            <Text>{formatFloat(report!.pointsProduced)} per min</Text>
            <SDivider />
          </List.Item>
          <List.Item>
            <SmallerTitle order={3}>Estimated Power {report!.powerUsageEstimate < 0 ? 'Production' : 'Usage'}</SmallerTitle>
            <Text>{formatFloat(Math.abs(report!.powerUsageEstimate))} MW</Text>
            <SDivider />
          </List.Item>
          <List.Item>
            <SmallerTitle order={3}>Resource Usage Score</SmallerTitle>
            <Text>{formatFloat(report!.resourceEfficiencyScore)}</Text>
            <SDivider />
          </List.Item>
          <List.Item>
            <SmallerTitle order={3}>Total Build Area</SmallerTitle>
            <Text>{formatFloat(report!.totalBuildArea)} m²</Text>
            <SDivider />
          </List.Item>
          <List.Item>
            <SmallerTitle order={3}>Estimated Minimal Foundations</SmallerTitle>
            <Text>{formatFloat(report!.estimatedFoundations)} foundations ({formatFloat(report!.estimatedFoundations * 8)} Concrete)</Text>
            <SDivider />
          </List.Item>
        </List>
        <Title order={2} style={{ marginTop: '30px' }}>Buildings</Title>
        <SDivider />
        <List listStyleType='none'>
          {renderBuildingsUsed()}
          <List.Item>
            <Title order={3} style={{ marginBottom: '8px' }}>Total</Title>
            <ListWithLine withPadding listStyleType='none'>
              {
                Object.entries(report!.totalMaterialCost)
                  .sort((a, b) => {
                    if (a[1] > b[1]) return -1;
                    if (a[1] < b[1]) return 1;
                    return 0;
                  })
                  .map(([itemKey, count]) => (
                    <List.Item key={itemKey}>
                      <ItemLabel>{items[itemKey].name}</ItemLabel> <Count>x{formatFloat(count)}</Count>
                    </List.Item>
                  ))
              }
            </ListWithLine>
          </List.Item>
        </List>
      </>
    );
  }

  function renderBuildingsUsed() {
    return Object.entries(report!.buildingsUsed)
      .sort((a, b) => {
        if (a[1].count > b[1].count) return -1;
        if (a[1].count < b[1].count) return 1;
        return 0;
      })
      .map(([buildingKey, usageInfo]) => (
      <List.Item key={buildingKey} style={{ paddingBottom: '10px' }}>
        <Title order={3} style={{ marginBottom: '8px' }}>
          {buildings[buildingKey].name} <Count>x{formatFloat(usageInfo.count)}</Count>
        </Title>
        <ListWithLine withPadding listStyleType='none' style={{ marginBottom: '10px' }}>
          {
            Object.entries(usageInfo.materialCost)
              .sort((a, b) => {
                if (a[1] > b[1]) return -1;
                if (a[1] < b[1]) return 1;
                return 0;
              })
              .map(([itemKey, count]) => (
                <List.Item key={itemKey}>
                  <ItemLabel>{items[itemKey].name}</ItemLabel>  <Count>x{formatFloat(count)}</Count>
                </List.Item>
              ))
          }
        </ListWithLine>
      </List.Item>
    ))
  }
  
  return (
    <ReportContainer fluid>
      {
      !report
        ? (
          <Group style={{ height: '150px', justifyContent: 'flex-start' }}>
            <AlertCircle color="#eee" size={50} />
            <Text style={{ fontSize: '32px' }}>
              No data available
            </Text>
          </Group>
        )
        : renderReport()
      }
    </ReportContainer>
  );
};

export default ReportTab;

const ReportContainer = styled(Container)`
  padding: 10px;
  padding-bottom: 15px;
`;

const SDivider = styled(Divider)`
  margin: 10px 0px;
`;

const SmallerTitle = styled(Title)`
  font-size: 19px;
`;

const ItemLabel = styled.span`
  font-size: 17px;
  font-weight: bold;
`;

const Count = styled.span`
  font-size: 15px;
  margin-left: 3px;
`;

const ListWithLine = styled(List)`
  position: relative;
  &::after {
    content: '';
    position: absolute;
    top: 0px;
    bottom: 0px;
    left: 12px;
    width: 3px;
    background: ${({ theme }) => theme.colors.background[3]};
  }
`;
