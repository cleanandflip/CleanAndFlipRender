import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { globalDesignSystem as theme } from "@/styles/design-system/theme";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface FAQ {
  question: string;
  answer: string;
}

export default function FAQ() {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const faqs: FAQ[] = [
    {
      question: "What condition are your used weights and equipment in?",
      answer: "All equipment undergoes our comprehensive inspection process. We grade items as Excellent (like new), Good (minor wear), or Fair (functional with visible wear). Every product listing includes detailed condition photos and descriptions."
    },
    {
      question: "Do you offer delivery within the Asheville area?",
      answer: "Yes! We offer free delivery within 30 miles of Asheville, NC. For locations beyond 30 miles, extended delivery is available with a $50 minimum charge. Contact us at (828) 338-9682 to schedule."
    },
    {
      question: "How does your equipment inspection process work?",
      answer: "Our certified technicians inspect every piece of equipment for safety, functionality, and cosmetic condition. We check moving parts, weight accuracy, structural integrity, and overall wear patterns before listing items for sale."
    },
    {
      question: "Can I sell my gym equipment to you?",
      answer: "Absolutely! We're always looking for quality fitness equipment. Submit your equipment details through our 'Sell To Us' page, and we'll provide a fair market quote within 24 hours."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and secure online payments through our Stripe integration. All transactions are fully encrypted and secure."
    },
    {
      question: "Do you offer warranties on used equipment?",
      answer: "Yes! We provide a 30-day functionality warranty on all equipment. If any item fails to perform as described within 30 days of purchase, we'll repair or replace it at no cost to you."
    },
    {
      question: "How do I know if an item will fit in my space?",
      answer: "Every product listing includes detailed dimensions and space requirements. Our team is also available to help with space planning - just call (828) 338-9682 for personalized assistance."
    },
    {
      question: "Can I return items if they don't work for me?",
      answer: "We offer a 7-day return window for items that don't meet your expectations. Returns must be in the same condition as received, and original delivery fees apply for the return pickup."
    },
    {
      question: "How quickly can I get my equipment delivered?",
      answer: "Local deliveries within 30 miles typically occur within 2-3 business days. Extended delivery areas may take 5-7 business days. We'll coordinate specific timing when you place your order."
    },
    {
      question: "Do you buy equipment from commercial gyms?",
      answer: "Yes! We work with commercial gyms, CrossFit boxes, and fitness centers looking to upgrade or liquidate equipment. We can handle large-scale purchases and provide competitive bulk pricing."
    }
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
            FREQUENTLY ASKED QUESTIONS
          </h1>
          <p 
            className="text-xl max-w-3xl mx-auto"
            style={{ color: theme.colors.text.secondary }}
          >
            Find answers to common questions about buying, selling, and using our fitness equipment.
            Can't find what you're looking for? Contact us directly.
          </p>
        </motion.div>

        {/* FAQ Items */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {faqs.map((faq, index) => (
            <Card key={index} className="p-6">
              <button
                className="w-full text-left flex justify-between items-center"
                onClick={() => toggleExpanded(index)}
                data-testid={`faq-toggle-${index}`}
              >
                <h3 
                  className="font-semibold text-lg pr-4"
                  style={{ color: theme.colors.text.primary }}
                >
                  {faq.question}
                </h3>
                {expandedItems.has(index) ? (
                  <ChevronUp size={24} style={{ color: theme.colors.brand.blue }} />
                ) : (
                  <ChevronDown size={24} style={{ color: theme.colors.brand.blue }} />
                )}
              </button>
              
              {expandedItems.has(index) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <p 
                    className="leading-relaxed"
                    style={{ color: theme.colors.text.secondary }}
                    data-testid={`faq-answer-${index}`}
                  >
                    {faq.answer}
                  </p>
                </motion.div>
              )}
            </Card>
          ))}
        </motion.div>

        {/* Contact CTA */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="p-12">
            <h2 
              className="font-bebas text-3xl mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              STILL HAVE QUESTIONS?
            </h2>
            <p 
              className="text-lg mb-8 max-w-2xl mx-auto"
              style={{ color: theme.colors.text.secondary }}
            >
              Our team is here to help! Contact us directly for personalized assistance 
              with your fitness equipment needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="tel:+18283389682"
                className="bg-accent-blue hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                data-testid="button-call"
              >
                Call (828) 338-9682
              </a>
              <a 
                href="/contact"
                className="border border-gray-300 hover:bg-gray-50 px-8 py-3 rounded-lg font-semibold transition-colors"
                style={{ color: theme.colors.text.primary }}
                data-testid="button-contact"
              >
                Send Message
              </a>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}