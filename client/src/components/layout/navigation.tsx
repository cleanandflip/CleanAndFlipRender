import { useState } from "react";
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
import Logo from "@/components/common/logo";
import SearchBar from "@/components/products/search-bar";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { Menu, Search, ShoppingCart, User, X, LogOut, LogIn, UserPlus } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const { user, logoutMutation } = useAuth();

  const navigation = [
    { name: "Shop", href: "/products" },
    { name: "Sell", href: "/sell-to-us" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  return (
    <>
      {/* Main Navigation - Cleaner Layout */}
      <nav className="fixed top-4 left-4 right-4 z-50 glass rounded-xl px-6 py-3 max-w-7xl mx-auto">
        <div className="flex items-center justify-between w-full gap-4">
          {/* Left Side - Logo */}
          <div className="flex items-center flex-shrink-0">
            <Logo size="md" />
          </div>

          {/* Center - Navigation Menu */}
          <div className="hidden lg:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <span
                  className={`transition-all duration-200 font-medium cursor-pointer px-3 py-2 rounded-lg hover:bg-white/10 text-base whitespace-nowrap ${
                    isActive(item.href)
                      ? "text-accent-blue bg-accent-blue/10"
                      : "text-text-secondary hover:text-white"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            ))}
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center space-x-3 flex-shrink-0 min-w-0">
            {/* Desktop Search */}
            <div className="hidden lg:block">
              <SearchBar
                placeholder="Search equipment..."
                onSearch={(query) => {
                  window.location.href = `/products?search=${encodeURIComponent(query)}`;
                }}
              />
            </div>

            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden glass p-2 w-10 h-10 flex-shrink-0 text-text-secondary border border-transparent hover:text-white hover:bg-white/10 hover:shadow-lg hover:shadow-white/20 hover:border-white/20 transition-all duration-200"
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
                      variant="ghost"
                      size="icon"
                      className="group glass p-2 text-accent-blue w-10 h-10 flex-shrink-0 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:outline-none border border-accent-blue/30 relative overflow-hidden transition-all duration-300 hover:border-accent-blue/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:bg-accent-blue/10 data-[state=open]:border-accent-blue/60 data-[state=open]:shadow-[0_0_20px_rgba(59,130,246,0.3)] data-[state=open]:bg-accent-blue/10"
                    >
                      {/* Inner glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/0 via-accent-blue/5 to-accent-blue/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <User size={18} className="relative z-10" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="w-64 glass border-glass-border shadow-2xl backdrop-blur-xl z-[100]"
                    align="end"
                    sideOffset={8}
                    avoidCollisions={true}
                    collisionPadding={8}
                  >
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-glass-border">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-accent-blue/20 rounded-full flex items-center justify-center">
                        <User size={18} className="text-accent-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}
                        </p>
                        <p className="text-xs text-text-secondary truncate">
                          {user.firstName ? user.email : 'Clean & Flip Member'}
                        </p>
                      </div>
                      {user.isAdmin && (
                        <span className="text-xs bg-accent-blue px-2 py-1 rounded text-white font-medium">
                          ADMIN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="py-2">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center px-4 py-2 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                        <User className="mr-3 h-4 w-4" />
                        My Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="flex items-center px-4 py-2 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
                        <ShoppingCart className="mr-3 h-4 w-4" />
                        Order History
                      </Link>
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator className="bg-glass-border" />
                  
                  {/* Logout */}
                  <div className="py-2">
                    <DropdownMenuItem 
                      onClick={() => logoutMutation.mutate()} 
                      className="flex items-center px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link href="/auth">
                <Button
                  size="sm"
                  className="bg-accent-blue hover:bg-blue-500 text-white font-medium px-5 py-2 transition-colors whitespace-nowrap"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                className={`group glass relative p-2 w-10 h-10 flex-shrink-0 overflow-hidden transition-all duration-300 ${
                  isActive("/cart") 
                    ? "text-accent-blue border border-accent-blue/30 bg-accent-blue/10 shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
                    : "text-text-secondary border border-transparent hover:text-accent-blue hover:bg-accent-blue/10 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:border-accent-blue/60"
                }`}
              >
                {/* Inner glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/0 via-accent-blue/5 to-accent-blue/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <ShoppingCart size={18} className="relative z-10" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shadow-lg z-20">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden glass p-2 w-10 h-10 flex-shrink-0 text-text-secondary border border-transparent hover:text-white hover:bg-white/10 hover:shadow-lg hover:shadow-white/20 hover:border-white/20 transition-all duration-200"
                >
                  <Menu size={18} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="glass border-glass-border">
                <div className="flex items-center justify-between mb-8">
                  <Logo />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X size={20} />
                  </Button>
                </div>
                
                <nav className="space-y-4">
                  {navigation.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <a
                        className={`block px-4 py-3 rounded-lg transition-colors ${
                          isActive(item.href)
                            ? "bg-accent-blue text-white"
                            : "text-text-secondary hover:bg-white/10 hover:text-white"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.name}
                      </a>
                    </Link>
                  ))}
                  
                  <Link href="/dashboard">
                    <a
                      className={`block px-4 py-3 rounded-lg transition-colors ${
                        isActive("/dashboard")
                          ? "bg-accent-blue text-white"
                          : "text-text-secondary hover:bg-white/10 hover:text-white"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </a>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-glass-border">
            <SearchBar
              placeholder="Search equipment..."
              onSearch={(query) => {
                window.location.href = `/products?search=${encodeURIComponent(query)}`;
                setIsSearchOpen(false);
              }}
            />
          </div>
        )}
      </nav>

      {/* Spacer to prevent content from hiding behind fixed nav */}
      <div className="h-24"></div>
    </>
  );
}
