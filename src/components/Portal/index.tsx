import React from 'react';
import { createPortal } from 'react-dom';

interface Props {
  children: React.ReactNode,
  rootNode: Element | null,
  key?: string,
}

const Portal = (props: Props) => {
  const { children, rootNode, key } = props;
  if (rootNode) {
    return (
      createPortal(children, rootNode, key)
    );
  }
  return null;
};

export default Portal;
