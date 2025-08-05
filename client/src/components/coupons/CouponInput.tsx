import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tag, X, Check, Percent } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  description: string;
  minOrderAmount?: number;
  maxDiscount?: number;
}

interface CouponInputProps {
  onCouponApplied: (coupon: Coupon | null) => void;
  appliedCoupon?: Coupon | null;
  orderTotal: number;
}

export function CouponInput({ onCouponApplied, appliedCoupon, orderTotal }: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const { toast } = useToast();

  const applyCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/coupons/validate", { 
        code: code.toUpperCase(),
        orderTotal 
      });
      return response as unknown as Coupon;
    },
    onSuccess: (coupon) => {
      onCouponApplied(coupon);
      setCouponCode('');
      
      const discountAmount = coupon.discountType === 'percentage' 
        ? Math.min((orderTotal * coupon.discountValue) / 100, coupon.maxDiscount || Infinity)
        : coupon.discountValue;

      toast({
        title: "Coupon Applied!",
        description: `${coupon.code} - Save $${discountAmount.toFixed(2)}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Invalid Coupon",
        description: error.message || "This coupon code is not valid",
        variant: "destructive",
      });
    }
  });

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast({
        title: "Enter Coupon Code",
        description: "Please enter a coupon code",
        variant: "destructive",
      });
      return;
    }

    applyCouponMutation.mutate(couponCode.trim());
  };

  const handleRemoveCoupon = () => {
    onCouponApplied(null);
    toast({
      title: "Coupon Removed",
      description: "The coupon has been removed from your order",
    });
  };

  const calculateDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'percentage') {
      const discount = (orderTotal * coupon.discountValue) / 100;
      return Math.min(discount, coupon.maxDiscount || Infinity);
    }
    return Math.min(coupon.discountValue, orderTotal);
  };

  return (
    <div className="space-y-4">
      {!appliedCoupon ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Tag size={16} className="text-accent-blue" />
            Have a coupon code?
          </div>
          
          <div className="flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="flex-1"
              maxLength={20}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyCoupon();
                }
              }}
            />
            <Button
              onClick={handleApplyCoupon}
              variant="outline"
              disabled={applyCouponMutation.isPending || !couponCode.trim()}
              className="whitespace-nowrap"
            >
              {applyCouponMutation.isPending ? 'Applying...' : 'Apply'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                <Check size={16} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-green-800 dark:text-green-200">
                    {appliedCoupon.code}
                  </span>
                  <span className="text-green-600 dark:text-green-400 text-sm">
                    -{appliedCoupon.discountType === 'percentage' 
                      ? `${appliedCoupon.discountValue}%`
                      : `$${appliedCoupon.discountValue}`
                    }
                  </span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {appliedCoupon.description}
                </p>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  You save: ${calculateDiscount(appliedCoupon).toFixed(2)}
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleRemoveCoupon}
              variant="ghost"
              size="sm"
              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Suggested Coupons */}
      <div className="space-y-2">
        <p className="text-xs text-text-secondary">Popular offers:</p>
        <div className="flex flex-wrap gap-2">
          {[
            { code: 'SAVE10', description: '10% off orders over $100' },
            { code: 'FIRST15', description: '15% off first order' },
            { code: 'FREE50', description: 'Free shipping over $50' }
          ].map((suggestion) => (
            <button
              key={suggestion.code}
              onClick={() => setCouponCode(suggestion.code)}
              className="text-xs px-2 py-1 bg-accent-blue/10 text-accent-blue rounded hover:bg-accent-blue/20 transition-colors"
              disabled={!!appliedCoupon}
            >
              <div className="flex items-center gap-1">
                <Percent size={10} />
                {suggestion.code}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}