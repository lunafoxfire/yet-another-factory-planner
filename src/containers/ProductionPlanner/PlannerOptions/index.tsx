import React, { useState } from 'react';
import styled from 'styled-components';
import { Header, Menu } from 'semantic-ui-react';
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
    <Container>
      <HeaderContainer>
        <Header>Factory Settings</Header>
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
      </HeaderContainer>
      <Content>
        <div style={{ padding: '20px 0px' }}>
          {renderTab()}
        </div>
      </Content>
    </Container>
  );
};

export default PlannerOptions;

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const HeaderContainer = styled.div`
  position: absolute;
  left: 0px;
  right: 0px;
  height: var(--drawer-header-height);
  overflow: hidden;
`;

const Content = styled.div`
  position: absolute;
  top: var(--drawer-header-height);
  left: 0px;
  bottom: 0px;
  right: 0px;
  padding: 20px 15px;
  overflow: auto;
`;
