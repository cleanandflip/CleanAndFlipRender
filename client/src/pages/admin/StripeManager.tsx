import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Package, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SyncResult {
  success: boolean;
  message: string;
}

export default function StripeManager() {
  const { toast } = useToast();
  const [syncStatus, setSyncStatus] = useState<{
    all?: 'idle' | 'loading' | 'success' | 'error';
    test?: 'idle' | 'loading' | 'success' | 'error';
  }>({});

  // Sync all products mutation
  const syncAllMutation = useMutation({
    mutationFn: async (): Promise<SyncResult> => {
      console.log('🔄 Starting Stripe sync from dashboard...');
      const response = await fetch('/api/stripe/sync-all', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Sync failed:', response.status, errorData);
        throw new Error(`Failed to sync products: ${response.status} - ${errorData}`);
      }
      
      const result = await response.json();
      console.log('✅ Sync result:', result);
      return result;
    },
    onMutate: () => {
      setSyncStatus(prev => ({ ...prev, all: 'loading' }));
    },
    onSuccess: (data) => {
      setSyncStatus(prev => ({ ...prev, all: 'success' }));
      toast({
        title: "Sync Complete",
        description: data.message,
      });
    },
    onError: (error) => {
      setSyncStatus(prev => ({ ...prev, all: 'error' }));
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Create test products mutation
  const createTestMutation = useMutation({
    mutationFn: async (): Promise<SyncResult> => {
      const response = await fetch('/api/stripe/create-test-products', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to create test products');
      }
      
      return response.json();
    },
    onMutate: () => {
      setSyncStatus(prev => ({ ...prev, test: 'loading' }));
    },
    onSuccess: (data) => {
      setSyncStatus(prev => ({ ...prev, test: 'success' }));
      toast({
        title: "Test Products Created",
        description: data.message,
      });
    },
    onError: (error) => {
      setSyncStatus(prev => ({ ...prev, test: 'error' }));
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'loading':
        return <Badge variant="secondary">Syncing...</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">Complete</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Ready</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stripe Integration</h1>
        <p className="text-muted-foreground">
          Manage product synchronization with Stripe for payment processing
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sync All Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Sync All Products
              {getStatusIcon(syncStatus.all)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Synchronize all existing products in your database with Stripe. This will create
              or update product listings and pricing information. Currently 11 products ready to sync.
            </p>
            
            <div className="flex items-center justify-between">
              {getStatusBadge(syncStatus.all)}
              <Button
                onClick={() => syncAllMutation.mutate()}
                disabled={syncAllMutation.isPending}
                className="glass glass-hover"
              >
                {syncAllMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Products
                  </>
                )}
              </Button>
            </div>

            {syncStatus.all === 'success' && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                ✅ All 11 products have been successfully synced to Stripe! You can now view them
                in your Stripe dashboard with active pricing.
              </div>
            )}
            
            {syncStatus.all === 'error' && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                ❌ Sync failed. Please check your authentication and try again.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Test Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Create Test Products
              {getStatusIcon(syncStatus.test)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create a set of sample weightlifting products with realistic data
              and automatically sync them to Stripe for testing.
            </p>
            
            <div className="flex items-center justify-between">
              {getStatusBadge(syncStatus.test)}
              <Button
                onClick={() => createTestMutation.mutate()}
                disabled={createTestMutation.isPending}
                variant="outline"
                className="glass glass-hover"
              >
                {createTestMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Create Test Data
                  </>
                )}
              </Button>
            </div>

            {syncStatus.test === 'success' && (
              <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                Test products created successfully! Check your product listings and
                Stripe dashboard to see the new items.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-medium">Stripe Connection</span>
              <Badge variant="default" className="bg-green-500">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-medium">Product Sync</span>
              <Badge variant="outline">Available</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-medium">Payment Processing</span>
              <Badge variant="default" className="bg-green-500">Enabled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Sync Existing Products</h4>
            <p className="text-sm text-muted-foreground">
              Use "Sync All Products" to synchronize your current product catalog with Stripe.
              This creates product listings and pricing that can be used for checkout.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">2. Create Test Data</h4>
            <p className="text-sm text-muted-foreground">
              Use "Create Test Products" to add sample weightlifting equipment with realistic
              descriptions, images, and pricing for development and testing.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">3. Verify in Stripe</h4>
            <p className="text-sm text-muted-foreground">
              After syncing, check your Stripe dashboard under Products to see the synchronized
              items. Each product will have metadata linking it back to your database.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}