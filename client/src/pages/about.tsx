import React, { useState } from 'react';
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
  DollarSign,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// Testimonials data with 35 unique reviews
const testimonials = [
  { id: 1, stars: 5, text: "Clean & Flip made selling my home gym equipment incredibly easy. Fair price, quick pickup, and professional service throughout.", author: "Sarah M." },
  { id: 2, stars: 5, text: "Bought a complete Olympic set for half the retail price. Quality was exactly as described and delivery was perfect.", author: "Mike R." },
  { id: 3, stars: 5, text: "Local business that actually cares about quality. They stand behind every sale and their inspection process is thorough.", author: "Jennifer L." },
  { id: 4, stars: 4.5, text: "Great experience selling my old treadmill. The team was professional and the process was smooth from start to finish.", author: "David K." },
  { id: 5, stars: 5, text: "Found an amazing power rack at 60% off retail. The quality inspection was spot-on and delivery was lightning fast.", author: "Amanda C." },
  { id: 6, stars: 4.5, text: "Excellent customer service when I had questions about a barbell set. They know their equipment inside and out.", author: "Robert F." },
  { id: 7, stars: 5, text: "Sold my entire home gym to them when I moved. Fair pricing, easy pickup, and they handled all the heavy lifting.", author: "Lisa T." },
  { id: 8, stars: 5, text: "The condition reports are incredibly detailed. What they described as 'good' was actually excellent condition.", author: "James W." },
  { id: 9, stars: 4.5, text: "Quick response time and honest pricing. They didn't try to lowball me like other places I contacted.", author: "Maria G." },
  { id: 10, stars: 5, text: "Bought dumbbells, bench, and plates all in one transaction. Everything was exactly as advertised.", author: "Kevin S." },
  { id: 11, stars: 5, text: "Their quality guarantee gave me confidence to buy. The 30-day return policy shows they stand behind their products.", author: "Rachel H." },
  { id: 12, stars: 4.5, text: "Fast local delivery in Asheville. Had my equipment set up in my garage the same day I purchased.", author: "Thomas B." },
  { id: 13, stars: 5, text: "Sold them my rowing machine and elliptical. The pickup was scheduled quickly and they were punctual.", author: "Nicole P." },
  { id: 14, stars: 5, text: "Great selection of cardio equipment. Found the exact model I wanted at an unbeatable price.", author: "Brian A." },
  { id: 15, stars: 4.5, text: "The team knows fitness equipment better than anyone. They helped me choose the right weight set for my goals.", author: "Stephanie M." },
  { id: 16, stars: 5, text: "Transparent pricing with no hidden fees. The quote they gave me was exactly what I received at pickup.", author: "Daniel R." },
  { id: 17, stars: 5, text: "Professional inspection process that caught issues I didn't even notice. Their expertise really shows.", author: "Karen J." },
  { id: 18, stars: 4.5, text: "Local pickup and delivery made the whole process convenient. No need to rent a truck or find help moving.", author: "Michael D." },
  { id: 19, stars: 5, text: "Bought a complete home gym setup for less than the cost of one new machine. Quality was exceptional.", author: "Jessica V." },
  { id: 20, stars: 5, text: "They handled the sale of my commercial-grade equipment with expertise. Fair pricing for high-end gear.", author: "Christopher L." },
  { id: 21, stars: 4.5, text: "Great communication throughout the process. They kept me updated from initial quote to final pickup.", author: "Ashley N." },
  { id: 22, stars: 5, text: "The condition grading system is accurate and fair. 'Good' condition was better than I expected.", author: "Ryan E." },
  { id: 23, stars: 5, text: "Local business that treats customers right. They've earned a customer for life with their service.", author: "Lauren B." },
  { id: 24, stars: 4.5, text: "Quick turnaround from inquiry to cash in hand. The whole process took less than 48 hours.", author: "Steven C." },
  { id: 25, stars: 5, text: "Helped me upgrade my home gym by buying my old equipment and selling me newer models. Win-win.", author: "Michelle K." },
  { id: 26, stars: 5, text: "Their online listings are accurate with detailed photos. What you see is exactly what you get.", author: "Gregory H." },
  { id: 27, stars: 4.5, text: "Fair market pricing based on actual research, not arbitrary numbers. They know the fitness equipment market.", author: "Samantha W." },
  { id: 28, stars: 5, text: "Zero pressure sales approach. They let the quality and pricing speak for themselves.", author: "Jonathan M." },
  { id: 29, stars: 5, text: "Excellent selection of strength training equipment. Found everything I needed in one place.", author: "Catherine R." },
  { id: 30, stars: 4.5, text: "The pickup team was careful with my floors and walls. They know how to move heavy equipment safely.", author: "Alexander P." },
  { id: 31, stars: 5, text: "Competitive pricing that beats online marketplaces once you factor in shipping and quality guarantees.", author: "Diana S." },
  { id: 32, stars: 5, text: "Local expertise you can't get from big box stores. They understand the Asheville fitness community.", author: "Timothy F." },
  { id: 33, stars: 4.5, text: "Smooth transaction from start to finish. Professional, courteous, and efficient throughout.", author: "Melissa G." },
  { id: 34, stars: 5, text: "They made selling my gym equipment stress-free. Handled everything so I could focus on my move.", author: "Brandon L." },
  { id: 35, stars: 5, text: "Outstanding customer service and quality products. This is how all fitness equipment sales should be handled.", author: "Rebecca T." }
];

function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const reviewsPerPage = 3;
  const totalPages = Math.ceil(testimonials.length / reviewsPerPage);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
  };

  const getCurrentReviews = () => {
    const startIndex = currentIndex * reviewsPerPage;
    return testimonials.slice(startIndex, startIndex + reviewsPerPage);
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex justify-center mb-3">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star 
            key={i} 
            className="fill-current" 
            size={16} 
            style={{ color: theme.colors.status.warning }}
          />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star 
              className="fill-current" 
              size={16} 
              style={{ color: '#e5e7eb' }}
            />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star 
                className="fill-current" 
                size={16} 
                style={{ color: theme.colors.status.warning }}
              />
            </div>
          </div>
        )}
        {Array.from({ length: 5 - Math.ceil(rating) }).map((_, i) => (
          <Star 
            key={`empty-${i}`} 
            className="fill-current" 
            size={16} 
            style={{ color: '#e5e7eb' }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={goToPrevious}
          className="p-2 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
          style={{ color: theme.colors.text.primary }}
          data-testid="testimonials-prev"
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="flex-1 mx-8">
          <div className="grid md:grid-cols-3 gap-8">
            {getCurrentReviews().map((testimonial) => (
              <Card key={testimonial.id} className="p-6">
                {renderStars(testimonial.stars)}
                <blockquote 
                  className="mb-4"
                  style={{ color: theme.colors.text.secondary }}
                >
                  "{testimonial.text}"
                </blockquote>
                <cite 
                  className="font-semibold"
                  style={{ color: theme.colors.text.primary }}
                >
                  - {testimonial.author}
                </cite>
              </Card>
            ))}
          </div>
        </div>
        
        <button
          onClick={goToNext}
          className="p-2 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
          style={{ color: theme.colors.text.primary }}
          data-testid="testimonials-next"
        >
          <ChevronRight size={24} />
        </button>
      </div>
      
      <div className="flex justify-center space-x-2">
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex 
                ? 'bg-blue-500' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            data-testid={`testimonials-dot-${index}`}
          />
        ))}
      </div>
    </div>
  );
}

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
          
          <Card className="bg-[#232937] backdrop-blur-sm border border-[rgba(255,255,255,0.08)] rounded-lg transition-all duration-300 card-hover p-8 pt-[32px] pb-[32px] mt-[115px] mb-[115px] ml-[0px] mr-[0px] pl-[20px] pr-[20px]">
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
                Safe, secure delivery options to get your equipment delivered to your doorstep.
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
              <div className="flex flex-col gap-6">
                <Link href="/sell-to-us" className="block">
                  <Button variant="primary" size="lg" className="w-full h-14 text-lg font-semibold">
                    Sell Your Equipment
                  </Button>
                </Link>
                <Link href="/products" className="block">
                  <Button variant="primary" size="lg" className="w-full h-14 text-lg font-semibold">
                    Shop Equipment
                  </Button>
                </Link>
                <Link href="/contact" className="block">
                  <Button variant="secondary" size="lg" className="w-full h-14 text-lg font-semibold">
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
          <TestimonialsCarousel />
        </motion.div>
      </div>
    </motion.div>
  );
}
