import React from 'react';
import { Container, Tabs } from '@mantine/core';
import { Share2, Edit } from 'react-feather';
import ProductionGraphTab from './ProductionGraphTab';
import ReportTab from './ReportTab';
import { SolverResults } from '../../../utilities/production-solver';

interface Props {
  solverResults: SolverResults | null;
}

const PlannerResults = (props: Props) => {
  const { solverResults } = props;
  return (
    <Tabs variant='outline'>
      <Tabs.Tab label='Production Graph' icon={<Share2 size={18} />}>
        <Container fluid padding={0}>
          <ProductionGraphTab activeGraph={solverResults?.productionGraph || null} errorMessage={solverResults?.error || ''} />
        </Container>
      </Tabs.Tab>
      <Tabs.Tab label='Report' icon={<Edit size={18} />}>
        <Container fluid>
          <ReportTab report={solverResults?.report || null} />
        </Container>
      </Tabs.Tab>
    </Tabs>
  );
};

export default PlannerResults;
