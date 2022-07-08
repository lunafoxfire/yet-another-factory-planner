import React from 'react';
import { useLocalStorageValue } from '@mantine/hooks';
import Drawer from '../Drawer';
import PlannerOptions from './PlannerOptions';
import PlannerResults from './PlannerResults';

const Factory = () => {
  const [drawerOpen, setDrawerOpen] = useLocalStorageValue<'false' | 'true'>({ key: 'drawer-open', defaultValue: 'false' });
  return (
    <>
      <PlannerResults />
      <Drawer open={drawerOpen === 'true'} onToggle={(value) => { setDrawerOpen(value ? 'true' : 'false'); }}>
        <PlannerOptions />
      </Drawer>
    </>
  );
}

export default Factory;
