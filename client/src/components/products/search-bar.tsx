// Legacy SearchBar - updated to use new unified search system
// This file is maintained for backward compatibility
// New search functionality is in @/components/ui/UnifiedSearchBar

import { SearchNavDropdown } from '@/components/ui';

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
    <SearchNavDropdown
      placeholder={placeholder}
      onSearch={onSearch}
      className={className}
    />
  );
}