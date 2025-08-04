import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { NavigationStateManager } from "@/lib/navigation-state";
import Logo from "@/components/common/logo";
import { EnhancedSearchBar } from "@/components/ui/EnhancedSearchBar";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Menu, Search, ShoppingCart, User, X, LogOut, LogIn, UserPlus, Settings, XCircle, Package } from "lucide-react";
import { ROUTES } from "@/config/routes";

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
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
              <EnhancedSearchBar
                context="header"
                placeholder="Search equipment..."
                onSearch={(query) => {
                  const searchUrl = `${ROUTES.PRODUCTS}?search=${encodeURIComponent(query)}`;
                  handleNavigation(searchUrl);
                }}
                className="w-72"
              />
            </div>

            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden bg-secondary p-2 w-10 h-10 flex-shrink-0 text-text-secondary border border-primary border-transparent hover:text-primary hover:bg-white/10 hover:shadow-lg hover:shadow-white/20 hover:border-white/20 transition-all duration-200"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search size={18} />
            </Button>

            {/* Account */}
            {user ? (
              <div className="relative">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 flex-shrink-0"
                    >
                      <User size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="w-64 bg-secondary border-bg-secondary-border border-primary shadow-2xl z-[100]"
                    align="end"
                    sideOffset={8}
                    avoidCollisions={true}
                    collisionPadding={8}
                  >
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-bg-secondary-border">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-500/20 rounded-full flex items-center justify-center">
                        <User size={18} className="text-slate-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary truncate">
                          {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}
                        </p>
                        <p className="text-xs text-text-secondary truncate">
                          {user.firstName ? user.email : 'Clean & Flip Member'}
                        </p>
                      </div>
                      {user.isAdmin && (
                        <span className="text-xs bg-slate-500 px-2 py-1 rounded text-primary font-medium">
                          ADMIN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="py-2 space-y-1">
                    <DropdownMenuItem asChild>
                      <div className="glass glass-hover rounded-lg mx-2 p-1">
                        <Link href={ROUTES.DASHBOARD} className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-primary transition-all duration-300 cursor-pointer rounded-md">
                          <User className="mr-3 h-4 w-4" />
                          My Dashboard
                        </Link>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <div className="glass glass-hover rounded-lg mx-2 p-1">
                        <Link href={ROUTES.ORDERS} className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-primary transition-all duration-300 cursor-pointer rounded-md">
                          <ShoppingCart className="mr-3 h-4 w-4" />
                          Order History
                        </Link>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <div className="glass glass-hover rounded-lg mx-2 p-1">
                        <Link href={`${ROUTES.DASHBOARD}?tab=submissions`} className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-primary transition-all duration-300 cursor-pointer rounded-md">
                          <Package className="mr-3 h-4 w-4" />
                          My Submissions
                        </Link>
                      </div>
                    </DropdownMenuItem>

                    {(user.role === 'developer' || user.role === 'admin' || user.isAdmin) && (
                      <DropdownMenuItem asChild>
                        <div className="glass glass-hover rounded-lg mx-2 p-1">
                          <Link href={ROUTES.ADMIN} className="flex items-center px-3 py-2 text-sm text-slate-300 hover:text-slate-100 transition-all duration-300 cursor-pointer rounded-md">
                            <Settings className="mr-3 h-4 w-4" />
                            Developer Dashboard
                          </Link>
                        </div>
                      </DropdownMenuItem>
                    )}
                  </div>

                  <DropdownMenuSeparator className="bg-bg-secondary-border" />
                  
                  {/* Logout */}
                  <div className="py-2">
                    <DropdownMenuItem asChild>
                      <Button
                        onClick={() => logoutMutation.mutate()} 
                        variant="outline"
                        className="w-full justify-start text-red-400 border-red-400/50 hover:bg-red-500/10 hover:border-red-400 mx-2"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Sign Out
                      </Button>
                    </DropdownMenuItem>
                  </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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

            {/* Cart - Toggle Button with Fixed Badge Overflow */}
            <div className="relative overflow-visible">
              <Button
                variant={isCartOpen ? 'primary' : 'outline'}
                size="sm"
                onClick={handleCartClick}
                className="h-8 group flex-shrink-0"
              >
                {/* Toggle between cart and close icon */}
                <div className="transition-transform duration-200">
                  {isCartOpen ? (
                    <XCircle size={16} className="animate-in fade-in-0 duration-200" />
                  ) : (
                    <ShoppingCart size={16} className="animate-in fade-in-0 duration-200" />
                  )}
                </div>
                
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center font-semibold shadow-lg z-10 animate-pulse shadow-blue-500/30">
                    {cartCount}
                  </span>
                )}
              </Button>
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
            <EnhancedSearchBar
              context="header"
              placeholder="Search equipment..."
              onSearch={(query) => {
                const searchUrl = `/products?search=${encodeURIComponent(query)}`;
                handleNavigation(searchUrl);
                setIsSearchOpen(false);
              }}
              autoFocus={true}
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
