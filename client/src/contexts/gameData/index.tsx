import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useGetInitialize } from '../../api/modules/initialize/useGetInitialize';
import { GameData } from './types';
import { DEFAULT_GAME_VERSION, LEGACY_GAME_VERSION, SHARE_QUERY_PARAM } from './consts';
import { usePrevious } from '../../hooks/usePrevious';


// TYPE
export type FactoryInitializer = {
  factoryConfig: any | null,
  shareKey: string | null,
  legacyEncoding: string | null,
};

export type GameDataContextType = {
  gameData: GameData | null,
  initializer: FactoryInitializer | null,
  loading: boolean,
  completedThisFrame: boolean,
};


// CONTEXT
export const GameDataContext = createContext<GameDataContextType | null>(null);
GameDataContext.displayName = 'GameDataContext';


// HELPER HOOK
export function useGameDataContext() {
  const ctx = useContext(GameDataContext);
  if (!ctx) {
    throw new Error('GameDataContext is null');
  }
  return ctx;
}


// PROVIDER
type PropTypes = { children: React.ReactNode };
export const GameDataProvider = ({ children }: PropTypes) => {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [initializer, setInitializer] = useState<FactoryInitializer | null>(null);
  const [loading, setLoading] = useState(false);
  const prevLoading = usePrevious(loading);
  const completedThisFrame = useMemo(() => !loading && loading !== prevLoading, [loading, prevLoading]);

  const getInitialize = useGetInitialize();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareKey = params.get(SHARE_QUERY_PARAM);
    const legacyEncoding = params.get('f');
    if (shareKey) {
      getInitialize.request({ factoryKey: shareKey });
    } else if (legacyEncoding) {
      getInitialize.request({ gameVersion: LEGACY_GAME_VERSION });
    } else {
      getInitialize.request({ gameVersion: DEFAULT_GAME_VERSION });
    }
    setLoading(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (getInitialize.completedThisFrame) {
      const gameData = getInitialize.data?.game_data || null;
      const factoryConfig = getInitialize.data?.factory_config || null;

      const params = new URLSearchParams(window.location.search);
      const shareKey = params.get(SHARE_QUERY_PARAM);
      const legacyEncoding = params.get('f');
      window.history.replaceState(null, '', `${window.location.pathname}`);

      setGameData(gameData);
      setInitializer({
        factoryConfig,
        shareKey,
        legacyEncoding,
      });
      setLoading(false);
    }
  }, [getInitialize]);

  const ctxValue = useMemo(() => {
    return {
      gameData,
      initializer,
      loading,
      completedThisFrame,
    }
  }, [completedThisFrame, gameData, initializer, loading]);

  return (
    <GameDataContext.Provider value={ctxValue}>
      {children}
    </GameDataContext.Provider>
  );
}
