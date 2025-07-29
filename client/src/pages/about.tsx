import GlassCard from "@/components/common/glass-card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Users, 
  MapPin, 
  Clock, 
  Star, 
  CheckCircle,
  Truck,
  DollarSign 
} from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen pt-32 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="font-bebas text-6xl md:text-8xl mb-6">
            ABOUT <span className="text-accent-blue">CLEAN & FLIP</span>
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            We're a trusted local business in Asheville, NC, dedicated to making weightlifting 
            equipment accessible to everyone through our buy and sell marketplace.
          </p>
        </div>

        {/* Mission Section */}
        <GlassCard className="p-12 mb-16 text-center">
          <h2 className="font-bebas text-4xl mb-6">OUR MISSION</h2>
          <p className="text-lg text-text-secondary max-w-4xl mx-auto leading-relaxed">
            To create a sustainable fitness ecosystem where quality weightlifting equipment gets a second life, 
            helping fitness enthusiasts build their dream home gyms while putting cash in the pockets of those 
            ready to upgrade or downsize their equipment.
          </p>
        </GlassCard>

        {/* Our Story */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="font-bebas text-4xl mb-6">OUR STORY</h2>
            <div className="space-y-6 text-text-secondary leading-relaxed">
              <p>
                Founded in 2020 in the heart of Asheville, North Carolina, Clean & Flip emerged from 
                a simple observation: too much quality weightlifting equipment was sitting unused in 
                garages and basements while fitness enthusiasts were paying premium prices for new gear.
              </p>
              <p>
                Our founders, lifelong fitness enthusiasts and Asheville locals, recognized the need 
                for a trusted marketplace that could bridge this gap. We started with a simple mission: 
                inspect every piece of equipment, ensure quality, and provide fair value to both buyers and sellers.
              </p>
              <p>
                Today, we've facilitated over 450 transactions, helping our community build stronger home 
                gyms while putting money back in people's pockets. Every item that passes through our doors 
                gets the same careful attention and quality guarantee.
              </p>
            </div>
          </div>
          
          <GlassCard className="p-8">
            <h3 className="font-bebas text-2xl mb-6">BY THE NUMBERS</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-blue mb-2">452</div>
                <div className="text-sm text-text-muted">Successful Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success mb-2">$85K</div>
                <div className="text-sm text-text-muted">Paid to Sellers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-warning mb-2">48hrs</div>
                <div className="text-sm text-text-muted">Average Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400 mb-2">4.9</div>
                <div className="text-sm text-text-muted">Customer Rating</div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Our Process */}
        <div className="mb-16">
          <h2 className="font-bebas text-4xl text-center mb-12">OUR QUALITY PROCESS</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <GlassCard className="p-6 text-center">
              <Shield className="mx-auto mb-4 text-accent-blue" size={48} />
              <h3 className="font-bebas text-xl mb-3">INSPECT</h3>
              <p className="text-sm text-text-secondary">
                Every item undergoes thorough inspection for safety, functionality, and quality standards.
              </p>
            </GlassCard>
            
            <GlassCard className="p-6 text-center">
              <CheckCircle className="mx-auto mb-4 text-success" size={48} />
              <h3 className="font-bebas text-xl mb-3">VERIFY</h3>
              <p className="text-sm text-text-secondary">
                We verify authenticity, condition, and specifications to ensure accurate listings.
              </p>
            </GlassCard>
            
            <GlassCard className="p-6 text-center">
              <Star className="mx-auto mb-4 text-warning" size={48} />
              <h3 className="font-bebas text-xl mb-3">GUARANTEE</h3>
              <p className="text-sm text-text-secondary">
                All equipment comes with our quality guarantee and 30-day return policy.
              </p>
            </GlassCard>
            
            <GlassCard className="p-6 text-center">
              <Truck className="mx-auto mb-4 text-purple-400" size={48} />
              <h3 className="font-bebas text-xl mb-3">DELIVER</h3>
              <p className="text-sm text-text-secondary">
                Safe, secure delivery or pickup options to get your equipment where it needs to go.
              </p>
            </GlassCard>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <GlassCard className="p-8">
            <h3 className="font-bebas text-2xl mb-6 flex items-center">
              <DollarSign className="mr-3 text-success" size={32} />
              FOR SELLERS
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-success mt-1 flex-shrink-0" size={16} />
                <div>
                  <h4 className="font-semibold mb-1">Fair Market Prices</h4>
                  <p className="text-sm text-text-secondary">
                    We research current market values to offer competitive prices for your equipment.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-success mt-1 flex-shrink-0" size={16} />
                <div>
                  <h4 className="font-semibold mb-1">Quick Turnaround</h4>
                  <p className="text-sm text-text-secondary">
                    Get your cash offer within 48 hours and complete the sale in days, not weeks.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-success mt-1 flex-shrink-0" size={16} />
                <div>
                  <h4 className="font-semibold mb-1">Free Pickup</h4>
                  <p className="text-sm text-text-secondary">
                    We handle all the heavy lifting with free pickup throughout the Asheville area.
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-8">
            <h3 className="font-bebas text-2xl mb-6 flex items-center">
              <Shield className="mr-3 text-accent-blue" size={32} />
              FOR BUYERS
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-accent-blue mt-1 flex-shrink-0" size={16} />
                <div>
                  <h4 className="font-semibold mb-1">Quality Guaranteed</h4>
                  <p className="text-sm text-text-secondary">
                    Every item is inspected and comes with our quality guarantee and return policy.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-accent-blue mt-1 flex-shrink-0" size={16} />
                <div>
                  <h4 className="font-semibold mb-1">Significant Savings</h4>
                  <p className="text-sm text-text-secondary">
                    Save 30-70% compared to buying new while getting premium equipment.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-accent-blue mt-1 flex-shrink-0" size={16} />
                <div>
                  <h4 className="font-semibold mb-1">Local Support</h4>
                  <p className="text-sm text-text-secondary">
                    Work with a local team that understands fitness equipment and stands behind every sale.
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Location & Contact */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <GlassCard className="p-8">
            <h3 className="font-bebas text-2xl mb-6 flex items-center">
              <MapPin className="mr-3 text-red-400" size={32} />
              FIND US
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Location</h4>
                <p className="text-text-secondary">
                  Serving the greater Asheville, NC area<br />
                  Pickup and delivery available
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Contact</h4>
                <p className="text-text-secondary">
                  Email: support@cleanandflip.com<br />
                  Phone: (828) 555-0123
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Clock size={16} />
                <span>Mon-Fri 9AM-5PM EST</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-8">
            <h3 className="font-bebas text-2xl mb-6 flex items-center">
              <Users className="mr-3 text-purple-400" size={32} />
              GET STARTED
            </h3>
            <div className="space-y-6">
              <p className="text-text-secondary">
                Ready to turn your unused equipment into cash or find quality gear for your home gym? 
                We're here to help make it happen.
              </p>
              <div className="space-y-3">
                <Link href="/sell-to-us">
                  <Button className="w-full bg-success hover:bg-green-600 text-white">
                    Sell Your Equipment
                  </Button>
                </Link>
                <Link href="/products">
                  <Button className="w-full bg-accent-blue hover:bg-blue-500 text-white">
                    Shop Equipment
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" className="w-full glass border-glass-border">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Testimonials */}
        <div className="text-center">
          <h2 className="font-bebas text-4xl mb-12">WHAT OUR CUSTOMERS SAY</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <GlassCard className="p-6">
              <div className="flex justify-center mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="text-yellow-400 fill-current" size={16} />
                ))}
              </div>
              <blockquote className="text-text-secondary mb-4">
                "Clean & Flip made selling my home gym equipment incredibly easy. Fair price, 
                quick pickup, and professional service throughout."
              </blockquote>
              <cite className="font-semibold">- Sarah M.</cite>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex justify-center mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="text-yellow-400 fill-current" size={16} />
                ))}
              </div>
              <blockquote className="text-text-secondary mb-4">
                "Bought a complete Olympic set for half the retail price. Quality was exactly 
                as described and delivery was perfect."
              </blockquote>
              <cite className="font-semibold">- Mike R.</cite>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex justify-center mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="text-yellow-400 fill-current" size={16} />
                ))}
              </div>
              <blockquote className="text-text-secondary mb-4">
                "Local business that actually cares about quality. They stand behind every 
                sale and their inspection process is thorough."
              </blockquote>
              <cite className="font-semibold">- Jennifer L.</cite>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
