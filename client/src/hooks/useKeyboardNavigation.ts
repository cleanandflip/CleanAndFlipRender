import { useEffect } from 'react';

interface UseKeyboardNavigationProps {
  isOpen: boolean;
  items: any[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onEnter: (item: any) => void;
  onEscape: () => void;
}

export function useKeyboardNavigation({
  isOpen,
  items,
  selectedIndex,
  onSelect,
  onEnter,
  onEscape
}: UseKeyboardNavigationProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          onSelect(Math.min(selectedIndex + 1, items.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          onSelect(Math.max(selectedIndex - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && items[selectedIndex]) {
            onEnter(items[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onEscape();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, selectedIndex, onSelect, onEnter, onEscape]);
}