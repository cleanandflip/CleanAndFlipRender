import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriceInput } from "@/components/ui/price-input";
import UnifiedDropdown from "@/components/ui/UnifiedDropdown";
import DropdownField from "@/components/form/DropdownField";
import { Textarea } from "@/components/ui/textarea";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card } from "@/components/shared/AnimatedComponents";
import { globalDesignSystem as theme } from "@/styles/design-system/theme";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEquipmentSubmissionSchema } from "@shared/schema";
import { z } from "zod";
import { 
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
import { ImageUploadZone } from '@/components/shared/ImageUploadZone';

const submissionSchema = z.object({
  name: z.string().min(1, "Equipment name is required"),
  brand: z.string().optional(),
  category: z.string().min(1, "Category is required"),
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
  // ALL HOOKS MUST BE AT THE TOP - React Rules of Hooks
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  // CRITICAL FIX: Force fresh auth check when accessing sell-to-us
  useEffect(() => {
    // Force immediate auth validation on page load
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  }, [queryClient]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const form = useForm<SubmissionForm>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      name: "",
      brand: "",
      category: "",
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
    onError: (error: any) => {
      console.error('Submission error:', error);
      let errorMessage = "Please check your information and try again.";
      
      // Check for authentication errors
      if (error.message?.includes('401') || error.message?.includes('Authentication required')) {
        errorMessage = "Please log in to submit equipment.";
        // Redirect to login after showing error
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
      }
      
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Handle image upload completion from ImageUploadZone
  const handleImageUploadComplete = (urls: string[]) => {
    setUploadedImages(urls);
  };

  const onSubmit = (data: SubmissionForm) => {
    submitMutation.mutate(data);
  };

  // Effect to scroll to top when submission state changes
  useEffect(() => {
    if (isSubmitted) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isSubmitted]);

  // Show login prompt for unauthenticated users (AFTER all hooks are defined)
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen pt-32 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="font-bebas text-3xl mb-4">LOGIN REQUIRED</h2>
            <p className="text-text-secondary mb-8">
              Please log in to sell your equipment to Clean & Flip. This helps us track your submissions and provide updates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="bg-accent-blue hover:bg-blue-600"
              >
                Sign In
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/auth'}
                className="glass border-border"
              >
                Create Account
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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
                {/* Equipment Details - 12-Column Grid Layout */}
                <Card className="max-w-3xl mx-auto p-8">
                  <h3 className="font-bebas text-2xl mb-6">EQUIPMENT DETAILS</h3>
                  <div className="border-t border-border my-4"></div>
                  
                  {/* 12-column grid with responsive mobile stacking */}
                  <div className="grid grid-cols-12 gap-x-6 gap-y-5">
                    {/* Row 1: Equipment Name & Brand */}
                    <div className="col-span-12 md:col-span-6">
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Equipment Name <span className="text-destructive">*</span>
                      </label>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                {...field}
                                id="name"
                                placeholder="e.g. Olympic Barbell 45lb"
                                className="h-11"
                                aria-invalid={!!form.formState.errors.name}
                                aria-describedby={form.formState.errors.name ? "name-error" : undefined}
                              />
                            </FormControl>
                            <FormMessage id="name-error" className="mt-1 text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-12 md:col-span-6">
                      <label htmlFor="brand" className="block text-sm font-medium mb-2">
                        Brand
                      </label>
                      <FormField
                        control={form.control}
                        name="brand"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Dropdown
                                fullWidth
                                value={field.value || ""}
                                onChange={(v) => field.onChange(v)}
                                options={EQUIPMENT_BRANDS.map(brand => ({ value: brand, label: brand }))}
                                placeholder="Search or select a brand…"
                                className="h-11"
                                aria-invalid={!!form.formState.errors.brand}
                                aria-describedby={form.formState.errors.brand ? "brand-error" : undefined}
                              />
                            </FormControl>
                            <FormMessage id="brand-error" className="mt-1 text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Row 2: Category & Condition */}
                    <div className="col-span-12 md:col-span-6">
                      <label htmlFor="category" className="block text-sm font-medium mb-2">
                        Category <span className="text-destructive">*</span>
                      </label>
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Dropdown
                                fullWidth
                                value={field.value || ""}
                                onChange={(v) => field.onChange(v)}
                                options={[
                                  { value: "barbells", label: "Barbells" },
                                  { value: "dumbbells", label: "Dumbbells" },
                                  { value: "plates", label: "Weight Plates" },
                                  { value: "racks", label: "Racks & Stands" },
                                  { value: "benches", label: "Benches" },
                                  { value: "cardio", label: "Cardio Equipment" },
                                  { value: "machines", label: "Weight Machines" },
                                  { value: "accessories", label: "Accessories" },
                                  { value: "other", label: "Other" }
                                ]}
                                placeholder="Select category"
                                className="h-11"
                                aria-invalid={!!form.formState.errors.category}
                                aria-describedby={form.formState.errors.category ? "category-error" : undefined}
                              />
                            </FormControl>
                            <FormMessage id="category-error" className="mt-1 text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <label htmlFor="condition" className="block text-sm font-medium mb-2">
                        Condition <span className="text-destructive">*</span>
                      </label>
                      <FormField
                        control={form.control}
                        name="condition"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Dropdown
                                fullWidth
                                value={field.value || ""}
                                onChange={(v) => field.onChange(v)}
                                options={[
                                  { value: "new", label: "New" },
                                  { value: "like_new", label: "Like New" },
                                  { value: "good", label: "Good" },
                                  { value: "fair", label: "Fair" },
                                  { value: "needs_repair", label: "Needs Repair" }
                                ]}
                                placeholder="Select condition"
                                className="h-11"
                                aria-invalid={!!form.formState.errors.condition}
                                aria-describedby={form.formState.errors.condition ? "condition-error" : undefined}
                              />
                            </FormControl>
                            <FormMessage id="condition-error" className="mt-1 text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Row 3: Weight & Price */}
                    <div className="col-span-12 md:col-span-6">
                      <label htmlFor="weight" className="block text-sm font-medium mb-2">
                        Weight (lbs)
                      </label>
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field}
                                  id="weight"
                                  value={field.value || ""}
                                  inputMode="numeric"
                                  placeholder="Total weight in pounds"
                                  className="h-11 pr-12"
                                  onChange={(e) => field.onChange(e.target.value)}
                                  aria-invalid={!!form.formState.errors.weight}
                                  aria-describedby={form.formState.errors.weight ? "weight-error" : undefined}
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                  <span className="text-sm text-muted-foreground">lbs</span>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage id="weight-error" className="mt-1 text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <label htmlFor="askingPrice" className="block text-sm font-medium mb-2">
                        Your Asking Price
                      </label>
                      <FormField
                        control={form.control}
                        name="askingPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                  <span className="text-sm text-muted-foreground">$</span>
                                </div>
                                <Input 
                                  {...field}
                                  id="askingPrice"
                                  value={field.value || ""}
                                  inputMode="decimal"
                                  placeholder="0.00"
                                  className="h-11 pl-8"
                                  onChange={(e) => field.onChange(e.target.value)}
                                  aria-invalid={!!form.formState.errors.askingPrice}
                                  aria-describedby="askingPrice-help"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="mt-1 text-xs" />
                            <p id="askingPrice-help" className="mt-1 text-xs text-muted-foreground">
                              We'll review market pricing and may adjust based on condition and demand.
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Row 4: Description (full width) */}
                    <div className="col-span-12">
                      <label htmlFor="description" className="block text-sm font-medium mb-2">
                        Description
                      </label>
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                {...field}
                                id="description"
                                value={field.value || ""}
                                rows={5}
                                placeholder="Condition, modifications, included accessories…"
                                className="resize-vertical"
                                aria-invalid={!!form.formState.errors.description}
                                aria-describedby="description-help"
                              />
                            </FormControl>
                            <FormMessage className="mt-1 text-xs" />
                            <p id="description-help" className="mt-1 text-xs text-muted-foreground">
                              Be detailed about condition, modifications, and what's included to help us provide an accurate quote.
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </Card>

                {/* Photo Upload */}
                <Card className="p-6">
                  <h3 className="font-bebas text-2xl mb-4">PHOTOS</h3>
                  <p className="text-text-secondary mb-6">
                    Upload clear photos showing the equipment from multiple angles. 
                    Include any wear, damage, or unique features.
                  </p>
                  
                  <ImageUploadZone
                    maxImages={8}
                    folder="equipment-submissions"
                    onUploadComplete={handleImageUploadComplete}
                    existingImages={uploadedImages}
                  />
                </Card>

                <Button 
                  type="submit" 
                  variant="primary"
                  size="lg"
                  className="w-full py-3"

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
