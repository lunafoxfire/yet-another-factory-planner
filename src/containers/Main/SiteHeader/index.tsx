import React from 'react';
import { Title } from '@mantine/core';

const SiteHeader = () => {
  return (
    <div>
      <Title style={{ display: 'inline-block' }}>Yet Another Factory Planner</Title>
      <Title order={2} style={{ display: 'inline-block', color: 'red', fontWeight: 'bold', fontSize: '20px', marginLeft: '30px' }}>This site is in ALPHA and is subject to breaking changes without warning!!</Title>
    </div>
  );
};

export default SiteHeader;
