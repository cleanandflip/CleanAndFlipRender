import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { theme } from "@/styles/design-system/theme";
import { Shield, Eye, Lock, Database, UserCheck, AlertTriangle } from "lucide-react";

export default function PrivacyPolicy() {
  const sections = [
    {
      icon: <Database size={24} />,
      title: "Information We Collect",
      content: `We collect information you provide directly (name, email, address, phone) and automatically (browsing data, device info, location for delivery). Payment information is processed securely through Stripe and not stored on our servers.`
    },
    {
      icon: <Eye size={24} />,
      title: "How We Use Information", 
      content: `Your information is used to process orders, coordinate delivery, provide customer service, and improve our services. We may send promotional emails with your consent, which you can unsubscribe from at any time.`
    },
    {
      icon: <Shield size={24} />,
      title: "Information Security",
      content: `We implement industry-standard security measures including encryption, secure servers, and regular security audits. Access to personal data is restricted to authorized personnel only.`
    },
    {
      icon: <UserCheck size={24} />,
      title: "Your Privacy Rights",
      content: `You have the right to access, update, or delete your personal information. You can also opt-out of marketing communications and request a copy of data we hold about you.`
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
            PRIVACY POLICY
          </h1>
          <p 
            className="text-xl max-w-3xl mx-auto mb-4"
            style={{ color: theme.colors.text.secondary }}
          >
            We're committed to protecting your privacy and being transparent about how we handle your information.
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
                <div className="p-3 rounded-lg" style={{ backgroundColor: `${theme.colors.brand.purple}15` }}>
                  <div style={{ color: theme.colors.brand.purple }}>
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

        {/* Detailed Privacy Policy */}
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
                COMPLETE PRIVACY POLICY
              </h2>
              
              <div className="space-y-8" style={{ color: theme.colors.text.secondary }}>
                <section>
                  <h3 className="font-semibold text-lg mb-3" style={{ color: theme.colors.text.primary }}>
                    1. Information Collection
                  </h3>
                  <p className="mb-4">
                    <strong>Personal Information:</strong> When you create an account, make a purchase, or contact us, we collect 
                    information such as your name, email address, phone number, shipping address, and payment information.
                  </p>
                  <p className="mb-4">
                    <strong>Automatic Information:</strong> We automatically collect certain information about your device and 
                    how you interact with our services, including IP address, browser type, operating system, and pages visited.
                  </p>
                  <p className="mb-4">
                    <strong>Location Information:</strong> We collect your location information to determine delivery eligibility 
                    and shipping costs within our service area.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3" style={{ color: theme.colors.text.primary }}>
                    2. Information Usage
                  </h3>
                  <p className="mb-4">
                    We use your information to:
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-1">
                    <li>Process orders and arrange delivery or pickup</li>
                    <li>Communicate with you about your account and orders</li>
                    <li>Provide customer service and technical support</li>
                    <li>Send marketing communications (with your consent)</li>
                    <li>Improve our services and develop new features</li>
                    <li>Comply with legal obligations and prevent fraud</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3" style={{ color: theme.colors.text.primary }}>
                    3. Information Sharing
                  </h3>
                  <p className="mb-4">
                    We do not sell, rent, or trade your personal information. We may share information with:
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-1">
                    <li>Service providers (payment processors, delivery partners)</li>
                    <li>Legal authorities when required by law</li>
                    <li>Business partners with your explicit consent</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3" style={{ color: theme.colors.text.primary }}>
                    4. Data Security
                  </h3>
                  <p className="mb-4">
                    We implement appropriate technical and organizational security measures to protect your personal information 
                    against unauthorized access, alteration, disclosure, or destruction. These measures include:
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-1">
                    <li>SSL encryption for data transmission</li>
                    <li>Secure servers with restricted access</li>
                    <li>Regular security audits and updates</li>
                    <li>Employee training on data protection</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3" style={{ color: theme.colors.text.primary }}>
                    5. Cookies and Tracking
                  </h3>
                  <p className="mb-4">
                    We use cookies and similar technologies to enhance your experience, analyze usage patterns, 
                    and deliver personalized content. You can control cookie settings through your browser preferences.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3" style={{ color: theme.colors.text.primary }}>
                    6. Your Rights
                  </h3>
                  <p className="mb-4">
                    You have the right to:
                  </p>
                  <ul className="list-disc list-inside mb-4 space-y-1">
                    <li>Access and review your personal information</li>
                    <li>Update or correct inaccurate information</li>
                    <li>Delete your account and associated data</li>
                    <li>Opt-out of marketing communications</li>
                    <li>Request a copy of your data</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3" style={{ color: theme.colors.text.primary }}>
                    7. Data Retention
                  </h3>
                  <p className="mb-4">
                    We retain your personal information for as long as necessary to provide our services and comply with legal obligations. 
                    Account information is retained until deletion is requested, while transaction records are kept for tax and legal purposes.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-3" style={{ color: theme.colors.text.primary }}>
                    8. Changes to This Policy
                  </h3>
                  <p className="mb-4">
                    We may update this Privacy Policy periodically. We will notify you of any material changes by posting 
                    the new policy on our website with an updated effective date.
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
            <div className="flex items-center justify-center mb-4">
              <Lock size={24} style={{ color: theme.colors.brand.purple }} />
            </div>
            <h2 
              className="font-bebas text-2xl mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              PRIVACY QUESTIONS?
            </h2>
            <p 
              className="mb-6"
              style={{ color: theme.colors.text.secondary }}
            >
              Contact our privacy team for questions about your data or to exercise your privacy rights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:privacy@cleanandflip.com"
                className="bg-accent-blue hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Email Privacy Team
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