import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/shared/AnimatedComponents";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin,
  Calendar,
  ExternalLink 
} from "lucide-react";

interface OrderTrackingEvent {
  id: string;
  orderId: string;
  status: string;
  location?: string;
  description: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  createdAt: string;
}

interface OrderTrackingProps {
  orderId: string;
  orderNumber: string;
  className?: string;
}

const statusConfig = {
  'order_placed': {
    icon: Package,
    color: 'blue',
    label: 'Order Placed'
  },
  'processing': {
    icon: Clock,
    color: 'yellow',
    label: 'Processing'
  },
  'shipped': {
    icon: Truck,
    color: 'orange',
    label: 'Shipped'
  },
  'out_for_delivery': {
    icon: Truck,
    color: 'purple',
    label: 'Out for Delivery'
  },
  'delivered': {
    icon: CheckCircle,
    color: 'green',
    label: 'Delivered'
  }
};

export function OrderTracking({ orderId, orderNumber, className = '' }: OrderTrackingProps) {
  const { data: trackingEvents = [], isLoading } = useQuery<OrderTrackingEvent[]>({
    queryKey: [`/api/orders/${orderId}/tracking`],
    enabled: !!orderId,
  });

  const currentEvent = trackingEvents[0];
  const hasTrackingNumber = currentEvent?.trackingNumber;

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bebas">ORDER TRACKING</h2>
        <Badge variant="outline" className="text-sm">
          #{orderNumber}
        </Badge>
      </div>

      {/* Current Status */}
      {currentEvent && (
        <div className="bg-gradient-to-r from-accent-blue/10 to-accent-green/10 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-3 mb-2">
            {(() => {
              const config = statusConfig[currentEvent.status as keyof typeof statusConfig];
              const Icon = config?.icon || Package;
              return (
                <div className={`w-10 h-10 bg-${config?.color || 'blue'}-100 rounded-full flex items-center justify-center`}>
                  <Icon size={20} className={`text-${config?.color || 'blue'}-600`} />
                </div>
              );
            })()}
            <div>
              <h3 className="font-semibold text-lg">
                {statusConfig[currentEvent.status as keyof typeof statusConfig]?.label || currentEvent.status}
              </h3>
              <p className="text-text-secondary text-sm">
                {format(new Date(currentEvent.createdAt), 'MMM d, yyyy • h:mm a')}
              </p>
            </div>
          </div>
          
          {currentEvent.description && (
            <p className="text-sm ml-13">{currentEvent.description}</p>
          )}
          
          {currentEvent.location && (
            <div className="flex items-center gap-1 text-sm text-text-secondary ml-13 mt-1">
              <MapPin size={14} />
              {currentEvent.location}
            </div>
          )}
        </div>
      )}

      {/* Tracking Number */}
      {hasTrackingNumber && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Tracking Number</p>
              <p className="font-mono text-lg">{currentEvent.trackingNumber}</p>
              {currentEvent.carrier && (
                <p className="text-sm text-text-secondary">via {currentEvent.carrier}</p>
              )}
            </div>
            {currentEvent.carrier && (
              <a
                href={getCarrierTrackingUrl(currentEvent.carrier, currentEvent.trackingNumber || '')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-accent-blue hover:text-accent-blue/80 text-sm font-medium"
              >
                Track on {currentEvent.carrier}
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Estimated Delivery */}
      {currentEvent?.estimatedDelivery && (
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
          <Calendar size={16} />
          <span>
            Estimated delivery: {format(new Date(currentEvent.estimatedDelivery), 'EEEE, MMM d')}
          </span>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Tracking History</h3>
        <div className="space-y-4">
          {trackingEvents.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-text-secondary">No tracking information available yet</p>
              <p className="text-sm text-text-muted">Check back soon for updates</p>
            </div>
          ) : (
            trackingEvents.map((event, index) => {
              const config = statusConfig[event.status as keyof typeof statusConfig];
              const Icon = config?.icon || Package;
              const isLast = index === trackingEvents.length - 1;
              
              return (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 bg-${config?.color || 'gray'}-100 rounded-full flex items-center justify-center`}>
                      <Icon size={16} className={`text-${config?.color || 'gray'}-600`} />
                    </div>
                    {!isLast && (
                      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mt-2"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold">
                        {config?.label || event.status.replace('_', ' ').toUpperCase()}
                      </h4>
                      <span className="text-sm text-text-secondary">
                        {format(new Date(event.createdAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-text-secondary mb-1">{event.description}</p>
                    )}
                    
                    {event.location && (
                      <div className="flex items-center gap-1 text-xs text-text-muted">
                        <MapPin size={12} />
                        {event.location}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}

function getCarrierTrackingUrl(carrier: string, trackingNumber: string): string {
  const trackingUrls: Record<string, string> = {
    'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'FedEx': `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNumber}`,
    'USPS': `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNumber}`,
    'DHL': `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNumber}`,
  };
  
  return trackingUrls[carrier] || `https://www.google.com/search?q=track+package+${trackingNumber}`;
}