// ENHANCED SUBMISSION MODAL WITH ANIMATIONS
import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Check, AlertCircle, Package, User, Calendar, MapPin, DollarSign, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useScrollLock } from '@/hooks/useScrollLock';

interface SubmissionModalProps {
  submission?: any;
  onClose: () => void;
  onSave: () => void;
}

export function EnhancedSubmissionModal({ submission, onClose, onSave }: SubmissionModalProps) {
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const { sendMessage } = useWebSocket();
  
  // Lock body scroll while modal is open
  useScrollLock(true);
  
  const [formData, setFormData] = useState({
    status: 'pending',
    adminNotes: '',
    estimatedValue: '',
    offerAmount: '',
    declineReason: ''
  });

  const [initialData, setInitialData] = useState<typeof formData | null>(null);

  useEffect(() => {
    if (submission) {
      const data = {
        status: submission.status || 'pending',
        adminNotes: submission.adminNotes || '',
        estimatedValue: submission.estimatedValue?.toString() || '',
        offerAmount: submission.offerAmount?.toString() || '',
        declineReason: submission.declineReason || ''
      };
      setFormData(data);
      setInitialData(data);
    } else {
      setInitialData(formData);
    }
  }, [submission]);

  useEffect(() => {
    if (initialData) {
      const changed = JSON.stringify(formData) !== JSON.stringify(initialData);
      setHasChanges(changed);
    }
  }, [formData, initialData]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [hasChanges]);

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Do you want to save them?')) {
        handleSubmit();
      } else if (confirm('Are you sure you want to discard your changes?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!submission) return;
    
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : null,
        offerAmount: formData.offerAmount ? parseFloat(formData.offerAmount) : null
      };
      
      const res = await fetch(`/api/admin/submissions/${submission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
        credentials: 'include'
      });

      if (res.ok) {
        toast({
          title: "Success!",
          description: 'Submission updated successfully',
        });
        
        // Broadcast update for live sync
        sendMessage({
          type: 'submission_update',
          data: { 
            submissionId: submission.id,
            action: 'update',
            status: formData.status,
            contactEmail: submission.contactEmail
          }
        });
        
        onSave();
        onClose();
      } else {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update submission');
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || 'Failed to update submission',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!submission) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-500/20';
      case 'declined': return 'text-red-400 bg-red-500/20';
      case 'pending': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div 
        ref={modalRef}
        className="bg-[#1e293b] border border-gray-700 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-slideUp"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-[#1e293b] to-[#2d3748]">
          <div>
            <h2 className="text-xl font-bold text-white">Equipment Submission</h2>
            <p className="text-sm text-gray-400 mt-1">
              Review and manage equipment submission
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(formData.status)}`}>
              {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
            </span>
            {hasChanges && (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 rounded-full">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-yellow-400">Unsaved changes</span>
              </div>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Submission Details */}
          <div className="w-2/3 p-6 overflow-y-auto bg-[#0f172a]/30">
            <div className="space-y-6">
              
              {/* Submission Info */}
              <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-400" />
                  Equipment Details
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Equipment Type</label>
                    <p className="text-white font-medium">{submission.equipmentType || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Brand</label>
                    <p className="text-white font-medium">{submission.brand || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Model</label>
                    <p className="text-white font-medium">{submission.model || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Condition</label>
                    <p className="text-white font-medium">{submission.condition || 'N/A'}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                  <div className="bg-[#0f172a]/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-300 whitespace-pre-wrap">
                      {submission.description || 'No description provided'}
                    </p>
                  </div>
                </div>

                {/* Images */}
                {submission.images && submission.images.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Images</label>
                    <div className="grid grid-cols-3 gap-4">
                      {submission.images.map((image: string, index: number) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Equipment ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-700"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submitter Info */}
              <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  Submitter Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                    <p className="text-white font-medium">{submission.contactName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                    <p className="text-white font-medium">{submission.contactEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                    <p className="text-white font-medium">{submission.contactPhone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                    <p className="text-white font-medium flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {submission.location || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submission Timeline */}
              <div className="bg-[#1e293b]/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Timeline
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-gray-300">
                      Submitted on {new Date(submission.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {submission.updatedAt !== submission.createdAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-gray-300">
                        Last updated {new Date(submission.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Admin Actions */}
          <div className="w-1/3 border-l border-gray-700 bg-[#1e293b]/30">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                
                {/* Status Management */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>

                {/* Valuation */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Estimated Value</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={formData.estimatedValue}
                        onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {formData.status === 'approved' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Offer Amount</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          value={formData.offerAmount}
                          onChange={(e) => setFormData({ ...formData, offerAmount: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Decline Reason */}
                {formData.status === 'declined' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Decline Reason</label>
                    <textarea
                      value={formData.declineReason}
                      onChange={(e) => setFormData({ ...formData, declineReason: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Explain why this submission was declined..."
                    />
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Admin Notes
                  </label>
                  <textarea
                    value={formData.adminNotes}
                    onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Add internal notes about this submission..."
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-700 bg-[#1e293b]/80 flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  {hasChanges && (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <span>You have unsaved changes</span>
                    </>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-gray-700 rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 btn-glow"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Update Submission
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}