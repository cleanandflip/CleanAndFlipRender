import { useQuery } from '@tanstack/react-query';
import { UnifiedStatCard } from '@/components/admin/UnifiedStatCard';
import { DollarSign, Clock, CheckCircle, MapPin, Package } from 'lucide-react';

export function SubmissionAnalytics() {
  const { data: analytics } = useQuery({
    queryKey: ['submission-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/submissions/analytics', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
    retry: 1
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <UnifiedStatCard
        title="Total Value"
        value={`$${analytics?.totalValue?.toLocaleString() || 0}`}
        icon={<DollarSign className="w-6 h-6 text-white" />}
        gradient="green"
        subtitle="Total submission value"
      />
      
      <UnifiedStatCard
        title="Avg Response Time"
        value={`${analytics?.avgResponseTime || 0}h`}
        icon={<Clock className="w-6 h-6 text-white" />}
        gradient="blue"
        subtitle="Response time"
      />
      
      <UnifiedStatCard
        title="Acceptance Rate"
        value={`${analytics?.acceptanceRate || 0}%`}
        icon={<CheckCircle className="w-6 h-6 text-white" />}
        gradient="purple"
        subtitle="Submission acceptance"
      />
      
      <UnifiedStatCard
        title="Local Submissions"
        value={`${analytics?.localPercentage || 0}%`}
        icon={<MapPin className="w-6 h-6 text-white" />}
        gradient="orange"
        subtitle="From local area"
      />
    </div>
  );
}