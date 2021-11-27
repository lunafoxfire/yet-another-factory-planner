import React, { useCallback, useEffect, useState } from 'react';
import _ from 'lodash';
import seedrandom from 'seedrandom';
import { Paper, Title, Divider, Group, Button, Switch, Text } from '@mantine/core';
import { FactoryOptions, useProductionContext } from '../../contexts/production';
import { usePrevious } from '../../hooks/usePrevious';
import Drawer from '../../components/Drawer';
import { SolverResults, ProductionSolver } from '../../utilities/production-solver';
import PlannerOptions from './PlannerOptions';
import PlannerResults from './PlannerResults';


const ONE_HOUR = 1000 * 60 * 60;
const seed = Math.floor(new Date().getTime() / ONE_HOUR);
const rng = seedrandom(String(seed));

const TIPS = [
  'Pet the lizard doggo!',
  'Get back to work!',
  'Update 5 now available!',
  'Arachnophobia mode enabled.',
  'FICSIT does not waste.',
  'Linear algebra!',
  'Do not pet the spiders.',
  'BEAMS.',
  'Just 5 more minutes...',
  'Thanks, Jace. Helps a lot!',
];

const TIP_INDEX = Math.floor(rng() * TIPS.length);
const TIP = `FICSIT Tip #${TIP_INDEX}: ${TIPS[TIP_INDEX]}`

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


const Factory = () => {
  const [autoCalc, setAutoCalc] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
      <Paper style={{ marginBottom: '20px' }}>
        <Title order={2}>Control Panel</Title>
        <Text>
          {TIP}
        </Text>
        <Divider style={{ marginTop: '15px', marginBottom: '15px' }} />
        <Group style={{ marginBottom: '15px' }}>
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
          size='md'
          label='Auto-calculate (turn this off if changing options is too slow)'
          checked={autoCalc}
          onChange={(e) => { handleSetAutoCalc(e.currentTarget.checked); }}
        />
      </Paper>
      <PlannerResults solverResults={solverResults} />
      <Drawer open={drawerOpen} onToggle={(value) => { setDrawerOpen(value); }}>
        <PlannerOptions />
      </Drawer>
    </>
  );
}

export default Factory;
