import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Logo from "@/components/common/logo";
import SearchBar from "@/components/products/search-bar";
import { useCart } from "@/hooks/use-cart";
import { Menu, Search, ShoppingCart, User, X } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount } = useCart();

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
      {/* Main Navigation */}
      <nav className="fixed top-6 left-6 right-6 z-50 glass rounded-2xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo & Menu */}
          <div className="flex items-center space-x-8">
            <Logo size="lg" />
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <a
                    className={`transition-colors font-medium ${
                      isActive(item.href)
                        ? "text-accent-blue"
                        : "text-text-secondary hover:text-white"
                    }`}
                  >
                    {item.name}
                  </a>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Side - Search, Account, Cart */}
          <div className="flex items-center space-x-4">
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
              className="lg:hidden glass hover:bg-white/10"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search size={20} />
            </Button>

            {/* Account */}
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="icon"
                className={`glass hover:bg-white/10 ${
                  isActive("/dashboard") ? "text-accent-blue" : "text-text-secondary"
                }`}
              >
                <User size={20} />
              </Button>
            </Link>

            {/* Cart */}
            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                className={`glass hover:bg-white/10 relative ${
                  isActive("/cart") ? "text-accent-blue" : "text-text-secondary"
                }`}
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent-blue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
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
                  className="md:hidden glass hover:bg-white/10"
                >
                  <Menu size={20} />
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
