import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Package } from 'lucide-react';

interface Submission {
  id: string;
  referenceNumber: string;
  name: string;
  brand: string;
  condition: string;
  askingPrice: number;
  status: string;
  createdAt: string;
  images?: string[];
}

interface SubmissionsGridProps {
  submissions: Submission[];
  selectedSubmissions: Set<string>;
  onSelectSubmission: (id: string) => void;
  onViewDetails: (submission: Submission) => void;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'pending': return 'default';
    case 'under_review': return 'secondary';
    case 'accepted': return 'secondary';
    case 'scheduled': return 'secondary';
    case 'completed': return 'secondary';
    case 'rejected': return 'destructive';
    case 'cancelled': return 'outline';
    default: return 'outline';
  }
};

const formatStatus = (status: string) => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export function SubmissionsGrid({ 
  submissions, 
  selectedSubmissions, 
  onSelectSubmission, 
  onViewDetails 
}: SubmissionsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {submissions.map((submission) => (
        <Card 
          key={submission.id}
          className={`p-4 hover:bg-gray-800/50 transition-all cursor-pointer ${
            selectedSubmissions.has(submission.id) ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => onViewDetails(submission)}
        >
          <div className="flex justify-between items-start mb-3">
            <input
              type="checkbox"
              className="rounded"
              checked={selectedSubmissions.has(submission.id)}
              onChange={(e) => {
                e.stopPropagation();
                onSelectSubmission(submission.id);
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <Badge variant={getStatusVariant(submission.status)}>
              {formatStatus(submission.status)}
            </Badge>
          </div>
          
          {/* Image placeholder or actual image */}
          <div className="aspect-square bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
            {submission.images?.[0] ? (
              <img 
                src={submission.images[0]} 
                alt={submission.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Package className="w-12 h-12 text-gray-600" />
            )}
          </div>
          
          <h3 className="font-semibold mb-1">{submission.name}</h3>
          <p className="text-sm text-gray-400 mb-2">{submission.brand}</p>
          
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">${submission.askingPrice || 'Open'}</span>
            <span className="text-gray-400">
              {new Date(submission.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-400 font-mono">{submission.referenceNumber}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}