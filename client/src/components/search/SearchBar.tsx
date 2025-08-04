// Legacy SearchBar - updated to use new enhanced search system
// This file is maintained for backward compatibility
// New search functionality is in @/components/ui/UnifiedSearchBar

import { UnifiedSearchBar } from '@/components/ui/UnifiedSearchBar';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  onResultClick?: (result: any) => void;
  variant?: 'default' | 'hero' | 'navbar';
  showSuggestions?: boolean;
  autoFocus?: boolean;
}

export default function SearchBar({
  className,
  placeholder = "Search equipment...",
  onSearch,
  onResultClick,
  variant = 'default',
  showSuggestions = true,
  autoFocus = false
}: SearchBarProps) {
  return (
    <UnifiedSearchBar 
      context="header"
      placeholder={placeholder}
      onSearch={onSearch}
      className={className}
      autoFocus={autoFocus}
    />
  );
}