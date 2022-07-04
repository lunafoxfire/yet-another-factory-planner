import React from 'react';
import styled from 'styled-components';
import { Info } from 'react-feather';
import { Tooltip } from '@mantine/core';

interface Props {
  label: string,
  tooltip: string,
}

const LabelWithTooltip = (props: Props) => {
  const { label, tooltip } = props;
  
  return (
    <Label>
      {label}{' '}
      <Tooltip
        label={tooltip}
        withArrow
        color='dark'
        width={230}
        wrapLines
        arrowSize={8}
      >
        <Info size={12} />
      </Tooltip>
    </Label>
  );
};

export default LabelWithTooltip;

const Label = styled.div`
  position: relative;
  cursor: pointer;
`;
