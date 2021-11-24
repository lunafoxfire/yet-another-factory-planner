import React from 'react';
import Main from './containers/Main';
import { DrawerProvider } from './contexts/drawer';

function App() {
  return (
    <DrawerProvider>
      <Main />
    </DrawerProvider>
  );
}

export default App;
