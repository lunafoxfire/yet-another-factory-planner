import { useWindowEvent } from '@mantine/hooks';
import { useState, useCallback, useEffect } from 'react';

interface UseSessionStorage<T> {
  /** Session storage key */
  key: string;

  /** Default value that will be set if value is not found in session storage */
  defaultValue?: T;

  /** If set to true, value will be update is useEffect after mount */
  getInitialValueInEffect?: boolean;

  /** Function to serialize value into string to be save in session storage */
  serialize?(value: T | undefined): string;

  /** Function to deserialize string value from session storage to value */
  deserialize?(value: string | undefined): T;
}

function serializeJSON<T>(value: T | undefined) {
  try {
    return JSON.stringify(value);
  } catch (error) {
    throw new Error('@mantine/hooks use-session-storage: Failed to serialize the value');
  }
}

function deserializeJSON(value: string | undefined) {
  try {
    return JSON.parse((value as string));
  } catch {
    return value;
  }
}

export function useSessionStorage<T = string>({
  key,
  defaultValue = undefined,
  getInitialValueInEffect = false,
  deserialize = deserializeJSON,
  serialize = serializeJSON,
}: UseSessionStorage<T>) {
  const [value, setValue] = useState<T>(
    typeof window !== 'undefined' && 'sessionStorage' in window && !getInitialValueInEffect
      ? deserialize(window.sessionStorage.getItem(key) ?? undefined)
      : ((defaultValue ?? '') as T)
  );

  const setSessionStorageValue = useCallback(
    (val: T | ((prevState: T) => T)) => {
      if (val instanceof Function) {
        setValue((current) => {
          const result = val(current);
          window.sessionStorage.setItem(key, serialize(result));
          window.dispatchEvent(
            new CustomEvent('mantine-session-storage', { detail: { key, value: val(current) } })
          );
          return result;
        });
      } else {
        window.sessionStorage.setItem(key, serialize(val));
        window.dispatchEvent(
          new CustomEvent('mantine-session-storage', { detail: { key, value: val } })
        );
        setValue(val);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  useWindowEvent('storage', (event) => {
    if (event.storageArea === window.sessionStorage && event.key === key) {
      setValue(deserialize(event.newValue ?? undefined));
    }
  });

  useWindowEvent('mantine-session-storage', (event) => {
    if (event.detail.key === key) {
      setValue(event.detail.value);
    }
  });

  useEffect(() => {
    if (defaultValue !== undefined && value === undefined) {
      setSessionStorageValue(defaultValue);
    }
  }, [defaultValue, value, setSessionStorageValue]);

  useEffect(() => {
    if (getInitialValueInEffect) {
      setValue(
        deserialize(window.sessionStorage.getItem(key) ?? undefined) || ((defaultValue ?? '') as T)
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [value === undefined ? defaultValue : value, setSessionStorageValue] as const;
}

export const useSessionStorageValue = useSessionStorage;
