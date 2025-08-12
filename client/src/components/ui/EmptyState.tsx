import { Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getQueryFromURL, setQueryInURL } from '@/lib/searchService';

interface EmptyStateProps {
  type: 'no-results' | 'no-products' | 'category-empty';
  title?: string;
  description?: string;
  showActions?: boolean;
}

export function EmptyState({
  type,
  title,
  description,
  showActions = true
}: EmptyStateProps) {
  const query = getQueryFromURL();
  
  const handleClearSearch = () => {
    setQueryInURL({ q: '' });
  };
  
  const handleClearCategory = () => {
    setQueryInURL({ category: '' });
  };
  
  const handleClearAll = () => {
    setQueryInURL({ q: '', category: '' });
  };

  const getDefaultContent = () => {
    switch (type) {
      case 'no-results':
        return {
          icon: Search,
          title: title || `No results found${query.q ? ` for "${query.q}"` : ''}`,
          description: description || `We couldn't find any products matching your search${query.category ? ` in ${query.category}` : ''}.`
        };
      case 'category-empty':
        return {
          icon: Package,
          title: title || `No products in this category`,
          description: description || `We don't currently have any products in this category. Check back soon!`
        };
      case 'no-products':
      default:
        return {
          icon: Package,
          title: title || 'No products available',
          description: description || 'We don\'t have any products available at the moment.'
        };
    }
  };
  
  const { icon: Icon, title: defaultTitle, description: defaultDescription } = getDefaultContent();
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title || defaultTitle}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        {description || defaultDescription}
      </p>
      
      {showActions && (
        <div className="flex flex-wrap gap-3 justify-center">
          {query.q && (
            <Button 
              variant="outline" 
              onClick={handleClearSearch}
              className="text-sm"
            >
              Clear search
            </Button>
          )}
          
          {query.category && (
            <Button 
              variant="outline" 
              onClick={handleClearCategory}
              className="text-sm"
            >
              View all categories
            </Button>
          )}
          
          {(query.q || query.category) && (
            <Button 
              onClick={handleClearAll}
              className="text-sm"
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}
      
      {!query.q && !query.category && (
        <Button 
          onClick={() => window.location.href = '/'}
          variant="outline"
          className="text-sm"
        >
          Browse our homepage
        </Button>
      )}
    </div>
  );
}