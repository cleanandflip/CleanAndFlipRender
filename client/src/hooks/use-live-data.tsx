import { useState, useEffect } from 'react';

export function useLiveData<T = unknown>(endpoint: string, interval: number = 30000) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (error) {
        // Failed to fetch live data
        setError(error instanceof Error ? error : new Error('Failed to fetch live data'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const timer = setInterval(fetchData, interval);
    
    return () => clearInterval(timer);
  }, [endpoint, interval]);

  return { data, isLoading, error };
}