export class NavigationStateManager {
  private static STORAGE_KEY = 'nav-state';
  private static PREVIOUS_PATH_KEY = 'prev-path';
  
  // Save current state with navigation context
  static saveState(path: string, state: any, fromPath: string) {
    const navState = {
      [path]: {
        state,
        savedAt: Date.now(),
        fromPath
      }
    };
    
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(navState));
    sessionStorage.setItem(this.PREVIOUS_PATH_KEY, fromPath);
  }
  
  // Get state only if coming from specific path
  static getState(path: string, expectedFromPath?: string): any {
    const stored = sessionStorage.getItem(this.STORAGE_KEY);
    const previousPath = sessionStorage.getItem(this.PREVIOUS_PATH_KEY);
    
    if (!stored) return null;
    
    try {
      const navState = JSON.parse(stored);
      const pathState = navState[path];
      
      if (!pathState) return null;
      
      // If expectedFromPath is provided, only return state if it matches
      if (expectedFromPath && previousPath !== expectedFromPath) {
        this.clearState(path);
        return null;
      }
      
      // Clear state if older than 30 minutes
      if (Date.now() - pathState.savedAt > 30 * 60 * 1000) {
        this.clearState(path);
        return null;
      }
      
      return pathState.state;
    } catch {
      return null;
    }
  }
  
  // Clear state for a specific path
  static clearState(path: string) {
    const stored = sessionStorage.getItem(this.STORAGE_KEY);
    if (!stored) return;
    
    try {
      const navState = JSON.parse(stored);
      delete navState[path];
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(navState));
    } catch {
      // Invalid state, clear all
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
  }
  
  // Clear all navigation state
  static clearAll() {
    sessionStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem(this.PREVIOUS_PATH_KEY);
  }
  
  // Check if we came from a product detail page
  static isFromProductDetail(): boolean {
    const previousPath = sessionStorage.getItem(this.PREVIOUS_PATH_KEY);
    return previousPath ? previousPath.startsWith('/products/') : false;
  }
  
  // Update previous path
  static updatePreviousPath(path: string) {
    sessionStorage.setItem(this.PREVIOUS_PATH_KEY, path);
  }
}