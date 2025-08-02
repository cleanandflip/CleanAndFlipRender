// Legacy SearchBar - replaced with new advanced search system
// This file is maintained for backward compatibility
// New search functionality is in @/components/search/SearchBar

import AdvancedSearchBar from '@/components/search/SearchBar';

// Backward compatibility wrapper - forwards to new SearchBar
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
    <AdvancedSearchBar 
      placeholder={placeholder}
      onSearch={onSearch}
      className={className}
    />
  );
}