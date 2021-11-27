import React from 'react';
import { ThemeProvider } from 'styled-components';
import { MantineProvider, useMantineTheme } from '@mantine/core';
import Main from './containers/Main';
import { DrawerProvider } from './contexts/drawer';
import { theme, styles } from './theme';

function App() {
  return (
    <MantineProvider
      theme={theme}
      styles={styles}
    >
      <ThemeTransfer />
    </MantineProvider>
  );
}

export default App;

const ThemeTransfer = () => {
  const mergedTheme = useMantineTheme();
  return (
    <ThemeProvider theme={mergedTheme}>
      <DrawerProvider>
        <Main />
      </DrawerProvider>
    </ThemeProvider>
  );
};
