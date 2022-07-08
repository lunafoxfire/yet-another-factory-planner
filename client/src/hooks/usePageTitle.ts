import { useEffect } from 'react';

export function usePageTitle(value: string) {
  useEffect(() => {
    document.title = value;
  }, [value])
}
