import React, { createContext, useContext, useState } from 'react';
import styled from 'styled-components';
import { useMantineTheme } from '@mantine/core';

export type DrawerContextType = {
  rootNode: HTMLDivElement | null,
};


// CONTEXT
export const DrawerContext = createContext<DrawerContextType | null>(null);
DrawerContext.displayName = 'DrawerContext';


// HELPER HOOK
export function useDrawerContext() {
  const ctx = useContext(DrawerContext);
  if (!ctx) {
    throw new Error('DrawerContext is null');
  }
  return ctx;
}


// PROVIDER
type Props = {
  children: React.ReactNode,
};
export const DrawerProvider = (props: Props) => {
  const { children } = props;
  const [rootNode, setRootNode] = useState<HTMLDivElement | null>(null);
  const theme = useMantineTheme();

  function setRef(ref: HTMLDivElement | null) {
    setRootNode((prevState) => {
      if (prevState !== ref) return ref;
      return prevState;
    });
  }

  return (
    <DrawerContext.Provider value={{ rootNode }}>
      <DrawerRoot ref={setRef} topOffset={theme.other.headerHeight} />
      {children}
    </DrawerContext.Provider>
  );
}

const DrawerRoot = styled.div<{ topOffset: string }>`
  position: fixed;
  top: ${({ topOffset }) => topOffset};
  left: 0px;
  bottom: 0px;
  right: 0px;
  z-index: 1000;
  margin: 0;
  padding: 0;
  pointer-events: none;
`;
