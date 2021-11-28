import React from 'react';
import { Paper, Title, Divider, Group, Button, Switch, Text } from '@mantine/core';
import { useLocalStorageValue } from '@mantine/hooks';
import { useProductionContext } from '../../contexts/production';
import Drawer from '../Drawer';
import PlannerOptions from './PlannerOptions';
import PlannerResults from './PlannerResults';



const Factory = () => {
  const [drawerOpen, setDrawerOpen] = useLocalStorageValue<'false' | 'true'>({ key: 'drawer-open', defaultValue: 'false' });
  const ctx = useProductionContext();

  return (
    <>
      <Paper style={{ marginBottom: '20px' }}>
        <Title order={2}>Control Panel</Title>
        <Text>
          {ctx.ficsitTip}
        </Text>
        <Divider style={{ marginTop: '15px', marginBottom: '15px' }} />
        <Group style={{ marginBottom: '15px' }}>
          <Button
            onClick={() => { ctx.calculate(); }}
            disabled={ctx.autoCalculate}
            style={{ marginBottom: '10px', marginRight: '15px' }}
          >
            Calculate
          </Button>
          <Button
            color='danger'
            onClick={() => { ctx.dispatch({ type: 'RESET_FACTORY' }) }}
            style={{ marginBottom: '10px' }}
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
      <PlannerResults solverResults={ctx.solverResults} />
      <Drawer open={drawerOpen === 'true'} onToggle={(value) => { setDrawerOpen(value ? 'true' : 'false'); }}>
        <PlannerOptions />
      </Drawer>
    </>
  );
}

export default Factory;
