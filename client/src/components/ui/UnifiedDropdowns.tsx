import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { Search, ChevronDown, X, ShoppingBag, TrendingUp, MapPin, Menu, User, Settings, LogOut, Package } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  type: 'product' | 'category';
  id: string | number;
  text: string;
  meta: string;
  image?: string;
  url: string;
}

interface NavigationMenu {
  categories: Array<{ id: number; name: string; slug: string }>;
  featured: Array<{ id: number; name: string; price: string }>;
  quickLinks: Array<{ label: string; url: string }>;
}

// Unified Search Dropdown Component
export const UnifiedSearchDropdown: React.FC<{
  className?: string;
  placeholder?: string;
}> = ({ className = '', placeholder = 'Search equipment...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);
  const [, navigate] = useLocation();

  // Fetch suggestions
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setLoading(true);
      fetch(`/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`)
        .then(res => res.json())
        .then(data => {
          setSuggestions(data.suggestions || []);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
          setSuggestions([]);
        });
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          navigate(suggestions[selectedIndex].url);
          setIsOpen(false);
          setQuery('');
        } else if (query) {
          navigate(`/products?search=${encodeURIComponent(query)}`);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full pl-10 pr-10 py-3 bg-bg-secondary/50 backdrop-blur-sm",
            "border border-bg-secondary-border rounded-lg",
            "text-text-primary placeholder:text-text-secondary",
            "focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue",
            "transition-all duration-200"
          )}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (query.length >= 2 || suggestions.length > 0) && (
        <div className={cn(
          "absolute top-full left-0 right-0 mt-2",
          "bg-bg-secondary border border-bg-secondary-border rounded-lg shadow-2xl",
          "overflow-hidden z-50 animate-in fade-in slide-in-from-top-2"
        )}>
          {loading ? (
            <div className="p-8 text-center text-text-secondary">
              <div className="animate-pulse">Searching...</div>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {/* Category Results */}
              {suggestions.filter(s => s.type === 'category').length > 0 && (
                <div className="p-2 border-b border-bg-secondary-border">
                  <div className="px-3 py-1 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Categories
                  </div>
                  {suggestions.filter(s => s.type === 'category').map((item, idx) => (
                    <Link key={item.id} href={item.url}>
                      <a
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-md",
                          "hover:bg-bg-primary/20 transition-colors text-text-primary",
                          selectedIndex === suggestions.indexOf(item) && "bg-bg-primary/20"
                        )}
                        onMouseEnter={() => setSelectedIndex(suggestions.indexOf(item))}
                        onClick={() => setIsOpen(false)}
                      >
                        <span className="font-medium">{item.text}</span>
                        <span className="text-sm text-text-secondary">{item.meta}</span>
                      </a>
                    </Link>
                  ))}
                </div>
              )}

              {/* Product Results */}
              {suggestions.filter(s => s.type === 'product').length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Products
                  </div>
                  {suggestions.filter(s => s.type === 'product').map((item) => (
                    <Link key={item.id} href={item.url}>
                      <a
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md",
                          "hover:bg-bg-primary/20 transition-colors text-text-primary",
                          selectedIndex === suggestions.indexOf(item) && "bg-bg-primary/20"
                        )}
                        onMouseEnter={() => setSelectedIndex(suggestions.indexOf(item))}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.text}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{item.text}</div>
                        </div>
                        <div className="text-sm font-semibold text-accent-blue">{item.meta}</div>
                      </a>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-8 text-center">
              <p className="text-text-secondary">No results found for "{query}"</p>
              <button
                onClick={() => {
                  navigate(`/products?search=${encodeURIComponent(query)}`);
                  setIsOpen(false);
                }}
                className="mt-2 text-accent-blue hover:text-blue-400 font-medium transition-colors"
              >
                View all results →
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

// Unified Navigation Dropdown Component
export const UnifiedNavDropdown: React.FC<{
  trigger?: React.ReactNode;
  className?: string;
}> = ({ trigger, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menu, setMenu] = useState<NavigationMenu | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  // Fetch menu data
  useEffect(() => {
    if (isOpen && !menu) {
      fetch('/api/navigation/menu')
        .then(res => res.json())
        .then(data => setMenu(data))
        .catch(console.error);
    }
  }, [isOpen, menu]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const defaultTrigger = (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg",
        "text-text-primary hover:text-white hover:bg-bg-secondary/50",
        "transition-all duration-200",
        className
      )}
    >
      <Menu className="w-5 h-5" />
      <span className="font-medium">Menu</span>
      <ChevronDown className={cn(
        "w-4 h-4 transition-transform duration-200",
        isOpen && "rotate-180"
      )} />
    </button>
  );

  return (
    <div ref={dropdownRef} className="relative">
      {trigger ? (
        React.cloneElement(trigger as React.ReactElement, {
          onClick: () => setIsOpen(!isOpen)
        })
      ) : defaultTrigger}

      {/* Dropdown */}
      {isOpen && (
        <div className={cn(
          "absolute top-full right-0 mt-2 w-80",
          "bg-bg-secondary border border-bg-secondary-border rounded-lg shadow-2xl",
          "overflow-hidden z-50 animate-in fade-in slide-in-from-top-2"
        )}>
          {menu ? (
            <div className="p-4 space-y-6">
              {/* Quick Links */}
              <div>
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Quick Access
                </h3>
                <div className="space-y-1">
                  {menu.quickLinks.map((link, idx) => (
                    <Link key={idx} href={link.url}>
                      <a
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-bg-primary/20 transition-colors text-text-primary"
                        onClick={() => setIsOpen(false)}
                      >
                        <TrendingUp className="w-4 h-4 text-accent-blue" />
                        {link.label}
                      </a>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Categories */}
              {menu.categories.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
                    Categories
                  </h3>
                  <div className="grid grid-cols-2 gap-1">
                    {menu.categories.map((cat) => (
                      <Link key={cat.id} href={`/products?category=${cat.id}`}>
                        <a
                          className="px-3 py-2 rounded-md hover:bg-bg-primary/20 transition-colors text-text-primary text-sm"
                          onClick={() => setIsOpen(false)}
                        >
                          {cat.name}
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Featured Products */}
              {menu.featured.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
                    Featured
                  </h3>
                  <div className="space-y-1">
                    {menu.featured.map((product) => (
                      <Link key={product.id} href={`/products/${product.id}`}>
                        <a
                          className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-bg-primary/20 transition-colors text-text-primary"
                          onClick={() => setIsOpen(false)}
                        >
                          <span className="text-sm">{product.name}</span>
                          <span className="text-sm font-semibold text-accent-blue">${product.price}</span>
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="animate-pulse text-text-secondary">Loading menu...</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// User Account Dropdown Component
export const UnifiedUserDropdown: React.FC<{
  user: { id: string; email: string; displayName?: string; role?: string };
  onLogout: () => void;
  className?: string;
}> = ({ user, onLogout, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const menuItems = [
    {
      label: 'Dashboard',
      icon: <Settings className="w-4 h-4" />,
      onClick: () => {
        navigate('/dashboard');
        setIsOpen(false);
      }
    },
    {
      label: 'My Orders',
      icon: <Package className="w-4 h-4" />,
      onClick: () => {
        navigate('/orders');
        setIsOpen(false);
      }
    },
    {
      label: 'Sign Out',
      icon: <LogOut className="w-4 h-4" />,
      onClick: () => {
        onLogout();
        setIsOpen(false);
      },
      variant: 'destructive' as const
    }
  ];

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg",
          "text-text-primary hover:text-white hover:bg-bg-secondary/50",
          "transition-all duration-200"
        )}
      >
        <User className="w-5 h-5" />
        <span className="font-medium">{user.displayName || user.email}</span>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={cn(
          "absolute top-full right-0 mt-2 w-48",
          "bg-bg-secondary border border-bg-secondary-border rounded-lg shadow-2xl",
          "overflow-hidden z-50 animate-in fade-in slide-in-from-top-2"
        )}>
          <div className="p-2">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={item.onClick}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md",
                  "hover:bg-bg-primary/20 transition-colors text-left",
                  item.variant === 'destructive' 
                    ? "text-red-400 hover:text-red-300" 
                    : "text-text-primary"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Backward compatibility exports
export const UnifiedSearchBar = UnifiedSearchDropdown;
export const UnifiedActionDropdown = UnifiedNavDropdown;