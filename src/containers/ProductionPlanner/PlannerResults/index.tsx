import React from 'react';
import { Container, Menu } from 'semantic-ui-react';

const PlannerResults = () => {
  return (
    <Container fluid>
      <Menu tabular>
        <Menu.Item name='graph'>
          Production Graph
          </Menu.Item>
        <Menu.Item name='buildings'>
          Buildings
          </Menu.Item>
      </Menu>
    </Container>  );
};

export default PlannerResults;
