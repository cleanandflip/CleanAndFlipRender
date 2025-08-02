import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button, Card } from "@/components/shared/AnimatedComponents";
import { globalDesignSystem as theme } from "@/styles/design-system/theme";
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
    <motion.div 
      className="min-h-screen pt-32 px-6 pb-12"
      style={{ backgroundColor: theme.colors.bg.primary }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="font-bebas text-6xl md:text-8xl mb-6">
            <span style={{ color: theme.colors.text.primary }}>ABOUT </span>
            <span style={{ color: theme.colors.brand.blue }}>CLEAN & FLIP</span>
          </h1>
          <p 
            className="text-xl max-w-3xl mx-auto"
            style={{ color: theme.colors.text.secondary }}
          >
            We're a trusted local business in Asheville, NC, dedicated to making weightlifting 
            equipment accessible to everyone through our buy and sell marketplace.
          </p>
        </motion.div>

        {/* Mission Section */}
        <Card className="p-12 mb-16 text-center">
          <h2 
            className="font-bebas text-4xl mb-6"
            style={{ color: theme.colors.text.primary }}
          >
            OUR MISSION
          </h2>
          <p 
            className="text-lg max-w-4xl mx-auto leading-relaxed"
            style={{ color: theme.colors.text.secondary }}
          >
            To create a sustainable fitness ecosystem where quality weightlifting equipment gets a second life, 
            helping fitness enthusiasts build their dream home gyms while putting cash in the pockets of those 
            ready to upgrade or downsize their equipment.
          </p>
        </Card>

        {/* Our Story */}
        <motion.div 
          className="grid lg:grid-cols-2 gap-12 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div>
            <h2 
              className="font-bebas text-4xl mb-6"
              style={{ color: theme.colors.text.primary }}
            >
              OUR STORY
            </h2>
            <div 
              className="space-y-6 leading-relaxed"
              style={{ color: theme.colors.text.secondary }}
            >
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
          
          <Card className="p-8">
            <h3 
              className="font-bebas text-2xl mb-6"
              style={{ color: theme.colors.text.primary }}
            >
              BY THE NUMBERS
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div 
                  className="text-3xl font-bold mb-2"
                  style={{ color: theme.colors.brand.blue }}
                >
                  452
                </div>
                <div 
                  className="text-sm"
                  style={{ color: theme.colors.text.muted }}
                >
                  Successful Transactions
                </div>
              </div>
              <div className="text-center">
                <div 
                  className="text-3xl font-bold mb-2"
                  style={{ color: theme.colors.brand.green }}
                >
                  $85K
                </div>
                <div 
                  className="text-sm"
                  style={{ color: theme.colors.text.muted }}
                >
                  Paid to Sellers
                </div>
              </div>
              <div className="text-center">
                <div 
                  className="text-3xl font-bold mb-2"
                  style={{ color: theme.colors.status.warning }}
                >
                  48hrs
                </div>
                <div 
                  className="text-sm"
                  style={{ color: theme.colors.text.muted }}
                >
                  Average Response Time
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Our Process */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 
            className="font-bebas text-4xl text-center mb-12"
            style={{ color: theme.colors.text.primary }}
          >
            OUR QUALITY PROCESS
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="p-6 text-center">
              <Shield 
                className="mx-auto mb-4" 
                size={48} 
                style={{ color: theme.colors.brand.blue }}
              />
              <h3 
                className="font-bebas text-xl mb-3"
                style={{ color: theme.colors.text.primary }}
              >
                INSPECT
              </h3>
              <p 
                className="text-sm"
                style={{ color: theme.colors.text.secondary }}
              >
                Every item undergoes thorough inspection for safety, functionality, and quality standards.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <CheckCircle 
                className="mx-auto mb-4" 
                size={48} 
                style={{ color: theme.colors.brand.green }}
              />
              <h3 
                className="font-bebas text-xl mb-3"
                style={{ color: theme.colors.text.primary }}
              >
                VERIFY
              </h3>
              <p 
                className="text-sm"
                style={{ color: theme.colors.text.secondary }}
              >
                We verify authenticity, condition, and specifications to ensure accurate listings.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <Star 
                className="mx-auto mb-4" 
                size={48} 
                style={{ color: theme.colors.status.warning }}
              />
              <h3 
                className="font-bebas text-xl mb-3"
                style={{ color: theme.colors.text.primary }}
              >
                GUARANTEE
              </h3>
              <p 
                className="text-sm"
                style={{ color: theme.colors.text.secondary }}
              >
                All equipment comes with our quality guarantee and 30-day return policy.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <Truck 
                className="mx-auto mb-4" 
                size={48} 
                style={{ color: theme.colors.brand.purple }}
              />
              <h3 
                className="font-bebas text-xl mb-3"
                style={{ color: theme.colors.text.primary }}
              >
                DELIVER
              </h3>
              <p 
                className="text-sm"
                style={{ color: theme.colors.text.secondary }}
              >
                Safe, secure delivery or pickup options to get your equipment where it needs to go.
              </p>
            </Card>
          </div>
        </motion.div>

        {/* Why Choose Us */}
        <motion.div 
          className="grid lg:grid-cols-2 gap-12 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="p-8">
            <h3 
              className="font-bebas text-2xl mb-6 flex items-center"
              style={{ color: theme.colors.text.primary }}
            >
              <DollarSign 
                className="mr-3" 
                size={32} 
                style={{ color: theme.colors.brand.green }}
              />
              FOR SELLERS
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle 
                  className="mt-1 flex-shrink-0" 
                  size={16} 
                  style={{ color: theme.colors.brand.green }}
                />
                <div>
                  <h4 
                    className="font-semibold mb-1"
                    style={{ color: theme.colors.text.primary }}
                  >
                    Fair Market Prices
                  </h4>
                  <p 
                    className="text-sm"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    We research current market values to offer competitive prices for your equipment.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle 
                  className="mt-1 flex-shrink-0" 
                  size={16} 
                  style={{ color: theme.colors.brand.green }}
                />
                <div>
                  <h4 
                    className="font-semibold mb-1"
                    style={{ color: theme.colors.text.primary }}
                  >
                    Quick Turnaround
                  </h4>
                  <p 
                    className="text-sm"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    Get your cash offer within 48 hours and complete the sale in days, not weeks.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle 
                  className="mt-1 flex-shrink-0" 
                  size={16} 
                  style={{ color: theme.colors.brand.green }}
                />
                <div>
                  <h4 
                    className="font-semibold mb-1"
                    style={{ color: theme.colors.text.primary }}
                  >
                    Free Pickup
                  </h4>
                  <p 
                    className="text-sm"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    We handle all the heavy lifting with free pickup throughout the Asheville area.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h3 
              className="font-bebas text-2xl mb-6 flex items-center"
              style={{ color: theme.colors.text.primary }}
            >
              <Shield 
                className="mr-3" 
                size={32} 
                style={{ color: theme.colors.brand.blue }}
              />
              FOR BUYERS
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle 
                  className="mt-1 flex-shrink-0" 
                  size={16} 
                  style={{ color: theme.colors.brand.blue }}
                />
                <div>
                  <h4 
                    className="font-semibold mb-1"
                    style={{ color: theme.colors.text.primary }}
                  >
                    Quality Guaranteed
                  </h4>
                  <p 
                    className="text-sm"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    Every item is inspected and comes with our quality guarantee and return policy.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle 
                  className="mt-1 flex-shrink-0" 
                  size={16} 
                  style={{ color: theme.colors.brand.blue }}
                />
                <div>
                  <h4 
                    className="font-semibold mb-1"
                    style={{ color: theme.colors.text.primary }}
                  >
                    Significant Savings
                  </h4>
                  <p 
                    className="text-sm"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    Save 30-70% compared to buying new while getting premium equipment.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle 
                  className="mt-1 flex-shrink-0" 
                  size={16} 
                  style={{ color: theme.colors.brand.blue }}
                />
                <div>
                  <h4 
                    className="font-semibold mb-1"
                    style={{ color: theme.colors.text.primary }}
                  >
                    Local Support
                  </h4>
                  <p 
                    className="text-sm"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    Work with a local team that understands fitness equipment and stands behind every sale.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Location & Contact */}
        <motion.div 
          className="grid lg:grid-cols-2 gap-12 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <Card className="p-8">
            <h3 
              className="font-bebas text-2xl mb-6 flex items-center"
              style={{ color: theme.colors.text.primary }}
            >
              <MapPin 
                className="mr-3" 
                size={32} 
                style={{ color: theme.colors.status.error }}
              />
              FIND US
            </h3>
            <div className="space-y-4">
              <div>
                <h4 
                  className="font-semibold mb-2"
                  style={{ color: theme.colors.text.primary }}
                >
                  Location
                </h4>
                <p 
                  className=""
                  style={{ color: theme.colors.text.secondary }}
                >
                  Serving the greater Asheville, NC area<br />
                  Pickup and delivery available
                </p>
              </div>
              <div>
                <h4 
                  className="font-semibold mb-2"
                  style={{ color: theme.colors.text.primary }}
                >
                  Contact
                </h4>
                <p 
                  className=""
                  style={{ color: theme.colors.text.secondary }}
                >
                  Email: support@cleanandflip.com<br />
                  Phone: (828) 555-0123
                </p>
              </div>
              <div 
                className="flex items-center gap-2 text-sm"
                style={{ color: theme.colors.text.muted }}
              >
                <Clock size={16} />
                <span>Mon-Fri 9AM-5PM EST</span>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h3 
              className="font-bebas text-2xl mb-6 flex items-center"
              style={{ color: theme.colors.text.primary }}
            >
              <Users 
                className="mr-3" 
                size={32} 
                style={{ color: theme.colors.brand.purple }}
              />
              GET STARTED
            </h3>
            <div className="space-y-6">
              <p 
                className=""
                style={{ color: theme.colors.text.secondary }}
              >
                Ready to turn your unused equipment into cash or find quality gear for your home gym? 
                We're here to help make it happen.
              </p>
              <div className="space-y-3">
                <Link href="/sell-to-us">
                  <Button variant="primary" size="lg" className="w-full">
                    Sell Your Equipment
                  </Button>
                </Link>
                <Link href="/products">
                  <Button variant="primary" size="lg" className="w-full">
                    Shop Equipment
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="secondary" size="lg" className="w-full">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Testimonials */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <h2 
            className="font-bebas text-4xl mb-12"
            style={{ color: theme.colors.text.primary }}
          >
            WHAT OUR CUSTOMERS SAY
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="flex justify-center mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className="fill-current" 
                    size={16} 
                    style={{ color: theme.colors.status.warning }}
                  />
                ))}
              </div>
              <blockquote 
                className="mb-4"
                style={{ color: theme.colors.text.secondary }}
              >
                "Clean & Flip made selling my home gym equipment incredibly easy. Fair price, 
                quick pickup, and professional service throughout."
              </blockquote>
              <cite 
                className="font-semibold"
                style={{ color: theme.colors.text.primary }}
              >
                - Sarah M.
              </cite>
            </Card>

            <Card className="p-6">
              <div className="flex justify-center mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className="fill-current" 
                    size={16} 
                    style={{ color: theme.colors.status.warning }}
                  />
                ))}
              </div>
              <blockquote 
                className="mb-4"
                style={{ color: theme.colors.text.secondary }}
              >
                "Bought a complete Olympic set for half the retail price. Quality was exactly 
                as described and delivery was perfect."
              </blockquote>
              <cite 
                className="font-semibold"
                style={{ color: theme.colors.text.primary }}
              >
                - Mike R.
              </cite>
            </Card>

            <Card className="p-6">
              <div className="flex justify-center mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className="fill-current" 
                    size={16} 
                    style={{ color: theme.colors.status.warning }}
                  />
                ))}
              </div>
              <blockquote 
                className="mb-4"
                style={{ color: theme.colors.text.secondary }}
              >
                "Local business that actually cares about quality. They stand behind every 
                sale and their inspection process is thorough."
              </blockquote>
              <cite 
                className="font-semibold"
                style={{ color: theme.colors.text.primary }}
              >
                - Jennifer L.
              </cite>
            </Card>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
