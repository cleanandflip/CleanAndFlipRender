import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { theme } from "@/styles/design-system/theme";
import { Search, CheckCircle, Award, Camera, Scale, Wrench, Star, Shield } from "lucide-react";

export default function InspectionProcess() {
  const inspectionSteps = [
    {
      icon: <Search size={24} />,
      title: "Initial Assessment",
      description: "Every piece of equipment undergoes a comprehensive visual inspection for obvious defects, damage, or excessive wear."
    },
    {
      icon: <Wrench size={24} />,
      title: "Mechanical Testing",
      description: "All moving parts, adjustments, and mechanisms are tested for proper operation, smoothness, and safety."
    },
    {
      icon: <Scale size={24} />,
      title: "Weight Verification",
      description: "Weights and plates are verified for accuracy using calibrated scales. Any discrepancies are noted and disclosed."
    },
    {
      icon: <Camera size={24} />,
      title: "Photo Documentation",
      description: "Detailed photos are taken from multiple angles, highlighting condition, wear patterns, and any cosmetic issues."
    },
    {
      icon: <Award size={24} />,
      title: "Condition Grading",
      description: "Equipment is graded as Excellent, Good, or Fair based on our standardized criteria and testing results."
    },
    {
      icon: <CheckCircle size={24} />,
      title: "Final Approval",
      description: "Only equipment that meets our safety and quality standards is approved for sale to customers."
    }
  ];

  const gradingCriteria = {
    excellent: {
      title: "EXCELLENT",
      color: theme.colors.status.success,
      description: "Like-new condition with minimal signs of use",
      criteria: [
        "No visible wear or damage",
        "All functions operate perfectly",
        "Original finish and appearance",
        "All accessories included",
        "Weight accuracy within 1%"
      ]
    },
    good: {
      title: "GOOD", 
      color: theme.colors.brand.blue,
      description: "Shows light use but fully functional",
      criteria: [
        "Minor cosmetic wear only",
        "All mechanical functions work properly",
        "Structural integrity intact",
        "May have light scratches or scuffs",
        "Weight accuracy within 2%"
      ]
    },
    fair: {
      title: "FAIR",
      color: theme.colors.status.warning,
      description: "Functional with visible wear but good value",
      criteria: [
        "Noticeable wear but structurally sound",
        "All safety features functional",
        "May need minor adjustments",
        "Cosmetic imperfections clearly disclosed",
        "Weight accuracy within 3%"
      ]
    }
  };

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
            INSPECTION PROCESS
          </h1>
          <p 
            className="text-xl max-w-4xl mx-auto"
            style={{ color: theme.colors.text.secondary }}
          >
            Every piece of equipment undergoes our rigorous 6-step inspection process before being offered for sale. 
            This ensures you receive quality equipment that performs as expected.
          </p>
        </motion.div>

        {/* Inspection Steps */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {inspectionSteps.map((step, index) => (
            <Card key={index} className="p-6">
              <div className="text-center mb-4">
                <div 
                  className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${theme.colors.brand.blue}15` }}
                >
                  <div style={{ color: theme.colors.brand.blue }}>
                    {step.icon}
                  </div>
                </div>
                <div 
                  className="text-sm font-semibold mb-2 px-3 py-1 rounded-full inline-block"
                  style={{ 
                    backgroundColor: `${theme.colors.brand.blue}15`,
                    color: theme.colors.brand.blue 
                  }}
                >
                  STEP {index + 1}
                </div>
              </div>
              <h3 
                className="font-semibold text-lg mb-3 text-center"
                style={{ color: theme.colors.text.primary }}
              >
                {step.title}
              </h3>
              <p 
                className="text-sm leading-relaxed text-center"
                style={{ color: theme.colors.text.secondary }}
              >
                {step.description}
              </p>
            </Card>
          ))}
        </motion.div>

        {/* Condition Grading */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 
            className="font-bebas text-4xl mb-8 text-center"
            style={{ color: theme.colors.text.primary }}
          >
            CONDITION GRADING SYSTEM
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {Object.entries(gradingCriteria).map(([key, grade]) => (
              <Card key={key} className="p-8">
                <div className="text-center mb-6">
                  <div 
                    className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${grade.color}15` }}
                  >
                    <Star size={32} style={{ color: grade.color }} />
                  </div>
                  <h3 
                    className="font-bebas text-2xl mb-2"
                    style={{ color: grade.color }}
                  >
                    {grade.title}
                  </h3>
                  <p 
                    className="text-sm font-medium"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    {grade.description}
                  </p>
                </div>
                <ul className="space-y-3">
                  {grade.criteria.map((criterion, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle 
                        size={16} 
                        style={{ color: grade.color }} 
                        className="mr-3 mt-1 flex-shrink-0"
                      />
                      <span 
                        className="text-sm"
                        style={{ color: theme.colors.text.secondary }}
                      >
                        {criterion}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Quality Guarantee */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="p-8">
            <div className="text-center mb-8">
              <Shield size={48} style={{ color: theme.colors.status.success }} className="mx-auto mb-4" />
              <h2 
                className="font-bebas text-3xl mb-4"
                style={{ color: theme.colors.text.primary }}
              >
                OUR QUALITY GUARANTEE
              </h2>
              <p 
                className="text-lg max-w-3xl mx-auto"
                style={{ color: theme.colors.text.secondary }}
              >
                We stand behind our inspection process. If any equipment doesn't perform as graded, 
                we'll make it right with our 30-day functionality warranty.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div 
                  className="text-3xl font-bold mb-2"
                  style={{ color: theme.colors.brand.blue }}
                >
                  15+
                </div>
                <p 
                  className="font-semibold mb-2"
                  style={{ color: theme.colors.text.primary }}
                >
                  Years Experience
                </p>
                <p 
                  className="text-sm"
                  style={{ color: theme.colors.text.secondary }}
                >
                  Our technicians have over 15 years of fitness equipment experience.
                </p>
              </div>
              <div className="text-center">
                <div 
                  className="text-3xl font-bold mb-2"
                  style={{ color: theme.colors.brand.blue }}
                >
                  98%
                </div>
                <p 
                  className="font-semibold mb-2"
                  style={{ color: theme.colors.text.primary }}
                >
                  Accuracy Rate
                </p>
                <p 
                  className="text-sm"
                  style={{ color: theme.colors.text.secondary }}
                >
                  Our condition grading accuracy rate based on customer feedback.
                </p>
              </div>
              <div className="text-center">
                <div 
                  className="text-3xl font-bold mb-2"
                  style={{ color: theme.colors.brand.blue }}
                >
                  30-Day
                </div>
                <p 
                  className="font-semibold mb-2"
                  style={{ color: theme.colors.text.primary }}
                >
                  Warranty
                </p>
                <p 
                  className="text-sm"
                  style={{ color: theme.colors.text.secondary }}
                >
                  Comprehensive functionality warranty on all inspected equipment.
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
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="p-12">
            <h2 
              className="font-bebas text-3xl mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              QUESTIONS ABOUT OUR INSPECTION?
            </h2>
            <p 
              className="text-lg mb-8 max-w-2xl mx-auto"
              style={{ color: theme.colors.text.secondary }}
            >
              Want to know more about how we evaluate equipment or our grading criteria? 
              Our inspection team is happy to explain our process in detail.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="tel:+18283389682"
                className="bg-accent-blue hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                data-testid="button-call-inspection"
              >
                Call (828) 338-9682
              </a>
              <a 
                href="mailto:inspection@cleanandflip.com"
                className="border border-gray-300 hover:bg-gray-50 px-8 py-3 rounded-lg font-semibold transition-colors"
                style={{ color: theme.colors.text.primary }}
                data-testid="button-email-inspection"
              >
                Email Inspection Team
              </a>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}