import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, Input } from "@/components/shared/AnimatedComponents";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { globalDesignSystem as theme } from "@/styles/design-system/theme";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageSquare, 
  CheckCircle,
  Send
} from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      category: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      // In a real app, this would send to a contact form endpoint
      const response = await apiRequest("POST", "/api/contact", data);
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      form.reset();
      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Send",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactForm) => {
    submitMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <motion.div 
        className="min-h-screen pt-32 px-6"
        style={{ backgroundColor: theme.colors.bg.primary }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <CheckCircle 
              className="mx-auto mb-6" 
              size={64} 
              style={{ color: theme.colors.brand.green }}
            />
            <h1 
              className="font-bebas text-4xl mb-4"
              style={{ color: theme.colors.text.primary }}
            >
              MESSAGE SENT!
            </h1>
            <p 
              className="text-lg mb-8"
              style={{ color: theme.colors.text.secondary }}
            >
              Thank you for contacting Clean & Flip. We've received your message and 
              will get back to you within 24 hours.
            </p>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="text-center">
                <Clock 
                  className="mx-auto mb-2" 
                  size={32} 
                  style={{ color: theme.colors.brand.blue }}
                />
                <h3 
                  className="font-semibold mb-1"
                  style={{ color: theme.colors.text.primary }}
                >
                  Quick Response
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: theme.colors.text.muted }}
                >
                  24-hour response guarantee
                </p>
              </div>
              <div className="text-center">
                <MessageSquare 
                  className="mx-auto mb-2" 
                  size={32} 
                  style={{ color: theme.colors.brand.green }}
                />
                <h3 
                  className="font-semibold mb-1"
                  style={{ color: theme.colors.text.primary }}
                >
                  Personal Service
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: theme.colors.text.muted }}
                >
                  Direct response from our team
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setIsSubmitted(false)}
              variant="secondary" 
              size="lg"
            >
              Send Another Message
            </Button>
          </Card>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen pt-32 px-6 pb-12"
      style={{ backgroundColor: theme.colors.bg.primary }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="font-bebas text-6xl md:text-8xl mb-6">
            <span style={{ color: theme.colors.text.primary }}>CONTACT </span>
            <span style={{ color: theme.colors.brand.blue }}>US</span>
          </h1>
          <p 
            className="text-xl max-w-3xl mx-auto"
            style={{ color: theme.colors.text.secondary }}
          >
            Have questions about buying or selling equipment? Need help with an order? 
            We're here to help and respond to all inquiries within 24 hours.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="p-6">
                  <h2 
                    className="font-bebas text-2xl mb-6 flex items-center"
                    style={{ color: theme.colors.text.primary }}
                  >
                    <Send 
                      className="mr-3" 
                      size={28} 
                      style={{ color: theme.colors.brand.blue }}
                    />
                    SEND US A MESSAGE
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Your full name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email"
                              placeholder="your@email.com"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="What can we help with?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="selling">Selling Equipment</SelectItem>
                              <SelectItem value="buying">Buying Equipment</SelectItem>
                              <SelectItem value="order">Order Support</SelectItem>
                              <SelectItem value="shipping">Shipping & Delivery</SelectItem>
                              <SelectItem value="returns">Returns & Refunds</SelectItem>
                              <SelectItem value="general">General Question</SelectItem>
                              <SelectItem value="partnership">Partnership Inquiry</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Brief subject line"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Message *</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Tell us how we can help you..."
                            className="min-h-[120px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div 
                    className="mt-6 text-sm"
                    style={{ color: theme.colors.text.muted }}
                  >
                    <p>* Required fields</p>
                    <p className="mt-1">
                      We typically respond within 24 hours during business hours. 
                      For urgent matters, please call us directly.
                    </p>
                  </div>
                </Card>

                <Button 
                  type="submit" 
                  variant="primary"
                  size="lg"
                  className="w-full py-3"
                  loading={submitMutation.isPending}
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </Form>
          </motion.div>

          {/* Contact Information */}
          <motion.div 
            className="lg:col-span-1 space-y-6"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {/* Direct Contact */}
            <Card className="p-6">
              <h3 
                className="font-bebas text-xl mb-6"
                style={{ color: theme.colors.text.primary }}
              >
                DIRECT CONTACT
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail 
                    className="mt-1 flex-shrink-0" 
                    size={20} 
                    style={{ color: theme.colors.brand.blue }}
                  />
                  <div>
                    <h4 
                      className="font-semibold mb-1"
                      style={{ color: theme.colors.text.primary }}
                    >
                      Email
                    </h4>
                    <a 
                      href="mailto:support@cleanandflip.com"
                      className="transition-colors"
                      style={{ 
                        color: theme.colors.text.secondary,
                        ':hover': { color: theme.colors.brand.blue }
                      }}
                    >
                      support@cleanandflip.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone 
                    className="mt-1 flex-shrink-0" 
                    size={20} 
                    style={{ color: theme.colors.brand.green }}
                  />
                  <div>
                    <h4 
                      className="font-semibold mb-1"
                      style={{ color: theme.colors.text.primary }}
                    >
                      Phone
                    </h4>
                    <a 
                      href="tel:+18285550123"
                      className="transition-colors"
                      style={{ 
                        color: theme.colors.text.secondary,
                        ':hover': { color: theme.colors.brand.green }
                      }}
                    >
                      (828) 555-0123
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin 
                    className="mt-1 flex-shrink-0" 
                    size={20} 
                    style={{ color: theme.colors.status.error }}
                  />
                  <div>
                    <h4 
                      className="font-semibold mb-1"
                      style={{ color: theme.colors.text.primary }}
                    >
                      Location
                    </h4>
                    <p 
                      className=""
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Asheville, NC<br />
                      Serving Western North Carolina
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock 
                    className="mt-1 flex-shrink-0" 
                    size={20} 
                    style={{ color: theme.colors.status.warning }}
                  />
                  <div>
                    <h4 
                      className="font-semibold mb-1"
                      style={{ color: theme.colors.text.primary }}
                    >
                      Hours
                    </h4>
                    <p 
                      className=""
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Monday - Friday<br />
                      9:00 AM - 5:00 PM EST
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Response Time */}
            <Card className="p-6">
              <h3 
                className="font-bebas text-xl mb-4"
                style={{ color: theme.colors.text.primary }}
              >
                RESPONSE GUARANTEE
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: theme.colors.brand.green }}
                  ></div>
                  <div>
                    <div 
                      className="font-semibold"
                      style={{ color: theme.colors.text.primary }}
                    >
                      Email inquiries
                    </div>
                    <div 
                      className="text-sm"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Within 24 hours
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: theme.colors.status.warning }}
                  ></div>
                  <div>
                    <div 
                      className="font-semibold"
                      style={{ color: theme.colors.text.primary }}
                    >
                      Equipment evaluations
                    </div>
                    <div 
                      className="text-sm"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Within 48 hours
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: theme.colors.brand.blue }}
                  ></div>
                  <div>
                    <div 
                      className="font-semibold"
                      style={{ color: theme.colors.text.primary }}
                    >
                      Phone calls
                    </div>
                    <div 
                      className="text-sm"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      Same business day
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Service Area Map */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="p-8 mt-12">
            <h2 
              className="font-bebas text-2xl mb-6 text-center"
              style={{ color: theme.colors.text.primary }}
            >
              SERVICE AREA
            </h2>
            <div className="text-center">
              <p 
                className="mb-6"
                style={{ color: theme.colors.text.secondary }}
              >
                We primarily serve the greater Asheville, NC area with pickup and delivery services. 
                Shipping is available throughout the continental United States.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <MapPin 
                    className="mx-auto mb-2" 
                    size={32} 
                    style={{ color: theme.colors.brand.blue }}
                  />
                  <h3 
                    className="font-semibold mb-1"
                    style={{ color: theme.colors.text.primary }}
                  >
                    Local Pickup
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    Free within 25 miles of Asheville
                  </p>
                </div>
                <div className="text-center">
                  <Phone 
                    className="mx-auto mb-2" 
                    size={32} 
                    style={{ color: theme.colors.brand.green }}
                  />
                  <h3 
                    className="font-semibold mb-1"
                    style={{ color: theme.colors.text.primary }}
                  >
                    Regional Delivery
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    Available throughout Western NC
                  </p>
                </div>
                <div className="text-center">
                  <Mail 
                    className="mx-auto mb-2" 
                    size={32} 
                    style={{ color: theme.colors.status.warning }}
                  />
                  <h3 
                    className="font-semibold mb-1"
                    style={{ color: theme.colors.text.primary }}
                  >
                    Nationwide Shipping
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    Professional freight services available
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
