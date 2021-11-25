import React from 'react';
import { Title, List, Divider, Text } from '@mantine/core';
import { buildings, items } from '../../../../data';
import { Report } from '../../../../utilities/production-solver';

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
        <Divider />
        <List listStyleType='none'>
          <List.Item>
            <Title order={3}>Points Produced</Title>
            <Text>{formatFloat(report!.pointsProduced)}</Text>
            <Divider />
          </List.Item>
          <List.Item>
            <Title order={3}>Estimated Power {report!.powerUsageEstimate < 0 ? 'Production' : 'Usage'}</Title>
            <Text>{formatFloat(Math.abs(report!.powerUsageEstimate))} MW</Text>
            <Divider />
          </List.Item>
          <List.Item>
            <Title order={3}>Resource Usage Score</Title>
            <Text>{formatFloat(report!.resourceEfficiencyScore)}</Text>
            <Divider />
          </List.Item>
          <List.Item>
            <Title order={3}>Total Build Area</Title>
            <Text>{formatFloat(report!.totalBuildArea)} m²</Text>
            <Divider />
          </List.Item>
          <List.Item>
            <Title order={3}>Estimated Minimal Foundations</Title>
            <Text>{formatFloat(report!.estimatedFoundations)} foundations ({formatFloat(report!.estimatedFoundations * 8)} Concrete)</Text>
            <Divider />
          </List.Item>
        </List>

        <Title order={2}>Buildings</Title>
        <Divider />
        <List listStyleType='none'>
          {renderBuildingsUsed()}
          <List.Item>
            <Title order={3}>Total</Title>
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
                        <b>{items[itemKey].name}</b> x{formatFloat(count)}
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
    return Object.entries(report!.buildingsUsed).map(([buildingKey, usageInfo]) => (
      <List.Item key={buildingKey} style={{ paddingBottom: '10px' }}>
        <Title order={3}>
          {buildings[buildingKey].name} <span style={{ fontSize: '14px', marginLeft: '3px' }}>x{formatFloat(usageInfo.count)}</span>
        </Title>
        <List withPadding listStyleType='square'>
          {
            Object.entries(usageInfo.materialCost)
              .sort((a, b) => {
                if (a[1] > b[1]) return -1;
                if (a[1] < b[1]) return 1;
                return 0;
              })
              .map(([itemKey, count]) => (
                <List.Item key={itemKey}>
                  <b style={{ marginRight: '3px' }}>{items[itemKey].name}</b> x{formatFloat(count)}
                </List.Item>
              ))
          }
        </List>
      </List.Item>
    ))
  }
  
  return (
    <div style={{ marginTop: '10px' }}>
      {
      !report
        ? (
          <Title>
            No data available
          </Title>
        )
        : renderReport()
      }
    </div>
  );
};

export default ReportTab;
