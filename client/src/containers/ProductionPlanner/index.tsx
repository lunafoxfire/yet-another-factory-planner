import React from 'react';
import { Center, Loader, Divider, Text, Title } from '@mantine/core';
import { useGameDataContext } from '../../contexts/gameData';
import { useGlobalContext } from '../../contexts/global';
import { ProductionProvider } from '../../contexts/production';
import Card from '../../components/Card';
import Factory from './Factory';

const ProductionPlanner = () => {
  const globalCtx = useGlobalContext();
  const gdCtx = useGameDataContext();

  const renderInner = () => {
    if (!gdCtx.gameData) {
      return (
        <Center style={{ padding: '150px 0px', flexDirection: 'column' }}>
          <Loader size='xl' />
          <Title style={{ marginTop: '15px' }}>
            Loading game data...
          </Title>
        </Center>
      );
    }
    return (
      <ProductionProvider gameData={gdCtx.gameData} initializer={gdCtx.initializer} triggerInitialize={gdCtx.completedThisFrame}>
        <Factory />
      </ProductionProvider>
    );
  }

  return (
    <>
      <Card style={{ marginBottom: '25px' }}>
        <Title order={2}>
          Welcome back &lt;Engineer ID #{globalCtx.engineerId}&gt;
        </Title>
        <Text>
          This tool has been created to increase the efficiency of your work towards Project Assembly.<br />
          We hope that you will continue to be effective.
        </Text>
        <Divider style={{ marginTop: '10px', marginBottom: '10px' }} />
        <Text style={{ fontSize: '13px' }}>
          {globalCtx.ficsitTip}
        </Text>
      </Card>
      {renderInner()}
    </>
  )
};

export default ProductionPlanner;
