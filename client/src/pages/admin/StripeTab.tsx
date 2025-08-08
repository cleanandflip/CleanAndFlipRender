// UNIFIED STRIPE TAB
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, DollarSign, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedMetricCard } from '@/components/admin/UnifiedMetricCard';
import { UnifiedDataTable } from '@/components/admin/UnifiedDataTable';
import { UnifiedButton } from '@/components/admin/UnifiedButton';

interface StripeTransaction {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  customerEmail: string;
  description: string;
  created: string;
  paymentMethod: string;
}

export function StripeTab() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: stripeData, isLoading, refetch } = useQuery({
    queryKey: ['admin-stripe', searchQuery],
    queryFn: async () => {
      // Mock data - replace with actual Stripe API integration
      return {
        transactions: [
          {
            id: 'pi_1234567890',
            amount: 29999,
            currency: 'usd',
            status: 'succeeded' as const,
            customerEmail: 'customer@example.com',
            description: 'Olympic Barbell Set',
            created: new Date().toISOString(),
            paymentMethod: 'Visa ****1234'
          },
          // Add more mock transactions
        ],
        summary: {
          totalRevenue: 45000,
          totalTransactions: 156,
          successfulPayments: 148,
          failedPayments: 8
        }
      };
    }
  });

  const transactions: StripeTransaction[] = stripeData?.transactions || [];
  const summary = stripeData?.summary || {
    totalRevenue: 0,
    totalTransactions: 0,
    successfulPayments: 0,
    failedPayments: 0
  };

  const columns = [
    {
      key: 'id',
      label: 'Transaction ID',
      render: (transaction: StripeTransaction) => (
        <span className="font-mono text-sm text-blue-400">{transaction.id}</span>
      )
    },
    {
      key: 'customerEmail',
      label: 'Customer',
      render: (transaction: StripeTransaction) => (
        <span className="text-gray-300">{transaction.customerEmail}</span>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (transaction: StripeTransaction) => (
        <span className="text-white">{transaction.description}</span>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (transaction: StripeTransaction) => (
        <span className="font-medium text-green-400">
          ${(transaction.amount / 100).toFixed(2)}
        </span>
      ),
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      render: (transaction: StripeTransaction) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-medium",
          transaction.status === 'succeeded' ? "bg-green-500/20 text-green-400" :
          transaction.status === 'pending' ? "bg-yellow-500/20 text-yellow-400" :
          "bg-red-500/20 text-red-400"
        )}>
          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
        </span>
      )
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      render: (transaction: StripeTransaction) => (
        <span className="text-gray-400">{transaction.paymentMethod}</span>
      )
    },
    {
      key: 'created',
      label: 'Date',
      render: (transaction: StripeTransaction) => (
        <span className="text-gray-400">
          {new Date(transaction.created).toLocaleDateString()}
        </span>
      ),
      sortable: true
    }
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <UnifiedMetricCard
          title="Total Revenue"
          value={`$${((summary.totalRevenue || 0) / 100).toLocaleString()}`}
          icon={DollarSign}
          change={{ value: 15, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Total Transactions"
          value={summary.totalTransactions || 0}
          icon={CreditCard}
          change={{ value: 12, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Success Rate"
          value={`${summary.totalTransactions ? Math.round((summary.successfulPayments / summary.totalTransactions) * 100) : 0}%`}
          icon={TrendingUp}
          change={{ value: 2, label: 'from last month' }}
        />
        <UnifiedMetricCard
          title="Failed Payments"
          value={summary.failedPayments || 0}
          icon={CreditCard}
          change={{ value: -5, label: 'from last month' }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Stripe Integration</h2>
          <p className="text-gray-400 mt-1">Monitor payments and transactions</p>
        </div>
        <UnifiedButton
          variant="secondary"
          icon={RefreshCw}
          onClick={refetch}
        >
          Sync with Stripe
        </UnifiedButton>
      </div>

      {/* Stripe Actions */}
      <div className="bg-[#1e293b]/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Stripe Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UnifiedButton
            variant="secondary"
            className="w-full justify-start"
            onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
          >
            Open Stripe Dashboard
          </UnifiedButton>
          <UnifiedButton
            variant="secondary"
            className="w-full justify-start"
            onClick={() => console.log('Sync products')}
          >
            Sync Products
          </UnifiedButton>
          <UnifiedButton
            variant="secondary"
            className="w-full justify-start"
            onClick={() => console.log('Export transactions')}
          >
            Export Transactions
          </UnifiedButton>
        </div>
      </div>

      {/* Transactions Table */}
      <UnifiedDataTable
        data={transactions}
        columns={columns}
        searchPlaceholder="Search transactions by ID or customer..."
        onSearch={setSearchQuery}
        onRefresh={refetch}
        onExport={() => console.log('Export transactions')}
        loading={isLoading}
        actions={{
          onView: (transaction) => console.log('View transaction:', transaction),
          onEdit: (transaction) => console.log('Refund transaction:', transaction),
        }}
        pagination={{
          currentPage: 1,
          totalPages: Math.ceil(transactions.length / 20) || 1,
          onPageChange: (page) => console.log('Page:', page)
        }}
      />
    </div>
  );
}