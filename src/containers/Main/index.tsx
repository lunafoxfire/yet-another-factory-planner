import React from 'react';
import { Container, Header, Menu } from 'semantic-ui-react';
import ProductionPlanner from '../ProductionPlanner';

const Main = () => {
  return (
    <Container fluid>
      <Menu fixed='top' size="massive">
        <Container fluid>
          <Menu.Item as='a' header >
            Yet Another Factory Planner
          </Menu.Item>
          <Menu.Item>
            <Header style={{ color: 'red', fontWeight: 'bold' }}>This site is in ALPHA and is subject to breaking changes without warning!!</Header>
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
