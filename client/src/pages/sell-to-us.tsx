import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceInput } from "@/components/ui/price-input";
import { UnifiedDropdown } from "@/components/ui/unified-dropdown";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card } from "@/components/shared/AnimatedComponents";
import { globalDesignSystem as theme } from "@/styles/design-system/theme";
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
  MessageSquare,
  Copy,
  Eye
} from "lucide-react";

const submissionSchema = z.object({
  name: z.string().min(1, "Equipment name is required"),
  brand: z.string().optional(),
  condition: z.enum(["new", "like_new", "good", "fair", "needs_repair"]),
  weight: z.string().optional(),
  askingPrice: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
});

type SubmissionForm = z.infer<typeof submissionSchema>;

// Popular equipment brands
const EQUIPMENT_BRANDS = [
  'Rogue Fitness',
  'Concept2',
  'Bowflex',
  'York Barbell',
  'PowerBlock',
  'Rep Fitness',
  'Titan Fitness',
  'CAP Barbell',
  'Eleiko',
  'Life Fitness',
  'Hammer Strength',
  'Cybex',
  'Precor',
  'Body-Solid',
  'Nautilus',
  'StairMaster',
  'TRX',
  'Assault Fitness',
  'Sorinex',
  'EliteFTS',
  'Texas Power Bar',
  'American Barbell',
  'Ivanko',
  'Iron Grip',
  'HulkFit'
];

export default function SellToUs() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const form = useForm<SubmissionForm>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      name: "",
      brand: "",
      condition: "good",
      weight: "",
      askingPrice: "",
      description: "",
      images: [],
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmissionForm) => {
      // Convert numeric fields back to numbers for database storage
      const submissionData = {
        ...data,
        weight: data.weight ? Number(data.weight) : undefined,
        askingPrice: data.askingPrice ? Number(data.askingPrice) : undefined,
        images: uploadedImages,
      };
      
      return await apiRequest("POST", "/api/equipment-submissions", submissionData);
    },
    onSuccess: (data: any) => {
      setIsSubmitted(true);
      // Store reference number for display
      setReferenceNumber(data.referenceNumber);
      // Scroll to top immediately when submission is successful
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast({
        title: "Submission Received!",
        description: `Reference: ${data.referenceNumber}`,
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

  // Effect to scroll to top when submission state changes
  useEffect(() => {
    if (isSubmitted) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isSubmitted]);

  if (isSubmitted) {
    return (
      <div className="min-h-screen pt-32 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <CheckCircle className="mx-auto mb-6 text-green-400" size={64} />
            <h1 className="font-bebas text-4xl mb-4">SUBMISSION RECEIVED!</h1>
            
            {/* Reference Number Display */}
            <div className="bg-gray-900/50 rounded-lg p-6 mb-6">
              <p className="text-text-muted text-sm mb-2">Your Reference Number</p>
              <div className="flex items-center justify-center gap-4">
                <code className="text-2xl font-mono text-accent-blue bg-gray-800 px-4 py-2 rounded">
                  {referenceNumber}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(referenceNumber);
                    toast({ title: "Reference copied!", description: "Use this to track your submission" });
                  }}
                  className="hover:bg-gray-700"
                >
                  <Copy className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-text-muted mt-2">
                Save this number to track your submission
              </p>
            </div>
            
            <p className="text-text-secondary text-lg mb-8">
              Thank you for choosing Clean & Flip. We've received your equipment submission 
              and our team will review it within 48 hours.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button 
                onClick={() => window.open(`/track-submission?ref=${referenceNumber}`, '_blank')}
                className="bg-accent-blue hover:bg-blue-600"
              >
                <Eye className="w-4 h-4 mr-2" />
                Track This Submission
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()} 
                className="glass border-border"
              >
                Submit Another Item
              </Button>
            </div>
            
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
          </Card>
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
            <Card className="p-6 text-center">
              <DollarSign className="mx-auto mb-4 text-success" size={40} />
              <h3 className="font-bebas text-xl mb-2">CASH OFFERS</h3>
              <p className="text-text-secondary">Get paid within 48 hours of acceptance</p>
            </Card>
            
            <Card className="p-6 text-center">
              <Camera className="mx-auto mb-4 text-accent-blue" size={40} />
              <h3 className="font-bebas text-xl mb-2">EASY PROCESS</h3>
              <p className="text-text-secondary">Just upload photos and basic info</p>
            </Card>
            
            <Card className="p-6 text-center">
              <Truck className="mx-auto mb-4 text-warning" size={40} />
              <h3 className="font-bebas text-xl mb-2">FREE PICKUP</h3>
              <p className="text-text-secondary">We handle pickup and payment</p>
            </Card>
          </div>
        </div>

        {/* Submission Form */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Equipment Details */}
                <Card className="p-6">
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
                              className="glass border-border"
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
                          <FormControl>
                            <UnifiedDropdown
                              label="Brand"
                              options={EQUIPMENT_BRANDS}
                              value={field.value || ""}
                              placeholder="Search or select a brand..."
                              onChange={field.onChange}
                              searchable={true}
                              allowCustom={true}
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
                          <FormControl>
                            <UnifiedDropdown
                              label="Condition"
                              options={[
                                { value: "new", label: "New" },
                                { value: "like_new", label: "Like New" },
                                { value: "good", label: "Good" },
                                { value: "fair", label: "Fair" },
                                { value: "needs_repair", label: "Needs Repair" }
                              ]}
                              value={field.value || ""}
                              placeholder="Select condition"
                              onChange={field.onChange}
                              required={true}
                            />
                          </FormControl>
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
                              className="glass border-border"
                              onChange={(e) => field.onChange(e.target.value)}
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
                            className="glass border-border"
                            onChange={(e) => field.onChange(e.target.value)}
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
                            className="glass border-border min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Card>

                {/* Photo Upload */}
                <Card className="p-6">
                  <h3 className="font-bebas text-2xl mb-4">PHOTOS</h3>
                  <p className="text-text-secondary mb-6">
                    Upload clear photos showing the equipment from multiple angles. 
                    Include any wear, damage, or unique features.
                  </p>
                  
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Upload className="mx-auto mb-4 text-text-muted" size={48} />
                    <h4 className="font-semibold mb-2">Upload Photos</h4>
                    <p className="text-text-muted mb-4">
                      Drag and drop photos here, or click to select
                    </p>
                    <Button variant="outline" className="glass border-border">
                      Choose Files
                    </Button>
                  </div>
                  
                  <div className="mt-4 text-sm text-text-muted">
                    <p>• Upload 3-8 photos for best results</p>
                    <p>• Show front, back, and detail views</p>
                    <p>• Highlight any wear or damage</p>
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
                  {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
                </Button>
              </form>
            </Form>
          </div>

          {/* Process Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-32">
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
            </Card>

            {/* Testimonial */}
            <Card className="p-6 mt-6">
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
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
