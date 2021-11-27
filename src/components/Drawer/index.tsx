import React from 'react';
import styled from 'styled-components';
import { useDrawerContext } from '../../contexts/drawer';
import Portal from '../Portal';
import { UnstyledButton } from '@mantine/core';

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
          <ToggleLabel>
            <ToggleLabelText>Factory Options</ToggleLabelText>
          </ToggleLabel>
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
  transition: opacity 550ms;
  pointer-events: ${({ open }) => open ? 'auto' : 'none' };
`;

const DrawerContainer = styled.div<{ open: boolean }>`
  position: relative;
  top: 0px;
  left: ${({ open, theme }) => (open ? '0px' : `-${theme.other.drawerOpenWidth}`)};
  width: ${({ theme }) => theme.other.drawerOpenWidth};
  height: 100%;
  background: ${({ theme }) => theme.colors.background[0]};
  transition: left 550ms;
  transition-timing-function: cubic-bezier(.68, -0.21, .38, 1.26);
  pointer-events: auto;
`;

const DrawerToggle = styled(UnstyledButton)`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0px;
  bottom: 0px;
  right: -25px;
  width: 25px;
  background: ${({ theme }) => theme.colors.primary[7]};
`;

const ToggleLabel = styled(UnstyledButton)`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  right: -20px;
  width: 40px;
  height: 200px;
  border-radius: 2px;
  font-size: 18px;
  font-weight: bold;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  background: ${({ theme }) => theme.colors.primary[7]};
  color: ${({ theme }) => theme.white};

  ::before {
    content: '';
    position: absolute;
    top: -25px;
    right: 3px;
    width: 40px;
    height: 28px;
    background: ${({ theme }) => theme.colors.primary[7]};
    transform: rotate(60deg);
  }

  ::after {
    content: '';
    position: absolute;
    bottom: -25px;
    right: 3px;
    width: 40px;
    height: 28px;
    background: ${({ theme }) => theme.colors.primary[7]};
    transform: rotate(-60deg);
  }
`;

const ToggleLabelText = styled.span`
  position: relative;
  left: -8px;
`;

const DrawerContent = styled.div`
  width: 100%;
  height: 100%;
`;
