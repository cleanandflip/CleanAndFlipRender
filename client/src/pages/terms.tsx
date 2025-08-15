import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { theme } from "@/styles/design-system/theme";
import { FileText, Scale, Shield, AlertCircle } from "lucide-react";

export default function TermsOfService() {
  const sections = [
    {
      icon: <FileText size={24} />,
      title: "Acceptance of Terms",
      content: `By accessing and using Clean & Flip's services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with these terms, please do not use our services.`
    },
    {
      icon: <Shield size={24} />,
      title: "Equipment Purchases",
      content: `All equipment sales are final unless covered by our 30-day functionality warranty. We guarantee that equipment will perform as described in the listing. Items must be inspected within 48 hours of delivery, and any concerns must be reported immediately.`
    },
    {
      icon: <Scale size={24} />,
      title: "Equipment Sales to Us",
      content: `When selling equipment to Clean & Flip, you warrant that you are the rightful owner with clear title to sell. All equipment submissions are subject to our inspection and valuation process. Pricing quotes are valid for 7 days from issue date.`
    },
    {
      icon: <AlertCircle size={24} />,
      title: "Delivery & Pickup",
      content: `Free delivery is provided within 30 miles of Asheville, NC (28806). Extended delivery beyond 30 miles incurs additional charges as outlined in our shipping policy. All delivery appointments must be confirmed 24 hours in advance.`
    }
  ];

  const lastUpdated = "March 1, 2024";

  return (
    <motion.div
      className="min-h-screen py-16 px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-4xl mx-auto">
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
            TERMS OF SERVICE
          </h1>
          <p 
            className="text-xl max-w-3xl mx-auto mb-4"
            style={{ color: theme.colors.text.secondary }}
          >
            These terms govern your use of Clean & Flip's fitness equipment marketplace services.
          </p>
          <p 
            className="text-sm"
            style={{ color: theme.colors.text.muted }}
          >
            Last updated: {lastUpdated}
          </p>
        </motion.div>

        {/* Key Sections */}
        <motion.div 
          className="grid gap-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {sections.map((section, index) => (
            <Card key={index} className="p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: `${theme.colors.brand.blue}15` }}>
                  <div style={{ color: theme.colors.brand.blue }}>
                    {section.icon}
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 
                    className="font-bold text-xl mb-4"
                    style={{ color: theme.colors.text.primary }}
                  >
                    {section.title}
                  </h3>
                  <p 
                    className="leading-relaxed"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    {section.content}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </motion.div>

        {/* Detailed Terms */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="p-8">
            <div className="prose max-w-none">
              <h2 
                className="font-bebas text-3xl mb-6"
                style={{ color: theme.colors.text.primary }}
              >
                COMPLETE TERMS & CONDITIONS
              </h2>
              
              <div className="space-y-8" style={{ color: theme.colors.text.secondary }}>
                <section>
                  <h3 className="font-semibold text-lg mb-3" style={{ color: theme.colors.text.primary }}>
                    1. Service Description
                  </h3>
                  <p className="mb-4">
                    Clean & Flip operates as a fitness equipment marketplace specializing in buying, reconditioning, 
                    and selling used fitness equipment in the greater Asheville, North Carolina area.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3" style={{ color: theme.colors.text.primary }}>
                    2. Equipment Condition & Warranty
                  </h3>
                  <p className="mb-4">
                    All equipment undergoes comprehensive inspection and is graded as Excellent, Good, or Fair condition. 
                    We provide a 30-day functionality warranty on all purchases, covering mechanical defects and performance issues.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3" style={{ color: theme.colors.text.primary }}>
                    3. Payment Terms
                  </h3>
                  <p className="mb-4">
                    Payment is due in full at time of purchase. We accept major credit cards, PayPal, and secure online payments. 
                    All transactions are processed securely through encrypted channels.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3" style={{ color: theme.colors.text.primary }}>
                    4. Delivery & Pickup Policy
                  </h3>
                  <p className="mb-4">
                    Free delivery is provided within 30 miles of Asheville, NC (ZIP 28806). Extended delivery beyond 30 miles 
                    requires a $50 minimum charge. All deliveries are scheduled during business hours: Monday-Saturday, 9AM-5PM EST.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3" style={{ color: theme.colors.text.primary }}>
                    5. Returns & Exchanges
                  </h3>
                  <p className="mb-4">
                    Returns are accepted within 7 days of delivery for items that don't meet expectations. 
                    Equipment must be returned in original condition. Customer is responsible for return delivery costs.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3" style={{ color: theme.colors.text.primary }}>
                    6. Limitation of Liability
                  </h3>
                  <p className="mb-4">
                    Clean & Flip's liability is limited to the purchase price of equipment. We are not responsible for 
                    indirect, incidental, or consequential damages. Customers assume responsibility for proper equipment use and safety.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3" style={{ color: theme.colors.text.primary }}>
                    7. Privacy & Data Protection
                  </h3>
                  <p className="mb-4">
                    We protect customer information in accordance with our Privacy Policy. Personal data is used only 
                    for order processing, delivery coordination, and customer service.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3" style={{ color: theme.colors.text.primary }}>
                    8. Modifications to Terms
                  </h3>
                  <p className="mb-4">
                    Clean & Flip reserves the right to modify these terms at any time. Changes will be posted on our website 
                    with an updated effective date. Continued use of our services constitutes acceptance of modified terms.
                  </p>
                </section>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Contact */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="p-8">
            <h2 
              className="font-bebas text-2xl mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              QUESTIONS ABOUT OUR TERMS?
            </h2>
            <p 
              className="mb-6"
              style={{ color: theme.colors.text.secondary }}
            >
              Contact us for clarification on any aspect of our Terms of Service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:legal@cleanandflip.com"
                className="bg-accent-blue hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Email Legal Team
              </a>
              <a 
                href="tel:+18283389682"
                className="border border-gray-300 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold transition-colors"
                style={{ color: theme.colors.text.primary }}
              >
                Call (828) 338-9682
              </a>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}