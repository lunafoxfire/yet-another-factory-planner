import React, { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  children: React.ReactNode,
  rootNode?: HTMLElement | null,
  createRoot?: boolean,
  key?: string,
  style?: Partial<CSSStyleDeclaration>,
}

const Portal = forwardRef<HTMLElement, Props>((props, ref) => {
  const { children, rootNode, createRoot, key, style } = props;
  const target = useRef<HTMLElement | null>(document.createElement('div'));

  if (!createRoot) {
    target.current = rootNode || null;
  }

  useEffect(() => {
    if (createRoot && target.current) {
      if (style) {
        Object.entries(style).forEach(([key, value]) => {
          target.current!.style[key as any] = value as any;
        });
      }
      document.body.append(target.current);
    }

    return () => {
      if (createRoot && target.current) {
        target.current.remove();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(target.current);
      } else {
        ref.current = target.current;
      }
    }
  }, [ref, target]);

  if (!target.current) return null;
  return createPortal(children, target.current, key);
});

export default Portal;
