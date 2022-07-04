import React from 'react';
import { Button, ButtonProps } from '@mantine/core';
import { Trash2 } from 'react-feather';

const TrashButton = (props: ButtonProps<React.ElementType<any>>) => {
  return (
    <Button { ...props} color='danger' style={{ ...(props?.style || {}), width: '36px', height: '36px', padding: '0px', flex: '0 0 auto' }}>
      <Trash2 size={20} />
    </Button>
  );
};

export default TrashButton;
