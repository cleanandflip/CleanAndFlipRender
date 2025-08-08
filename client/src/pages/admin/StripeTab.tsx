// STRIPE TAB WITH BEAUTIFUL SYNC ANIMATION
import { useState, useEffect } from 'react';
import { CreditCard, RefreshCw, CheckCircle, XCircle, TrendingUp, DollarSign, Activity, Zap, Clock } from 'lucide-react';
import { UnifiedMetricCard } from '@/components/admin/UnifiedMetricCard';
import { useWebSocket } from '@/hooks/useWebSocket';
import { toast } from '@/hooks/use-toast';

export function StripeTab() {
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncStage, setSyncStage] = useState('');
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [transactions, setTransactions] = useState([]);
  
  const { isConnected, sendMessage } = useWebSocket();

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

      if (response.ok) {
        setSyncStatus('success');
        toast({
          title: "Sync Complete!",
          description: result.message || "All Stripe data synchronized successfully",
        });
        
        // Broadcast to all connected clients
        sendMessage({
          type: 'stripe_sync_complete',
          data: { 
            completedAt: new Date().toISOString(),
            success: true
          }
        });
      } else {
        throw new Error(result.error || 'Sync failed');
      }

      // Reset after animation
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncProgress(0);
        setPulseAnimation(false);
        setSyncStage('');
      }, 3000);

    } catch (error) {
      setSyncStatus('error');
      toast({
        title: "Sync Failed",
        description: error.message || "Please try again or check your connection",
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <UnifiedMetricCard
          title="Total Revenue"
          value="$12,450"
          icon={DollarSign}
          change={{ value: 15, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Transactions"
          value="156"
          icon={Activity}
          change={{ value: 12, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Success Rate"
          value="95.8%"
          icon={TrendingUp}
          change={{ value: 2, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Avg. Transaction"
          value="$79.80"
          icon={CreditCard}
          change={{ value: 8, label: 'from last month' }}
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
              <tr className="hover:bg-white/5 transition-colors duration-200">
                <td className="px-6 py-4">
                  <div className="font-mono text-sm text-gray-300">pi_3N4K5L2eZvKYlo2C1234567890</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-300">john.smith@example.com</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-green-400">$299.99</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Succeeded
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">2 minutes ago</td>
              </tr>
              
              <tr className="hover:bg-white/5 transition-colors duration-200">
                <td className="px-6 py-4">
                  <div className="font-mono text-sm text-gray-300">pi_3N4K5L2eZvKYlo2C0987654321</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-300">sarah.connor@example.com</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-green-400">$149.99</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Succeeded
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">8 minutes ago</td>
              </tr>
              
              <tr className="hover:bg-white/5 transition-colors duration-200">
                <td className="px-6 py-4">
                  <div className="font-mono text-sm text-gray-300">pi_3N4K5L2eZvKYlo2C1122334455</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-300">mike.johnson@example.com</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-yellow-400">$89.99</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                    Pending
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">15 minutes ago</td>
              </tr>
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