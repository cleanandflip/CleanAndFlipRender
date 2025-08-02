// Legacy SearchBar - updated to use new enhanced search system
// This file is maintained for backward compatibility
// New search functionality is in @/components/ui/EnhancedSearchBar

import { EnhancedSearchBar } from '@/components/ui/EnhancedSearchBar';

// Backward compatibility wrapper - forwards to new Enhanced SearchBar
interface LegacySearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
}

export function SearchBar({ 
  placeholder = "Search equipment...", 
  onSearch, 
  className 
}: LegacySearchBarProps) {
  return (
    <EnhancedSearchBar 
      context="header"
      placeholder={placeholder}
      onSearch={onSearch}
      className={className}
    />
  );
}