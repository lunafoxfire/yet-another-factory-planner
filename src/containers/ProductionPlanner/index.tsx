import React, { useState } from 'react';
import styled from 'styled-components';
import { Title, Text, Container } from '@mantine/core';
import seedrandom from 'seedrandom';
import PlannerOptions from './PlannerOptions';
import PlannerResults from './PlannerResults';
import { ProductionProvider } from '../../contexts/production';
import Drawer from '../../components/Drawer';

const ONE_HOUR = 1000 * 60 * 60;
const seed = Math.floor(new Date().getTime() / ONE_HOUR);
const rng = seedrandom(String(seed));

const TIPS = [
  'Pet the lizard doggo!',
  'Get back to work!',
  'Update 5 now available!',
  'Arachnophobia mode enabled.',
  'FICSIT does not waste.',
  'Linear algebra!',
  'Do not pet the spiders.',
  'BEAMS.',
  'Just 5 more minutes...',
  'Thanks, Jace. Helps a lot!',
];

const TIP_INDEX = Math.floor(rng() * TIPS.length);
const TIP = `FICSIT Tip #${TIP_INDEX}: ${TIPS[TIP_INDEX]}`

const ProductionPlanner = () => {
  return (
    <MainContainer fluid>
      <Title order={2}>Production Planner</Title>
      <Text>
        {TIP}
      </Text>
      <ProductionProvider>
        <Factory />
      </ProductionProvider>
    </MainContainer>
  );
};

export default ProductionPlanner;

const Factory = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  return (
    <>
      <Drawer open={drawerOpen} onToggle={(value) => { setDrawerOpen(value); }}>
        <PlannerOptions />
      </Drawer>
      <PlannerResults />
    </>
  );
}


const MainContainer = styled(Container)`
  margin-left: ${({ theme }) => theme.other.drawerClosedWidth};
  padding-left: 0px;
`;
