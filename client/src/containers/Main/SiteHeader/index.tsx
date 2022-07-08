import React from 'react';
import styled from 'styled-components';
import { Title, Container, Group, Select } from '@mantine/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faTwitter, faDiscord } from '@fortawesome/free-brands-svg-icons';
import logo from '../../../assets/satisfactory_logo_full_color_small.png';
import SocialIcon from '../../../components/SocialIcon';
import { DEFAULT_GAME_VERSION, GAME_VERSION_OPTIONS } from '../../../contexts/gameData/consts';
import { useGameDataContext } from '../../../contexts/gameData';

const SiteHeader = () => {
  const ctx = useGameDataContext();

  return (
    <HeaderContainer fluid>
      <img src={logo} height={42} alt='Satisfactory logo' />
      <MainTitle>[Yet Another Factory Planner]</MainTitle>
      <BetaTag>(BETA)</BetaTag>
      <RightAlign>
        <Select
          aria-label="Game version"
          data={GAME_VERSION_OPTIONS}
          value={ctx.gameVersion}
          onChange={(value) => { ctx.setGameVersion(value || DEFAULT_GAME_VERSION); }}
          disabled={ctx.loading}
          style={{ width: '200px' }}
        />
        <SocialIcon href='https://github.com/lydianlights/yet-another-factory-planner' icon={<FontAwesomeIcon icon={faGithub} fontSize={32} />} />
        <SocialIcon href='https://discord.gg/p7e9ZzRHCm' icon={<FontAwesomeIcon icon={faDiscord} fontSize={32} />} />
        <SocialIcon href='https://twitter.com/LydianLights' icon={<FontAwesomeIcon icon={faTwitter} fontSize={32} />} />
      </RightAlign>
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

const RightAlign = styled(Group)`
  display: flex;
  margin-left: auto;
  margin-right: 30px;
`;
