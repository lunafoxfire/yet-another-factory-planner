// import React from 'react';
import styled from 'styled-components';
import { Text } from '@mantine/core';
import Card from '../Card';

export const Section = styled(Card)`
  background: ${({ theme }) => theme.colors.background[1]};
  box-shadow: 0px 0px 24px -6px #0F1011;
  border: 3px solid ${({ theme }) => theme.colors.background[3]};
  padding: 20px;
`;

export const SectionDescription = styled(Text)`
  margin-bottom: 20px;
`;
