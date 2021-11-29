import React from 'react';
import { ProductionProvider } from '../../contexts/production';
import Factory from './Factory';

const ProductionPlanner = () => {
  return (
    <ProductionProvider>
      <Factory />
    </ProductionProvider>
  );
};

export default ProductionPlanner;
