import React from 'react';
import { Container, Tabs } from '@mantine/core';
import { TrendingUp, Shuffle, Box } from 'react-feather';
import ProductionTab from './ProductionTab';
import InputsTab from './InputsTab';
import RecipesTab from './RecipesTab';

const PlannerOptions = () => {
  return (
    <Tabs grow variant='outline'>
      <Tabs.Tab label='Production' icon={<TrendingUp size={18} />}>
        <Container>
          <ProductionTab />
        </Container>
      </Tabs.Tab>
      <Tabs.Tab label='Inputs' icon={<Shuffle size={18} />}>
        <Container>
          <InputsTab />
        </Container>
      </Tabs.Tab>
      <Tabs.Tab label='Recipes' icon={<Box size={18} />}>
        <Container>
          <RecipesTab />
        </Container>
      </Tabs.Tab>
    </Tabs>
  );
};

export default PlannerOptions;
