import React from 'react';
import styled from 'styled-components';
import { Container, Tabs, Paper, Title, Divider, Group, Button, Switch } from '@mantine/core';
import { TrendingUp, Shuffle, Box } from 'react-feather';
import { useProductionContext } from '../../../contexts/production';
import ProductionTab from './ProductionTab';
import InputsTab from './InputsTab';
import RecipesTab from './RecipesTab';

const PlannerOptions = () => {
  const ctx = useProductionContext();
  
  return (
    <>
      <Paper style={{ marginBottom: '20px', paddingTop: '10px' }}>
        <Title order={2}>Control Panel</Title>
        <Divider style={{ marginTop: '5px', marginBottom: '15px' }} />
        <Group style={{ marginBottom: '15px' }}>
          <Button
            onClick={() => { ctx.calculate(); }}
            disabled={ctx.autoCalculate}
            style={{ marginRight: '15px' }}
          >
            Calculate
          </Button>
          <Button
            color='danger'
            onClick={() => { ctx.dispatch({ type: 'RESET_FACTORY' }) }}
          >
            Reset ALL Factory Options
          </Button>
        </Group>
        <Switch
          size='md'
          label='Auto-calculate (turn this off if changing options is too slow)'
          checked={ctx.autoCalculate}
          onChange={(e) => { ctx.setAutoCalculate(e.currentTarget.checked); }}
        />
      </Paper>
      <Tabs grow variant='outline'>
        <Tabs.Tab label='Production' icon={<TrendingUp size={18} />}>
          <TabContainer fluid>
            <ProductionTab />
          </TabContainer>
        </Tabs.Tab>
        <Tabs.Tab label='Inputs' icon={<Shuffle size={18} />}>
          <TabContainer fluid>
            <InputsTab />
          </TabContainer>
        </Tabs.Tab>
        <Tabs.Tab label='Recipes' icon={<Box size={18} />}>
          <TabContainer fluid>
            <RecipesTab />
          </TabContainer>
        </Tabs.Tab>
      </Tabs>
    </>
  );
};

export default PlannerOptions;

const TabContainer = styled(Container)`
  padding: 15px 15px;
  background: ${({ theme }) => theme.colors.background[1]}
`;
