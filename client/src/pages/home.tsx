import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Logo from "@/components/common/logo";
import GlassCard from "@/components/common/glass-card";
import ProductCard from "@/components/products/product-card";
import { DollarSign, Dumbbell, TrendingUp, Users, Clock, CheckCircle } from "lucide-react";
import CategoryGrid from "@/components/categories/category-grid";
import { productEvents } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

export default function Home() {
  const { data: featuredProducts, refetch } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: 'always', // Always refetch when component mounts
    staleTime: 0, // Always consider data stale for real-time accuracy
    gcTime: 0, // No client-side caching to prevent stale data (v5)
    refetchInterval: 30000, // Auto-refetch every 30 seconds for live updates
  });

  // Real-time event listeners for admin updates
  useEffect(() => {
    const handleProductUpdate = () => {
      console.log('Featured products page received update event - force refreshing');
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
    <div className="min-h-screen bg-transparent">
      {/* Hero Section - Full Screen */}
      <section className="min-h-screen flex items-center justify-center pt-20 pb-12 px-6 bg-transparent">
        <div className="max-w-6xl mx-auto text-center">
          {/* Main Heading */}
          <div className="mb-12">
            <h1 className="font-bebas text-6xl md:text-8xl mb-6 tracking-wider leading-tight">
              <span className="text-white">THE WEIGHTLIFTING</span><br />
              <span className="text-accent-blue">EQUIPMENT EXCHANGE</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto mb-12">
              Turn your unused gear into cash. Buy quality equipment you can trust.
            </p>
          </div>

          {/* Two Paths - Enhanced Design */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Selling Path */}
            <GlassCard className="p-10 text-center glass-hover hover:scale-105 transition-all duration-300">
              <div className="mb-8">
                <DollarSign className="text-success mb-6 mx-auto" size={64} />
                <h2 className="font-bebas text-4xl mb-3 text-white">SELLING?</h2>
                <p className="text-text-secondary text-lg">Cash for your equipment</p>
              </div>
              <Link href="/sell-to-us">
                <button className="w-full bg-success hover:bg-green-600 text-white font-bold px-8 py-4 rounded-lg transition-colors text-lg">
                  Get Cash Offer
                </button>
              </Link>
            </GlassCard>

            {/* Buying Path */}
            <GlassCard className="p-10 text-center glass-hover hover:scale-105 transition-all duration-300">
              <div className="mb-8">
                <Dumbbell className="text-accent-blue mb-6 mx-auto" size={64} />
                <h2 className="font-bebas text-4xl mb-3 text-white">BUYING?</h2>
                <p className="text-text-secondary text-lg">Verified quality gear</p>
              </div>
              <Link href="/products">
                <button className="w-full bg-accent-blue hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-lg transition-colors text-lg">
                  Shop Equipment
                </button>
              </Link>
            </GlassCard>
          </div>

          {/* Trust Bar - Enhanced */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center p-4 glass rounded-lg">
              <TrendingUp className="text-accent-blue mb-2" size={24} />
              <span className="font-bold text-lg text-white">452</span>
              <span className="text-text-muted text-sm">Transactions</span>
            </div>
            <div className="flex flex-col items-center p-4 glass rounded-lg">
              <Users className="text-accent-blue mb-2" size={24} />
              <span className="font-bold text-lg text-white">Asheville</span>
              <span className="text-text-muted text-sm">Local</span>
            </div>
            <div className="flex flex-col items-center p-4 glass rounded-lg">
              <Clock className="text-accent-blue mb-2" size={24} />
              <span className="font-bold text-lg text-white">Same Day</span>
              <span className="text-text-muted text-sm">Cash</span>
            </div>
            <div className="flex flex-col items-center p-4 glass rounded-lg">
              <CheckCircle className="text-success mb-2" size={24} />
              <span className="font-bold text-lg text-white">Inspected</span>
              <span className="text-text-muted text-sm">Every Item</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Full Screen */}
      <section className="min-h-screen flex items-center py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Simple Process */}
            <div className="space-y-12">
              <h2 className="font-bebas text-5xl mb-12 text-white tracking-wider">SIMPLE PROCESS</h2>

              {/* Sellers Process */}
              <GlassCard className="p-8">
                <h3 className="font-bebas text-3xl text-success mb-8 tracking-wider">SELL YOUR EQUIPMENT</h3>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center text-white font-bold text-lg">1</div>
                    <span className="text-white text-lg">Submit photos online</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center text-white font-bold text-lg">2</div>
                    <span className="text-white text-lg">Get cash offer in 48hrs</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center text-white font-bold text-lg">3</div>
                    <span className="text-white text-lg">We pick up & pay cash</span>
                  </div>
                </div>
                <Link href="/sell-to-us">
                  <button className="w-full mt-8 bg-success hover:bg-green-600 text-white font-bold px-6 py-3 rounded-lg transition-colors">
                    Start Selling →
                  </button>
                </Link>
              </GlassCard>

              {/* Buyers Process */}
              <GlassCard className="p-8">
                <h3 className="font-bebas text-3xl text-accent-blue mb-8 tracking-wider">BUY QUALITY GEAR</h3>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-accent-blue rounded-full flex items-center justify-center text-white font-bold text-lg">1</div>
                    <span className="text-white text-lg">Browse verified equipment</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-accent-blue rounded-full flex items-center justify-center text-white font-bold text-lg">2</div>
                    <span className="text-white text-lg">Secure checkout</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-accent-blue rounded-full flex items-center justify-center text-white font-bold text-lg">3</div>
                    <span className="text-white text-lg">Fast delivery or pickup</span>
                  </div>
                </div>
                <Link href="/products">
                  <button className="w-full mt-8 bg-accent-blue hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-lg transition-colors">
                    Start Shopping →
                  </button>
                </Link>
              </GlassCard>
            </div>

            {/* Right Side - Latest Activity */}
            <div className="space-y-8">
              <h3 className="font-bebas text-4xl text-white tracking-wider">LATEST ACTIVITY</h3>

              {/* Live Stats */}
              <GlassCard className="p-8">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary text-lg">Items Available</span>
                    <span className="font-bold text-accent-blue text-2xl">234</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary text-lg">Sold This Week</span>
                    <span className="font-bold text-success text-2xl">18</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary text-lg">People Shopping</span>
                    <span className="font-bold text-warning text-2xl">12</span>
                  </div>
                </div>
              </GlassCard>

              {/* Featured Items */}
              {featuredProducts && featuredProducts.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {featuredProducts.slice(0, 4).map((product) => (
                    <ProductCard key={product.id} product={product} compact />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 px-6 spacing-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-bebas text-5xl mb-4">SHOP BY CATEGORY</h2>
            <p className="text-text-secondary text-lg">Find exactly what you need for your home gym</p>
          </div>

          <CategoryGrid />
        </div>
      </section>
    </div>
  );
}
