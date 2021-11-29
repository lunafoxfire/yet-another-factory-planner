import React from 'react';
import styled from 'styled-components';
import { Anchor } from '@mantine/core';

interface Props {
  href: string;
  icon: React.ReactNode;
}

const SocialIcon = (props: Props) => {
  const { href, icon } = props;
  return (
    <SAnchor href={href} target='_blank' rel='noopener noreferrer'>
      {icon || null}
    </SAnchor>
  );
};

export default SocialIcon;

const SAnchor = styled(Anchor)`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f0f0f0;

  &:hover {
    color: #ddd;
  }
`;
