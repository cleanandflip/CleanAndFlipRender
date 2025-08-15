import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { globalDesignSystem as theme } from "@/styles/design-system/theme";
import { Shield, Clock, Wrench, CheckCircle, AlertTriangle, Phone, FileText } from "lucide-react";

export default function Warranty() {
  const warrantyFeatures = [
    {
      icon: <Shield size={24} />,
      title: "30-Day Coverage",
      description: "Comprehensive functionality warranty on all equipment purchases for 30 days from delivery."
    },
    {
      icon: <Wrench size={24} />,
      title: "Free Repairs",
      description: "We'll repair or replace any equipment that fails to perform as described at no cost to you."
    },
    {
      icon: <Clock size={24} />,
      title: "Quick Response",
      description: "Report issues within 48 hours of discovery for fastest resolution and support."
    },
    {
      icon: <CheckCircle size={24} />,
      title: "No Questions Asked",
      description: "If covered equipment fails functionality tests, we handle it immediately without hassle."
    }
  ];

  const coveredItems = [
    "Mechanical operation of moving parts",
    "Weight accuracy and calibration",
    "Structural integrity and safety",
    "Proper function as described in listing", 
    "All included accessories and components",
    "Electronic components and displays"
  ];

  const notCovered = [
    "Cosmetic wear or scratches",
    "Normal equipment aging",
    "Damage from misuse or abuse",
    "Modifications made by customer",
    "Wear items like cables or grips",
    "Issues not reported within 48 hours"
  ];

  return (
    <motion.div
      className="min-h-screen py-16 px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 
            className="font-bebas text-6xl mb-6"
            style={{ color: theme.colors.text.primary }}
          >
            WARRANTY PROTECTION
          </h1>
          <p 
            className="text-xl max-w-3xl mx-auto"
            style={{ color: theme.colors.text.secondary }}
          >
            Every piece of equipment comes with our comprehensive 30-day functionality warranty. 
            If it doesn't work as promised, we'll make it right.
          </p>
        </motion.div>

        {/* Warranty Features */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {warrantyFeatures.map((feature, index) => (
            <Card key={index} className="p-6 text-center">
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${theme.colors.status.success}15` }}
              >
                <div style={{ color: theme.colors.status.success }}>
                  {feature.icon}
                </div>
              </div>
              <h3 
                className="font-semibold text-lg mb-3"
                style={{ color: theme.colors.text.primary }}
              >
                {feature.title}
              </h3>
              <p 
                className="text-sm leading-relaxed"
                style={{ color: theme.colors.text.secondary }}
              >
                {feature.description}
              </p>
            </Card>
          ))}
        </motion.div>

        {/* Coverage Details */}
        <motion.div 
          className="grid md:grid-cols-2 gap-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="p-8">
            <div className="flex items-center mb-6">
              <CheckCircle size={32} style={{ color: theme.colors.status.success }} className="mr-4" />
              <h2 
                className="font-bebas text-2xl"
                style={{ color: theme.colors.text.primary }}
              >
                WHAT'S COVERED
              </h2>
            </div>
            <ul className="space-y-3">
              {coveredItems.map((item, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle 
                    size={16} 
                    style={{ color: theme.colors.status.success }} 
                    className="mr-3 mt-1 flex-shrink-0"
                  />
                  <span 
                    className="text-sm"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-8">
            <div className="flex items-center mb-6">
              <AlertTriangle size={32} style={{ color: theme.colors.status.warning }} className="mr-4" />
              <h2 
                className="font-bebas text-2xl"
                style={{ color: theme.colors.text.primary }}
              >
                NOT COVERED
              </h2>
            </div>
            <ul className="space-y-3">
              {notCovered.map((item, index) => (
                <li key={index} className="flex items-start">
                  <AlertTriangle 
                    size={16} 
                    style={{ color: theme.colors.status.warning }} 
                    className="mr-3 mt-1 flex-shrink-0"
                  />
                  <span 
                    className="text-sm"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* Warranty Process */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="p-8">
            <h2 
              className="font-bebas text-3xl mb-8 text-center"
              style={{ color: theme.colors.text.primary }}
            >
              HOW TO FILE A WARRANTY CLAIM
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div 
                  className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: theme.colors.brand.blue }}
                >
                  1
                </div>
                <h3 
                  className="font-semibold text-lg mb-3"
                  style={{ color: theme.colors.text.primary }}
                >
                  Report the Issue
                </h3>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: theme.colors.text.secondary }}
                >
                  Contact us within 48 hours of discovering the problem. Call (828) 338-9682 
                  or email warranty@cleanandflip.com with your order details.
                </p>
              </div>
              <div className="text-center">
                <div 
                  className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: theme.colors.brand.blue }}
                >
                  2
                </div>
                <h3 
                  className="font-semibold text-lg mb-3"
                  style={{ color: theme.colors.text.primary }}
                >
                  Assessment
                </h3>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: theme.colors.text.secondary }}
                >
                  Our technician will assess the issue, either remotely or with an on-site 
                  inspection. Most problems can be diagnosed quickly over the phone.
                </p>
              </div>
              <div className="text-center">
                <div 
                  className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: theme.colors.brand.blue }}
                >
                  3
                </div>
                <h3 
                  className="font-semibold text-lg mb-3"
                  style={{ color: theme.colors.text.primary }}
                >
                  Resolution
                </h3>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: theme.colors.text.secondary }}
                >
                  We'll repair the equipment on-site, provide replacement parts, or replace 
                  the entire unit. All warranty work is completed at no charge to you.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Extended Protection */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="p-8">
            <h2 
              className="font-bebas text-3xl mb-6 text-center"
              style={{ color: theme.colors.text.primary }}
            >
              EXTENDED PROTECTION AVAILABLE
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div 
                  className="text-2xl font-bold mb-2"
                  style={{ color: theme.colors.brand.blue }}
                >
                  6 MONTHS
                </div>
                <h4 
                  className="font-semibold mb-3"
                  style={{ color: theme.colors.text.primary }}
                >
                  Extended Warranty
                </h4>
                <p 
                  className="text-sm mb-4"
                  style={{ color: theme.colors.text.secondary }}
                >
                  Additional coverage for high-value equipment purchases over $2,000.
                </p>
                <p 
                  className="text-xs"
                  style={{ color: theme.colors.text.muted }}
                >
                  Available at time of purchase
                </p>
              </div>
              <div className="text-center">
                <div 
                  className="text-2xl font-bold mb-2"
                  style={{ color: theme.colors.brand.blue }}
                >
                  ANNUAL
                </div>
                <h4 
                  className="font-semibold mb-3"
                  style={{ color: theme.colors.text.primary }}
                >
                  Maintenance Plans
                </h4>
                <p 
                  className="text-sm mb-4"
                  style={{ color: theme.colors.text.secondary }}
                >
                  Professional maintenance and tune-ups for commercial-grade equipment.
                </p>
                <p 
                  className="text-xs"
                  style={{ color: theme.colors.text.muted }}
                >
                  Contact for pricing
                </p>
              </div>
              <div className="text-center">
                <div 
                  className="text-2xl font-bold mb-2"
                  style={{ color: theme.colors.brand.blue }}
                >
                  LIFETIME
                </div>
                <h4 
                  className="font-semibold mb-3"
                  style={{ color: theme.colors.text.primary }}
                >
                  Support Access
                </h4>
                <p 
                  className="text-sm mb-4"
                  style={{ color: theme.colors.text.secondary }}
                >
                  Ongoing technical support and troubleshooting for all purchased equipment.
                </p>
                <p 
                  className="text-xs"
                  style={{ color: theme.colors.text.muted }}
                >
                  Included with purchase
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Contact CTA */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <Card className="p-12">
            <div className="flex items-center justify-center mb-4">
              <Shield size={32} style={{ color: theme.colors.status.success }} />
            </div>
            <h2 
              className="font-bebas text-3xl mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              WARRANTY CLAIM OR QUESTION?
            </h2>
            <p 
              className="text-lg mb-8 max-w-2xl mx-auto"
              style={{ color: theme.colors.text.secondary }}
            >
              Our warranty team is here to help. Contact us immediately if you discover 
              any functionality issues with your equipment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="tel:+18283389682"
                className="bg-accent-blue hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center justify-center"
                data-testid="button-call-warranty"
              >
                <Phone className="mr-2" size={20} />
                Call (828) 338-9682
              </a>
              <a 
                href="mailto:warranty@cleanandflip.com"
                className="border border-gray-300 hover:bg-gray-50 px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center justify-center"
                style={{ color: theme.colors.text.primary }}
                data-testid="button-email-warranty"
              >
                <FileText className="mr-2" size={20} />
                Email Warranty Team
              </a>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}