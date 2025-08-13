import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import SearchBar from "@/components/search/SearchBar";
import { NavigationStateManager } from "@/lib/navigation-state";
import Logo from "@/components/common/logo";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Menu, Search, ShoppingCart, User, X, LogOut, LogIn, UserPlus, Settings, XCircle, Package, History, ChevronDown, LayoutDashboard, Code, LayoutGrid, Code2, Shield } from "lucide-react";
import { LocalBadge } from "@/components/locality/LocalBadge";
import { useLocality } from "@/hooks/useLocality";

import { ROUTES } from "@/config/routes";

export default function Navigation() {
  const [location, setLocation] = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  // Cart functionality with real-time updates - FIXED DATA ACCESS
  const { data: cart } = useCart();  
  const cartCount = cart?.items?.length || 0;
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const { data: locality } = useLocality();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);


  // Track cart open state based on current location
  useEffect(() => {
    setIsCartOpen(location === ROUTES.CART);
  }, [location]);

  // Position calculations and outside click handling for portal
  useEffect(() => {
    if (!isUserDropdownOpen || !triggerRef.current) return;
    
    const calculatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      
      const rect = trigger.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom + 8 + window.scrollY,
        left: rect.right - 320 + window.scrollX, // Align right edge
        width: 320
      });
    };
    
    calculatePosition();
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (dropdownRef.current && !dropdownRef.current.contains(target) && 
          triggerRef.current && !triggerRef.current.contains(target)) {
        setIsUserDropdownOpen(false);
      }
    };

    const handleScroll = () => calculatePosition();
    const handleResize = () => calculatePosition();
    
    // Delay to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
    }, 10);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
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

  // Cart button toggle with SSOT profile completion check
  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated first
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to access your cart",
        variant: "default",
        action: (
          <button 
            onClick={() => setLocation('/auth')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
          >
            Sign In
          </button>
        )
      });
      return;
    }
    
    // CART ACCESS UNRESTRICTED - Users can browse cart freely, address required only at checkout
    
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
          <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
            {/* Search Bar - Enhanced responsive layout */}
            <div className="flex-1 sm:flex-none min-w-0">
              <SearchBar 
                size="md"
                placeholder="Search equipment..."
                className="w-full sm:w-[min(90vw,360px)]"
              />
            </div>
            
            {/* Visual separator before user section - desktop only */}
            <div className="hidden lg:block h-8 w-px bg-white/10" />

            {/* Account - Professional Dropdown */}
            {user ? (
              <div className="relative">
                <button 
                  ref={triggerRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUserDropdownOpen(!isUserDropdownOpen);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/60 hover:bg-white/20 h-11 min-w-[44px] cursor-pointer"
                  style={{
                    background: 'rgba(75, 85, 99, 0.4)',
                    border: '1px solid rgba(156, 163, 175, 0.4)',
                    backdropFilter: 'blur(8px)',
                    color: 'white',
                    fontWeight: '500',
                  }}
                >
                  <User className="w-5 h-5 text-gray-300" />
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
                    isUserDropdownOpen ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Portal-rendered dropdown menu */}
                {isUserDropdownOpen && dropdownCoords && createPortal(
                  <div
                    ref={dropdownRef}
                    style={{ 
                      position: 'absolute', 
                      top: dropdownCoords.top, 
                      left: dropdownCoords.left, 
                      width: dropdownCoords.width, 
                      zIndex: 60 
                    }}
                    className="transition duration-200"
                  >
                    <div className="rounded-xl border bg-popover text-popover-foreground shadow-xl overflow-hidden">
                      {/* Profile Section - Enhanced visibility */}
                      <div className="px-3 py-2.5 rounded-lg bg-muted/60 mb-2 mx-2 mt-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-white/20 flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {user?.firstName?.[0]?.toUpperCase() || 
                               user?.email?.[0]?.toUpperCase() || 
                               'U'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {user?.firstName && user?.lastName 
                                ? `${user?.firstName} ${user?.lastName}` 
                                : user?.email?.split('@')[0] || 'User'
                              }
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user?.email}
                            </p>
                            {user?.role?.includes('developer') && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
                                Developer
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Navigation Links */}
                      <div className="py-1 px-1">
                        {/* First item: LocalBadge */}
                        <div className="px-3 py-2.5 mb-2">
                          <LocalBadge isLocal={locality?.isLocal ?? false} />
                        </div>

                        {/* Second line: Dynamic locality message */}

                        
                        <button
                          onClick={() => {
                            handleNavigation(ROUTES.DASHBOARD);
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-md select-none transition-[background,transform,opacity] duration-150 ease-out hover:bg-muted/60 hover:translate-x-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 cursor-pointer"
                        >
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Dashboard</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            handleNavigation(ROUTES.ORDERS);
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-md select-none transition-[background,transform,opacity] duration-150 ease-out hover:bg-muted/60 hover:translate-x-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 cursor-pointer"
                        >
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">My Orders</span>
                        </button>

                        {user?.role?.includes('developer') && (
                          <button
                            onClick={() => {
                              handleNavigation(ROUTES.ADMIN);
                              setIsUserDropdownOpen(false);
                            }}
                            className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-md select-none transition-[background,transform,opacity] duration-150 ease-out hover:bg-muted/60 hover:translate-x-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 cursor-pointer"
                          >
                            <Shield className="w-4 h-4 text-blue-400" />
                            <span className="text-sm">Developer Dashboard</span>
                          </button>
                        )}
                        
                        {/* Divider */}
                        <div className="my-2 h-px bg-border/60" />

                        <button
                          onClick={() => {
                            logoutMutation.mutate();
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-md select-none transition-[background,transform,opacity] duration-150 ease-out hover:bg-muted/60 hover:translate-x-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-red-400">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
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
                    variant="outline"
                    onClick={() => {
                      handleNavigation(ROUTES.PRODUCTS);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Shop
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>


      </nav>

      {/* Spacer to prevent content from hiding behind fixed nav - Enhanced */}
      <div className="h-28"></div>
    </>
  );
}