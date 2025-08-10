import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { CheckCircle, Circle, MapPin, Truck, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { ProtectedRoute } from "@/lib/protected-route";
import { DeliveryAddressStep } from "@/components/checkout/DeliveryAddressStep";
import { DeliveryMethodStep } from "@/components/checkout/DeliveryMethodStep";
import { PaymentStep } from "@/components/checkout/PaymentStep";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { ProfilePrompt } from "@/components/checkout/ProfilePrompt";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder');

interface CheckoutStep {
  id: number;
  name: string;
  icon: React.ReactNode;
  completed: boolean;
}

function CheckoutPageContent() {
  const { user } = useAuth();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const [, navigate] = useLocation();
  
  const [currentStep, setCurrentStep] = useState(1);
  
  // Checkout Data
  const [checkoutData, setCheckoutData] = useState({
    deliveryAddress: null as any,
    deliveryMethod: user?.isLocalCustomer ? 'local_delivery' : 'standard',
    paymentIntentId: '',
    notes: ''
  });
  
  // Calculate totals
  const isLocal = checkoutData.deliveryAddress?.isLocal || user?.isLocalCustomer;
  const subtotal = getCartTotal();
  const shipping = checkoutData.deliveryMethod === 'local_delivery' ? 0 : 9.99;
  const tax = subtotal * 0.0875; // 8.75% NC tax
  const total = subtotal + shipping + tax;
  
  // Steps configuration
  const steps: CheckoutStep[] = [
    { id: 1, name: 'Delivery Address', icon: <MapPin className="h-5 w-5" />, completed: false },
    { id: 2, name: 'Delivery Method', icon: <Truck className="h-5 w-5" />, completed: false },
    { id: 3, name: 'Payment', icon: <CreditCard className="h-5 w-5" />, completed: false }
  ];
  
  // Guard checks
  useEffect(() => {
    if (!user || !user.profileComplete) {
      navigate('/onboarding?return=/checkout');
    }
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [user, cartItems]);
  
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  if (!user || !user.profileComplete) {
    return <ProfilePrompt />;
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                  currentStep >= step.id 
                    ? 'bg-accent-blue border-accent-blue text-white' 
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {currentStep > step.id ? <CheckCircle className="h-5 w-5" /> : step.icon}
                </div>
                
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-text-primary' : 'text-text-muted'
                  }`}>
                    {step.name}
                  </p>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 transition-all ${
                    currentStep > step.id ? 'bg-accent-blue' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl p-6 shadow-sm">
              {currentStep === 1 && (
                <DeliveryAddressStep 
                  user={user}
                  checkoutData={checkoutData}
                  setCheckoutData={setCheckoutData}
                  onNext={nextStep}
                />
              )}
              
              {currentStep === 2 && (
                <DeliveryMethodStep
                  user={user}
                  checkoutData={checkoutData}
                  setCheckoutData={setCheckoutData}
                  onNext={nextStep}
                  onBack={prevStep}
                  shipping={shipping}
                />
              )}
              
              {currentStep === 3 && (
                <Elements stripe={stripePromise}>
                  <PaymentStep
                    user={user}
                    checkoutData={checkoutData}
                    items={cartItems}
                    total={total}
                    onBack={prevStep}
                    clearCart={clearCart}
                  />
                </Elements>
              )}
            </div>
          </div>
          
          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummary 
              items={cartItems}
              subtotal={subtotal}
              tax={tax}
              shipping={shipping}
              total={total}
              isLocal={isLocal}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  return (
    <ProtectedRoute requireCompleteProfile={true}>
      <CheckoutPageContent />
    </ProtectedRoute>
  );
}