import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { theme } from "@/styles/design-system/theme";
import { Calendar, Clock, ArrowRight, Tag } from "lucide-react";

interface BlogPost {
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  slug: string;
  featured: boolean;
}

export default function Blog() {
  const blogPosts: BlogPost[] = [
    {
      title: "The Ultimate Guide to Buying Used Gym Equipment",
      excerpt: "Everything you need to know about purchasing quality used fitness equipment, from inspection tips to negotiation strategies.",
      date: "March 15, 2024",
      readTime: "8 min read",
      category: "Buying Guide",
      slug: "ultimate-guide-buying-used-gym-equipment",
      featured: true
    },
    {
      title: "Home Gym Setup: Maximizing Small Spaces",
      excerpt: "Transform even the smallest spaces into an effective home gym with smart equipment choices and layout strategies.",
      date: "March 10, 2024", 
      readTime: "6 min read",
      category: "Home Gym",
      slug: "home-gym-setup-small-spaces",
      featured: true
    },
    {
      title: "Equipment Maintenance: Keeping Your Gear Like New",
      excerpt: "Professional maintenance tips to extend the life of your fitness equipment and maintain peak performance.",
      date: "March 5, 2024",
      readTime: "7 min read",
      category: "Maintenance",
      slug: "equipment-maintenance-guide",
      featured: false
    },
    {
      title: "Olympic vs Standard Plates: What's the Difference?",
      excerpt: "Understanding the key differences between Olympic and standard weight plates to make the right choice for your setup.",
      date: "February 28, 2024",
      readTime: "5 min read", 
      category: "Equipment Guide",
      slug: "olympic-vs-standard-plates",
      featured: false
    },
    {
      title: "Selling Your Gym Equipment: Getting Top Dollar",
      excerpt: "Maximize the value of your used fitness equipment with our proven strategies for cleaning, pricing, and presentation.",
      date: "February 20, 2024",
      readTime: "6 min read",
      category: "Selling Tips",
      slug: "selling-gym-equipment-top-dollar", 
      featured: false
    },
    {
      title: "CrossFit Equipment Essentials for Home Workouts",
      excerpt: "Build a complete CrossFit home gym with the essential equipment that delivers maximum workout versatility.",
      date: "February 15, 2024",
      readTime: "9 min read",
      category: "CrossFit",
      slug: "crossfit-equipment-essentials-home",
      featured: false
    }
  ];

  const categories = Array.from(new Set(blogPosts.map(post => post.category)));
  const featuredPosts = blogPosts.filter(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

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
            FITNESS EQUIPMENT BLOG
          </h1>
          <p 
            className="text-xl max-w-3xl mx-auto"
            style={{ color: theme.colors.text.secondary }}
          >
            Expert insights, buying guides, and maintenance tips for fitness enthusiasts 
            looking to make smart equipment decisions.
          </p>
        </motion.div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <motion.div 
            className="mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 
              className="font-bebas text-3xl mb-8"
              style={{ color: theme.colors.text.primary }}
            >
              FEATURED ARTICLES
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.map((post, index) => (
                <Card key={post.slug} className="p-8 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center gap-2 mb-4">
                    <span 
                      className="bg-accent-blue text-white px-3 py-1 rounded text-xs font-semibold"
                    >
                      FEATURED
                    </span>
                    <span 
                      className="flex items-center gap-1 text-xs"
                      style={{ color: theme.colors.brand.blue }}
                    >
                      <Tag size={12} />
                      {post.category}
                    </span>
                  </div>
                  
                  <h3 
                    className="font-bold text-xl mb-4 leading-tight"
                    style={{ color: theme.colors.text.primary }}
                    data-testid={`featured-post-title-${index}`}
                  >
                    {post.title}
                  </h3>
                  
                  <p 
                    className="mb-6 leading-relaxed"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm" style={{ color: theme.colors.text.muted }}>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {post.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        {post.readTime}
                      </div>
                    </div>
                    <ArrowRight size={20} style={{ color: theme.colors.brand.blue }} />
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* All Posts */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 
              className="font-bebas text-3xl"
              style={{ color: theme.colors.text.primary }}
            >
              ALL ARTICLES
            </h2>
            
            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              <span 
                className="px-3 py-1 rounded-full text-xs font-medium bg-accent-blue text-white cursor-pointer"
              >
                All
              </span>
              {categories.map((category) => (
                <span 
                  key={category}
                  className="px-3 py-1 rounded-full text-xs font-medium border cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ color: theme.colors.text.secondary }}
                >
                  {category}
                </span>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <Card key={post.slug} className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span 
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                    style={{ 
                      color: theme.colors.brand.blue,
                      backgroundColor: `${theme.colors.brand.blue}10`
                    }}
                  >
                    <Tag size={10} />
                    {post.category}
                  </span>
                </div>
                
                <h3 
                  className="font-semibold text-lg mb-3 leading-tight flex-grow"
                  style={{ color: theme.colors.text.primary }}
                  data-testid={`post-title-${index}`}
                >
                  {post.title}
                </h3>
                
                <p 
                  className="mb-4 text-sm leading-relaxed flex-grow"
                  style={{ color: theme.colors.text.secondary }}
                >
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t mt-auto">
                  <div className="flex items-center gap-4 text-xs" style={{ color: theme.colors.text.muted }}>
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {post.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {post.readTime}
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ color: theme.colors.brand.blue }} />
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Newsletter CTA */}
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
              STAY UPDATED
            </h2>
            <p 
              className="text-lg mb-8 max-w-2xl mx-auto"
              style={{ color: theme.colors.text.secondary }}
            >
              Get the latest fitness equipment insights, buying guides, and exclusive deals 
              delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="px-4 py-3 border border-gray-300 rounded-lg flex-grow"
                data-testid="input-email-newsletter"
              />
              <button 
                className="bg-accent-blue hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                data-testid="button-subscribe"
              >
                Subscribe
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}