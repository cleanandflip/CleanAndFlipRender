import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { GlobalDropdown, DropdownItem, DropdownLabel, DropdownSeparator } from "@/components/ui/GlobalDropdown";
import { NavigationStateManager } from "@/lib/navigation-state";
import Logo from "@/components/common/logo";
import { UnifiedSearchBar } from "@/components/ui/UnifiedSearchBar";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Menu, Search, ShoppingCart, User, X, LogOut, LogIn, UserPlus, Settings, XCircle, Package, History, ChevronDown } from "lucide-react";

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


  // Track cart open state based on current location
  useEffect(() => {
    setIsCartOpen(location === ROUTES.CART);
  }, [location]);

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
      {/* Main Navigation - Cleaner Layout with Badge Support */}
      <nav className="fixed top-4 left-4 right-4 z-50 rounded-xl px-6 py-3 max-w-7xl mx-auto overflow-visible" style={{ 
        background: 'rgba(35, 41, 55, 0.4)', 
 
        border: '1px solid rgba(255, 255, 255, 0.08)' 
      }}>
        <div className="flex items-center justify-between w-full gap-4">
          {/* Left Side - Logo */}
          <div className="flex items-center flex-shrink-0">
            <button onClick={(e) => handleNavigation(ROUTES.HOME, e)}>
              <Logo size="md" />
            </button>
          </div>

          {/* Center - Navigation Menu */}
          <div className="hidden lg:flex items-center space-x-6">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigation(item.href, e);
                }}
                className={`transition-all duration-300 font-medium cursor-pointer px-3 py-2 rounded-lg text-base whitespace-nowrap ${
                  isActive(item.href)
                    ? "text-white bg-blue-500/30 border border-blue-400/50 shadow-md cursor-default"
                    : "text-text-secondary hover:text-blue-300 hover:bg-blue-500/10"
                }`}
                disabled={isActive(item.href)}
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center space-x-3 flex-shrink-0 min-w-0 overflow-visible p-1">
            {/* Desktop Search */}
            <div className="hidden lg:block">
              <UnifiedSearchBar
                placeholder="Search equipment..."
                onSearch={(query) => {
                  const searchUrl = `${ROUTES.PRODUCTS}?search=${encodeURIComponent(query)}`;
                  handleNavigation(searchUrl);
                }}
                onProductSelect={(product) => {
                  const productUrl = `/products/${product.id}`;
                  handleNavigation(productUrl);
                }}
                context="header"
                className="w-72"
              />
            </div>

            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden w-10 h-10 flex-shrink-0 transition-all duration-200 hover:bg-white/10"
              style={{
                background: 'rgba(75, 85, 99, 0.4)',
                border: '1px solid rgba(156, 163, 175, 0.4)',
                backdropFilter: 'blur(8px)',
                color: 'white',
                fontWeight: '500'
              }}
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search size={18} />
            </Button>

            {/* Account */}
            {user ? (
              <GlobalDropdown
                isOpen={isUserDropdownOpen}
                onOpenChange={setIsUserDropdownOpen}
                align="end"
                trigger={
                  <Button
                    variant="ghost"
                    className="h-10 px-3 flex-shrink-0 transition-all duration-200 flex items-center gap-2 hover:bg-white/10"
                    style={{
                      background: 'rgba(75, 85, 99, 0.4)',
                      border: '1px solid rgba(156, 163, 175, 0.4)',
                      backdropFilter: 'blur(8px)',
                      color: 'white',
                      fontWeight: '500'
                    }}
                  >
                    <User size={16} />
                    <span className="hidden sm:inline text-sm font-medium">{user.firstName || 'User'}</span>
                    <ChevronDown size={14} />
                  </Button>
                }
              >
                <DropdownLabel>
                  {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}
                </DropdownLabel>
                <DropdownSeparator />
                <DropdownItem 
                  onClick={() => {
                    handleNavigation(ROUTES.DASHBOARD);
                    setIsUserDropdownOpen(false);
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownItem>
                <DropdownItem 
                  onClick={() => {
                    handleNavigation(ROUTES.ORDERS);
                    setIsUserDropdownOpen(false);
                  }}
                >
                  <History className="mr-2 h-4 w-4" />
                  Order History
                </DropdownItem>
                {user.isAdmin && (
                  <>
                    <DropdownSeparator />
                    <DropdownItem 
                      onClick={() => {
                        handleNavigation(ROUTES.ADMIN);
                        setIsUserDropdownOpen(false);
                      }}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </DropdownItem>
                  </>
                )}
                <DropdownSeparator />
                <DropdownItem 
                  onClick={() => {
                    logoutMutation.mutate();
                    setIsUserDropdownOpen(false);
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownItem>
              </GlobalDropdown>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => handleNavigation(ROUTES.LOGIN, e)}
                className="font-medium px-5 py-2 whitespace-nowrap"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}

            {/* Cart */}
            <div className="relative">
              <button
                onClick={handleCartClick}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 focus:outline-none relative hover:bg-white/10"
                style={{
                  background: 'rgba(75, 85, 99, 0.4)',
                  border: isCartOpen ? '1px solid #3b82f6' : '1px solid rgba(156, 163, 175, 0.4)',
                  backdropFilter: 'blur(8px)',
                  color: 'white',
                  fontWeight: '500'
                }}
              >
                {isCartOpen ? (
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <X size={12} className="text-white" />
                  </div>
                ) : (
                  <ShoppingCart size={20} className="text-white" />
                )}
                
                {cartCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
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
                  className="lg:hidden w-10 h-10 flex-shrink-0"
                >
                  <Menu size={18} />
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
            <UnifiedSearchBar
              placeholder="Search equipment..."
              onSearch={(query: string) => {
                const searchUrl = `/products?search=${encodeURIComponent(query)}`;
                handleNavigation(searchUrl);
                setIsSearchOpen(false);
              }}
              onProductSelect={(product) => {
                const productUrl = `/products/${product.id}`;
                handleNavigation(productUrl);
                setIsSearchOpen(false);
              }}
              context="header"
              className="w-full"
            />
          </div>
        )}
      </nav>

      {/* Spacer to prevent content from hiding behind fixed nav */}
      <div className="h-24"></div>
    </>
  );
}