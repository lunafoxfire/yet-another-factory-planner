import { useLocalStorage } from '@mantine/hooks';
import React, { createContext, useContext, useMemo } from 'react';
import seedrandom from 'seedrandom';


// TYPE
export type GlobalContextType = {
  ficsitTip: string,
  engineerId: string,
};


// CONTEXT
export const GlobalContext = createContext<GlobalContextType | null>(null);
GlobalContext.displayName = 'GlobalContext';


// HELPER HOOK
export function useGlobalContext() {
  const ctx = useContext(GlobalContext);
  if (!ctx) {
    throw new Error('GlobalContext is null');
  }
  return ctx;
}


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


// PROVIDER
type PropTypes = { children: React.ReactNode };
export const GlobalContextProvider = ({ children }: PropTypes) => {
  const [engineerId] = useLocalStorage<string>({ key: 'engineer-id', defaultValue: ID });
  
  const ctxValue = useMemo(() => {
    return {
      ficsitTip: TIP,
      engineerId,
    }
  }, [engineerId]);

  return (
    <GlobalContext.Provider value={ctxValue}>
      {children}
    </GlobalContext.Provider>
  );
}
