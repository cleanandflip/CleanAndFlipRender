import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import * as React from "react";
import { Search, X } from "lucide-react";
import Logo from "@/components/common/logo";
import { Button, Card } from "@/components/shared/AnimatedComponents";
import ProductCard from "@/components/products/product-card";
import { DollarSign, Dumbbell, TrendingUp, Users, Clock, CheckCircle } from "lucide-react";
import CategoryGrid from "@/components/categories/category-grid";
import { productEvents } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/useWebSocket";
import { globalDesignSystem as theme } from "@/styles/design-system/theme";
import { searchService } from "@/lib/searchService";
import ProductsResults from "@/components/products/ProductsResults";
import { EmptyState } from "@/components/ui/EmptyState";
import { useProducts } from "@/hooks/useProducts";
import { useLocality } from "@/hooks/useLocality";
import { useAuth } from "@/hooks/use-auth";
import { LocalBadge } from "@/components/locality/LocalBadge";
import type { Product } from "@shared/schema";

function HomeSections() {
  const queryClient = useQueryClient();
  const { lastMessage, isConnected } = useWebSocket();
  const { data: locality } = useLocality();
  const { user } = useAuth();
  
  const { data: featuredProducts, refetch } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Always refetch when component mounts
    staleTime: 0, // Always consider data stale for real-time accuracy
    gcTime: 0, // No client-side caching to prevent stale data (v5)
    refetchInterval: 30000, // Auto-refetch every 30 seconds for live updates
  });

  // Real-time WebSocket event listeners for live sync
  useEffect(() => {
    if (lastMessage?.type === 'product_update') {
      // Product update received, refreshing featured products
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    }
  }, [lastMessage, refetch, queryClient]);

  // Legacy event listeners for admin updates
  useEffect(() => {
    const handleProductUpdate = () => {
      // Legacy product update event, refreshing
      refetch();
    };

    const handleRefreshProducts = () => {
      // Refresh products event, invalidating cache
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    };

    // Listen to both global productEvents and window events
    productEvents.addEventListener('productUpdated', handleProductUpdate);
    window.addEventListener('productUpdated', handleProductUpdate);
    window.addEventListener('refresh_products', handleRefreshProducts);
    window.addEventListener('storageChanged', handleProductUpdate);
    
    return () => {
      productEvents.removeEventListener('productUpdated', handleProductUpdate);
      window.removeEventListener('productUpdated', handleProductUpdate);
      window.removeEventListener('refresh_products', handleRefreshProducts);
      window.removeEventListener('storageChanged', handleProductUpdate);
    };
  }, [refetch, queryClient]);

  return (
    <motion.div 
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Locality Banner - Minimal */}
      {user && locality && (
        <motion.div 
          className="max-w-4xl mx-auto mb-8 px-6 pt-24"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {locality.isLocal ? (
            <div className="text-center bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-center gap-3">
                <LocalBadge isLocal={true} />
                <span className="text-green-800 font-medium">
                  Eligible for FREE Local Delivery! Local items deliver to your doorstep within 24-48 hours!
                </span>
              </div>
            </div>
          ) : !locality.hasAddress ? (
            <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-center gap-3">
                <LocalBadge isLocal={false} />
                <span className="text-blue-800 font-medium">
                  Add your address to check if you qualify for FREE Local Delivery
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-center gap-3">
                <LocalBadge isLocal={false} />
                <span className="text-gray-800 font-medium">
                  You're outside our Local Delivery area — shipping available
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Hero Section - Full Screen */}
      <section className="min-h-screen flex items-center justify-center pt-20 pb-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Main Heading */}
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="font-bebas text-6xl md:text-8xl mb-6 tracking-wider leading-tight">
              <span style={{ color: theme.colors.text.primary }}>FITNESS EQUIPMENT</span><br />
              <span style={{ color: theme.colors.brand.blue }}>THAT FITS YOUR HOME</span>
            </h1>
            <p 
              className="text-lg md:text-xl max-w-3xl mx-auto mb-4"
              style={{ color: theme.colors.text.secondary }}
            >
              We specialize in space-saving strength training equipment
            </p>
            <p 
              className="text-xl md:text-2xl max-w-3xl mx-auto mb-12 font-semibold"
              style={{ color: theme.colors.brand.blue }}
            >
              Dumbbells • Kettlebells • Plates • Barbells • More
            </p>
          </motion.div>

          {/* Two Paths - Enhanced Design */}
          <motion.div 
            className="grid md:grid-cols-2 gap-8 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Selling Path */}
            <Card interactive glow className="p-10 text-center">
              <div className="mb-8">
                <DollarSign 
                  className="mb-6 mx-auto" 
                  size={64} 
                  style={{ color: theme.colors.brand.green }}
                />
                <h2 
                  className="font-bebas text-4xl mb-3"
                  style={{ color: theme.colors.text.primary }}
                >
                  SELLING?
                </h2>
                <p 
                  className="text-lg"
                  style={{ color: theme.colors.text.secondary }}
                >
                  Cash for your equipment
                </p>
              </div>
              <Link href="/sell-to-us">
                <Button variant="success" size="lg" className="w-full text-lg">
                  Get Cash Offer
                </Button>
              </Link>
            </Card>

            {/* Buying Path */}
            <Card interactive glow className="p-10 text-center">
              <div className="mb-8">
                <Dumbbell 
                  className="mb-6 mx-auto" 
                  size={64} 
                  style={{ color: theme.colors.brand.blue }}
                />
                <h2 
                  className="font-bebas text-4xl mb-3"
                  style={{ color: theme.colors.text.primary }}
                >
                  BUYING?
                </h2>
                <p 
                  className="text-lg"
                  style={{ color: theme.colors.text.secondary }}
                >
                  Verified quality gear
                </p>
              </div>
              <Link href="/products">
                <Button variant="primary" size="lg" className="w-full text-lg">
                  Shop Equipment
                </Button>
              </Link>
            </Card>
          </motion.div>

          {/* Trust Bar - Enhanced */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="flex flex-col items-center p-4">
              <TrendingUp 
                className="mb-2" 
                size={24} 
                style={{ color: theme.colors.brand.blue }}
              />
              <span 
                className="font-bold text-lg"
                style={{ color: theme.colors.text.primary }}
              >
                452
              </span>
              <span 
                className="text-sm"
                style={{ color: theme.colors.text.muted }}
              >
                Transactions
              </span>
            </Card>
            <Card className="flex flex-col items-center p-4">
              <Users 
                className="mb-2" 
                size={24} 
                style={{ color: theme.colors.brand.blue }}
              />
              <span 
                className="font-bold text-lg"
                style={{ color: theme.colors.text.primary }}
              >
                Asheville
              </span>
              <span 
                className="text-sm"
                style={{ color: theme.colors.text.muted }}
              >
                Local
              </span>
            </Card>
            <Card className="flex flex-col items-center p-4">
              <Clock 
                className="mb-2" 
                size={24} 
                style={{ color: theme.colors.brand.blue }}
              />
              <span 
                className="font-bold text-lg"
                style={{ color: theme.colors.text.primary }}
              >
                Same Day
              </span>
              <span 
                className="text-sm"
                style={{ color: theme.colors.text.muted }}
              >
                Free Local Delivery
              </span>
            </Card>
            <Card className="flex flex-col items-center p-4">
              <CheckCircle 
                className="mb-2" 
                size={24} 
                style={{ color: theme.colors.brand.green }}
              />
              <span 
                className="font-bold text-lg"
                style={{ color: theme.colors.text.primary }}
              >
                Space-Efficient
              </span>
              <span 
                className="text-sm"
                style={{ color: theme.colors.text.muted }}
              >
                Home Gym Ready
              </span>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section - Full Screen */}
      <section className="min-h-screen flex items-center py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Simple Process */}
            <motion.div 
              className="space-y-12"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 
                className="font-bebas text-5xl mb-12 tracking-wider"
                style={{ color: theme.colors.text.primary }}
              >
                SIMPLE PROCESS
              </h2>

              {/* Sellers Process */}
              <Card className="p-8">
                <h3 
                  className="font-bebas text-3xl mb-8 tracking-wider"
                  style={{ color: theme.colors.brand.green }}
                >
                  SELL YOUR EQUIPMENT
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                      style={{ 
                        backgroundColor: theme.colors.brand.green,
                        color: theme.colors.text.primary 
                      }}
                    >
                      1
                    </div>
                    <span 
                      className="text-lg"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Submit photos online
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                      style={{ 
                        backgroundColor: theme.colors.brand.green,
                        color: theme.colors.text.primary 
                      }}
                    >
                      2
                    </div>
                    <span 
                      className="text-lg"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Get cash offer in 48hrs
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                      style={{ 
                        backgroundColor: theme.colors.brand.green,
                        color: theme.colors.text.primary 
                      }}
                    >
                      3
                    </div>
                    <span 
                      className="text-lg"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      We pick up & pay cash
                    </span>
                  </div>
                </div>
                <Link href="/sell-to-us">
                  <Button variant="success" size="lg" className="w-full mt-8">
                    Start Selling →
                  </Button>
                </Link>
              </Card>

              {/* Buyers Process */}
              <Card className="p-8">
                <h3 
                  className="font-bebas text-3xl mb-8 tracking-wider"
                  style={{ color: theme.colors.brand.blue }}
                >
                  BUY QUALITY GEAR
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                      style={{ 
                        backgroundColor: theme.colors.brand.blue,
                        color: theme.colors.text.primary 
                      }}
                    >
                      1
                    </div>
                    <span 
                      className="text-lg"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Browse verified equipment
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                      style={{ 
                        backgroundColor: theme.colors.brand.blue,
                        color: theme.colors.text.primary 
                      }}
                    >
                      2
                    </div>
                    <span 
                      className="text-lg"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Secure checkout
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                      style={{ 
                        backgroundColor: theme.colors.brand.blue,
                        color: theme.colors.text.primary 
                      }}
                    >
                      3
                    </div>
                    <span 
                      className="text-lg"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Fast delivery or pickup
                    </span>
                  </div>
                </div>
                <Link href="/products">
                  <Button variant="primary" size="lg" className="w-full mt-8">
                    Start Shopping →
                  </Button>
                </Link>
              </Card>
            </motion.div>

            {/* Right Side - Latest Activity */}
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h3 
                className="font-bebas text-4xl tracking-wider"
                style={{ color: theme.colors.text.primary }}
              >
                LATEST ACTIVITY
              </h3>

              {/* Live Stats */}
              <Card className="p-8">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span 
                      className="text-lg"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Items Available
                    </span>
                    <span 
                      className="font-bold text-2xl"
                      style={{ color: theme.colors.brand.blue }}
                    >
                      234
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span 
                      className="text-lg"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Sold This Week
                    </span>
                    <span 
                      className="font-bold text-2xl"
                      style={{ color: theme.colors.brand.green }}
                    >
                      18
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span 
                      className="text-lg"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      People Shopping
                    </span>
                    <span 
                      className="font-bold text-2xl"
                      style={{ color: theme.colors.status.warning }}
                    >
                      12
                    </span>
                  </div>
                </div>
              </Card>

              {/* Live Sync Status */}
              <div className="flex items-center gap-2 mb-4">
                <div 
                  className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <span 
                  className="text-xs"
                  style={{ color: theme.colors.text.muted }}
                >
                  {isConnected ? 'Live Updates Active' : 'Connecting...'}
                </span>
              </div>

              {/* Featured Items */}
              {featuredProducts && featuredProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {featuredProducts.slice(0, 4).map((product) => (
                    <ProductCard key={product.id} product={product} compact />
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <span 
                    className="text-lg"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    {featuredProducts === undefined ? 'Loading latest items...' : 'No items available yet'}
                  </span>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 px-6 spacing-section">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 
              className="font-bebas text-5xl mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              SHOP BY CATEGORY
            </h2>
            <p 
              className="text-lg"
              style={{ color: theme.colors.text.secondary }}
            >
              Find exactly what you need for your home gym
            </p>
          </motion.div>

          <CategoryGrid />
        </div>
      </section>
    </motion.div>
  );
}

export default function Home() {
  const [q, setQ] = React.useState(searchService.getQuery().q);

  React.useEffect(() => searchService.subscribe(() => setQ(searchService.getQuery().q)), []);

  // If no query -> render original home. Query present -> render inline results.
  if (!q) return <HomeSections />;

  const clear = () => searchService.setQuery({ q: "", page: 1 });

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-primary to-bg-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Inline "search mode" header: show current query and an X to exit */}
        <div className="flex items-center justify-between mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6 text-blue-500" />
            <span className="text-lg font-medium text-gray-900 dark:text-white">
              Results for "{q}"
            </span>
          </div>
          <button 
            type="button" 
            onClick={clear} 
            aria-label="Clear search"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>

        <ProductsResults
          fetchProducts={useProducts}
          emptyState={<EmptyState type="no-results" title={`No matches for "${q}"`} description="Clear or try another term." showActions={true} />}
        />
      </div>
    </div>
  );
}
