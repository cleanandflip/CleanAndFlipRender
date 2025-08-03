import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Eye, Edit, MessageSquare, Archive, Trash2, MoreVertical } from 'lucide-react';
import { formatStatus, getStatusVariant, formatCurrency } from '@/utils/submissionHelpers';

interface Submission {
  id: string;
  referenceNumber: string;
  name: string;
  brand: string;
  condition: string;
  askingPrice: number;
  status: string;
  createdAt: string;
  phoneNumber: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  viewedByAdmin?: boolean;
}

interface SubmissionsListProps {
  submissions: Submission[];
  selectedSubmissions: Set<string>;
  onSelectSubmission: (id: string) => void;
  onViewDetails: (submission: Submission) => void;
}

// Removed duplicate functions - now using centralized utilities

export function SubmissionsList({ 
  submissions, 
  selectedSubmissions, 
  onSelectSubmission, 
  onViewDetails 
}: SubmissionsListProps) {
  const handleSelectAll = (checked: boolean) => {
    submissions.forEach(s => {
      if (checked && !selectedSubmissions.has(s.id)) {
        onSelectSubmission(s.id);
      } else if (!checked && selectedSubmissions.has(s.id)) {
        onSelectSubmission(s.id);
      }
    });
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm text-gray-400 font-medium">
        <div className="col-span-1">
          <input
            type="checkbox"
            className="rounded"
            checked={submissions.length > 0 && selectedSubmissions.size === submissions.length}
            onChange={(e) => handleSelectAll(e.target.checked)}
          />
        </div>
        <div className="col-span-2">Reference</div>
        <div className="col-span-3">Equipment</div>
        <div className="col-span-2">User</div>
        <div className="col-span-1">Price</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-1">Date</div>
        <div className="col-span-1">Actions</div>
      </div>
      
      {/* Rows */}
      {submissions.map((submission) => (
        <Card 
          key={submission.id}
          className={`p-4 hover:bg-gray-800/50 transition-colors ${
            selectedSubmissions.has(submission.id) ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-1">
              <input
                type="checkbox"
                className="rounded"
                checked={selectedSubmissions.has(submission.id)}
                onChange={() => onSelectSubmission(submission.id)}
              />
            </div>
            
            <div className="col-span-2">
              <p className="font-mono text-sm">{submission.referenceNumber}</p>
              {!submission.viewedByAdmin && (
                <Badge variant="secondary" className="text-xs mt-1">New</Badge>
              )}
            </div>
            
            <div className="col-span-3">
              <p className="font-medium">{submission.name}</p>
              <p className="text-sm text-gray-400">{submission.brand} • {submission.condition}</p>
            </div>
            
            <div className="col-span-2">
              <p className="text-sm">
                {submission.user?.firstName && submission.user?.lastName 
                  ? `${submission.user.firstName} ${submission.user.lastName}`
                  : submission.user?.email || 'Unknown User'
                }
              </p>
              <p className="text-xs text-gray-400">{submission.phoneNumber}</p>
            </div>
            
            <div className="col-span-1">
              <p className="font-medium">${submission.askingPrice || 'Open'}</p>
            </div>
            
            <div className="col-span-1">
              <Badge variant={getStatusVariant(submission.status)}>
                {formatStatus(submission.status)}
              </Badge>
            </div>
            
            <div className="col-span-1">
              <p className="text-sm text-gray-400">
                {new Date(submission.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="col-span-1 flex gap-1">
              <div className="glass glass-hover rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewDetails(submission)}
                  className="h-8 w-8 transition-all duration-300 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="glass glass-hover rounded-lg p-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 transition-all duration-300 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Add Note
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-400">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}