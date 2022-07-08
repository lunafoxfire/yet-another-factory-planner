import React from 'react';
import Drawer from '../Drawer';
import PlannerOptions from './PlannerOptions';
import PlannerResults from './PlannerResults';
import { useSessionStorage } from '../../hooks/useSessionStorage';

const Factory = () => {
  const [drawerOpen, setDrawerOpen] = useSessionStorage<'false' | 'true'>({ key: 'drawer-open', defaultValue: 'false' });
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
