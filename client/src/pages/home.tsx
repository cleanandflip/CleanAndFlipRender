import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Logo from "@/components/common/logo";
import GlassCard from "@/components/common/glass-card";
import ProductCard from "@/components/products/product-card";
import { DollarSign, Dumbbell, TrendingUp, Users, Clock, CheckCircle } from "lucide-react";
import type { Product } from "@shared/schema";

export default function Home() {
  const { data: featuredProducts } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Main Heading */}
          <div className="spacing-element mb-8">
            <h1 className="font-bebas text-6xl md:text-8xl mb-4 tracking-wider text-white">
              THE WEIGHTLIFTING<br />
              <span className="text-accent-blue">EQUIPMENT EXCHANGE</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto">
              Turn your unused gear into cash. Buy quality equipment you can trust.
            </p>
          </div>

          {/* Two Paths */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Selling Path */}
            <GlassCard className="p-8 text-center glass-hover">
              <div className="spacing-element mb-6">
                <DollarSign className="text-4xl text-success mb-4 mx-auto" size={48} />
                <h2 className="font-bebas text-3xl mb-2">SELLING?</h2>
                <p className="text-text-secondary">Cash for your equipment</p>
              </div>
              <Link href="/sell-to-us">
                <a className="inline-block bg-success hover:bg-green-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors">
                  Get Cash Offer
                </a>
              </Link>
            </GlassCard>

            {/* Buying Path */}
            <GlassCard className="p-8 text-center glass-hover">
              <div className="spacing-element mb-6">
                <Dumbbell className="text-4xl text-accent-blue mb-4 mx-auto" size={48} />
                <h2 className="font-bebas text-3xl mb-2">BUYING?</h2>
                <p className="text-text-secondary">Verified quality gear</p>
              </div>
              <Link href="/products">
                <a className="inline-block bg-accent-blue hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-lg transition-colors">
                  Shop Equipment
                </a>
              </Link>
            </GlassCard>
          </div>

          {/* Trust Bar */}
          <GlassCard className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="trust-indicator">
                <div className="text-2xl font-bold text-accent-blue">452</div>
                <div className="text-sm text-text-muted">Transactions</div>
              </div>
              <div className="trust-indicator">
                <div className="text-2xl font-bold text-success">Asheville</div>
                <div className="text-sm text-text-muted">Local</div>
              </div>
              <div className="trust-indicator">
                <div className="text-2xl font-bold text-warning">Same Day</div>
                <div className="text-sm text-text-muted">Cash</div>
              </div>
              <div className="trust-indicator">
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-sm text-text-muted">Inspected</div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="min-h-screen flex items-center py-12 px-6 spacing-section">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Process */}
            <div className="space-y-8">
              <h2 className="font-bebas text-5xl mb-8">SIMPLE PROCESS</h2>

              {/* Sellers Process */}
              <GlassCard className="p-6">
                <h3 className="font-bebas text-2xl text-success mb-4">Sell Your Equipment</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <span>Submit photos online</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <span>Get cash offer in 48hrs</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <span>We pick up & pay cash</span>
                  </div>
                </div>
                <Link href="/sell-to-us">
                  <a className="inline-block mt-4 text-success hover:text-green-400 font-semibold">
                    Start Selling →
                  </a>
                </Link>
              </GlassCard>

              {/* Buyers Process */}
              <GlassCard className="p-6">
                <h3 className="font-bebas text-2xl text-accent-blue mb-4">Buy Quality Gear</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-accent-blue rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <span>Browse verified equipment</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-accent-blue rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-accent-blue rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <span>Fast delivery or pickup</span>
                  </div>
                </div>
                <Link href="/products">
                  <a className="inline-block mt-4 text-accent-blue hover:text-blue-400 font-semibold">
                    Start Shopping →
                  </a>
                </Link>
              </GlassCard>
            </div>

            {/* Right Side - Latest Activity */}
            <div className="space-y-6">
              <h3 className="font-bebas text-3xl">LATEST ACTIVITY</h3>

              {/* Stats */}
              <GlassCard className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Items Available</span>
                    <span className="font-bold text-accent-blue">234</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Sold This Week</span>
                    <span className="font-bold text-success">18</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">People Shopping</span>
                    <span className="font-bold text-warning">12</span>
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

      {/* Featured Categories */}
      <section className="py-24 px-6 spacing-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-bebas text-5xl mb-4">SHOP BY CATEGORY</h2>
            <p className="text-text-secondary text-lg">Find exactly what you need for your home gym</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Barbells Category */}
            <GlassCard className="overflow-hidden glass-hover">
              <img 
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300" 
                alt="Barbells and Olympic Equipment" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-bebas text-2xl mb-2">BARBELLS</h3>
                <p className="text-text-secondary mb-4">Olympic bars, specialty bars, and complete sets</p>
                <Link href="/products?category=barbells">
                  <a className="text-accent-blue hover:text-blue-400 font-semibold">
                    Shop Barbells →
                  </a>
                </Link>
              </div>
            </GlassCard>

            {/* Plates Category */}
            <GlassCard className="overflow-hidden glass-hover">
              <img 
                src="https://images.unsplash.com/photo-1434682772747-f16d3ea162c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300" 
                alt="Weight Plates and Discs" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-bebas text-2xl mb-2">PLATES</h3>
                <p className="text-text-secondary mb-4">Olympic plates, bumper plates, and iron sets</p>
                <Link href="/products?category=plates">
                  <a className="text-accent-blue hover:text-blue-400 font-semibold">
                    Shop Plates →
                  </a>
                </Link>
              </div>
            </GlassCard>

            {/* Racks Category */}
            <GlassCard className="overflow-hidden glass-hover">
              <img 
                src="https://images.unsplash.com/photo-1517963879433-6ad2b056d712?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300" 
                alt="Power Racks and Squat Stands" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-bebas text-2xl mb-2">RACKS</h3>
                <p className="text-text-secondary mb-4">Power racks, squat stands, and storage</p>
                <Link href="/products?category=racks">
                  <a className="text-accent-blue hover:text-blue-400 font-semibold">
                    Shop Racks →
                  </a>
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>
    </div>
  );
}
