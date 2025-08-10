import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OnboardingData {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    phone: ""
  });

  // Get step from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlStep = urlParams.get('step');
    if (urlStep) {
      setStep(parseInt(urlStep));
    }
  }, []);

  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressSubmit = async () => {
    if (!formData.street || !formData.city || !formData.state || !formData.zipCode) {
      toast({
        title: "Missing Information",
        description: "Please fill in all address fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/api/auth/onboarding/address', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      setStep(2);
      toast({
        title: "Address Updated",
        description: "Your address has been saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update address. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/auth/onboarding/complete', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      toast({
        title: "Welcome!",
        description: "Your profile setup is complete"
      });
      
      navigate(data.redirect || '/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              {step === 1 ? "Let's set up your address for local delivery" : "Almost done! Review and finish setup"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 ? (
              <>
                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    placeholder="123 Main St"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Asheville"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="NC"
                      maxLength={2}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="28801"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(828) 555-0123"
                  />
                </div>
                <Button 
                  onClick={handleAddressSubmit} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Saving..." : "Continue"}
                </Button>
              </>
            ) : (
              <>
                <div className="text-center space-y-4">
                  <div className="text-green-600 dark:text-green-400">
                    ✓ Address information saved
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your account is ready! Click below to start shopping for fitness equipment.
                  </p>
                  <Button 
                    onClick={handleComplete} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "Setting up..." : "Complete Setup"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}