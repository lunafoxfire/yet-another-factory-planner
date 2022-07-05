import React, { createContext, useContext, useReducer, useState, useEffect, useMemo, useCallback } from 'react';
import _ from 'lodash';
import seedrandom from 'seedrandom';
import { usePrevious } from '../../hooks/usePrevious';
import { ProductionSolver, SolverResults } from '../../utilities/production-solver';
import { reducer, FactoryOptions, FactoryAction, getInitialState } from './reducer';
import { useLocalStorageValue } from '@mantine/hooks';
import { GraphError } from '../../utilities/error/GraphError';
import { usePostSharedFactory } from '../../api/modules/shared-factories/usePostSharedFactory';

export type ProductionContextType = {
  state: FactoryOptions,
  dispatch: React.Dispatch<FactoryAction>,
  calculating: boolean,
  solverResults: SolverResults | null,
  calculate: () => void,
  autoCalculate: boolean,
  setAutoCalculate: (value: boolean) => void,
  generateShareLink: () => void,
  shareLinkLoading: boolean,
  shareLink: string,
  ficsitTip: string,
  engineerId: string,
};

const ONE_HOUR = 1000 * 60 * 60;
const seed = Math.floor(new Date().getTime() / (0.5 * ONE_HOUR));
const rng = seedrandom(String(seed));

const TIPS = [
  'Pet the lizard doggo!',
  'Get back to work!',
  'Update 6 now available!',
  'Arachnophobia mode enabled.',
  'FICSIT does not waste.',
  'Linear programming!',
  'Do not pet the spiders.',
  'Just slap some beams on it!',
  'Just 5 more minutes...',
  'Thanks, Jace. Helps a lot!',
  'Thanks, Snutt. Helps a lot!',
  'Check out the new Spire Coast!',
  'ADA says it\'s my turn to play with the nuke nobelisk.',
  'Harvest.',
];

const TIP_INDEX = Math.floor(rng() * TIPS.length);
const TIP = `FICSIT Tip #${TIP_INDEX}: ${TIPS[TIP_INDEX]}`;

const ID = Math.floor(Math.random() * 1e7).toString().padStart(7, '0');

const _setCalculating = _.debounce((value: boolean, setCalculating: React.Dispatch<React.SetStateAction<boolean>>) => {
  setCalculating(value);
}, 300, { leading: false, trailing: true });

const _handleCalculateFactory = _.debounce(async (
    state: FactoryOptions,
    setSolverResults: React.Dispatch<React.SetStateAction<SolverResults | null>>,
    setCalculating: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    _setCalculating(true, setCalculating);
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
    } catch (e: unknown) {
      setSolverResults({
        productionGraph: null,
        report: null,
        timestamp: performance.now(),
        computeTime: 0,
        error: e as GraphError,
      });
    } finally {
      _setCalculating(false, setCalculating);
    }
  }, 300, { leading: true, trailing: true });



// CONTEXT
export const ProductionContext = createContext<ProductionContextType | null>(null);
ProductionContext.displayName = 'ProductionContext';


// HELPER HOOK
export function useProductionContext() {
  const ctx = useContext(ProductionContext);
  if (!ctx) {
    throw new Error('ProductionContext is null');
  }
  return ctx;
}


// PROVIDER
type PropTypes = { children: React.ReactNode };
export const ProductionProvider = ({ children }: PropTypes) => {
  const [state, dispatch] = useReducer(reducer, getInitialState());
  const [loadedFromQuery, setLoadedFromQuery] = useState(false);
  const [firstCalculationDone, setFirstCalculationDone] = useState(false);
  const [autoCalculate, setAutoCalculate] = useLocalStorageValue<'false' | 'true'>({ key: 'auto-calculate', defaultValue: 'true' });
  const [calculating, setCalculating] = useState(false);
  const [solverResults, setSolverResults] = useState<SolverResults | null>(null);
  const [engineerId] = useLocalStorageValue<string>({ key: 'engineer-id', defaultValue: ID });
  const prevState = usePrevious(state);

  const postSharedFactory = usePostSharedFactory();

  const autoCalculateBool = autoCalculate === 'true' ? true : false;

  const handleCalculateFactory = useCallback(() => {
    _handleCalculateFactory(state, setSolverResults, setCalculating)
  }, [state]);

  const handleSetAutoCalculate = (checked: boolean) => {
    setAutoCalculate(checked ? 'true' : 'false');
    if (checked) {
      handleCalculateFactory();
    }
  };

  const handleGenerateShareLink = () => {
    postSharedFactory.request({ factoryConfig: state });
  };

  const shareLink = useMemo(() => {
    const key = postSharedFactory.data?.key;
    if (key) {
      return `${window.location.protocol}//${window.location.host}${window.location.pathname}?share=${key}`;
    }
    return '';
  }, [postSharedFactory.data?.key]);

  useEffect(() => {
    if (loadedFromQuery) {
      if (!firstCalculationDone) {
        handleCalculateFactory();
        setFirstCalculationDone(true);
      } else if (autoCalculateBool && prevState !== state) {
        handleCalculateFactory();
      }
    }
  }, [autoCalculateBool, firstCalculationDone, handleCalculateFactory, loadedFromQuery, prevState, state]);

  useEffect(() => {
    if (!loadedFromQuery) {
      dispatch({ type: 'LOAD_FROM_QUERY_PARAM' });
      setLoadedFromQuery(true);
    }
  }, [loadedFromQuery]);

  const ctxValue = useMemo(() => {
    return {
      state,
      dispatch,
      calculating,
      solverResults,
      calculate: handleCalculateFactory,
      autoCalculate: autoCalculateBool,
      setAutoCalculate: handleSetAutoCalculate,
      generateShareLink: handleGenerateShareLink,
      shareLink,
      shareLinkLoading: postSharedFactory.loading,
      ficsitTip: TIP,
      engineerId,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCalculateBool, calculating, handleCalculateFactory, solverResults, state, shareLink, postSharedFactory.loading]);

  return (
    <ProductionContext.Provider value={ctxValue}>
      {children}
    </ProductionContext.Provider>
  );
}
