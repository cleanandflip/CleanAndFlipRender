import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import GlassCard from "@/components/common/glass-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
      <div className="min-h-screen pt-32 px-6">
        <div className="max-w-4xl mx-auto">
          <GlassCard className="p-12 text-center">
            <CheckCircle className="mx-auto mb-6 text-success" size={64} />
            <h1 className="font-bebas text-4xl mb-4">MESSAGE SENT!</h1>
            <p className="text-text-secondary text-lg mb-8">
              Thank you for contacting Clean & Flip. We've received your message and 
              will get back to you within 24 hours.
            </p>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="text-center">
                <Clock className="mx-auto mb-2 text-accent-blue" size={32} />
                <h3 className="font-semibold mb-1">Quick Response</h3>
                <p className="text-sm text-text-muted">24-hour response guarantee</p>
              </div>
              <div className="text-center">
                <MessageSquare className="mx-auto mb-2 text-success" size={32} />
                <h3 className="font-semibold mb-1">Personal Service</h3>
                <p className="text-sm text-text-muted">Direct response from our team</p>
              </div>
            </div>
            <Button 
              onClick={() => setIsSubmitted(false)}
              variant="outline" 
              className="glass border-glass-border"
            >
              Send Another Message
            </Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-bebas text-6xl md:text-8xl mb-6">
            CONTACT <span className="text-accent-blue">US</span>
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Have questions about buying or selling equipment? Need help with an order? 
            We're here to help and respond to all inquiries within 24 hours.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <GlassCard className="p-6">
                  <h2 className="font-bebas text-2xl mb-6 flex items-center">
                    <Send className="mr-3 text-accent-blue" size={28} />
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
                              className="glass border-glass-border"
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
                              className="glass border-glass-border"
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
                              <SelectTrigger className="glass border-glass-border">
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
                              className="glass border-glass-border"
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
                            className="glass border-glass-border min-h-[120px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-6 text-sm text-text-muted">
                    <p>* Required fields</p>
                    <p className="mt-1">
                      We typically respond within 24 hours during business hours. 
                      For urgent matters, please call us directly.
                    </p>
                  </div>
                </GlassCard>

                <Button 
                  type="submit" 
                  disabled={submitMutation.isPending}
                  className="w-full bg-accent-blue hover:bg-blue-500 text-white py-3"
                >
                  {submitMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </Form>
          </div>

          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Direct Contact */}
            <GlassCard className="p-6">
              <h3 className="font-bebas text-xl mb-6">DIRECT CONTACT</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="text-accent-blue mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-semibold mb-1">Email</h4>
                    <a 
                      href="mailto:support@cleanandflip.com"
                      className="text-text-secondary hover:text-accent-blue transition-colors"
                    >
                      support@cleanandflip.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="text-success mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-semibold mb-1">Phone</h4>
                    <a 
                      href="tel:+18285550123"
                      className="text-text-secondary hover:text-success transition-colors"
                    >
                      (828) 555-0123
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="text-red-400 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-semibold mb-1">Location</h4>
                    <p className="text-text-secondary">
                      Asheville, NC<br />
                      Serving Western North Carolina
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="text-warning mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-semibold mb-1">Hours</h4>
                    <p className="text-text-secondary">
                      Monday - Friday<br />
                      9:00 AM - 5:00 PM EST
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* FAQ Quick Links */}
            <GlassCard className="p-6">
              <h3 className="font-bebas text-xl mb-6">QUICK ANSWERS</h3>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Common Questions:</h4>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li>• How long does equipment evaluation take?</li>
                  <li>• What areas do you serve for pickup?</li>
                  <li>• What's your return policy?</li>
                  <li>• How do you determine equipment value?</li>
                  <li>• Do you offer delivery services?</li>
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full glass border-glass-border mt-4"
                >
                  View Full FAQ
                </Button>
              </div>
            </GlassCard>

            {/* Response Time */}
            <GlassCard className="p-6">
              <h3 className="font-bebas text-xl mb-4">RESPONSE GUARANTEE</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <div>
                    <div className="font-semibold">Email inquiries</div>
                    <div className="text-sm text-text-secondary">Within 24 hours</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-warning rounded-full"></div>
                  <div>
                    <div className="font-semibold">Equipment evaluations</div>
                    <div className="text-sm text-text-secondary">Within 48 hours</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent-blue rounded-full"></div>
                  <div>
                    <div className="font-semibold">Phone calls</div>
                    <div className="text-sm text-text-secondary">Same business day</div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Service Area Map */}
        <GlassCard className="p-8 mt-12">
          <h2 className="font-bebas text-2xl mb-6 text-center">SERVICE AREA</h2>
          <div className="text-center">
            <p className="text-text-secondary mb-6">
              We primarily serve the greater Asheville, NC area with pickup and delivery services. 
              Shipping is available throughout the continental United States.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <MapPin className="mx-auto mb-2 text-accent-blue" size={32} />
                <h3 className="font-semibold mb-1">Local Pickup</h3>
                <p className="text-sm text-text-secondary">Free within 25 miles of Asheville</p>
              </div>
              <div className="text-center">
                <Phone className="mx-auto mb-2 text-success" size={32} />
                <h3 className="font-semibold mb-1">Regional Delivery</h3>
                <p className="text-sm text-text-secondary">Available throughout Western NC</p>
              </div>
              <div className="text-center">
                <Mail className="mx-auto mb-2 text-warning" size={32} />
                <h3 className="font-semibold mb-1">Nationwide Shipping</h3>
                <p className="text-sm text-text-secondary">Professional freight services available</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
