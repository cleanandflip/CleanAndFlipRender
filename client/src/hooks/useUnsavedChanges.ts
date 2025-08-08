// NATIVE UNSAVED CHANGES DETECTION
import { useEffect, useRef, useState } from 'react';

interface UseUnsavedChangesOptions {
  hasChanges: boolean;
  message?: string;
}

export function useUnsavedChanges({ 
  hasChanges, 
  message = 'You have unsaved changes. Do you want to save them?' 
}: UseUnsavedChangesOptions) {
  const [showDialog, setShowDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => void>(() => {});
  const isNavigating = useRef(false);

  // Disable Replit's beforeunload when we have changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges && !isNavigating.current) {
        // Prevent Replit's dialog and show our own
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
    };

    if (hasChanges) {
      // Override any existing beforeunload handlers
      window.onbeforeunload = null;
      window.addEventListener('beforeunload', handleBeforeUnload, true);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload, true);
    };
  }, [hasChanges, message]);

  const confirmNavigation = (callback: () => void) => {
    if (hasChanges) {
      setShowDialog(true);
      setPendingAction(() => callback);
      return false;
    }
    callback();
    return true;
  };

  const handleSave = () => {
    setShowDialog(false);
    return true;
  };

  const handleDiscard = () => {
    setShowDialog(false);
    isNavigating.current = true;
    pendingAction();
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  return {
    showDialog,
    confirmNavigation,
    handleSave,
    handleDiscard,
    handleCancel
  };
}