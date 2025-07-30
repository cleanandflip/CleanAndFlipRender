import { useState, useEffect } from 'react';

export function useLiveData(endpoint: string, interval: number = 30000) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
        console.error('Failed to fetch live data:', error);
        setError(error);
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