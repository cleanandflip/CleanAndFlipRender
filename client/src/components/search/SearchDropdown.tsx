import React from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Search, X, Package, Tag, DollarSign } from 'lucide-react';
import { SearchResult, SearchSuggestion } from '@shared/types/search';
import { cn } from '@/lib/utils';

interface SearchDropdownProps {
  query: string;
  results: SearchResult[];
  suggestions: SearchSuggestion[];
  recentSearches: string[];
  popularSearches: string[];
  isLoading: boolean;
  selectedIndex: number;
  onResultClick: (result: SearchResult) => void;
  onSearchClick: (query: string) => void;
  onClearHistory: () => void;
}

export default function SearchDropdown({
  query,
  results,
  suggestions,
  recentSearches,
  popularSearches,
  isLoading,
  selectedIndex,
  onResultClick,
  onSearchClick,
  onClearHistory,
}: SearchDropdownProps) {
  const hasQuery = query.length >= 2;
  const hasResults = results.length > 0;
  const hasRecentSearches = recentSearches.length > 0;
  const hasPopularSearches = popularSearches.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute top-full left-0 right-0 mt-2 z-50"
    >
      <div className="bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-lg shadow-2xl max-h-96 overflow-hidden">
        <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {hasQuery ? (
            // Search Results
            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-400">Searching...</span>
                </div>
              ) : hasResults ? (
                <>
                  <div className="text-sm font-medium text-gray-400 mb-3">
                    Search Results ({results.length})
                  </div>
                  <div className="space-y-1">
                    {results.map((result, index) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => onResultClick(result)}
                        className={cn(
                          "w-full text-left px-3 py-3 rounded-lg transition-all duration-150 flex items-center group",
                          "hover:bg-gray-700/50",
                          selectedIndex === index && "bg-gray-700/50"
                        )}
                      >
                        <div className="mr-3 flex-shrink-0">
                          {result.type === 'product' && (
                            <Package size={16} className="text-gray-400 group-hover:text-blue-400" />
                          )}
                          {result.type === 'category' && (
                            <Tag size={16} className="text-gray-400 group-hover:text-green-400" />
                          )}
                          {result.type === 'brand' && (
                            <Search size={16} className="text-gray-400 group-hover:text-purple-400" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium truncate">
                            {result.title}
                          </div>
                          {result.subtitle && (
                            <div className="text-gray-400 text-sm truncate">
                              {result.subtitle}
                            </div>
                          )}
                        </div>
                        
                        {result.price && (
                          <div className="flex items-center text-blue-400 font-medium ml-2">
                            <DollarSign size={14} />
                            {result.price}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Search size={28} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No results found for "{query}"</p>
                  <p className="text-xs mt-1 opacity-60">Try different keywords</p>
                </div>
              )}
            </div>
          ) : (
            // Recent and Popular Searches
            <div className="p-4 space-y-6">
              {/* Recent Searches */}
              {hasRecentSearches && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Clock size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-400">
                        Recent Searches
                      </span>
                    </div>
                    <button
                      onClick={onClearHistory}
                      className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search, index) => (
                      <button
                        key={`recent-${index}`}
                        onClick={() => onSearchClick(search)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-700/30 rounded-lg transition-all duration-150 flex items-center group"
                      >
                        <Clock size={14} className="text-gray-500 mr-3 group-hover:text-blue-400" />
                        <span className="text-gray-300">{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              {hasPopularSearches && (
                <div>
                  <div className="flex items-center mb-3">
                    <TrendingUp size={16} className="text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-400">
                      Popular Searches
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {popularSearches.map((search, index) => (
                      <button
                        key={`popular-${index}`}
                        onClick={() => onSearchClick(search)}
                        className="text-left px-3 py-2 hover:bg-gray-700/30 rounded-lg transition-all duration-150 flex items-center group"
                      >
                        <TrendingUp size={14} className="text-gray-500 mr-3 group-hover:text-green-400" />
                        <span className="text-gray-300">{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No recent/popular searches fallback */}
              {!hasRecentSearches && !hasPopularSearches && (
                <div className="text-center py-8 text-gray-400">
                  <Search size={28} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Start typing to search equipment</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}