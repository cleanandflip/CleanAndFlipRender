import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { theme } from "@/styles/design-system/theme";
import { Star, Quote, Verified } from "lucide-react";

interface Review {
  name: string;
  location: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  verified: boolean;
  equipment: string;
}

export default function Reviews() {
  const reviews: Review[] = [
    {
      name: "Sarah Johnson",
      location: "Asheville, NC",
      rating: 5,
      date: "2 weeks ago",
      title: "Outstanding quality and service!",
      content: "Bought a complete Olympic weight set and couldn't be happier. Every plate was exactly as described, delivery was prompt, and the team even helped set everything up. The inspection process really shows - this equipment looks and performs like new.",
      verified: true,
      equipment: "Olympic Weight Set"
    },
    {
      name: "Mike Rodriguez",
      location: "Hendersonville, NC",
      rating: 5,
      date: "1 month ago", 
      title: "Saved thousands on commercial-grade equipment",
      content: "As a personal trainer opening my own studio, Clean & Flip helped me get professional equipment at a fraction of retail cost. The squat racks and dumbbells I purchased have been rock-solid. Their inspection process gave me confidence in every purchase.",
      verified: true,
      equipment: "Squat Racks & Dumbbell Set"
    },
    {
      name: "Jennifer Davis",
      location: "Black Mountain, NC",
      rating: 5,
      date: "3 weeks ago",
      title: "Honest grading and fast delivery",
      content: "The condition grading was spot-on accurate. What they called 'Good' condition was better than I expected. Free delivery within 30 miles made it even better. Already recommended to my CrossFit friends!",
      verified: true,
      equipment: "Concept2 Rower"
    },
    {
      name: "David Thompson",
      location: "Fletcher, NC", 
      rating: 4,
      date: "2 months ago",
      title: "Great selection and knowledgeable staff",
      content: "Found exactly what I needed for my garage gym. The team knew their stuff and helped me choose the right equipment for my space and goals. Minor scuff on one plate that wasn't mentioned, but overall very satisfied.",
      verified: true,
      equipment: "Home Gym Package"
    },
    {
      name: "Lisa Chen",
      location: "Weaverville, NC",
      rating: 5,
      date: "1 month ago",
      title: "Sold my old equipment - smooth process",
      content: "Clean & Flip made selling my old gym equipment incredibly easy. Fair pricing, quick evaluation, and they handled all the heavy lifting. Used the credit toward new equipment and saved even more!",
      verified: true,
      equipment: "Trade-in Program"
    },
    {
      name: "Robert Williams",
      location: "Arden, NC",
      rating: 5,
      date: "6 weeks ago",
      title: "Warranty gave me peace of mind",
      content: "The 30-day functionality warranty was clutch when one of my dumbbells had a loose handle. They replaced it immediately with no questions asked. That's the kind of service that builds trust.",
      verified: true,
      equipment: "Adjustable Dumbbells"
    }
  ];

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={i < rating ? "fill-current" : "fill-current opacity-30"}
        size={16}
        style={{ color: i < rating ? theme.colors.status.warning : '#e5e7eb' }}
      />
    ));
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
            CUSTOMER REVIEWS
          </h1>
          <p 
            className="text-xl max-w-3xl mx-auto mb-8"
            style={{ color: theme.colors.text.secondary }}
          >
            See what our customers say about their experience with Clean & Flip fitness equipment.
          </p>
          
          {/* Overall Rating */}
          <Card className="inline-block p-6">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div 
                  className="text-4xl font-bold mb-2"
                  style={{ color: theme.colors.text.primary }}
                >
                  {averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(averageRating))}
                </div>
                <p 
                  className="text-sm"
                  style={{ color: theme.colors.text.secondary }}
                >
                  Based on {reviews.length} reviews
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Reviews Grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {reviews.map((review, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <Card className="p-6 h-full flex flex-col">
                {/* Review Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {renderStars(review.rating)}
                    </div>
                    {review.verified && (
                      <div className="flex items-center gap-1">
                        <Verified size={14} style={{ color: theme.colors.status.success }} />
                        <span 
                          className="text-xs font-medium"
                          style={{ color: theme.colors.status.success }}
                        >
                          Verified
                        </span>
                      </div>
                    )}
                  </div>
                  <span 
                    className="text-xs"
                    style={{ color: theme.colors.text.muted }}
                  >
                    {review.date}
                  </span>
                </div>

                {/* Review Title */}
                <h3 
                  className="font-semibold text-lg mb-3"
                  style={{ color: theme.colors.text.primary }}
                  data-testid={`review-title-${index}`}
                >
                  {review.title}
                </h3>

                {/* Review Content */}
                <div className="flex-grow mb-4">
                  <Quote size={20} style={{ color: theme.colors.brand.blue }} className="mb-2" />
                  <p 
                    className="leading-relaxed text-sm mb-4"
                    style={{ color: theme.colors.text.secondary }}
                    data-testid={`review-content-${index}`}
                  >
                    {review.content}
                  </p>
                </div>

                {/* Review Footer */}
                <div className="border-t pt-4 mt-auto">
                  <div className="flex justify-between items-center">
                    <div>
                      <p 
                        className="font-medium text-sm"
                        style={{ color: theme.colors.text.primary }}
                      >
                        {review.name}
                      </p>
                      <p 
                        className="text-xs"
                        style={{ color: theme.colors.text.muted }}
                      >
                        {review.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p 
                        className="text-xs font-medium"
                        style={{ color: theme.colors.brand.blue }}
                      >
                        {review.equipment}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Leave Review CTA */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="p-12">
            <h2 
              className="font-bebas text-3xl mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              SHARE YOUR EXPERIENCE
            </h2>
            <p 
              className="text-lg mb-8 max-w-2xl mx-auto"
              style={{ color: theme.colors.text.secondary }}
            >
              Purchased equipment from us? We'd love to hear about your experience! 
              Your feedback helps us serve the fitness community better.
            </p>
            <a 
              href="mailto:reviews@cleanandflip.com?subject=Equipment Review"
              className="bg-accent-blue hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-block"
              data-testid="button-leave-review"
            >
              Leave a Review
            </a>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}