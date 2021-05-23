import React from 'react';
import { Container, Header, Segment, Grid } from 'semantic-ui-react';
import PlannerOptions from './PlannerOptions';
import PlannerResults from './PlannerResults';
import { ProductionProvider } from '../../contexts/production';
import { useProductionContext } from '../../contexts/production';

const ProductionPlanner = () => {
  return (
    <>
      <Header as='h1'>Production Planner</Header>
      <p>
        This is some descriptive text that will have some usage information or whatever.
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
  const ctx = useProductionContext();
  return (
    <>
      <Segment attached='top'>
        <Header size='medium'>{ctx.state.name}</Header>
      </Segment>
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
