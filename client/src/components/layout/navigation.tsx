import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Logo from "@/components/common/logo";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Menu, Search, ShoppingCart, User, X, LogOut, LogIn, Settings, History, ChevronDown } from "lucide-react";

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
      {/* Professional Navigation - Global Theme Integration */}
      <nav className="bg-[#0f172a]/95 backdrop-blur-md border-b border-gray-800/30 sticky top-0 z-50">
        <div className="container mx-auto px-6">
          <div className="h-16 flex items-center justify-between">
            {/* Professional Logo with Brand Styling */}
            <button onClick={(e) => handleNavigation(ROUTES.HOME, e)} className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative bg-[#1e293b] border border-gray-700/50 rounded-lg px-3 py-2 group-hover:border-gray-600/50 transition-all">
                  <span className="text-white font-bold text-lg">C&F</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="text-white font-semibold">CLEAN & FLIP</div>
                <div className="text-gray-400 text-xs">Premium Sports Gear</div>
              </div>
            </button>

            {/* Navigation Links - Theme Consistent */}
            <div className="hidden md:flex items-center gap-2">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigation(item.href, e);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    isActive(item.href)
                      ? 'bg-white/10 text-white border border-gray-700/50'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  disabled={isActive(item.href)}
                >
                  {item.name}
                </button>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Search Bar with Theme Styling */}
              <div className="hidden md:block relative flex-1 max-w-md mx-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search equipment..."
                  className="w-full pl-10 pr-4 py-2 
                             bg-[#1e293b]/50 border border-gray-700/50 
                             rounded-lg text-white placeholder-gray-500
                             focus:bg-[#1e293b] focus:border-blue-500/50 
                             focus:ring-2 focus:ring-blue-500/20
                             transition-all duration-200"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const searchUrl = `${ROUTES.PRODUCTS}?search=${encodeURIComponent(e.currentTarget.value)}`;
                      handleNavigation(searchUrl);
                    }
                  }}
                />
              </div>

              {/* Mobile Search Toggle */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-all"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <Search className="w-5 h-5 text-gray-300" />
              </button>

              {/* User Account Section */}
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 
                               rounded-lg hover:bg-white/5 transition-all group"
                  >
                    <div className="relative">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 
                                      rounded-lg flex items-center justify-center shadow-lg
                                      group-hover:shadow-blue-500/25 transition-all">
                        <span className="text-white font-bold text-sm">
                          {user.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      {user.role === 'developer' && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 
                                        bg-purple-500 rounded-full 
                                        border-2 border-[#0f172a]" />
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200
                                            ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Professional Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 
                                    bg-[#1e293b]/95 backdrop-blur-md
                                    border border-gray-700/50 
                                    rounded-xl shadow-2xl overflow-hidden
                                    animate-slideDown z-50">
                      
                      {/* Header */}
                      <div className="px-4 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 
                                      border-b border-gray-700/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 
                                          rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">
                              {user.email?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium">{user.firstName || 'User'}</div>
                            <div className="text-gray-400 text-xs">{user.email}</div>
                          </div>
                        </div>
                        {user.role === 'developer' && (
                          <div className="mt-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 
                                           bg-purple-500/20 text-purple-400 
                                           text-xs font-medium rounded-full">
                              <Settings className="w-3 h-3" />
                              Developer Access
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-2">
                        <button
                          onClick={() => {
                            handleNavigation(ROUTES.DASHBOARD);
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 
                                    text-gray-300 hover:bg-white/5 hover:text-white 
                                    transition-all group text-left"
                        >
                          <div className="p-1.5 bg-white/5 rounded-lg 
                                         group-hover:bg-white/10 transition-all">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="text-sm">Dashboard</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            handleNavigation(ROUTES.ORDERS);
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 
                                    text-gray-300 hover:bg-white/5 hover:text-white 
                                    transition-all group text-left"
                        >
                          <div className="p-1.5 bg-white/5 rounded-lg 
                                         group-hover:bg-white/10 transition-all">
                            <History className="w-4 h-4" />
                          </div>
                          <span className="text-sm">Order History</span>
                        </button>
                        
                        {user.role === 'developer' && (
                          <>
                            <div className="my-2 mx-4 border-t border-gray-700/30" />
                            <button
                              onClick={() => {
                                handleNavigation(ROUTES.ADMIN);
                                setIsUserDropdownOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 
                                        text-purple-400 hover:bg-purple-500/10 
                                        transition-all group text-left"
                            >
                              <div className="p-1.5 bg-purple-500/10 rounded-lg 
                                             group-hover:bg-purple-500/20 transition-all">
                                <Settings className="w-4 h-4" />
                              </div>
                              <span className="text-sm">Developer Dashboard</span>
                            </button>
                          </>
                        )}
                        
                        <div className="my-2 mx-4 border-t border-gray-700/30" />
                        
                        <button 
                          onClick={() => {
                            logoutMutation.mutate();
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 
                                     text-red-400 hover:bg-red-500/10 
                                     transition-all group text-left"
                        >
                          <div className="p-1.5 bg-red-500/10 rounded-lg 
                                         group-hover:bg-red-500/20 transition-all">
                            <LogOut className="w-4 h-4" />
                          </div>
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
                  className="font-medium px-6 py-2.5 whitespace-nowrap"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              )}

              {/* Professional Cart Button */}
              <button
                onClick={handleCartClick}
                className="relative p-2 rounded-lg hover:bg-white/5 transition-all group"
              >
                {isCartOpen ? (
                  <X className="w-5 h-5 text-red-400 group-hover:text-red-300" />
                ) : (
                  <ShoppingCart className="w-5 h-5 text-gray-300 group-hover:text-white" />
                )}
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 
                                   min-w-[20px] h-5 px-1
                                   bg-gradient-to-r from-red-500 to-pink-500 
                                   text-white text-xs font-bold 
                                   rounded-full flex items-center justify-center
                                   shadow-lg shadow-red-500/25">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-all">
                    <Menu className="w-5 h-5 text-gray-300" />
                  </button>
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
            <div className="md:hidden px-6 pb-4 border-t border-gray-700/30">
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search equipment..."
                  className="w-full pl-10 pr-4 py-2 
                             bg-[#1e293b]/50 border border-gray-700/50 
                             rounded-lg text-white placeholder-gray-500
                             focus:bg-[#1e293b] focus:border-blue-500/50 
                             focus:ring-2 focus:ring-blue-500/20
                             transition-all duration-200"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const searchUrl = `${ROUTES.PRODUCTS}?search=${encodeURIComponent(e.currentTarget.value)}`;
                      handleNavigation(searchUrl);
                      setIsSearchOpen(false);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}