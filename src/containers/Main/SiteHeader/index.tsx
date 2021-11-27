import React from 'react';
import styled from 'styled-components';
import { Title, Container } from '@mantine/core';
import logo from '../../../assets/satisfactory_logo_full_color_small.png';

const SiteHeader = () => {
  return (
    <HeaderContainer fluid>
      <img src={logo} height={42} alt='Satisfactory logo' />
      <MainTitle>[Yet Another Factory Planner]</MainTitle>
      <BetaTag>(BETA)</BetaTag>
    </HeaderContainer>
  );
};

export default SiteHeader;

const HeaderContainer = styled(Container)`
  display: flex;
  margin-left: ${({ theme }) => theme.other.drawerClosedWidth};
  padding: 0px;
`;

const MainTitle = styled(Title)`
  position: relative;
  top: 1px;
  font-size: 32px;
  color: #fff;
  margin-left: 25px;
  white-space: nowrap;
  font-family: 'Indie Flower', sans-serif;
`;

const BetaTag = styled.div`
  position: relative;
  left: 7px;
  top: 3px;
  font-size: 24px;
  color: #fff;
  font-family: 'Fjalla One', sans-serif;
  transform: rotate(20deg);
`;
