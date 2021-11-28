import React from 'react';
import styled from 'styled-components';
import { AppShell, Header, useMantineTheme } from '@mantine/core';
import SiteHeader from './SiteHeader';
import ProductionPlanner from '../ProductionPlanner';

const Main = () => {
  const theme = useMantineTheme();
  return (
    <AppShell
      padding='md'
      header={<SHeader height={theme.other.headerHeight} padding='sm'><SiteHeader /></SHeader>}
    >
      <ProductionPlanner />
    </AppShell>
  );
};

export default Main;

const SHeader = styled(Header)`
  position: fixed;
  margin: 0px;
  padding: 10px;
  background: ${({ theme }) => theme.colors.primary[6]};
  overflow: hidden;
`;
