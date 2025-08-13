import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, Truck } from "lucide-react";

interface LocalBannerProps {
  isLocal: boolean;
  className?: string;
}

export function LocalBanner({ isLocal, className }: LocalBannerProps) {
  if (isLocal) {
    return (
      <Alert className={`border-green-200 bg-green-50 ${className || ''}`}>
        <Check className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          You're in our Local Delivery area — delivery is FREE.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={`border-blue-200 bg-blue-50 ${className || ''}`}>
      <Truck className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        Outside our Local Delivery area. Shipping available on eligible items.
      </AlertDescription>
    </Alert>
  );
}