import React from 'react';
import { ThemeProvider } from 'styled-components';
import { MantineProvider, useMantineTheme } from '@mantine/core';
import Main from './containers/Main';
import { DrawerProvider } from './contexts/drawer';


const theme: any = {
  colorScheme: 'light',
  primaryColor: 'blue',
  colors: {
    'danger': ['#fff5f5', '#ffe3e3', '#ffc9c9', '#ffa8a8', '#ff8787', '#ff6b6b', '#fa5252', '#f03e3e', '#e03131', '#c92a2a'],
  },
  radius: '0px',
  other: {
    headerHeight: '70px',
    drawerOpenWidth: '600px',
    drawerClosedWidth: '40px',
  },
};

function App() {
  return (
    <MantineProvider theme={theme}>
      <ThemeTransfer />
    </MantineProvider>
  );
}

export default App;

const ThemeTransfer = () => {
  const theme2 = useMantineTheme();
  console.log(theme2);
  return (
    <ThemeProvider theme={theme2}>
      <DrawerProvider>
        <Main />
      </DrawerProvider>
    </ThemeProvider>
  );
};
