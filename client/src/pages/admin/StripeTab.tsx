// STRIPE TAB WITH BEAUTIFUL SYNC ANIMATION
import { useState, useEffect } from 'react';
import { CreditCard, RefreshCw, CheckCircle, XCircle, TrendingUp, DollarSign, Activity, Zap, Clock } from 'lucide-react';
import { UnifiedMetricCard } from '@/components/admin/UnifiedMetricCard';
import { useWebSocket } from '@/hooks/useWebSocket';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

export function StripeTab() {
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncStage, setSyncStage] = useState('');
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [stripeMetrics, setStripeMetrics] = useState({
    totalRevenue: 0,
    transactionCount: 0,
    successRate: 0,
    avgTransaction: 0
  });
  
  const { isConnected, send } = useWebSocket();
  
  // Fetch real Stripe transactions
  const { data: transactionData, refetch: refetchTransactions } = useQuery({
    queryKey: ['stripe-transactions'],
    queryFn: async () => {
      const res = await fetch('/api/stripe/transactions', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Update transactions and metrics when data changes
  useEffect(() => {
    if (transactionData?.transactions) {
      setTransactions(transactionData.transactions);
      
      // Calculate real metrics from actual Stripe data
      const txs = transactionData.transactions;
      const totalRevenue = txs.reduce((sum: number, tx: any) => sum + (tx.amount / 100), 0);
      const successfulTxs = txs.filter((tx: any) => tx.status === 'succeeded');
      const successRate = txs.length > 0 ? (successfulTxs.length / txs.length) * 100 : 0;
      const avgTransaction = successfulTxs.length > 0 ? totalRevenue / successfulTxs.length : 0;
      
      setStripeMetrics({
        totalRevenue,
        transactionCount: txs.length,
        successRate,
        avgTransaction
      });
    }
  }, [transactionData]);

  // REAL STRIPE SYNC WITH API CALL
  const handleMasterSync = async () => {
    setSyncing(true);
    setSyncStatus('syncing');
    setSyncProgress(0);
    setPulseAnimation(true);

    const stages = [
      { name: 'Connecting to Stripe...', progress: 15, delay: 800 },
      { name: 'Syncing Products...', progress: 35, delay: 1200 },
      { name: 'Updating Prices...', progress: 55, delay: 1000 },
      { name: 'Syncing Customers...', progress: 75, delay: 900 },
      { name: 'Fetching Transactions...', progress: 90, delay: 700 },
      { name: 'Finalizing...', progress: 100, delay: 500 }
    ];

    try {
      // Start animation stages
      const animationPromise = (async () => {
        for (const stage of stages) {
          setSyncStage(stage.name);
          
          // Animate progress smoothly
          const targetProgress = stage.progress;
          const currentProgress = syncProgress;
          const steps = 25;
          const increment = (targetProgress - currentProgress) / steps;
          
          for (let i = 0; i < steps; i++) {
            setSyncProgress(prev => Math.min(prev + increment, targetProgress));
            await new Promise(resolve => setTimeout(resolve, stage.delay / steps));
          }
        }
      })();

      // Make actual API call
      const response = await fetch('/api/stripe/sync-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await response.json();

      // Wait for animation to complete
      await animationPromise;

      if (response.ok && result.success) {
        setSyncStatus('success');
        toast({
          title: "Sync Complete!",
          description: result.message || "All Stripe data synchronized successfully",
        });
        
        // Broadcast to all connected clients
        if (send) {
          send({
            type: 'stripe_sync_complete',
            data: { 
              completedAt: new Date().toISOString(),
              success: true
            }
          });
        }
      } else {
        throw new Error(result.error || result.message || 'Sync failed');
      }

      // Reset after animation
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncProgress(0);
        setPulseAnimation(false);
        setSyncStage('');
      }, 3000);

    } catch (error: any) {
      console.error('Stripe sync error:', error);
      setSyncStatus('error');
      toast({
        title: "Sync Failed",
        description: error?.message || "Please try again or check your connection",
        variant: "destructive",
      });
      setPulseAnimation(false);
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncProgress(0);
        setSyncStage('');
      }, 3000);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Live Connection Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Stripe Integration</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
            <p className="text-gray-400">
              {isConnected ? 'Live sync active' : 'Reconnecting...'}
            </p>
          </div>
        </div>
      </div>

      {/* Real Stripe Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <UnifiedMetricCard
          title="Total Revenue"
          value={stripeMetrics.totalRevenue > 0 ? `$${stripeMetrics.totalRevenue.toFixed(2)}` : '$0.00'}
          icon={DollarSign}
          change={{ value: 0, label: 'from Stripe API' }}
        />
        <UnifiedMetricCard
          title="Transactions"
          value={stripeMetrics.transactionCount.toString()}
          icon={Activity}
          change={{ value: 0, label: 'from Stripe API' }}
        />
        <UnifiedMetricCard
          title="Success Rate"
          value={`${stripeMetrics.successRate.toFixed(1)}%`}
          icon={TrendingUp}
          change={{ value: 0, label: 'from Stripe API' }}
        />
        <UnifiedMetricCard
          title="Avg. Transaction"
          value={stripeMetrics.avgTransaction > 0 ? `$${stripeMetrics.avgTransaction.toFixed(2)}` : '$0.00'}
          icon={CreditCard}
          change={{ value: 0, label: 'from Stripe API' }}
        />
      </div>

      {/* Master Sync Section */}
      <div className="bg-[#1e293b]/50 border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Synchronization Control</h3>
            <p className="text-gray-400">Keep all Stripe data perfectly synchronized</p>
          </div>
          
          {/* Master Sync Button with Animations */}
          <div className="relative">
            <button
              onClick={handleMasterSync}
              disabled={syncing}
              className={`
                relative overflow-hidden px-8 py-4 rounded-xl font-medium
                transition-all duration-500 transform
                ${syncing 
                  ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 scale-105' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25'
                }
                ${pulseAnimation ? 'animate-pulse' : ''}
                ${syncStatus === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : ''}
                ${syncStatus === 'error' ? 'bg-gradient-to-r from-red-500 to-pink-500' : ''}
                text-white disabled:cursor-not-allowed
                group min-w-[200px]
              `}
            >
              {/* Animated Background Shimmer */}
              <div className={`
                absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                -translate-x-full group-hover:translate-x-full transition-transform duration-1000
              `} />
              
              {/* Progress Fill */}
              {syncing && (
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400/40 to-purple-400/40 transition-all duration-300 ease-out rounded-xl"
                  style={{ width: `${syncProgress}%` }}
                />
              )}
              
              {/* Button Content */}
              <span className="relative z-10 flex items-center justify-center gap-3">
                {syncStatus === 'idle' && (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Sync Everything</span>
                  </>
                )}
                {syncStatus === 'syncing' && (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{Math.round(syncProgress)}%</span>
                  </>
                )}
                {syncStatus === 'success' && (
                  <>
                    <CheckCircle className="w-5 h-5 animate-bounce" />
                    <span>Complete!</span>
                  </>
                )}
                {syncStatus === 'error' && (
                  <>
                    <XCircle className="w-5 h-5 animate-pulse" />
                    <span>Failed</span>
                  </>
                )}
              </span>
            </button>
            
            {/* Sync Stage Indicator */}
            {syncStage && (
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap animate-fadeIn">
                <div className="bg-[#1e293b]/90 backdrop-blur border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    {syncStage}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {syncing && (
          <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden animate-fadeIn">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-[#1e293b]/50 border border-gray-700/50 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Live updates</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50 bg-[#0f172a]/30">
                <th className="px-6 py-4 text-left text-xs text-gray-400 uppercase tracking-wider font-medium">Transaction</th>
                <th className="px-6 py-4 text-left text-xs text-gray-400 uppercase tracking-wider font-medium">Customer</th>
                <th className="px-6 py-4 text-left text-xs text-gray-400 uppercase tracking-wider font-medium">Amount</th>
                <th className="px-6 py-4 text-left text-xs text-gray-400 uppercase tracking-wider font-medium">Status</th>
                <th className="px-6 py-4 text-left text-xs text-gray-400 uppercase tracking-wider font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/30">
              {transactions.length > 0 ? transactions.map((transaction: any, index: number) => (
                <tr key={index} className="hover:bg-white/5 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div className="font-mono text-sm text-gray-300">{transaction.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300">{transaction.customer_email || transaction.customer || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm font-medium ${
                      transaction.status === 'succeeded' ? 'text-green-400' : 
                      transaction.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      ${(transaction.amount / 100).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                      transaction.status === 'succeeded' ? 'bg-green-500/20 text-green-400' :
                      transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                        transaction.status === 'succeeded' ? 'bg-green-400' :
                        transaction.status === 'pending' ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`} />
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {transaction.created ? new Date(transaction.created * 1000).toLocaleString() : 'Unknown'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No recent transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-700/50 bg-[#0f172a]/20">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing 3 of 156 transactions
            </div>
            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
              View All Transactions →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}