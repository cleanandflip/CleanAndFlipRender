import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceInput } from "@/components/ui/price-input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import GlassCard from "@/components/common/glass-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEquipmentSubmissionSchema } from "@shared/schema";
import { z } from "zod";
import { 
  Upload, 
  DollarSign, 
  Camera, 
  CheckCircle, 
  Clock, 
  Truck,
  Star,
  MessageSquare
} from "lucide-react";

const submissionSchema = insertEquipmentSubmissionSchema.extend({
  images: z.array(z.string()).optional(),
});

type SubmissionForm = z.infer<typeof submissionSchema>;

export default function SellToUs() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const form = useForm<SubmissionForm>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      condition: "good",
      images: [],
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmissionForm) => {
      const response = await apiRequest("POST", "/api/submissions", {
        ...data,
        userId: "temp-user-id", // Replace with actual user ID
        images: uploadedImages,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Submission Received!",
        description: "We'll review your equipment and get back to you within 48 hours.",
      });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SubmissionForm) => {
    submitMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen pt-32 px-6">
        <div className="max-w-4xl mx-auto">
          <GlassCard className="p-12 text-center">
            <CheckCircle className="mx-auto mb-6 text-green-400" size={64} />
            <h1 className="font-bebas text-4xl mb-4">SUBMISSION RECEIVED!</h1>
            <p className="text-text-secondary text-lg mb-8">
              Thank you for choosing Clean & Flip. We've received your equipment submission 
              and our team will review it within 48 hours.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <Clock className="mx-auto mb-2 text-accent-blue" size={32} />
                <h3 className="font-semibold mb-1">Quick Review</h3>
                <p className="text-sm text-text-muted">48-hour response time</p>
              </div>
              <div className="text-center">
                <DollarSign className="mx-auto mb-2 text-success" size={32} />
                <h3 className="font-semibold mb-1">Fair Offers</h3>
                <p className="text-sm text-text-muted">Competitive pricing</p>
              </div>
              <div className="text-center">
                <Truck className="mx-auto mb-2 text-warning" size={32} />
                <h3 className="font-semibold mb-1">Free Pickup</h3>
                <p className="text-sm text-text-muted">We come to you</p>
              </div>
            </div>
            <p className="text-text-secondary">
              Check your email for a confirmation and tracking link.
            </p>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="font-bebas text-6xl md:text-8xl mb-6">
            SELL YOUR <span className="text-success">EQUIPMENT</span>
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto mb-8">
            Turn your unused weightlifting gear into cash. We inspect every item and 
            offer fair prices for quality equipment.
          </p>
          
          {/* Value Props */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <GlassCard className="p-6 text-center">
              <DollarSign className="mx-auto mb-4 text-success" size={40} />
              <h3 className="font-bebas text-xl mb-2">CASH OFFERS</h3>
              <p className="text-text-secondary">Get paid within 48 hours of acceptance</p>
            </GlassCard>
            
            <GlassCard className="p-6 text-center">
              <Camera className="mx-auto mb-4 text-accent-blue" size={40} />
              <h3 className="font-bebas text-xl mb-2">EASY PROCESS</h3>
              <p className="text-text-secondary">Just upload photos and basic info</p>
            </GlassCard>
            
            <GlassCard className="p-6 text-center">
              <Truck className="mx-auto mb-4 text-warning" size={40} />
              <h3 className="font-bebas text-xl mb-2">FREE PICKUP</h3>
              <p className="text-text-secondary">We handle pickup and payment</p>
            </GlassCard>
          </div>
        </div>

        {/* Submission Form */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Equipment Details */}
                <GlassCard className="p-6">
                  <h3 className="font-bebas text-2xl mb-6">EQUIPMENT DETAILS</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Equipment Name *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="e.g. Olympic Barbell 45lb"
                              className="glass border-glass-border"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brand</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ""}
                              placeholder="e.g. Rogue, Eleiko, etc."
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
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condition *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="glass border-glass-border">
                                <SelectValue placeholder="Select condition" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="like_new">Like New</SelectItem>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="fair">Fair</SelectItem>
                              <SelectItem value="needs_repair">Needs Repair</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (lbs)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ""}
                              type="number"
                              placeholder="Total weight in pounds"
                              className="glass border-glass-border"
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="askingPrice"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Your Asking Price (Optional)</FormLabel>
                        <FormControl>
                          <PriceInput 
                            {...field} 
                            value={field.value || ""}
                            placeholder="50"
                            className="glass border-glass-border"
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <p className="text-sm text-text-muted mt-1">
                          This helps us make a fair offer, but we'll evaluate based on condition and market value.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            value={field.value || ""}
                            placeholder="Tell us about the equipment - age, usage, any wear or damage..."
                            className="glass border-glass-border min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </GlassCard>

                {/* Photo Upload */}
                <GlassCard className="p-6">
                  <h3 className="font-bebas text-2xl mb-4">PHOTOS</h3>
                  <p className="text-text-secondary mb-6">
                    Upload clear photos showing the equipment from multiple angles. 
                    Include any wear, damage, or unique features.
                  </p>
                  
                  <div className="border-2 border-dashed border-glass-border rounded-lg p-8 text-center">
                    <Upload className="mx-auto mb-4 text-text-muted" size={48} />
                    <h4 className="font-semibold mb-2">Upload Photos</h4>
                    <p className="text-text-muted mb-4">
                      Drag and drop photos here, or click to select
                    </p>
                    <Button variant="outline" className="glass border-glass-border">
                      Choose Files
                    </Button>
                  </div>
                  
                  <div className="mt-4 text-sm text-text-muted">
                    <p>• Upload 3-8 photos for best results</p>
                    <p>• Show front, back, and detail views</p>
                    <p>• Highlight any wear or damage</p>
                  </div>
                </GlassCard>

                <Button 
                  type="submit" 
                  disabled={submitMutation.isPending}
                  className="w-full bg-success hover:bg-green-600 text-white py-3"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
                </Button>
              </form>
            </Form>
          </div>

          {/* Process Sidebar */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6 sticky top-32">
              <h3 className="font-bebas text-xl mb-6">HOW IT WORKS</h3>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Submit Details</h4>
                    <p className="text-sm text-text-secondary">
                      Fill out the form with photos and equipment details
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Get Cash Offer</h4>
                    <p className="text-sm text-text-secondary">
                      We'll review and send you a fair offer within 48 hours
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Schedule Pickup</h4>
                    <p className="text-sm text-text-secondary">
                      Accept the offer and we'll arrange free pickup
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Get Paid</h4>
                    <p className="text-sm text-text-secondary">
                      Receive cash payment when we pick up your equipment
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Testimonial */}
            <GlassCard className="p-6 mt-6">
              <div className="flex items-center mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="text-yellow-400 fill-current" size={16} />
                ))}
              </div>
              <blockquote className="text-sm text-text-secondary mb-3">
                "Clean & Flip made selling my home gym equipment so easy. Fair price, 
                quick pickup, and cash in hand. Highly recommend!"
              </blockquote>
              <cite className="text-sm font-semibold">- Sarah M.</cite>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
