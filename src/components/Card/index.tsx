// import React from 'react';
import styled from 'styled-components';
import { Paper } from '@mantine/core';

const Card = styled(Paper)`
  margin-bottom: 20px;
  border-left: 5px solid ${({ theme }) => theme.colors.primary[7]};
`;

export default Card;
