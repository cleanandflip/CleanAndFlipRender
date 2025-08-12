import { useState, useEffect, useRef, useCallback } from 'react';
import { CATEGORY_LABELS, CategoryLabel, fromSlug, toSlug } from "@/lib/categories";
import { getQuery, setQuery, subscribe } from '@/lib/searchService';

export default function CategoryTabs() {
  const [current, setCurrent] = useState<CategoryLabel>('All Categories');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [mounted, setMounted] = useState(false);
  const tabListRef = useRef<HTMLUListElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  // Initialize from URL
  useEffect(() => {
    const query = getQuery();
    setCurrent(fromSlug(query.category || null));
    setMounted(true);
  }, []);
  
  // Subscribe to URL changes
  useEffect(() => {
    const unsubscribe = subscribe((query) => {
      setCurrent(fromSlug(query.category || null));
    });
    return unsubscribe;
  }, []);

  const select = useCallback((label: CategoryLabel) => {
    const slug = toSlug(label);
    setQuery({ category: slug, page: 1 });
    
    // Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'category_selected', {
        category: slug || 'all',
        previous_category: toSlug(current) || 'all'
      });
    }
  }, [current]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        const nextIndex = (index + 1) % CATEGORY_LABELS.length;
        buttonRefs.current[nextIndex]?.focus();
        setFocusedIndex(nextIndex);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        const prevIndex = index === 0 ? CATEGORY_LABELS.length - 1 : index - 1;
        buttonRefs.current[prevIndex]?.focus();
        setFocusedIndex(prevIndex);
        break;
      case 'Home':
        e.preventDefault();
        buttonRefs.current[0]?.focus();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        const lastIndex = CATEGORY_LABELS.length - 1;
        buttonRefs.current[lastIndex]?.focus();
        setFocusedIndex(lastIndex);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        select(CATEGORY_LABELS[index]);
        break;
    }
  };

  return (
    <nav 
      aria-label="Product Categories" 
      className="space-y-2"
      role="navigation"
    >
      <h3 className="font-bebas text-2xl mb-4 tracking-wider text-gray-900 dark:text-white">
        CATEGORIES
      </h3>
      
      <ul 
        ref={tabListRef}
        role="tablist"
        aria-orientation="vertical"
        className="space-y-1 relative"
      >
        {/* Active indicator */}
        <div 
          className="absolute left-0 w-1 bg-blue-500 rounded-r-lg transition-all duration-300 ease-out"
          style={{
            height: '40px',
            top: `${CATEGORY_LABELS.indexOf(current) * 44 + 4}px`,
            opacity: current !== 'All Categories' ? 1 : 0
          }}
          aria-hidden="true"
        />
        
        {CATEGORY_LABELS.map((label, index) => {
          const active = label === current;
          const isFocused = focusedIndex === index;
          
          return (
            <li 
              key={label}
              className={`
                transition-all duration-300 ease-out
                ${mounted ? `animation-delay-${index * 100}ms animate-fade-in-up` : 'opacity-0'}
              `}
              style={{ 
                animationDelay: mounted ? `${index * 100}ms` : '0ms',
                opacity: mounted ? 1 : 0 
              }}
            >
              <button
                ref={el => buttonRefs.current[index] = el}
                type="button"
                role="tab"
                tabIndex={active ? 0 : -1}
                aria-selected={active}
                aria-current={active ? "page" : undefined}
                onClick={() => select(label)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(-1)}
                className={`
                  group w-full text-left px-3 py-2 rounded-lg 
                  transition-all duration-200 ease-out
                  hover:scale-[1.02] hover:shadow-sm focus:scale-[1.02]
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  transform-gpu ${active ? 'translate-x-2' : 'hover:translate-x-1'}
                  ${active 
                    ? 'font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }
                  ${isFocused ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                  motion-safe:transition-transform motion-reduce:transition-none
                `}
                aria-label={`Filter by ${label} category`}
              >
                <span className="flex items-center justify-between">
                  {label}
                  {active && (
                    <span 
                      className="ml-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                      aria-hidden="true"
                    />
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      
      {/* Keyboard hints */}
      <div className="sr-only" aria-live="polite">
        {focusedIndex >= 0 && (
          `Category ${focusedIndex + 1} of ${CATEGORY_LABELS.length}: ${CATEGORY_LABELS[focusedIndex]}. 
           Use arrow keys to navigate, Enter to select.`
        )}
      </div>
    </nav>
  );
}

// CSS animations for staggered fade-in (add to your global CSS)
const styles = `
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.4s ease-out forwards;
}

@media (prefers-reduced-motion: reduce) {
  .motion-reduce\\:transition-none {
    transition: none !important;
  }
  
  .animate-fade-in-up {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('category-tabs-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'category-tabs-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}