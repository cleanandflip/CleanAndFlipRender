// ADDITIVE: Comprehensive locality gate component for UI consistency
import { ReactNode } from 'react';
import { AlertTriangle, MapPin, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocality } from '@/hooks/useLocality';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';

interface LocalityGateProps {
  title?: string;
  description?: string;
  showAddAddress?: boolean;
  children?: ReactNode;
}

export function LocalityGate({ 
  title = "Local delivery only", 
  description = "This feature requires a local delivery address.",
  showAddAddress = true,
  children 
}: LocalityGateProps) {
  const locality = useLocality();
  const { isAuthenticated } = useAuth();

  // Show gate if user is not eligible for local delivery
  if (!locality.eligible) {
    return (
      <div className="min-h-[200px] flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-amber-200 dark:border-amber-800">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-amber-100 dark:bg-amber-900 p-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <CardTitle className="text-lg text-amber-900 dark:text-amber-100">
              {title}
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-sm text-muted-foreground">
              We deliver to Asheville NC area:
              <br />
              <span className="font-mono text-xs">28801, 28803, 28804, 28805, 28806, 28808</span>
            </div>
            
            {isAuthenticated && showAddAddress && (
              <Link to="/profile/addresses">
                <Button className="w-full" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Local Address
                </Button>
              </Link>
            )}
            
            {!isAuthenticated && (
              <Link to="/auth/sign-in">
                <Button className="w-full">
                  <MapPin className="w-4 h-4 mr-2" />
                  Sign In to Set Address
                </Button>
              </Link>
            )}
            
            {children}
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is eligible - don't show gate
  return null;
}

export default LocalityGate;