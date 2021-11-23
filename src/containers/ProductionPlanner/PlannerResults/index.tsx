import React, { useCallback, useEffect, useState } from 'react';
import { Container, Menu, Button, Checkbox } from 'semantic-ui-react';
import ProductionGraphTab from './ProductionGraphTab';
import ReportTab from './ReportTab';
import { ProductionSolver, SolverResults } from '../../../utilities/production-solver';
import { useProductionContext } from '../../../contexts/production';
import { usePrevious } from '../../../hooks/usePrevious';

const PlannerResults = () => {
  const [activeTab, setActiveTab] = useState('production-graph');
  const [autoCalc, setAutoCalc] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [solverResults, setSolverResults] = useState<SolverResults | null>(null);
  const ctx = useProductionContext();
  const prevState = usePrevious(ctx.state);

  const handleCalculateFactory = useCallback(async () => {
    try {
      const solver = new ProductionSolver(ctx.state);
      const results = await solver.exec();
      setSolverResults((prevState) => {
        if (!prevState || prevState.timestamp < results.timestamp) {
          return results;
        }
        return prevState;
      });
    } catch (e: any) {
      setSolverResults({
        productionGraph: null,
        report: null,
        timestamp: performance.now(),
        error: e.message,
      });
    }
  }, [ctx.state]);

  function handleSetTab(e: any, data: any) {
    setActiveTab(data.name);
  }

  function renderTab() {
    switch (activeTab) {
      case 'production-graph':
        return <ProductionGraphTab activeGraph={solverResults?.productionGraph || null} errorMessage={solverResults?.error || ''} />
      case 'report':
        return <ReportTab report={solverResults?.report || null} />
      default:
        return null;
    }
  }

  useEffect(() => {
    if (!loaded) {
      handleCalculateFactory();
      setLoaded(true);
    } else if (autoCalc && prevState !== ctx.state) {
      handleCalculateFactory();
    }
  }, [autoCalc, ctx.state, handleCalculateFactory, loaded, prevState]);

  return (
    <Container fluid>
      <Menu pointing secondary attached="top">
        <Menu.Item
          name='production-graph'
          active={activeTab === 'production-graph'}
          onClick={handleSetTab}
        >
          Production Graph
        </Menu.Item>
        <Menu.Item
          name='report'
          active={activeTab === 'report'}
          onClick={handleSetTab}
        >
          Report
        </Menu.Item>
      </Menu>
      <div style={{ padding: '20px 0px' }}>
        <Button primary onClick={handleCalculateFactory} disabled={autoCalc} style={{ marginBottom: '10px', marginRight: '15px' }}>
          Calculate
        </Button>
        <Checkbox
          label='Auto-calculate (turn this off if changing options is too slow)'
          toggle
          checked={autoCalc}
          onChange={(e, { checked }) => { setAutoCalc(!!checked); }}
        />
        {renderTab()}
      </div>
    </Container>
  );
};

export default PlannerResults;
