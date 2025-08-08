import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import Logo from "@/components/common/logo";
import { Button, Card } from "@/components/shared/AnimatedComponents";
import ProductCard from "@/components/products/product-card";
import { DollarSign, Dumbbell, TrendingUp, Users, Clock, CheckCircle } from "lucide-react";
import CategoryGrid from "@/components/categories/category-grid";
import { productEvents } from "@/lib/queryClient";
import { globalDesignSystem as theme } from "@/styles/design-system/theme";
import type { Product } from "@shared/schema";

export default function Home() {
  const { data: featuredProducts, refetch } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Always refetch when component mounts
    staleTime: 0, // Always consider data stale for real-time accuracy
    gcTime: 0, // No client-side caching to prevent stale data (v5)
    refetchInterval: 30000, // Auto-refetch every 30 seconds for live updates
  });

  // Real-time event listeners for admin updates
  useEffect(() => {
    const handleProductUpdate = () => {
      // Force refresh on product updates
      refetch();
    };

    // Listen to both global productEvents and window events
    productEvents.addEventListener('productUpdated', handleProductUpdate);
    window.addEventListener('productUpdated', handleProductUpdate);
    window.addEventListener('storageChanged', handleProductUpdate);
    
    return () => {
      productEvents.removeEventListener('productUpdated', handleProductUpdate);
      window.removeEventListener('productUpdated', handleProductUpdate);
      window.removeEventListener('storageChanged', handleProductUpdate);
    };
  }, [refetch]);

  return (
    <motion.div 
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #0f1419 100%)'
      }}
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
              <span style={{ color: theme.colors.text.primary }}>THE WEIGHTLIFTING</span><br />
              <span style={{ color: theme.colors.brand.blue }}>EQUIPMENT EXCHANGE</span>
            </h1>
            <p 
              className="text-xl md:text-2xl max-w-3xl mx-auto mb-12"
              style={{ color: theme.colors.text.secondary }}
            >
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
                Cash
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
                Inspected
              </span>
              <span 
                className="text-sm"
                style={{ color: theme.colors.text.muted }}
              >
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

              {/* Featured Items */}
              {featuredProducts && featuredProducts.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {featuredProducts.slice(0, 4).map((product) => (
                    <ProductCard key={product.id} product={product} compact />
                  ))}
                </div>
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
