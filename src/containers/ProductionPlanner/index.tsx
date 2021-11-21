import React from 'react';
import seedrandom from 'seedrandom';
import { Container, Header, Grid } from 'semantic-ui-react';
import PlannerOptions from './PlannerOptions';
import PlannerResults from './PlannerResults';
import { ProductionProvider } from '../../contexts/production';

const ONE_HOUR = 1000 * 60 * 60;
const seed = Math.floor(new Date().getTime() / ONE_HOUR);
const rng = seedrandom(String(seed));

const TIPS = [
  'Pet the doggo!',
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
    <>
      <Header as='h1'>Production Planner</Header>
      <p>
        {TIP}
      </p>
      <Container fluid>
        <ProductionProvider>
          <Factory />
        </ProductionProvider>
      </Container>
    </>
  );
};

export default ProductionPlanner;

const Factory = () => {
  return (
    <>
      <Grid columns={2}>
        <Grid.Column width={5}>
          <PlannerOptions />
        </Grid.Column>
        <Grid.Column width={11}>
          <PlannerResults />
        </Grid.Column>
      </Grid>
    </>
  );
}
