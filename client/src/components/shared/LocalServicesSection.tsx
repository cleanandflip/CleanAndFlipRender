import { Truck, Package } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function LocalServicesSection() {
  const { user } = useAuth();
  const isLocal = user?.isLocalCustomer;
  
  return (
    <section className="py-16 bg-gradient-to-b from-background to-background/50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bebas text-text-primary mb-4">
            ASHEVILLE AREA EXCLUSIVE BENEFITS
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Living in the Asheville area? Enjoy completely FREE pickup and delivery services for all your fitness equipment needs.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* SELLING BENEFIT */}
          <Card className={`p-8 ${isLocal ? 'border-green-500/30 bg-green-50/10 dark:bg-green-900/10' : 'opacity-60'} transition-all hover:scale-105`}>
            <div className="flex items-start space-x-4">
              <div className={`p-4 rounded-full ${isLocal ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-200 dark:bg-gray-700'}`}>
                <Package className={`h-10 w-10 ${isLocal ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bebas mb-3 ${!isLocal ? 'line-through text-gray-500' : 'text-text-primary'}`}>
                  WE PICK UP EQUIPMENT YOU'RE SELLING - FREE
                </h3>
                <p className={`text-text-secondary mb-4 ${!isLocal ? 'opacity-60' : ''}`}>
                  Selling your fitness equipment? We'll come to your doorstep and pick it up at no charge. Just schedule a time that works for you.
                </p>
                {isLocal ? (
                  <div className="flex items-center space-x-2">
                    <span className="inline-block text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 px-3 py-1 rounded-full font-medium">
                      ✓ Available in Your Area
                    </span>
                    <Button variant="outline" size="sm" className="ml-4">
                      Sell Equipment →
                    </Button>
                  </div>
                ) : (
                  <span className="inline-block text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-3 py-1 rounded-full">
                    ✗ Asheville Area Only (ZIP 287xx-288xx)
                  </span>
                )}
              </div>
            </div>
          </Card>
          
          {/* BUYING BENEFIT */}
          <Card className={`p-8 ${isLocal ? 'border-green-500/30 bg-green-50/10 dark:bg-green-900/10' : 'opacity-60'} transition-all hover:scale-105`}>
            <div className="flex items-start space-x-4">
              <div className={`p-4 rounded-full ${isLocal ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-200 dark:bg-gray-700'}`}>
                <Truck className={`h-10 w-10 ${isLocal ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bebas mb-3 ${!isLocal ? 'line-through text-gray-500' : 'text-text-primary'}`}>
                  WE DELIVER YOUR PURCHASES - FREE
                </h3>
                <p className={`text-text-secondary mb-4 ${!isLocal ? 'opacity-60' : ''}`}>
                  Bought equipment from us? We'll deliver it to your doorstep at no additional cost. Same-day or next-day delivery available.
                </p>
                {isLocal ? (
                  <div className="flex items-center space-x-2">
                    <span className="inline-block text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 px-3 py-1 rounded-full font-medium">
                      ✓ Available in Your Area
                    </span>
                    <Button variant="outline" size="sm" className="ml-4">
                      Shop Equipment →
                    </Button>
                  </div>
                ) : (
                  <span className="inline-block text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-3 py-1 rounded-full">
                    ✗ Asheville Area Only (ZIP 287xx-288xx)
                  </span>
                )}
              </div>
            </div>
          </Card>
        </div>
        
        {/* Call to Action for Non-Local Users */}
        {!isLocal && (
          <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center border border-blue-200 dark:border-blue-700">
            <p className="text-text-secondary mb-4">
              Not in the Asheville area? No worries! We offer competitive shipping rates nationwide and work with trusted carriers.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" size="sm">
                View Shipping Rates →
              </Button>
              <Button variant="outline" size="sm">
                Update Your Location →
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}