import React from 'react';
import styled from 'styled-components';
import { Icon } from 'semantic-ui-react';
import { useDrawerContext } from '../../contexts/drawer';
import Portal from '../Portal';

interface Props {
  open?: boolean,
  onToggle?: (newState: boolean) => void,
  children: React.ReactNode,
}

const Drawer = (props: Props) => {
  const { open, onToggle, children } = props;
  const ctx = useDrawerContext();
  return (
    <Portal rootNode={ctx.rootNode}>
      <DrawerDimmer open={!!open} onClick={() => { onToggle?.(!open); }} />
      <DrawerContainer open={!!open}>
        <DrawerToggle onClick={() => { onToggle?.(!open); }}>
          {
            open
              ? <Icon name='angle double left' />
              : <Icon name='angle double right' />
          }
        </DrawerToggle>
        <DrawerContent aria-hidden={!open}>
          {children}
        </DrawerContent>
      </DrawerContainer>
    </Portal>
  )
};

export default Drawer;

const DrawerDimmer = styled.div<{ open: boolean }>`
  position: absolute;
  top: 0px;
  left: 0px;
  bottom: 0px;
  right: 0px;
  margin: 0;
  padding: 0;
  background: #000;
  opacity: ${({ open }) => open ? 0.7 : 0.0 };
  transition: opacity 500ms;
  pointer-events: ${({ open }) => open ? 'auto' : 'none' }
`;

const DrawerContainer = styled.div<{ open: boolean }>`
  position: relative;
  top: 0px;
  left: ${({ open }) => open ? '0px' : 'calc(-1 * var(--drawer-width))' };
  width: var(--drawer-width);
  height: 100%;
  background: var(--background-color);
  transition: left 500ms;
  pointer-events: auto;
`;

const DrawerToggle = styled.button`
  position: absolute;
  display: block;
  top: 0px;
  bottom: 0px;
  right: calc(-1 * var(--drawer-button-width));
  width: var(--drawer-button-width);
`;

const DrawerContent = styled.div`
  width: 100%;
  height: 100%;
`;
