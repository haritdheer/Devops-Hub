import { useState, useEffect } from 'react';

const LOCAL_KEY = 'dvh_visited';

export function useVisitorCount() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasVisited = localStorage.getItem(LOCAL_KEY);

    fetch('/api/visitors', {
      method: hasVisited ? 'GET' : 'POST',
    })
      .then(r => r.json())
      .then(data => {
        if (typeof data.count === 'number') {
          setCount(data.count);
          if (!hasVisited) localStorage.setItem(LOCAL_KEY, 'true');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { count, loading };
}
