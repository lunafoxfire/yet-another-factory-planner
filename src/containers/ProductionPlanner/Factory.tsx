import React from 'react';
import { Divider, Text, Title } from '@mantine/core';
import { useLocalStorageValue } from '@mantine/hooks';
import { useProductionContext } from '../../contexts/production';
import Drawer from '../Drawer';
import PlannerOptions from './PlannerOptions';
import PlannerResults from './PlannerResults';
import Card from '../../components/Card';

const Factory = () => {
  const [drawerOpen, setDrawerOpen] = useLocalStorageValue<'false' | 'true'>({ key: 'drawer-open', defaultValue: 'false' });
  const ctx = useProductionContext();

  return (
    <>
      <Card>
        <Title order={2}>
          Welcome back, &lt;Engineer ID #{ctx.engineerId}&gt;,
        </Title>
        <Text>
          This tool has been created to increase the efficiency of your work towards Project Assembly.<br />
          We hope that you will continue to be effective.
        </Text>
        <Divider style={{ marginTop: '10px', marginBottom: '10px' }} />
        <Text style={{ fontSize: '12px' }}>
          {ctx.ficsitTip}
        </Text>
      </Card>
      <PlannerResults solverResults={ctx.solverResults} />
      <Drawer open={drawerOpen === 'true'} onToggle={(value) => { setDrawerOpen(value ? 'true' : 'false'); }}>
        <PlannerOptions />
      </Drawer>
    </>
  );
}

export default Factory;
