import React from 'react';
import { Container, Menu } from 'semantic-ui-react';
import ProductionPlanner from '../ProductionPlanner';

const Main = () => {
  return (
    <Container fluid>
      <Menu fixed='top' size="massive">
        <Container fluid>
          <Menu.Item as='a' header >
            Yet Another Factory Planner
          </Menu.Item>
        </Container>
      </Menu>
      <Container fluid style={{ padding: '0px 50px', paddingTop: '70px' }}>
        <ProductionPlanner />
      </Container>
    </Container>
  );
};

export default Main;
