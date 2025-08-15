import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Truck, Clock, Phone, Mail, CheckCircle } from 'lucide-react';
import { globalDesignSystem as theme } from '@/styles/design-system/theme';

export default function ShippingInfo() {

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
            <span style={{ color: theme.colors.text.primary }}>SHIPPING & </span>
            <span style={{ color: theme.colors.brand.blue }}>SERVICE AREA</span>
          </h1>
          <p 
            className="text-xl max-w-3xl mx-auto"
            style={{ color: theme.colors.text.secondary }}
          >
            Everything you need to know about our delivery, pickup, and shipping services 
            in the greater Asheville, NC area.
          </p>
        </motion.div>

        {/* Service Area Map */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="p-8">
            <h2 
              className="font-bebas text-4xl mb-6 flex items-center justify-center"
              style={{ color: theme.colors.text.primary }}
            >
              <MapPin 
                className="mr-3" 
                size={32} 
                style={{ color: theme.colors.status.error }}
              />
              PRIMARY SERVICE AREA
            </h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 
                  className="font-bebas text-2xl mb-4"
                  style={{ color: theme.colors.text.primary }}
                >
                  LOCAL DELIVERY & PICKUP ZONES
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle 
                      size={20} 
                      style={{ color: theme.colors.status.success }}
                    />
                    <span style={{ color: theme.colors.text.secondary }}>
                      Asheville (28801, 28803, 28804, 28805, 28806)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle 
                      size={20} 
                      style={{ color: theme.colors.status.success }}
                    />
                    <span style={{ color: theme.colors.text.secondary }}>
                      Black Mountain (28711)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle 
                      size={20} 
                      style={{ color: theme.colors.status.success }}
                    />
                    <span style={{ color: theme.colors.text.secondary }}>
                      Fletcher (28732)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle 
                      size={20} 
                      style={{ color: theme.colors.status.success }}
                    />
                    <span style={{ color: theme.colors.text.secondary }}>
                      Arden (28704)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle 
                      size={20} 
                      style={{ color: theme.colors.status.success }}
                    />
                    <span style={{ color: theme.colors.text.secondary }}>
                      Weaverville (28787)
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <MapPin 
                  size={64} 
                  className="mx-auto mb-4" 
                  style={{ color: theme.colors.brand.blue }}
                />
                <h4 
                  className="font-bebas text-xl mb-2"
                  style={{ color: theme.colors.text.primary }}
                >
                  15-MILE RADIUS
                </h4>
                <p style={{ color: theme.colors.text.secondary }}>
                  Free pickup and delivery within 15 miles of downtown Asheville
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Service Types */}
        <motion.div 
          className="grid md:grid-cols-3 gap-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="p-8 text-center">
            <Truck 
              className="mx-auto mb-4" 
              size={48} 
              style={{ color: theme.colors.brand.blue }}
            />
            <h3 
              className="font-bebas text-2xl mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              LOCAL DELIVERY
            </h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} style={{ color: theme.colors.status.success }} />
                <span style={{ color: theme.colors.text.secondary }}>FREE within service area</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} style={{ color: theme.colors.status.success }} />
                <span style={{ color: theme.colors.text.secondary }}>Same-day or next-day delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} style={{ color: theme.colors.status.success }} />
                <span style={{ color: theme.colors.text.secondary }}>Professional setup available</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} style={{ color: theme.colors.status.success }} />
                <span style={{ color: theme.colors.text.secondary }}>White glove service</span>
              </div>
            </div>
          </Card>

          <Card className="p-8 text-center">
            <MapPin 
              className="mx-auto mb-4" 
              size={48} 
              style={{ color: theme.colors.status.success }}
            />
            <h3 
              className="font-bebas text-2xl mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              PICKUP SERVICE
            </h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} style={{ color: theme.colors.status.success }} />
                <span style={{ color: theme.colors.text.secondary }}>FREE equipment pickup</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} style={{ color: theme.colors.status.success }} />
                <span style={{ color: theme.colors.text.secondary }}>Flexible scheduling</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} style={{ color: theme.colors.status.success }} />
                <span style={{ color: theme.colors.text.secondary }}>We handle heavy lifting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} style={{ color: theme.colors.status.success }} />
                <span style={{ color: theme.colors.text.secondary }}>Safe equipment removal</span>
              </div>
            </div>
          </Card>

          <Card className="p-8 text-center">
            <Clock 
              className="mx-auto mb-4" 
              size={48} 
              style={{ color: theme.colors.status.warning }}
            />
            <h3 
              className="font-bebas text-2xl mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              SHIPPING OPTIONS
            </h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} style={{ color: theme.colors.status.success }} />
                <span style={{ color: theme.colors.text.secondary }}>Regional shipping available</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} style={{ color: theme.colors.status.success }} />
                <span style={{ color: theme.colors.text.secondary }}>Professional packaging</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} style={{ color: theme.colors.status.success }} />
                <span style={{ color: theme.colors.text.secondary }}>Tracking provided</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} style={{ color: theme.colors.status.success }} />
                <span style={{ color: theme.colors.text.secondary }}>Insurance included</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Delivery Schedule */}
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
              <Clock 
                className="mr-3" 
                size={32} 
                style={{ color: theme.colors.status.warning }}
              />
              DELIVERY SCHEDULE
            </h3>
            <div className="space-y-4">
              <div>
                <h4 
                  className="font-semibold mb-2"
                  style={{ color: theme.colors.text.primary }}
                >
                  Local Delivery Windows
                </h4>
                <ul className="space-y-2" style={{ color: theme.colors.text.secondary }}>
                  <li>• Monday - Saturday: 9:00 AM - 5:00 PM</li>
                  <li>• Same-day delivery (orders placed before 2 PM)</li>
                  <li>• Next-day delivery (orders placed after 2 PM)</li>
                  <li>• Evening deliveries available upon request</li>
                </ul>
              </div>
              <div>
                <h4 
                  className="font-semibold mb-2"
                  style={{ color: theme.colors.text.primary }}
                >
                  Pickup Windows
                </h4>
                <ul className="space-y-2" style={{ color: theme.colors.text.secondary }}>
                  <li>• Monday - Saturday: 8:00 AM - 6:00 PM</li>
                  <li>• 2-hour scheduling windows</li>
                  <li>• Text/call 30 minutes before arrival</li>
                  <li>• Weekend pickup available</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h3 
              className="font-bebas text-2xl mb-6 flex items-center"
              style={{ color: theme.colors.text.primary }}
            >
              <Phone 
                className="mr-3" 
                size={32} 
                style={{ color: theme.colors.brand.blue }}
              />
              CONTACT FOR SCHEDULING
            </h3>
            <div className="space-y-6">
              <div>
                <h4 
                  className="font-semibold mb-2"
                  style={{ color: theme.colors.text.primary }}
                >
                  Phone Support
                </h4>
                <p style={{ color: theme.colors.text.secondary }}>
                  <strong>(828) 555-0123</strong><br />
                  Mon-Sat 9AM-5PM EST
                </p>
              </div>
              <div>
                <h4 
                  className="font-semibold mb-2"
                  style={{ color: theme.colors.text.primary }}
                >
                  Email Support
                </h4>
                <p style={{ color: theme.colors.text.secondary }}>
                  <strong>support@cleanandflip.com</strong><br />
                  Average response time: 3 hours
                </p>
              </div>
              <div>
                <h4 
                  className="font-semibold mb-2"
                  style={{ color: theme.colors.text.primary }}
                >
                  Emergency Contact
                </h4>
                <p style={{ color: theme.colors.text.secondary }}>
                  For urgent delivery issues:<br />
                  <strong>(828) 555-0124</strong>
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Shipping Rates */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <Card className="p-8">
            <h2 
              className="font-bebas text-4xl mb-8 text-center"
              style={{ color: theme.colors.text.primary }}
            >
              DELIVERY & SHIPPING RATES
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div 
                  className="text-3xl font-bold mb-2"
                  style={{ color: theme.colors.status.success }}
                >
                  FREE
                </div>
                <h4 
                  className="font-bebas text-xl mb-3"
                  style={{ color: theme.colors.text.primary }}
                >
                  LOCAL DELIVERY
                </h4>
                <ul className="text-sm space-y-1" style={{ color: theme.colors.text.secondary }}>
                  <li>Within 15-mile radius</li>
                  <li>No minimum order</li>
                  <li>Equipment pickup included</li>
                  <li>Professional handling</li>
                </ul>
              </div>
              
              <div className="text-center">
                <div 
                  className="text-3xl font-bold mb-2"
                  style={{ color: theme.colors.brand.blue }}
                >
                  $2/MILE
                </div>
                <h4 
                  className="font-bebas text-xl mb-3"
                  style={{ color: theme.colors.text.primary }}
                >
                  EXTENDED DELIVERY
                </h4>
                <ul className="text-sm space-y-1" style={{ color: theme.colors.text.secondary }}>
                  <li>15-50 mile radius</li>
                  <li>$50 minimum charge</li>
                  <li>Scheduled delivery</li>
                  <li>Call for availability</li>
                </ul>
              </div>
              
              <div className="text-center">
                <div 
                  className="text-3xl font-bold mb-2"
                  style={{ color: theme.colors.status.warning }}
                >
                  QUOTE
                </div>
                <h4 
                  className="font-bebas text-xl mb-3"
                  style={{ color: theme.colors.text.primary }}
                >
                  REGIONAL SHIPPING
                </h4>
                <ul className="text-sm space-y-1" style={{ color: theme.colors.text.secondary }}>
                  <li>Beyond 50 miles</li>
                  <li>Custom quote provided</li>
                  <li>Professional packaging</li>
                  <li>Freight shipping options</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <Card className="p-12">
            <h2 
              className="font-bebas text-4xl mb-6"
              style={{ color: theme.colors.text.primary }}
            >
              QUESTIONS ABOUT DELIVERY?
            </h2>
            <p 
              className="text-xl mb-8 max-w-2xl mx-auto"
              style={{ color: theme.colors.text.secondary }}
            >
              Our team is here to help plan your delivery or pickup. Contact us for 
              personalized service and scheduling.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-accent-blue hover:bg-blue-600"
                onClick={() => window.location.href = 'tel:+18285550123'}
              >
                <Phone className="mr-2" size={20} />
                Call (828) 555-0123
              </Button>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Mail className="mr-2" size={20} />
                  Send Message
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}