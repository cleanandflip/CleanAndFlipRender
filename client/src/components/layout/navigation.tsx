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
      <nav className="fixed top-4 left-4 right-4 z-50 glass rounded-xl px-8 py-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between w-full">
          {/* Left Side - Logo */}
          <div className="flex items-center flex-shrink-0 min-w-0">
            <Logo size="md" />
          </div>

          {/* Center - Navigation Menu */}
          <div className="hidden xl:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <span
                  className={`transition-all duration-200 font-medium cursor-pointer px-4 py-2 rounded-lg hover:bg-white/10 text-base whitespace-nowrap ${
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
          <div className="flex items-center space-x-2 flex-shrink-0 min-w-0">
            {/* Desktop Search */}
            <div className="hidden xl:block mr-2">
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
              className="xl:hidden glass hover:bg-white/20 p-2 transition-colors"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search size={18} />
            </Button>

            {/* Account */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`glass hover:bg-white/20 p-2 transition-colors ${
                      isActive("/dashboard") ? "text-accent-blue" : "text-text-secondary"
                    }`}
                  >
                    <User size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52 bg-slate-800 border-slate-700 shadow-xl">
                  <DropdownMenuItem className="text-slate-300 px-3 py-2">
                    <User className="mr-2 h-4 w-4" />
                    {user.firstName || user.email}
                    {user.isAdmin && (
                      <span className="ml-auto text-xs bg-blue-600 px-2 py-1 rounded">ADMIN</span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer text-slate-300 hover:text-white px-3 py-2">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="cursor-pointer text-slate-300 hover:text-white px-3 py-2">
                      Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem 
                    onClick={() => logoutMutation.mutate()} 
                    className="text-red-400 hover:text-red-300 cursor-pointer px-3 py-2"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                className={`glass hover:bg-white/20 relative p-2 transition-colors ${
                  isActive("/cart") ? "text-accent-blue" : "text-text-secondary"
                }`}
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shadow-lg">
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
                  className="xl:hidden glass hover:bg-white/20 p-2 transition-colors"
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
