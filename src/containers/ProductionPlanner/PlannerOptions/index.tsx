import React, { useState } from 'react';
import { Container, Menu } from 'semantic-ui-react';
import ProductionTab from './ProductionTab';
import InputsTab from './InputsTab';
import RecipesTab from './RecipesTab';

const PlannerOptions = () => {
  const [activeTab, setActiveTab] = useState('production');

  function handleSetTab(e: any, data: any) {
    setActiveTab(data.name);
  }

  function renderTab() {
    switch (activeTab) {
      case 'production':
        return <ProductionTab />
      case 'inputs':
        return <InputsTab />
      case 'recipes':
        return <RecipesTab />
      default:
        return null;
    }
  }

  return (
    <Container fluid>
      <Menu pointing secondary attached="top" fluid widths={3}>
        <Menu.Item
          name='production'
          active={activeTab === 'production'}
          onClick={handleSetTab}
        >
          Production
        </Menu.Item>
        <Menu.Item
          name='inputs'
          active={activeTab === 'inputs'}
          onClick={handleSetTab}
        >
          Inputs
        </Menu.Item>
        <Menu.Item
          name='recipes'
          active={activeTab === 'recipes'}
          onClick={handleSetTab}
        >
          Recipes
        </Menu.Item>
      </Menu>
      <Container style={{ padding: '20px 0px' }}>
        {renderTab()}
      </Container>
    </Container>
  );
};

export default PlannerOptions;
