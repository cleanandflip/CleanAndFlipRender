import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UnifiedDropdown } from '@/components/ui/unified-dropdown';
import { Calendar, MapPin, Phone, DollarSign, Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Submission {
  id: string;
  name: string;
  description: string;
  brand: string;
  condition: string;
  weight?: number;
  askingPrice?: number;
  images: string[];
  status: string;
  offerAmount?: number;
  adminNotes?: string;
  phoneNumber?: string;
  userCity?: string;
  userState?: string;
  userZipCode?: string;
  isLocal?: boolean;
  distance?: number;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export default function SubmissionsManager() {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['admin-submissions', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      return await apiRequest('GET', `/api/admin/submissions${params}`);
    }
  });

  const updateSubmission = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return await apiRequest('PUT', `/api/admin/submissions/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-submissions'] });
      toast({
        title: "Submission Updated",
        description: "The submission has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update submission. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleStatusUpdate = async (submission: Submission, status: string) => {
    const updates: any = { status };
    
    if (status === 'offer_made' && offerAmount) {
      updates.offerAmount = Number(offerAmount);
    }
    
    if (adminNotes) {
      updates.adminNotes = adminNotes;
    }

    await updateSubmission.mutateAsync({ id: submission.id, updates });
    
    // Clear form
    setOfferAmount('');
    setAdminNotes('');
    
    if (status === 'offer_made') {
      toast({
        title: "Offer Sent",
        description: `Offer of $${offerAmount} sent to ${submission.user.email}`,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'reviewed': return <Package className="w-4 h-4" />;
      case 'offer_made': return <DollarSign className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'reviewed': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'offer_made': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'accepted': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'scheduled': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="w-8 h-8 animate-spin mx-auto mb-4 text-accent-blue" />
          <p className="text-text-muted">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bebas text-white">EQUIPMENT SUBMISSIONS</h1>
            <p className="text-text-muted">Review and manage equipment submissions</p>
          </div>
          
          <UnifiedDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All Submissions' },
              { value: 'pending', label: 'Pending Review' },
              { value: 'reviewed', label: 'Reviewed' },
              { value: 'offer_made', label: 'Offer Made' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'scheduled', label: 'Scheduled' }
            ]}
            className="w-48"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submissions List */}
          <div className="lg:col-span-2 space-y-4">
            {submissions.length === 0 ? (
              <Card className="glass-card p-8 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-text-muted" />
                <h3 className="text-lg font-semibold mb-2">No Submissions Found</h3>
                <p className="text-text-muted">
                  {statusFilter === 'all' 
                    ? 'No equipment submissions have been received yet.'
                    : `No submissions with status "${statusFilter}" found.`
                  }
                </p>
              </Card>
            ) : (
              submissions.map((submission: Submission) => (
                <Card 
                  key={submission.id}
                  className={`glass-card p-4 cursor-pointer transition-all duration-200 hover:bg-white/5 ${
                    selectedSubmission?.id === submission.id ? 'ring-2 ring-accent-blue' : ''
                  }`}
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-white">{submission.name}</h3>
                      <p className="text-text-muted">{submission.brand} • {submission.condition}</p>
                    </div>
                    <Badge className={`${getStatusColor(submission.status)} border flex items-center gap-1`}>
                      {getStatusIcon(submission.status)}
                      {submission.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-accent-blue" />
                      <span className="text-text-muted">
                        Asking: {submission.askingPrice ? `$${submission.askingPrice}` : 'Open to offers'}
                      </span>
                    </div>
                    
                    {submission.isLocal && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">
                          {submission.distance ? `${submission.distance} miles` : 'Local'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between text-sm text-text-muted">
                    <span>{submission.user.firstName || submission.user.email}</span>
                    <span>{new Date(submission.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  {submission.offerAmount && (
                    <div className="mt-2 text-sm">
                      <span className="text-accent-blue">Current Offer: ${submission.offerAmount}</span>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>

          {/* Detail Panel */}
          {selectedSubmission ? (
            <Card className="glass-card p-6 h-fit">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl text-white">Submission Details</CardTitle>
              </CardHeader>
              
              <CardContent className="px-0 space-y-4">
                {/* Images */}
                {selectedSubmission.images?.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSubmission.images.map((img, idx) => (
                      <img 
                        key={idx}
                        src={img} 
                        alt={`Equipment ${idx + 1}`}
                        className="rounded-lg w-full h-24 object-cover border border-glass-border"
                      />
                    ))}
                  </div>
                )}
                
                {/* Equipment Details */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-text-muted">Description</label>
                    <p className="text-white">{selectedSubmission.description || 'No description provided'}</p>
                  </div>
                  
                  {selectedSubmission.weight && (
                    <div>
                      <label className="text-sm text-text-muted">Weight</label>
                      <p className="text-white">{selectedSubmission.weight} lbs</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm text-text-muted">Contact</label>
                    <div className="space-y-1">
                      <p className="text-white">{selectedSubmission.user.email}</p>
                      {selectedSubmission.phoneNumber && (
                        <p className="flex items-center gap-2 text-white">
                          <Phone className="w-4 h-4" />
                          {selectedSubmission.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {(selectedSubmission.userCity || selectedSubmission.userState) && (
                    <div>
                      <label className="text-sm text-text-muted">Location</label>
                      <p className="text-white">
                        {[selectedSubmission.userCity, selectedSubmission.userState, selectedSubmission.userZipCode]
                          .filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {selectedSubmission.adminNotes && (
                    <div>
                      <label className="text-sm text-text-muted">Admin Notes</label>
                      <p className="text-white">{selectedSubmission.adminNotes}</p>
                    </div>
                  )}
                </div>

                {/* Action Panel */}
                {selectedSubmission.status === 'pending' && (
                  <div className="space-y-4 pt-4 border-t border-glass-border">
                    <div>
                      <label className="text-sm text-text-muted mb-2 block">Your Offer ($)</label>
                      <Input
                        type="number"
                        value={offerAmount}
                        onChange={(e) => setOfferAmount(e.target.value)}
                        placeholder="Enter offer amount"
                        className="glass border-glass-border"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-text-muted mb-2 block">Notes</label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Internal notes or message to user"
                        className="glass border-glass-border"
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        onClick={() => handleStatusUpdate(selectedSubmission, 'offer_made')}
                        disabled={!offerAmount || updateSubmission.isPending}
                        className="bg-accent-blue hover:bg-blue-600"
                      >
                        Make Offer
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => handleStatusUpdate(selectedSubmission, 'rejected')}
                        disabled={updateSubmission.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
                
                {selectedSubmission.status === 'offer_made' && (
                  <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
                    <p className="text-purple-400 font-semibold">
                      Offer Made: ${selectedSubmission.offerAmount}
                    </p>
                    <p className="text-sm text-text-muted mt-1">
                      Waiting for user response
                    </p>
                  </div>
                )}
                
                {selectedSubmission.status === 'accepted' && (
                  <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                    <p className="text-green-400 font-semibold">
                      Offer Accepted: ${selectedSubmission.offerAmount}
                    </p>
                    <p className="text-sm text-text-muted mt-1">
                      Contact user to schedule pickup
                    </p>
                    <Button 
                      onClick={() => handleStatusUpdate(selectedSubmission, 'scheduled')}
                      className="mt-2 w-full bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      Mark as Scheduled
                    </Button>
                  </div>
                )}
                
                {selectedSubmission.status === 'rejected' && (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                    <p className="text-red-400 font-semibold">
                      Submission Rejected
                    </p>
                    {selectedSubmission.adminNotes && (
                      <p className="text-sm text-text-muted mt-1">
                        Reason: {selectedSubmission.adminNotes}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card p-6 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-text-muted" />
              <h3 className="text-lg font-semibold mb-2 text-white">Select a Submission</h3>
              <p className="text-text-muted">Click on a submission to view details and take action</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}