import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useGetInitialize } from '../../api/modules/initialize/useGetInitialize';
import { GameData } from './types';
import { DEFAULT_GAME_VERSION, LEGACY_GAME_VERSION, SHARE_QUERY_PARAM } from './consts';
import { usePrevious } from '../../hooks/usePrevious';
import { FactoryOptions } from '../production/types';
import { usePageTitle } from '../../hooks/usePageTitle';


// TYPE
export type FactoryInitializer = {
  factoryConfig: any | null,
  shareKey: string | null,
  legacyEncoding: string | null,
  sessionState: FactoryOptions | null,
};

export type GameDataContextType = {
  gameData: GameData | null,
  initializer: FactoryInitializer | null,
  loading: boolean,
  completedThisFrame: boolean,
  gameVersion: string,
  setGameVersion: (version: string) => void,
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
  const [gameVersion, setGameVersion] = useState('');
  const [initializer, setInitializer] = useState<FactoryInitializer | null>(null);
  const [loading, setLoading] = useState(false);
  const prevLoading = usePrevious(loading);
  const [needToFetchGameData, setNeedToFetchGameData] = useState(true);
  const completedThisFrame = useMemo(() => !loading && loading !== prevLoading, [loading, prevLoading]);

  const getInitialize = useGetInitialize();

  const pageTitle = useMemo(() => {
    const base = 'Yet Another Factory Planner';
    let versionPart = '';
    if (gameVersion) {
      versionPart = `[${gameVersion}] `;
    }
    return versionPart + base;
  }, [gameVersion]);

  usePageTitle(pageTitle);

  useEffect(() => {
    if (needToFetchGameData) {
      setLoading(true);
      setNeedToFetchGameData(false);
      setGameData(null);
      setInitializer(null);

      const params = new URLSearchParams(window.location.search);
      const shareKey = params.get(SHARE_QUERY_PARAM);
      const legacyEncoding = params.get('f');
      const sessionVersion = window.sessionStorage?.getItem('game-version');
      const sessionState = window.sessionStorage?.getItem('state');

      if (shareKey) {
        getInitialize.request({ factoryKey: shareKey });
      } else if (legacyEncoding) {
        getInitialize.request({ gameVersion: LEGACY_GAME_VERSION });
      } else if (sessionVersion && sessionState) {
        getInitialize.request({ gameVersion: sessionVersion });
      } else {
        getInitialize.request({ gameVersion: gameVersion || DEFAULT_GAME_VERSION });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needToFetchGameData]);

  useEffect(() => {
    if (getInitialize.completedThisFrame) {
      const gameData = getInitialize.data?.game_data || null;
      const factoryConfig = getInitialize.data?.factory_config || null;

      const params = new URLSearchParams(window.location.search);
      const shareKey = params.get(SHARE_QUERY_PARAM);
      const legacyEncoding = params.get('f');
      const sessionVersion = window.sessionStorage?.getItem('game-version');
      let sessionState: FactoryOptions | null = null;
      try {
        const sessionStateJSON = window.sessionStorage?.getItem('state');
        if (sessionVersion && sessionStateJSON) {
          sessionState = JSON.parse(sessionStateJSON);
        }
      } catch (e) {
        console.error(e);
      }

      window.history.replaceState(null, '', `${window.location.pathname}`);
      window.sessionStorage?.removeItem('game-version');
      window.sessionStorage?.removeItem('state');

      if (factoryConfig?.gameVersion) {
        setGameVersion(factoryConfig.gameVersion);
      } else if (legacyEncoding) {
        setGameVersion(LEGACY_GAME_VERSION);
      } else if (sessionVersion && sessionState) {
        setGameVersion(sessionVersion);
      } else {
        setGameVersion(gameVersion || DEFAULT_GAME_VERSION);
      }

      setGameData(gameData);
      setInitializer({
        factoryConfig,
        shareKey,
        legacyEncoding,
        sessionState,
      });
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getInitialize]);

  const handleSetGameVersion = useCallback((version: string) => {
    if (version !== gameVersion) {
      setGameVersion(version);
      setNeedToFetchGameData(true);
      window.sessionStorage?.removeItem('game-version');
      window.sessionStorage?.removeItem('state');
    }
  }, [gameVersion]);

  const ctxValue = useMemo(() => {
    return {
      gameData,
      initializer,
      loading,
      completedThisFrame,
      gameVersion,
      setGameVersion: handleSetGameVersion,
    }
  }, [completedThisFrame, gameData, gameVersion, handleSetGameVersion, initializer, loading]);

  return (
    <GameDataContext.Provider value={ctxValue}>
      {children}
    </GameDataContext.Provider>
  );
}
