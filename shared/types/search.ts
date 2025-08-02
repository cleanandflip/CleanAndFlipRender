export interface SearchResult {
  id: string;
  title: string;
  type: 'product' | 'category' | 'brand';
  subtitle?: string;
  price?: number;
  image?: string;
  url: string;
}

export interface SearchSuggestion {
  term: string;
  category?: string;
  count?: number;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  suggestions: SearchSuggestion[];
  recentSearches: string[];
  popularSearches: string[];
  isLoading: boolean;
  isOpen: boolean;
  selectedIndex: number;
}

export interface SearchFilters {
  categories?: string[];
  priceRange?: { min: number; max: number };
  brands?: string[];
  conditions?: string[];
}