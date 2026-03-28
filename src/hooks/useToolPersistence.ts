import { useEffect, useState } from 'react';

export function useToolPersistence(key: string, defaultValue: string) {
  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(key) || defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  }, [key, value]);

  return [value, setValue] as const;
}
