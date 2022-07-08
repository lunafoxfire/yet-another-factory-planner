import React, { createContext, useContext, useReducer, useState, useEffect, useMemo, useCallback } from 'react';
import _ from 'lodash';
import { usePrevious } from '../../hooks/usePrevious';
import { useSessionStorage } from '../../hooks/useSessionStorage';
import { ProductionSolver, SolverResults } from '../../utilities/production-solver';
import { GraphError } from '../../utilities/error/GraphError';
import { usePostSharedFactory } from '../../api/modules/shared-factories/usePostSharedFactory';
import { reducer, FactoryAction, getInitialState } from './reducer';
import { FactoryOptions } from './types';
import { FactoryInitializer } from '../gameData';
import { GameData } from '../gameData/types';
import { SHARE_QUERY_PARAM } from '../gameData/consts';


export type ShareLinkProps = { link: string, copyToClipboard: boolean, loading: boolean };

// TYPE
export type ProductionContextType = {
  state: FactoryOptions,
  dispatch: React.Dispatch<FactoryAction>,
  gameData: GameData,
  calculating: boolean,
  solverResults: SolverResults | null,
  calculate: () => void,
  autoCalculate: boolean,
  setAutoCalculate: (value: boolean) => void,
  generateShareLink: () => void,
  shareLink: ShareLinkProps,
};


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


const _setCalculating = _.debounce((value: boolean, setCalculating: React.Dispatch<React.SetStateAction<boolean>>) => {
  setCalculating(value);
}, 300, { leading: false, trailing: true });

const _handleCalculateFactory = _.debounce(async (
  state: FactoryOptions,
  gameData: GameData,
  setSolverResults: React.Dispatch<React.SetStateAction<SolverResults | null>>,
  setCalculating: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  _setCalculating(true, setCalculating);
  try {
    const solver = new ProductionSolver(state, gameData);
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


// PROVIDER
type PropTypes = {
  gameData: GameData,
  initializer: FactoryInitializer | null,
  triggerInitialize: boolean,
  children: React.ReactNode,
};
export const ProductionProvider = ({ gameData, initializer, triggerInitialize, children }: PropTypes) => {
  const [state, dispatch] = useReducer(reducer, getInitialState(gameData));
  const prevState = usePrevious(state);
  const [solverResults, setSolverResults] = useState<SolverResults | null>(null);

  const [calculating, setCalculating] = useState(false);
  const [autoCalculate, setAutoCalculate] = useSessionStorage<'false' | 'true'>({ key: 'auto-calculate', defaultValue: 'true' });
  const autoCalculateBool = autoCalculate === 'true' ? true : false;

  const postSharedFactory = usePostSharedFactory();

  const handleCalculateFactory = useCallback(() => {
    _handleCalculateFactory(state, gameData, setSolverResults, setCalculating)
  }, [gameData, state]);

  const handleSetAutoCalculate = (checked: boolean) => {
    setAutoCalculate(checked ? 'true' : 'false');
    if (checked) {
      handleCalculateFactory();
    }
  };

  const handleGenerateShareLink = () => {
    postSharedFactory.request({ factoryConfig: state });
  };

  const shareLink: ShareLinkProps = useMemo(() => {
    let link = '';
    const key = postSharedFactory.data?.key || initializer?.shareKey;
    if (key) {
      link = `${window.location.protocol}//${window.location.host}${window.location.pathname}?${SHARE_QUERY_PARAM}=${key}`;
    }
    return {
      link,
      copyToClipboard: !!postSharedFactory.data?.key,
      loading: postSharedFactory.loading,
    }
  }, [initializer?.shareKey, postSharedFactory.data?.key, postSharedFactory.loading]);
  
  useEffect(() => {
    if (triggerInitialize) {
      if (initializer?.factoryConfig) {
        dispatch({ type: 'LOAD_FROM_SHARED_FACTORY', config: initializer.factoryConfig, gameData });
      } else if (initializer?.legacyEncoding) {
        dispatch({ type: 'LOAD_FROM_LEGACY_ENCODING', encoding: initializer.legacyEncoding, gameData });
      } else if (window.sessionStorage?.getItem('state')) {
        dispatch({ type: 'LOAD_FROM_SESSION_STORAGE', gameData });
      } else {
        dispatch({ type: 'RESET_FACTORY', gameData });
      }
      handleCalculateFactory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerInitialize]);

  useEffect(() => {
    if (autoCalculateBool && prevState !== state) {
      handleCalculateFactory();
    }
  }, [autoCalculateBool, handleCalculateFactory, prevState, state]);

  useEffect(() => {
      try {
        window.sessionStorage.setItem('state', JSON.stringify(state));
      } catch (e) {
        console.error(e);
      }
  }, [state]);

  const ctxValue = useMemo(() => {
    return {
      state,
      dispatch,
      gameData,
      calculating,
      solverResults,
      calculate: handleCalculateFactory,
      autoCalculate: autoCalculateBool,
      setAutoCalculate: handleSetAutoCalculate,
      generateShareLink: handleGenerateShareLink,
      shareLink,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state,
    gameData,
    calculating,
    solverResults,
    autoCalculateBool,
    shareLink,
  ]);

  return (
    <ProductionContext.Provider value={ctxValue}>
      {children}
    </ProductionContext.Provider>
  );
}
