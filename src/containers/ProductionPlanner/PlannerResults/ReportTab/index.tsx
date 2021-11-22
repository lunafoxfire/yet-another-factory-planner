import React from 'react';
import { Container, Header, Icon, List } from 'semantic-ui-react';
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
        <Header size='huge'>Statistics</Header>
        <List celled size='large' style={{ marginBottom: '30px' }}>
          <List.Item style={{ paddingTop: '5px', paddingBottom: '5px', marginBottom: '10px' }}>
            <List.Content>
              <List.Header style={{ marginBottom: '5px' }}>Points Produced</List.Header>
              {formatFloat(report!.pointsProduced)}
            </List.Content>
          </List.Item>
          <List.Item style={{ paddingTop: '5px', paddingBottom: '5px', marginBottom: '10px' }}>
            <List.Content>
              <List.Header style={{ marginBottom: '5px' }}>Estimated Power {report!.powerUsageEstimate < 0 ? 'Production' : 'Usage'}</List.Header>
              {formatFloat(Math.abs(report!.powerUsageEstimate))} MW
            </List.Content>
          </List.Item>
          <List.Item style={{ paddingTop: '5px', paddingBottom: '5px', marginBottom: '10px' }}>
            <List.Content>
              <List.Header style={{ marginBottom: '5px' }}>Resource Usage Score</List.Header>
              {formatFloat(report!.resourceEfficiencyScore)}
            </List.Content>
          </List.Item>
          <List.Item style={{ paddingTop: '5px', paddingBottom: '5px', marginBottom: '10px' }}>
            <List.Content>
              <List.Header style={{ marginBottom: '5px' }}>Total Build Area</List.Header>
              {formatFloat(report!.totalBuildArea)} m²
            </List.Content>
          </List.Item>
          <List.Item style={{ paddingTop: '5px', paddingBottom: '15px' }}>
            <List.Content>
              <List.Header style={{ marginBottom: '5px' }}>Estimated Minimal Foundations</List.Header>
              {formatFloat(report!.estimatedFoundations)} foundations ({formatFloat(report!.estimatedFoundations * 8)} Concrete)
            </List.Content>
          </List.Item>
        </List>

        <Header size='huge'>Buildings</Header>
        <List celled>
          {renderBuildingsUsed()}
          <List.Item style={{ paddingBottom: '10px' }}>
            <List.Content>
              <Header size='medium'>Total</Header>
              <List.List>
                {
                  Object.entries(report!.totalMaterialCost).map(([itemKey, count]) => (
                    <List.Item key={itemKey}>
                      <Icon name='triangle right' />
                      <List.Content>
                        <b style={{ marginRight: '3px' }}>{items[itemKey].name}</b> x{formatFloat(count)}
                      </List.Content>
                    </List.Item>
                  ))
                }
              </List.List>
            </List.Content>
          </List.Item>
        </List>
      </>
    );
  }

  function renderBuildingsUsed() {
    return Object.entries(report!.buildingsUsed).map(([buildingKey, usageInfo]) => (
      <List.Item key={buildingKey} style={{ paddingBottom: '10px' }}>
        <List.Content>
          <Header size='medium'>{buildings[buildingKey].name} <span style={{ fontSize: '14px', marginLeft: '3px' }}>x{usageInfo.count}</span></Header>
          <List.List>
            {
              Object.entries(usageInfo.materialCost)
                .sort((a, b) => {
                  if (a[1] > b[1]) return -1;
                  if (a[1] < b[1]) return 1;
                  return 0;
                })
                .map(([itemKey, count]) => (
                  <List.Item key={itemKey}>
                    <Icon name='triangle right' />
                    <List.Content>
                      <b style={{ marginRight: '3px' }}>{items[itemKey].name}</b> x{formatFloat(count)}
                    </List.Content>
                  </List.Item>
                ))
            }
          </List.List>
        </List.Content>
      </List.Item>
    ))
  }
  
  return (
    <div style={{ marginTop: '10px' }}>
      {
      !report
        ? (
          <Header>
            No data available
          </Header>
        )
        : renderReport()
      }
    </div>
  );
};

export default ReportTab;
