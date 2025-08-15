import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/shared/AnimatedComponents";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dropdown } from "@/components/ui";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
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
  topic: z.string().min(1, "Please select a topic"),
});

type ContactForm = z.infer<typeof contactSchema>;

const TOPIC_OPTIONS = [
  { value: "selling", label: "Selling Equipment" },
  { value: "buying", label: "Buying Equipment" },
  { value: "order", label: "Order Support" },
  { value: "shipping", label: "Shipping & Delivery" },
  { value: "returns", label: "Returns & Refunds" },
  { value: "general", label: "General Question" },
  { value: "partnership", label: "Partnership Inquiry" }
];

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      topic: "",
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
          <Card className="p-12 text-center">
            <CheckCircle className="mx-auto mb-6 text-success" size={64} />
            <h1 className="font-bebas text-4xl mb-4 text-foreground">MESSAGE SENT!</h1>
            <p className="text-lg mb-8 text-text-secondary">
              Thank you for contacting Clean & Flip. We've received your message and 
              will get back to you within 24 hours.
            </p>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="text-center">
                <Clock className="mx-auto mb-2 text-accent-blue" size={32} />
                <h3 className="font-semibold mb-1 text-foreground">Quick Response</h3>
                <p className="text-sm text-text-muted">24-hour response guarantee</p>
              </div>
              <div className="text-center">
                <MessageSquare className="mx-auto mb-2 text-success" size={32} />
                <h3 className="font-semibold mb-1 text-foreground">Personal Service</h3>
                <p className="text-sm text-text-muted">Direct response from our team</p>
              </div>
            </div>
            <Button 
              onClick={() => setIsSubmitted(false)}
              variant="outline" 
              size="lg"
            >
              Send Another Message
            </Button>
          </Card>
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
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card className="max-w-4xl mx-auto p-6 md:p-8 lg:p-10 rounded-2xl mb-10 lg:mb-12">
                  {/* Header row */}
                  <div className="flex items-center gap-3 mb-6 md:mb-8">
                    <Send className="h-5 w-5 opacity-70" />
                    <div>
                      <h2 className="text-xl md:text-2xl font-semibold">Send Us a Message</h2>
                      <p className="mt-1 text-sm opacity-80">We'll get back to you within 24 hours</p>
                    </div>
                  </div>
                  
                  {/* Form grid with consistent rhythm */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    {/* Row 1: Full Name & Email */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium">
                        Full Name <span className="text-destructive">*</span>
                      </label>
                      <div className="mt-2">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  id="name"
                                  placeholder="Your full name"
                                  className="h-10"
                                  aria-invalid={!!form.formState.errors.name}
                                  aria-describedby={form.formState.errors.name ? "name-error" : undefined}
                                />
                              </FormControl>
                              <FormMessage id="name-error" className="mt-1 text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium">
                        Email Address <span className="text-destructive">*</span>
                      </label>
                      <div className="mt-2">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  id="email"
                                  type="email"
                                  placeholder="your@email.com"
                                  className="h-10"
                                  aria-invalid={!!form.formState.errors.email}
                                  aria-describedby={form.formState.errors.email ? "email-error" : undefined}
                                />
                              </FormControl>
                              <FormMessage id="email-error" className="mt-1 text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Row 2: Topic & Subject */}
                    <div>
                      <label htmlFor="topic" className="block text-sm font-medium">
                        Topic <span className="text-destructive">*</span>
                      </label>
                      <div className="mt-2">
                        <FormField
                          control={form.control}
                          name="topic"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Dropdown
                                  fullWidth
                                  value={field.value || ""}
                                  onChange={(v) => field.onChange(v)}
                                  options={TOPIC_OPTIONS}
                                  placeholder="What can we help with?"
                                  aria-invalid={!!form.formState.errors.topic}
                                  aria-describedby={form.formState.errors.topic ? "topic-error" : undefined}
                                />
                              </FormControl>
                              <FormMessage id="topic-error" className="mt-1 text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium">
                        Subject <span className="text-destructive">*</span>
                      </label>
                      <div className="mt-2">
                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  id="subject"
                                  placeholder="Brief subject line"
                                  className="h-10"
                                  aria-invalid={!!form.formState.errors.subject}
                                  aria-describedby={form.formState.errors.subject ? "subject-error" : undefined}
                                />
                              </FormControl>
                              <FormMessage id="subject-error" className="mt-1 text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Row 3: Message (full width) */}
                    <div className="md:col-span-2">
                      <label htmlFor="message" className="block text-sm font-medium">
                        Message <span className="text-destructive">*</span>
                      </label>
                      <div className="mt-2">
                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  id="message"
                                  placeholder="Tell us how we can help you…"
                                  rows={6}
                                  className="resize-vertical"
                                  aria-invalid={!!form.formState.errors.message}
                                  aria-describedby={form.formState.errors.message ? "message-error" : undefined}
                                />
                              </FormControl>
                              <FormMessage id="message-error" className="mt-1 text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* SLA note under Message */}
                      <p className="mt-2 text-xs opacity-80">
                        We typically respond within 24 hours during business hours. For urgent matters, please call us directly.
                      </p>
                    </div>
                  </div>

                  {/* Required fields note at bottom-left */}
                  <p className="mt-3 text-xs opacity-70">* Required fields</p>
                </Card>

                {/* Submit button block */}
                <div className="mt-6 md:flex md:justify-end">
                  <Button 
                    type="submit" 
                    disabled={submitMutation.isPending || !form.formState.isValid}
                    aria-busy={submitMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    {submitMutation.isPending ? "Sending…" : "Send Message"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Contact Info Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-bebas text-xl mb-4">GET IN TOUCH</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-accent-blue" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-text-muted">contact@cleanandflip.com</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-success" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-text-muted">(828) 338-9682</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-warning" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-text-muted">Asheville, NC</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-text-muted" />
                  <div>
                    <p className="font-medium">Hours</p>
                    <p className="text-sm text-text-muted">Mon-Fri 9AM-6PM</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bebas text-xl mb-4">RESPONSE TIME</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">General Inquiries</span>
                  <span className="text-sm font-medium text-success">24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Order Support</span>
                  <span className="text-sm font-medium text-warning">4 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Urgent Issues</span>
                  <span className="text-sm font-medium text-accent-blue">1 hour</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}