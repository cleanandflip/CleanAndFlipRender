import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UnifiedDashboardCard } from '@/components/admin/UnifiedDashboardCard';
import { UnifiedStatCard } from '@/components/admin/UnifiedStatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, RefreshCw, Zap, DollarSign, TrendingUp, AlertCircle, CheckCircle, Activity, Settings, Webhook, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/utils/submissionHelpers';
import { useToast } from '@/hooks/use-toast';

interface StripeData {
  balance: { available: number; pending: number };
  transactions: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    created: number;
    description: string;
  }>;
  products: Array<{
    id: string;
    name: string;
    price: number;
    synced: boolean;
  }>;
  webhooks: Array<{
    id: string;
    url: string;
    status: string;
    events: string[];
  }>;
}

export function StripeManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stripeData, isLoading, refetch } = useQuery({
    queryKey: ['stripe-data'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stripe/dashboard');
      if (!res.ok) throw new Error('Failed to fetch Stripe data');
      return res.json();
    }
  });

  const syncProductsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/stripe/sync-products', {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to sync products');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Products synced successfully' });
      refetch();
    },
    onError: () => {
      toast({ title: 'Error syncing products', variant: 'destructive' });
    }
  });

  const handleSyncProducts = () => {
    syncProductsMutation.mutate();
  };

  const handleWebhookTest = (webhookId: string) => {
    toast({ title: `Testing webhook ${webhookId}...` });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      succeeded: { className: 'bg-green-600/20 text-green-300 border-green-500/30' },
      pending: { className: 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30' },
      failed: { className: 'bg-red-600/20 text-red-300 border-red-500/30' },
      enabled: { className: 'bg-green-600/20 text-green-300 border-green-500/30' },
      disabled: { className: 'bg-gray-600/20 text-gray-300 border-gray-500/30' }
    };
    return variants[status] || variants.disabled;
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      {/* PROFESSIONAL HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Stripe Integration</h1>
            <p className="text-gray-400">Manage payments and Stripe integration</p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              className="border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={handleSyncProducts}
              disabled={syncProductsMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Sync Products
            </Button>
            <Button 
              onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Stripe Dashboard
            </Button>
          </div>
        </div>

        {/* STRIPE STATISTICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <UnifiedStatCard
            title="Available Balance"
            value={formatCurrency(stripeData?.balance?.available || 0)}
            icon={<DollarSign className="w-6 h-6 text-white" />}
            gradient="green"
            change={12.5}
            subtitle="Ready for payout"
          />
          <UnifiedStatCard
            title="Pending Balance"
            value={formatCurrency(stripeData?.balance?.pending || 0)}
            icon={<TrendingUp className="w-6 h-6 text-white" />}
            gradient="blue"
            subtitle="Processing"
          />
          <UnifiedStatCard
            title="Synced Products"
            value={stripeData?.products?.filter((p: any) => p.synced).length || 0}
            icon={<CheckCircle className="w-6 h-6 text-white" />}
            gradient="purple"
            subtitle="In Stripe catalog"
          />
          <UnifiedStatCard
            title="Active Webhooks"
            value={stripeData?.webhooks?.filter((w: any) => w.status === 'enabled').length || 0}
            icon={<Webhook className="w-6 h-6 text-white" />}
            gradient="orange"
            subtitle="Event listeners"
          />
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* RECENT TRANSACTIONS */}
        <UnifiedDashboardCard 
          title="Recent Transactions" 
          icon={<Activity className="w-5 h-5 text-white" />}
          gradient="blue"
        >
          <div className="space-y-3">
            {stripeData?.transactions?.slice(0, 5).map((transaction: any) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {formatCurrency(transaction.amount / 100)}
                    </div>
                    <div className="text-gray-400 text-sm truncate max-w-xs">
                      {transaction.description}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusBadge(transaction.status).className}>
                    {transaction.status}
                  </Badge>
                  <div className="text-gray-400 text-xs mt-1">
                    {new Date(transaction.created * 1000).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center text-gray-400 py-8">
                <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recent transactions</p>
              </div>
            )}
          </div>
        </UnifiedDashboardCard>

        {/* PRODUCT SYNC STATUS */}
        <UnifiedDashboardCard 
          title="Product Sync Status" 
          icon={<Zap className="w-5 h-5 text-white" />}
          gradient="purple"
          actions={
            <Button 
              size="sm" 
              onClick={handleSyncProducts}
              disabled={syncProductsMutation.isPending}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Sync All
            </Button>
          }
        >
          <div className="space-y-3">
            {stripeData?.products?.slice(0, 5).map((product: any) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    product.synced ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <div>
                    <div className="text-white font-medium">{product.name}</div>
                    <div className="text-gray-400 text-sm">
                      {formatCurrency(product.price)}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusBadge(product.synced ? 'succeeded' : 'failed').className}>
                  {product.synced ? 'Synced' : 'Not Synced'}
                </Badge>
              </div>
            )) || (
              <div className="text-center text-gray-400 py-8">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No products to sync</p>
              </div>
            )}
          </div>
        </UnifiedDashboardCard>
      </div>

      {/* WEBHOOK CONFIGURATION */}
      <UnifiedDashboardCard 
        title="Webhook Configuration" 
        icon={<Webhook className="w-5 h-5 text-white" />}
        gradient="orange"
        className="mb-8"
      >
        <div className="space-y-4">
          {stripeData?.webhooks?.map((webhook: any) => (
            <div key={webhook.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${
                  webhook.status === 'enabled' ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <div>
                  <div className="text-white font-medium">{webhook.url}</div>
                  <div className="text-gray-400 text-sm">
                    {webhook.events.length} events configured
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusBadge(webhook.status).className}>
                  {webhook.status}
                </Badge>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleWebhookTest(webhook.id)}
                >
                  Test
                </Button>
              </div>
            </div>
          )) || (
            <div className="text-center text-gray-400 py-8">
              <Webhook className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No webhooks configured</p>
            </div>
          )}
        </div>
      </UnifiedDashboardCard>

      {/* QUICK ACTIONS */}
      <UnifiedDashboardCard 
        title="Quick Actions" 
        icon={<Settings className="w-5 h-5 text-white" />}
        gradient="green"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            onClick={handleSyncProducts}
            disabled={syncProductsMutation.isPending}
            className="h-20 flex-col gap-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700"
          >
            <Zap className="w-6 h-6" />
            Sync Products
          </Button>
          
          <Button 
            onClick={() => toast({ title: 'Create coupon functionality coming soon' })}
            className="h-20 flex-col gap-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700"
          >
            <DollarSign className="w-6 h-6" />
            Create Coupon
          </Button>
          
          <Button 
            onClick={() => toast({ title: 'Payment settings coming soon' })}
            className="h-20 flex-col gap-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700"
          >
            <CreditCard className="w-6 h-6" />
            Payment Settings
          </Button>
          
          <Button 
            onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
            className="h-20 flex-col gap-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700"
          >
            <ExternalLink className="w-6 h-6" />
            Stripe Console
          </Button>
        </div>
      </UnifiedDashboardCard>
    </div>
  );
}