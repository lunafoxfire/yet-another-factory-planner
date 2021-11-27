import React from 'react';
import styled from 'styled-components';
import { Container } from '@mantine/core';
import { ProductionProvider } from '../../contexts/production';
import Factory from './Factory';


const ProductionPlanner = () => {
  return (
    <MainContainer fluid>
      <ProductionProvider>
        <Factory />
      </ProductionProvider>
    </MainContainer>
  );
};

export default ProductionPlanner;

const MainContainer = styled(Container)`
  margin-left: ${({ theme }) => theme.other.drawerClosedWidth};
  padding-left: 0px;
`;
