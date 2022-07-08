import React from 'react';
import { Container, MantineTheme, Tabs, useMantineTheme } from '@mantine/core';
import { Share2, Edit } from 'react-feather';
import ProductionGraphTab from './ProductionGraphTab';
import ReportTab from './ReportTab';
import Card from '../../../components/Card';

const tabSx = (theme: MantineTheme) => ({
  '&.mantine-Tabs-tabControl': {
    minWidth: '200px',
  },
});

const PlannerResults = () => {
  const theme = useMantineTheme();
  return (
    <Tabs variant='outline'>
      <Tabs.Tab label='Production Graph' icon={<Share2 size={18} />} sx={tabSx}>
        <Container fluid padding={0}>
          <ProductionGraphTab />
        </Container>
      </Tabs.Tab>
      <Tabs.Tab label='Factory Report' icon={<Edit size={18} />} sx={tabSx}>
        <Card style={{ paddingLeft: '10px', background: theme.colors.background[0] }}>
          <ReportTab  />
        </Card>
      </Tabs.Tab>
    </Tabs>
  );
};

export default PlannerResults;
