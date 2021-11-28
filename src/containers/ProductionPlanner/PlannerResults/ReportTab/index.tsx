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
            <H3 order={3}>Points Produced</H3>
            <Text>{formatFloat(report!.pointsProduced)} per min</Text>
            <SDivider />
          </List.Item>
          <List.Item>
            <H3 order={3}>Estimated Power {report!.powerUsageEstimate < 0 ? 'Production' : 'Usage'}</H3>
            <Text>{formatFloat(Math.abs(report!.powerUsageEstimate))} MW</Text>
            <SDivider />
          </List.Item>
          <List.Item>
            <H3 order={3}>Resource Usage Score</H3>
            <Text>{formatFloat(report!.resourceEfficiencyScore)}</Text>
            <SDivider />
          </List.Item>
          <List.Item>
            <H3 order={3}>Total Build Area</H3>
            <Text>{formatFloat(report!.totalBuildArea)} m²</Text>
            <SDivider />
          </List.Item>
          <List.Item>
            <H3 order={3}>Estimated Minimal Foundations</H3>
            <Text>{formatFloat(report!.estimatedFoundations)} foundations ({formatFloat(report!.estimatedFoundations * 8)} Concrete)</Text>
            <SDivider />
          </List.Item>
        </List>
        <Title order={2} style={{ marginTop: '30px' }}>Buildings</Title>
        <SDivider />
        <List listStyleType='none'>
          {renderBuildingsUsed()}
          <List.Item>
            <H3 order={3}>Total</H3>
            <List withPadding listStyleType='square'>
              {
                Object.entries(report!.totalMaterialCost)
                  .sort((a, b) => {
                    if (a[1] > b[1]) return -1;
                    if (a[1] < b[1]) return 1;
                    return 0;
                  })
                  .map(([itemKey, count]) => (
                    <List.Item key={itemKey}>
                      <b>{items[itemKey].name}</b> <Count>x{formatFloat(count)}</Count>
                    </List.Item>
                  ))
              }
            </List>
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
        <H3 order={3}>
          {buildings[buildingKey].name} <Count>x{formatFloat(usageInfo.count)}</Count>
        </H3>
        <List withPadding listStyleType='square' style={{ marginBottom: '10px' }}>
          {
            Object.entries(usageInfo.materialCost)
              .sort((a, b) => {
                if (a[1] > b[1]) return -1;
                if (a[1] < b[1]) return 1;
                return 0;
              })
              .map(([itemKey, count]) => (
                <List.Item key={itemKey}>
                  <b>{items[itemKey].name}</b>  <Count>x{formatFloat(count)}</Count>
                </List.Item>
              ))
          }
        </List>
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
  padding-bottom: 30px;
`;

const SDivider = styled(Divider)`
  margin: 10px 0px;
`;

const H3 = styled(Title)`
  font-size: 18px;
`;

const Count = styled.span`
  font-size: 14px;
  margin-left: 3px;
`;
