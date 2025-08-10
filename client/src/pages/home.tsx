import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import Logo from "@/components/common/logo";
import { UnifiedButton } from "@/components/ui/UnifiedButton";
import { Card } from "@/components/shared/AnimatedComponents";
import ProductCard from "@/components/products/product-card";
import { DollarSign, Dumbbell, TrendingUp, Users, Clock, CheckCircle } from "lucide-react";
import CategoryGrid from "@/components/categories/category-grid";
import { productEvents } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/useWebSocket";
import { globalDesignSystem as theme } from "@/styles/design-system/theme";
import type { Product } from "@shared/schema";

export default function Home() {
  const queryClient = useQueryClient();
  const { lastMessage, isConnected } = useWebSocket();
  
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

      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    }
  }, [lastMessage, refetch, queryClient]);

  // Legacy event listeners for admin updates
  useEffect(() => {
    const handleProductUpdate = () => {

      refetch();
    };

    const handleRefreshProducts = () => {

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
              <span className="text-white">THE WEIGHTLIFTING</span><br />
              <span className="text-blue-400">EQUIPMENT EXCHANGE</span>
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-12 text-gray-300">
              Turn your unused gear into cash. Buy quality equipment you can trust.
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
                <DollarSign className="mb-6 mx-auto text-green-400 w-16 h-16" />
                <h2 className="font-bebas text-4xl mb-3 text-white">
                  SELLING?
                </h2>
                <p className="text-lg text-gray-300">
                  Cash for your equipment
                </p>
              </div>
              <Link href="/sell-to-us">
                <UnifiedButton variant="success" size="lg" className="w-full text-lg">
                  Get Cash Offer
                </UnifiedButton>
              </Link>
            </Card>

            {/* Buying Path */}
            <Card interactive glow className="p-10 text-center">
              <div className="mb-8">
                <Dumbbell className="mb-6 mx-auto text-blue-400 w-16 h-16" />
                <h2 className="font-bebas text-4xl mb-3 text-white">
                  BUYING?
                </h2>
                <p className="text-lg text-gray-300">
                  Verified quality gear
                </p>
              </div>
              <Link href="/products">
                <UnifiedButton variant="primary" size="lg" className="w-full text-lg">
                  Shop Equipment
                </UnifiedButton>
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
              <TrendingUp className="mb-2 text-blue-400 w-6 h-6" />
              <span className="font-bold text-lg text-white">
                452
              </span>
              <span className="text-sm text-gray-400">
                Transactions
              </span>
            </Card>
            <Card className="flex flex-col items-center p-4">
              <Users className="mb-2 text-blue-400 w-6 h-6" />
              <span className="font-bold text-lg text-white">
                Asheville
              </span>
              <span className="text-sm text-gray-400">
                Local
              </span>
            </Card>
            <Card className="flex flex-col items-center p-4">
              <Clock className="mb-2 text-blue-400 w-6 h-6" />
              <span className="font-bold text-lg text-white">
                Same Day
              </span>
              <span className="text-sm text-gray-400">
                Cash
              </span>
            </Card>
            <Card className="flex flex-col items-center p-4">
              <CheckCircle className="mb-2 text-green-400 w-6 h-6" />
              <span className="font-bold text-lg text-white">
                Inspected
              </span>
              <span className="text-sm text-gray-400">
                Every Item
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
                <h3 className="font-bebas text-3xl mb-8 tracking-wider text-green-400">
                  SELL YOUR EQUIPMENT
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-green-400 text-white">
                      1
                    </div>
                    <span className="text-lg text-gray-300">
                      Submit photos online
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-green-400 text-white">
                      2
                    </div>
                    <span className="text-lg text-gray-300">
                      Get cash offer in 48hrs
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-green-400 text-white">
                      3
                    </div>
                    <span className="text-lg text-gray-300">
                      We pick up & pay cash
                    </span>
                  </div>
                </div>
                <Link href="/sell-to-us">
                  <UnifiedButton variant="success" size="lg" className="w-full mt-8">
                    Start Selling →
                  </UnifiedButton>
                </Link>
              </Card>

              {/* Buyers Process */}
              <Card className="p-8">
                <h3 className="font-bebas text-3xl mb-8 tracking-wider text-blue-400">
                  BUY QUALITY GEAR
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-blue-400 text-white">
                      1
                    </div>
                    <span className="text-lg text-gray-300">
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
                    <span className="text-lg text-gray-300">
                      Fast delivery or pickup
                    </span>
                  </div>
                </div>
                <Link href="/products">
                  <UnifiedButton variant="primary" size="lg" className="w-full mt-8">
                    Start Shopping →
                  </UnifiedButton>
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
              <h3 className="font-bebas text-4xl tracking-wider text-white">
                LATEST ACTIVITY
              </h3>

              {/* Live Stats */}
              <Card className="p-8">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg text-gray-300">
                      Items Available
                    </span>
                    <span className="font-bold text-2xl text-blue-400">
                      234
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg text-gray-300">
                      Sold This Week
                    </span>
                    <span className="font-bold text-2xl text-green-400">
                      18
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg text-gray-300">
                      People Shopping
                    </span>
                    <span className="font-bold text-2xl text-orange-400">
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
                <span className="text-xs text-gray-500">
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
                  <span className="text-lg text-gray-300">
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
            <h2 className="font-bebas text-5xl mb-4 text-white">
              SHOP BY CATEGORY
            </h2>
            <p className="text-lg text-gray-300">
              Find exactly what you need for your home gym
            </p>
          </motion.div>

          <CategoryGrid />
        </div>
      </section>
    </motion.div>
  );
}
