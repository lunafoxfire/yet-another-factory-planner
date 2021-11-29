import React from 'react';
import styled from 'styled-components';
import { Title, Container, Group } from '@mantine/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import logo from '../../../assets/satisfactory_logo_full_color_small.png';
import SocialIcon from '../../../components/SocialIcon';

const SiteHeader = () => {
  return (
    <HeaderContainer fluid>
      <img src={logo} height={42} alt='Satisfactory logo' />
      <MainTitle>[Yet Another Factory Planner]</MainTitle>
      <BetaTag>(BETA)</BetaTag>
      <SocialLinks>
        <SocialIcon href='https://github.com/lydianlights/yet-another-factory-planner' icon={<FontAwesomeIcon icon={faGithub} fontSize={32} />} />
        <SocialIcon href='https://twitter.com/LydianLights' icon={<FontAwesomeIcon icon={faTwitter} fontSize={32} />} />
      </SocialLinks>
    </HeaderContainer>
  );
};

export default SiteHeader;

const HeaderContainer = styled(Container)`
  display: flex;
  margin-left: ${({ theme }) => theme.other.pageLeftMargin};
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

const SocialLinks = styled(Group)`
  display: flex;
  margin-left: auto;
  margin-right: 30px;
`;
