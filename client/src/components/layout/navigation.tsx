import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UnifiedDropdown, UnifiedSearch } from "@/components/ui";
import { NavigationStateManager } from "@/lib/navigation-state";
import Logo from "@/components/common/logo";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Menu, Search, ShoppingCart, User, X, LogOut, LogIn, UserPlus, Settings, XCircle, Package, History, ChevronDown, LayoutDashboard, Code, LayoutGrid, Code2 } from "lucide-react";

import { ROUTES } from "@/config/routes";

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const { cartCount } = useCart();
  const { user, logoutMutation } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);


  // Track cart open state based on current location
  useEffect(() => {
    setIsCartOpen(location === ROUTES.CART);
  }, [location]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-dropdown-container')) {
        setIsUserDropdownOpen(false);
      }
    };

    if (isUserDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isUserDropdownOpen]);

  const navigation = [
    { name: "Shop", href: ROUTES.PRODUCTS },
    { name: "Sell", href: ROUTES.SUBMIT_EQUIPMENT },
    { name: "About", href: ROUTES.ABOUT },
    { name: "Contact", href: ROUTES.CONTACT },
  ];

  const isActive = (href: string) => {
    if (!href || !location) return false;
    if (href === ROUTES.HOME && location === ROUTES.HOME) return true;
    if (href !== ROUTES.HOME && location.startsWith(href)) return true;
    return false;
  };

  // Smart navigation with state management
  const handleNavigation = (href: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    // Don't navigate if already on this page
    if (location === href) {
      return;
    }
    
    // Clear products state when navigating to non-product pages
    if (href && href !== ROUTES.PRODUCTS && !href.startsWith('/products/')) {
      NavigationStateManager.clearState(ROUTES.PRODUCTS);
    }
    
    setLocation(href);
  };

  // Cart button toggle behavior
  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!isCartOpen) {
      // Save current location before opening cart
      if (location !== ROUTES.CART) {
        setPreviousPath(location);
        sessionStorage.setItem('cartPreviousPath', location);
      }
      setLocation(ROUTES.CART);
    } else {
      // Cart is open, go back to previous view
      const savedPath = sessionStorage.getItem('cartPreviousPath') || previousPath;
      if (savedPath && savedPath !== ROUTES.CART) {
        setLocation(savedPath);
        sessionStorage.removeItem('cartPreviousPath');
      } else {
        setLocation(ROUTES.PRODUCTS); // fallback
      }
    }
  };

  return (
    <>
      {/* Main Navigation - Enhanced Spacing & Polish */}
      <nav className="fixed top-4 left-4 right-4 z-50 rounded-xl px-6 lg:px-8 py-4 max-w-7xl mx-auto overflow-visible" style={{ 
        background: 'rgba(35, 41, 55, 0.4)', 
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)' 
      }}>
        <div className="flex items-center justify-between w-full gap-6">
          {/* Left Side - Logo */}
          <div className="flex items-center flex-shrink-0">
            <button onClick={(e) => handleNavigation(ROUTES.HOME, e)}>
              <Logo size="md" />
            </button>
          </div>

          {/* Center - Navigation Menu with Enhanced Spacing */}
          <div className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigation(item.href, e);
                }}
                className={`transition-all duration-300 font-medium cursor-pointer px-4 py-2.5 rounded-lg text-base whitespace-nowrap ${
                  isActive(item.href)
                    ? "text-white bg-blue-500/30 border border-blue-400/50 shadow-md cursor-default"
                    : "text-text-secondary hover:text-blue-300 hover:bg-white/5"
                }`}
                disabled={isActive(item.href)}
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Right Side - Actions with Enhanced Spacing */}
          <div className="flex items-center space-x-4 flex-shrink-0 min-w-0 overflow-visible">
            {/* Visual separator before user section */}
            <div className="hidden lg:block h-8 w-px bg-white/10" />
            {/* Desktop Search with Enhanced Width */}
            <div className="hidden lg:block flex-1 max-w-md mx-4">
              <UnifiedSearch
                placeholder="Search equipment..."
                onSearch={(query) => {
                  const searchUrl = `${ROUTES.PRODUCTS}?search=${encodeURIComponent(query)}`;
                  handleNavigation(searchUrl);
                }}
                onSelect={(result) => {
                  handleNavigation(result.url);
                }}
                className="w-full"
                variant="navbar"
              />
            </div>

            {/* Mobile Search Toggle with Enhanced Touch Target */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden w-11 h-11 flex-shrink-0 transition-all duration-200 hover:bg-white/10"
              style={{
                background: 'rgba(75, 85, 99, 0.4)',
                border: '1px solid rgba(156, 163, 175, 0.4)',
                backdropFilter: 'blur(8px)',
                color: 'white',
                fontWeight: '500'
              }}
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search size={20} />
            </Button>

            {/* Account - Professional Dropdown */}
            {user ? (
              <div className="relative user-dropdown-container" ref={dropdownRef}>
                <button 
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-200 h-11"
                  style={{
                    background: 'rgba(75, 85, 99, 0.4)',
                    border: '1px solid rgba(156, 163, 175, 0.4)',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  <User className="w-5 h-5 text-gray-300" />
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
                    isUserDropdownOpen ? 'rotate-180' : ''
                  }`} />
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 
                                  rounded-xl shadow-2xl 
                                  overflow-hidden"
                       style={{ 
                         background: 'rgba(35, 41, 55, 0.4)', 
                         backdropFilter: 'blur(12px)',
                         border: '1px solid rgba(255, 255, 255, 0.08)' 
                       }}>
                    
                    

                    {/* Menu Items Container */}
                    <div className="py-1">
                      {/* Dashboard */}
                      <button
                        onClick={() => {
                          handleNavigation(ROUTES.DASHBOARD);
                          setIsUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 
                                  text-gray-300 hover:bg-white/5 
                                  transition-colors group text-left"
                      >
                        <LayoutGrid className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Dashboard</span>
                      </button>

                      {/* Order History */}
                      <button
                        onClick={() => {
                          handleNavigation(ROUTES.ORDERS);
                          setIsUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 
                                  text-gray-300 hover:bg-white/5 
                                  transition-colors group text-left"
                      >
                        <History className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Order History</span>
                      </button>

                      {/* Developer Dashboard - Conditional */}
                      {user?.role === 'developer' && (
                        <>
                          <button
                            onClick={() => {
                              handleNavigation(ROUTES.ADMIN);
                              setIsUserDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 
                                      text-purple-400 hover:bg-purple-500/10 
                                      transition-colors group text-left"
                          >
                            <Code2 className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium">Developer Dashboard</span>
                          </button>
                        </>
                      )}

                      {/* Sign Out */}
                      <button
                        onClick={() => {
                          logoutMutation.mutate();
                          setIsUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 
                                  text-red-400 hover:bg-red-500/10 
                                  transition-colors group text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => handleNavigation(ROUTES.LOGIN, e)}
                className="font-medium px-6 py-2.5 whitespace-nowrap h-11"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}

            {/* Cart with Enhanced Touch Target */}
            <div className="relative">
              <button
                onClick={handleCartClick}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 focus:outline-none relative hover:bg-white/10 h-11 min-w-[44px]"
                style={{
                  background: 'rgba(75, 85, 99, 0.4)',
                  border: isCartOpen ? '1px solid #3b82f6' : '1px solid rgba(156, 163, 175, 0.4)',
                  backdropFilter: 'blur(8px)',
                  color: 'white',
                  fontWeight: '500'
                }}
              >
                {isCartOpen ? (
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <X size={14} className="text-white" />
                  </div>
                ) : (
                  <ShoppingCart size={22} className="text-white" />
                )}
                
                {cartCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full min-w-[22px] h-[22px] flex items-center justify-center font-semibold px-1">
                    {cartCount}
                  </div>
                )}
              </button>
            </div>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden w-11 h-11 flex-shrink-0"
                >
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-secondary border-bg-secondary-border">
                <div className="flex items-center justify-between mb-8">
                  <Logo />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X size={20} />
                  </Button>
                </div>
                
                <nav className="space-y-4">
                  {navigation.map((item) => (
                    <Button
                      key={item.name}
                      variant={isActive(item.href) ? "primary" : "outline"}
                      onClick={() => {
                        handleNavigation(item.href);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full justify-start"
                      disabled={isActive(item.href)}
                    >
                      {item.name}
                    </Button>
                  ))}
                  
                  <Button
                    variant={isActive("/dashboard") ? "primary" : "outline"}
                    onClick={() => {
                      handleNavigation("/dashboard");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start"
                    disabled={isActive("/dashboard")}
                  >
                    Dashboard
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-bg-secondary-border">
            <UnifiedSearch
              placeholder="Search equipment..."
              onSearch={(query: string) => {
                const searchUrl = `/products?search=${encodeURIComponent(query)}`;
                handleNavigation(searchUrl);
                setIsSearchOpen(false);
              }}
              onSelect={(result) => {
                handleNavigation(result.url);
                setIsSearchOpen(false);
              }}
              className="w-full"
              variant="page"
            />
          </div>
        )}
      </nav>

      {/* Spacer to prevent content from hiding behind fixed nav - Enhanced */}
      <div className="h-28"></div>
    </>
  );
}