import React from 'react';
import { AppShell, Header, useMantineTheme } from '@mantine/core';
import SiteHeader from './SiteHeader';
import ProductionPlanner from '../ProductionPlanner';

const Main = () => {
  const theme = useMantineTheme();
  return (
    <AppShell
      padding='md'
      header={<Header height={theme.other.headerHeight} padding='sm'><SiteHeader /></Header>}
    >
      <ProductionPlanner />
    </AppShell>
  );
};

export default Main;
