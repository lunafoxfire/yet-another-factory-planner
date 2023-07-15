import React, { useEffect, useMemo, useState } from 'react';
import { Loader, Divider, Text, Title } from '@mantine/core';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';
import bgImage from '../../assets/stripe-bg.png';
import { useGameDataContext } from '../../contexts/gameData';
import { useGlobalContext } from '../../contexts/global';
import { ProductionProvider } from '../../contexts/production';
import Card from '../../components/Card';
import Factory from './Factory';
import Portal from '../../components/Portal';

const ProductionPlanner = () => {
  const globalCtx = useGlobalContext();
  const gdCtx = useGameDataContext();
  const [slowLoad, setSlowLoad] = useState(false);

  const loaded = !!gdCtx.gameData;
  useEffect(() => {
    setSlowLoad(false);
    if (!loaded) {
      const timer = setTimeout(() => {
        setSlowLoad(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  const renderLoading = () => {
    return (
      <Portal createRoot>
        <AnimatePresence>
          {!gdCtx.gameData && (
            <LoadingOverlay
              $bgImage={bgImage}
              initial={false}
              animate={{ opacity: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.0, type: 'tween' }}
            >
              {gdCtx.loadingError ? (
                <>
                  <Title style={{ marginTop: '15px' }}>
                    An error occured connecting to the server x_x
                  </Title>
                </>
              ) : (
                <>
                  <Loader size='xl' />
                  <Title style={{ marginTop: '15px' }}>
                    Loading game data...
                  </Title>
                  <AnimatePresence>
                    {slowLoad && (
                      <motion.div
                        initial={{ opacity: 0.0, y: 20 }}
                        animate={{ opacity: 1.0, y: 0 }}
                        transition={{ duration: 1.0, type: 'tween' }}
                      >
                        <Title style={{ marginTop: '15px' }}>
                          Trying real hard!
                        </Title>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </LoadingOverlay>
          )}
        </AnimatePresence>
      </Portal>
    );
  }

  const renderProduction = () => {
    if (gdCtx.gameData) {
      return (
        <ProductionProvider gameData={gdCtx.gameData} gameVersion={gdCtx.gameVersion} initializer={gdCtx.initializer} triggerInitialize={gdCtx.completedThisFrame}>
          <Factory />
        </ProductionProvider>
      );
    }
    return null;
  }

  return (
    <>
      {renderLoading()}
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
      {renderProduction()}
    </>
  )
};

export default ProductionPlanner;

const LoadingOverlay = motion(styled.div<any>`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background: url(${({ $bgImage }) => $bgImage});
  background-color: #000;
  z-index: 9999;
`);
