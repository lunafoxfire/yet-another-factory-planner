import React, { useCallback, useEffect, useState } from 'react';
import _ from 'lodash';
import { Container, Tabs, Button, Switch, Group } from '@mantine/core';
import { Share2, Edit } from 'react-feather';
import ProductionGraphTab from './ProductionGraphTab';
import ReportTab from './ReportTab';
import { ProductionSolver, SolverResults } from '../../../utilities/production-solver';
import { FactoryOptions, useProductionContext } from '../../../contexts/production';
import { usePrevious } from '../../../hooks/usePrevious';

const _handleCalculateFactory = _.debounce(async (state: FactoryOptions, setSolverResults: React.Dispatch<React.SetStateAction<SolverResults | null>>) => {
  try {
    const solver = new ProductionSolver(state);
    const results = await solver.exec();
    setSolverResults((prevState) => {
      if (!prevState || prevState.timestamp < results.timestamp) {
        console.log(`Computed in: ${results.computeTime}ms`);
        return results;
      }
      return prevState;
    });
  } catch (e: any) {
    setSolverResults({
      productionGraph: null,
      report: null,
      timestamp: performance.now(),
      computeTime: 0,
      error: e.message,
    });
  }
}, 300, { leading: true, trailing: true });

const PlannerResults = () => {
  const [autoCalc, setAutoCalc] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [solverResults, setSolverResults] = useState<SolverResults | null>(null);
  const ctx = useProductionContext();
  const prevState = usePrevious(ctx.state);

  const handleCalculateFactory = useCallback(() => {
    _handleCalculateFactory(ctx.state, setSolverResults)
  }, [ctx.state]);

  const handleSetAutoCalc = (checked: boolean) => {
    setAutoCalc(checked);
    if (checked) {
      handleCalculateFactory();
    }
  };

  useEffect(() => {
    if (!loaded) {
      handleCalculateFactory();
      setLoaded(true);
    } else if (autoCalc && prevState !== ctx.state) {
      handleCalculateFactory();
    }
  }, [autoCalc, ctx.state, handleCalculateFactory, loaded, prevState]);

  return (
    <>
      <div style={{ padding: '20px 0px' }}>
        <Group>
          <Button onClick={handleCalculateFactory} disabled={autoCalc} style={{ marginBottom: '10px', marginRight: '15px' }}>
            Calculate
          </Button>
          <Button
            color='danger'
            onClick={() => { ctx.dispatch({ type: 'RESET_FACTORY' }) }}
            style={{ marginBottom: '10px' }}
          >
            Reset ALL Factory Options
          </Button>
        </Group>
        <Switch
          label='Auto-calculate (turn this off if changing options is too slow)'
          checked={autoCalc}
          onChange={(e) => { handleSetAutoCalc(e.currentTarget.checked); }}
        />
      </div>
      <Tabs variant='outline'>
        <Tabs.Tab label='Production Graph' icon={<Share2 size={18} />} style={{ width: '180px' }}>
          <Container fluid padding={0}>
            <ProductionGraphTab activeGraph={solverResults?.productionGraph || null} errorMessage={solverResults?.error || ''} />
          </Container>
        </Tabs.Tab>
        <Tabs.Tab label='Report' icon={<Edit size={18} />} style={{ width: '180px' }}>
          <Container fluid>
            <ReportTab report={solverResults?.report || null} />
          </Container>
        </Tabs.Tab>
      </Tabs>
    </>
  );
};

export default PlannerResults;
