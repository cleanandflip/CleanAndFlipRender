import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { DollarSign, Clock, CheckCircle, MapPin } from 'lucide-react';

export function SubmissionAnalytics() {
  const { data: analytics } = useQuery({
    queryKey: ['submission-analytics'],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/submissions/analytics`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
    retry: 1
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total Value</p>
            <p className="text-2xl font-bold">${analytics?.totalValue?.toLocaleString() || 0}</p>
          </div>
          <DollarSign className="w-8 h-8 text-green-500" />
        </div>
      </Card>
      
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Avg Response Time</p>
            <p className="text-2xl font-bold">{analytics?.avgResponseTime || 0}h</p>
          </div>
          <Clock className="w-8 h-8 text-blue-500" />
        </div>
      </Card>
      
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Acceptance Rate</p>
            <p className="text-2xl font-bold">{analytics?.acceptanceRate || 0}%</p>
          </div>
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
      </Card>
      
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Local Submissions</p>
            <p className="text-2xl font-bold">{analytics?.localPercentage || 0}%</p>
          </div>
          <MapPin className="w-8 h-8 text-purple-500" />
        </div>
      </Card>
    </div>
  );
}