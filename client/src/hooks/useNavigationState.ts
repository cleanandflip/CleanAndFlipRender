import { useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';

interface NavigationState {
  scrollPosition: number;
  activeTab?: string;
  filters?: Record<string, unknown>;
  expandedItems?: string[];
}

export function useNavigationState(key: string) {
  const [location] = useLocation();
  
  // Save state before navigation
  const saveState = useCallback((state: NavigationState) => {
    const currentPath = location;
    const savedStates = JSON.parse(sessionStorage.getItem('navigationStates') || '{}');
    savedStates[currentPath] = {
      ...state,
      timestamp: Date.now()
    };
    sessionStorage.setItem('navigationStates', JSON.stringify(savedStates));
  }, [location]);
  
  // Restore state when returning to page
  const restoreState = useCallback((): NavigationState | null => {
    const currentPath = location;
    const savedStates = JSON.parse(sessionStorage.getItem('navigationStates') || '{}');
    return savedStates[currentPath] || null;
  }, [location]);
  
  // Clean up old states (older than 30 minutes)
  useEffect(() => {
    const savedStates = JSON.parse(sessionStorage.getItem('navigationStates') || '{}');
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    
    Object.keys(savedStates).forEach(path => {
      if (now - savedStates[path].timestamp > thirtyMinutes) {
        delete savedStates[path];
      }
    });
    
    sessionStorage.setItem('navigationStates', JSON.stringify(savedStates));
  }, []);
  
  return { saveState, restoreState };
}