import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { globalDesignSystem as theme } from "@/styles/design-system/theme";
import { RotateCcw, Clock, Truck, CheckCircle, AlertCircle, Phone } from "lucide-react";

export default function Returns() {
  const returnSteps = [
    {
      icon: <Clock size={24} />,
      title: "7-Day Return Window",
      description: "Contact us within 7 days of delivery if you're not satisfied with your purchase."
    },
    {
      icon: <Phone size={24} />,
      title: "Contact Our Team",
      description: "Call (828) 338-9682 or email returns@cleanandflip.com to initiate your return."
    },
    {
      icon: <CheckCircle size={24} />,
      title: "Return Authorization",
      description: "We'll provide a return authorization number and schedule pickup at your convenience."
    },
    {
      icon: <Truck size={24} />,
      title: "Equipment Pickup",
      description: "We'll collect the equipment from your location. Return delivery fee applies."
    }
  ];

  const returnConditions = [
    "Equipment must be in original condition",
    "All accessories and parts must be included",
    "Return must be initiated within 7 days of delivery",
    "Customer pays return delivery fee",
    "Refund processed within 3-5 business days"
  ];

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
            RETURNS POLICY
          </h1>
          <p 
            className="text-xl max-w-3xl mx-auto"
            style={{ color: theme.colors.text.secondary }}
          >
            We want you to be completely satisfied with your purchase. If equipment doesn't meet 
            your expectations, we offer a straightforward return process.
          </p>
        </motion.div>

        {/* Return Process */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="p-8">
            <h2 
              className="font-bebas text-3xl mb-8 text-center"
              style={{ color: theme.colors.text.primary }}
            >
              RETURN PROCESS
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {returnSteps.map((step, index) => (
                <div key={index} className="text-center">
                  <div 
                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${theme.colors.brand.blue}15` }}
                  >
                    <div style={{ color: theme.colors.brand.blue }}>
                      {step.icon}
                    </div>
                  </div>
                  <h3 
                    className="font-semibold text-lg mb-3"
                    style={{ color: theme.colors.text.primary }}
                  >
                    {step.title}
                  </h3>
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Return Conditions */}
        <motion.div 
          className="grid md:grid-cols-2 gap-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="p-8">
            <div className="flex items-center mb-6">
              <RotateCcw size={32} style={{ color: theme.colors.status.success }} className="mr-4" />
              <h2 
                className="font-bebas text-2xl"
                style={{ color: theme.colors.text.primary }}
              >
                RETURN CONDITIONS
              </h2>
            </div>
            <ul className="space-y-3">
              {returnConditions.map((condition, index) => (
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
                    {condition}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-8">
            <div className="flex items-center mb-6">
              <AlertCircle size={32} style={{ color: theme.colors.status.warning }} className="mr-4" />
              <h2 
                className="font-bebas text-2xl"
                style={{ color: theme.colors.text.primary }}
              >
                IMPORTANT NOTES
              </h2>
            </div>
            <div className="space-y-4" style={{ color: theme.colors.text.secondary }}>
              <p className="text-sm">
                <strong>Return Fees:</strong> Customer is responsible for return delivery costs. 
                This typically ranges from $25-$75 depending on equipment size and location.
              </p>
              <p className="text-sm">
                <strong>Condition Requirement:</strong> Equipment must be returned in the same 
                condition as received. Any damage beyond normal inspection may affect refund amount.
              </p>
              <p className="text-sm">
                <strong>Processing Time:</strong> Once we receive and inspect returned equipment, 
                refunds are processed within 3-5 business days to your original payment method.
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Warranty vs Returns */}
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
              RETURNS VS WARRANTY
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 
                  className="font-semibold text-xl mb-4 flex items-center"
                  style={{ color: theme.colors.brand.blue }}
                >
                  <RotateCcw className="mr-3" size={24} />
                  Returns (7 days)
                </h3>
                <ul className="space-y-2 text-sm" style={{ color: theme.colors.text.secondary }}>
                  <li>• Equipment doesn't fit your space</li>
                  <li>• Changed your mind about purchase</li>
                  <li>• Equipment condition not as expected</li>
                  <li>• You found a better solution elsewhere</li>
                </ul>
              </div>
              <div>
                <h3 
                  className="font-semibold text-xl mb-4 flex items-center"
                  style={{ color: theme.colors.status.success }}
                >
                  <CheckCircle className="mr-3" size={24} />
                  Warranty (30 days)
                </h3>
                <ul className="space-y-2 text-sm" style={{ color: theme.colors.text.secondary }}>
                  <li>• Equipment not functioning as described</li>
                  <li>• Mechanical defects or failures</li>
                  <li>• Safety issues with equipment</li>
                  <li>• Missing parts or accessories</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-center" style={{ color: theme.colors.text.secondary }}>
                <strong>Need help deciding?</strong> Contact us at (828) 338-9682 and we'll help 
                determine whether your situation is covered under returns or warranty.
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Contact CTA */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="p-12">
            <h2 
              className="font-bebas text-3xl mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              NEED TO RETURN EQUIPMENT?
            </h2>
            <p 
              className="text-lg mb-8 max-w-2xl mx-auto"
              style={{ color: theme.colors.text.secondary }}
            >
              Contact our customer service team to initiate a return. 
              We'll make the process as smooth as possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="tel:+18283389682"
                className="bg-accent-blue hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                data-testid="button-call-returns"
              >
                Call (828) 338-9682
              </a>
              <a 
                href="mailto:returns@cleanandflip.com"
                className="border border-gray-300 hover:bg-gray-50 px-8 py-3 rounded-lg font-semibold transition-colors"
                style={{ color: theme.colors.text.primary }}
                data-testid="button-email-returns"
              >
                Email Returns Team
              </a>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}