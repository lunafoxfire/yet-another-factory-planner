import React, { useState } from 'react';
import { Container, Menu, Button } from 'semantic-ui-react';
import { ProductionGraphAlgorithm } from '../../../utilities/production-calculator';
import { useProductionContext } from '../../../contexts/production';

const PlannerResults = () => {
  const [activeTab, setActiveTab] = useState('graph');
  const ctx = useProductionContext();

  function handleCalculateFactory() {
    const alg = new ProductionGraphAlgorithm(ctx.state);
    const results = alg.exec();
  }

  function handleSetTab(e: any, data: any) {
    setActiveTab(data.name);
  }

  function renderTab() {
    switch (activeTab) {
      case 'graph':
      case 'buildings':
      default:
        return null;
    }
  }

  return (
    <Container fluid>
      <Menu pointing secondary attached="top">
        <Menu.Item
          name='graph'
          active={activeTab === 'graph'}
          onClick={handleSetTab}
        >
          Production Graph
        </Menu.Item>
        <Menu.Item
          name='buildings'
          active={activeTab === 'buildings'}
          onClick={handleSetTab}
        >
          Buildings
        </Menu.Item>
      </Menu>
      <div style={{ padding: '20px 0px' }}>
        <Button primary onClick={handleCalculateFactory}>
          Calculate
        </Button>
        {renderTab()}
      </div>
    </Container>
  );
};

export default PlannerResults;
