import React from 'react';
import styled from 'styled-components';
import { AppShell, Header, Container, useMantineTheme, Anchor } from '@mantine/core';
import SiteHeader from './SiteHeader';
import ProductionPlanner from '../ProductionPlanner';
import PaypalButton from '../../components/PaypalButton';

const Main = () => {
  const theme = useMantineTheme();
  return (
    <AppShell
      padding='md'
      header={<SHeader height={theme.other.headerHeight} padding='sm'><SiteHeader /></SHeader>}
    >
      <MainContainer fluid>
        <ProductionPlanner />
        <Footer>
          <FooterContent>
            Made with ♥ by <Anchor href='https://github.com/lydianlights' target='_blank' rel='noopener noreferrer'>LydianLights</Anchor> - Questions or bugs? File an <Anchor href='https://github.com/lydianlights/yet-another-factory-planner/issues' target='_blank' rel='noopener noreferrer'>issue on github</Anchor>
          </FooterContent>
          <PaypalButton />
        </Footer>
      </MainContainer>
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

const MainContainer = styled(Container)`
  margin-left: ${({ theme }) => theme.other.pageLeftMargin};
  margin-top: ${({ theme }) => theme.other.headerHeight};
  padding-left: 0px;
`;

const Footer = styled(Container)`
  margin-top: 40px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const FooterContent = styled(Container)`
  padding: 10px 20px;
  color: ${({ theme }) => theme.white};
  /* background: rgba(0, 0, 0, 0.3); */
`;
