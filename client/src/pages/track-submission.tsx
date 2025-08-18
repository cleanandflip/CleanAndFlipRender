import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  DollarSign,
  MessageSquare,
  Copy,
  Search 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TrackSubmission() {
  const [location] = useLocation();
  const { toast } = useToast();
  
  const [referenceInput, setReferenceInput] = useState('');
  const [searchRef, setSearchRef] = useState('');

  // Extract URL parameters and auto-trigger search
  useEffect(() => {
    // Get the full URL including query parameters
    const fullUrl = window.location.href;
    const currentUrl = new URL(fullUrl);
    const urlRef = currentUrl.searchParams.get('ref') || '';
    
    console.log('🔍 TrackSubmission - Full URL:', fullUrl);
    console.log('🔍 TrackSubmission - location (wouter):', location);
    console.log('🔍 TrackSubmission - urlRef extracted:', urlRef);
    
    if (urlRef) {
      const trimmedRef = urlRef.toUpperCase().trim();
      console.log('🔍 Auto-populating and searching for:', trimmedRef);
      setReferenceInput(trimmedRef);
      setSearchRef(trimmedRef);
    }
  }, [location]);
  
  const { data: submission, isLoading, error } = useQuery({
    queryKey: ['track-submission', searchRef],
    queryFn: async () => {
      if (!searchRef) return null;
      return await apiRequest('GET', `/api/submissions/track/${searchRef}`);
    },
    enabled: !!searchRef
  });
  
  const statusConfig = {
    pending: { 
      label: 'Pending Review', 
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', 
      icon: Clock,
      description: 'Your submission is waiting to be reviewed by our team.'
    },
    under_review: { 
      label: 'Under Review', 
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', 
      icon: Package,
      description: 'Our team is currently evaluating your equipment.'
    },
    accepted: { 
      label: 'Offer Made', 
      color: 'bg-green-500/20 text-green-400 border-green-500/30', 
      icon: CheckCircle,
      description: 'We\'ve made an offer! Check your email for details.'
    },
    declined: { 
      label: 'Declined', 
      color: 'bg-red-500/20 text-red-400 border-red-500/30', 
      icon: XCircle,
      description: 'Unfortunately, we cannot accept this item at this time.'
    },
    scheduled: { 
      label: 'Pickup Scheduled', 
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', 
      icon: Calendar,
      description: 'Pickup has been scheduled. We\'ll see you soon!'
    },
    completed: { 
      label: 'Completed', 
      color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', 
      icon: CheckCircle,
      description: 'This submission has been completed. Thank you!'
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceInput.trim()) return;
    setSearchRef(referenceInput.toUpperCase().trim());
  };

  const copyReference = () => {
    if ((submission as any)?.referenceNumber) {
      navigator.clipboard.writeText((submission as any).referenceNumber);
      toast({
        title: "Reference copied!",
        description: "You can share this with others to track the submission.",
      });
    }
  };
  
  return (
    <div className="min-h-screen pt-32 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-bebas text-4xl mb-4">TRACK YOUR SUBMISSION</h1>
          <p className="text-text-secondary">
            Enter your reference number to track the status of your equipment submission
          </p>
        </div>
        
        {/* Search Bar */}
        <Card className="p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <Input
              type="text"
              placeholder="Enter reference number (e.g., REF-20250731-1234)"
              value={referenceInput}
              onChange={(e) => setReferenceInput(e.target.value)}
              className="flex-1 glass border-border"
            />
            <Button type="submit" className="bg-accent-blue hover:bg-blue-600">
              <Search className="w-4 h-4 mr-2" />
              Track
            </Button>
          </form>
        </Card>
        
        {/* Loading State */}
        {isLoading && (
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue mx-auto"></div>
            <p className="mt-4 text-text-secondary">Loading submission details...</p>
          </Card>
        )}
        
        {/* Error State */}
        {error && (
          <Card className="p-8 text-center border-red-500/30">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 text-lg mb-2">Submission Not Found</p>
            <p className="text-text-muted">
              No submission found with reference: <code className="bg-gray-800 px-2 py-1 rounded">{searchRef}</code>
            </p>
            <p className="text-sm text-text-muted mt-2">
              Please check your reference number and try again.
            </p>
          </Card>
        )}
        
        {/* Submission Details */}
        {submission && (
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-bebas text-2xl mb-2">SUBMISSION STATUS</h2>
                  <div className="flex items-center gap-3">
                    <code className="text-sm bg-gray-800 px-3 py-1 rounded text-accent-blue">
                      {(submission as any).referenceNumber}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyReference}
                      className="h-8 w-8"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-text-muted mb-1">Submitted</p>
                  <p className="text-sm">
                    {new Date((submission as any).createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {/* Current Status */}
              <div className="space-y-4">
                {statusConfig[(submission as any).status as keyof typeof statusConfig] && (
                  <>
                    <div className="flex items-center gap-3">
                      {React.createElement(
                        statusConfig[(submission as any).status as keyof typeof statusConfig].icon,
                        { className: "w-6 h-6" }
                      )}
                      <Badge className={statusConfig[(submission as any).status as keyof typeof statusConfig].color}>
                        {statusConfig[(submission as any).status as keyof typeof statusConfig].label}
                      </Badge>
                    </div>
                    <p className="text-text-secondary">
                      {statusConfig[(submission as any).status as keyof typeof statusConfig].description}
                    </p>
                  </>
                )}
              </div>
            </Card>
            
            {/* Equipment Details */}
            <Card className="p-6">
              <h3 className="font-bebas text-xl mb-4">EQUIPMENT DETAILS</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-muted">Equipment</p>
                  <p className="font-medium">{(submission as any).name}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Brand</p>
                  <p className="font-medium">{(submission as any).brand || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Condition</p>
                  <p className="font-medium capitalize">{((submission as any).condition || 'unknown').replace('_', ' ')}</p>
                </div>
                {(submission as any).offerAmount && (
                  <div>
                    <p className="text-sm text-text-muted">Offer Amount</p>
                    <p className="font-medium text-green-400">${(submission as any).offerAmount}</p>
                  </div>
                )}
              </div>
            </Card>
            
            {/* Pickup Information */}
            {(submission as any).scheduledPickupDate && (
              <Card className="p-6">
                <h3 className="font-bebas text-xl mb-4">PICKUP INFORMATION</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent-blue" />
                    <span>
                      {new Date((submission as any).scheduledPickupDate).toLocaleDateString()}
                    </span>
                  </div>
                  {(submission as any).pickupWindowStart && (submission as any).pickupWindowEnd && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-accent-blue" />
                      <span>
                        {(submission as any).pickupWindowStart} - {(submission as any).pickupWindowEnd}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}
            
            {/* Decline Reason */}
            {(submission as any).status === 'declined' && (submission as any).declineReason && (
              <Card className="p-6 border-red-500/30">
                <h3 className="font-bebas text-xl mb-4 text-red-400">DECLINE REASON</h3>
                <p className="text-text-secondary">{(submission as any).declineReason}</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}