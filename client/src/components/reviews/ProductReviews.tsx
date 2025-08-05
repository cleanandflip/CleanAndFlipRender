import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/shared/AnimatedComponents";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Star, MessageSquare, ThumbsUp, User } from "lucide-react";
import { format } from "date-fns";

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  content: string;
  verified: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductReviewsProps {
  productId: string;
  averageRating?: number;
  totalReviews?: number;
}

export function ProductReviews({ productId, averageRating = 0, totalReviews = 0 }: ProductReviewsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    content: ''
  });

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: [`/api/products/${productId}/reviews`],
    enabled: !!productId,
  });

  const addReviewMutation = useMutation({
    mutationFn: async (reviewData: typeof newReview) => {
      return await apiRequest("POST", `/api/products/${productId}/reviews`, reviewData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
      setShowReviewForm(false);
      setNewReview({ rating: 5, title: '', content: '' });
      toast({
        title: "Review Added",
        description: "Thank you for your review!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add review",
        variant: "destructive",
      });
    }
  });

  const markHelpfulMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      return await apiRequest("POST", `/api/reviews/${reviewId}/helpful`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/reviews`] });
    }
  });

  const handleSubmitReview = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to write a review",
        variant: "destructive",
      });
      return;
    }

    if (!newReview.title.trim() || !newReview.content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and review content",
        variant: "destructive",
      });
      return;
    }

    addReviewMutation.mutate(newReview);
  };

  const renderStars = (rating: number, interactive = false, size = 20) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={interactive ? () => setNewReview({ ...newReview, rating: star }) : undefined}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b pb-4">
                <div className="h-4 bg-gray-300 rounded mb-2 w-1/2"></div>
                <div className="h-16 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bebas">CUSTOMER REVIEWS</h2>
          {user && (
            <Button
              onClick={() => setShowReviewForm(!showReviewForm)}
              variant="primary"
              size="sm"
              className="flex items-center gap-2"
            >
              <MessageSquare size={16} />
              Write Review
            </Button>
          )}
        </div>

        {/* Rating Summary */}
        <div className="flex items-center gap-4 mb-6 p-4 glass rounded-lg">
          <div className="text-center">
            <div className="text-3xl font-bold text-accent-blue mb-1">
              {averageRating.toFixed(1)}
            </div>
            {renderStars(Math.round(averageRating), false, 24)}
          </div>
          <div className="text-text-secondary">
            <p className="text-lg font-semibold">{totalReviews} Reviews</p>
            <p className="text-sm">Based on verified purchases</p>
          </div>
        </div>

        {/* Add Review Form */}
        {showReviewForm && (
          <Card className="p-4 mb-6 border border-accent-blue/30">
            <h3 className="font-semibold mb-4">Write Your Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                {renderStars(newReview.rating, true, 24)}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Review Title</label>
                <Input
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                  placeholder="Sum up your experience"
                  maxLength={100}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Your Review</label>
                <Textarea
                  value={newReview.content}
                  onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                  placeholder="Tell others about your experience with this product"
                  rows={4}
                  maxLength={1000}
                />
                <div className="text-xs text-text-secondary mt-1">
                  {newReview.content.length}/1000 characters
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitReview}
                  variant="primary"
                  disabled={addReviewMutation.isPending}
                >
                  {addReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                </Button>
                <Button
                  onClick={() => setShowReviewForm(false)}
                  variant="secondary"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-text-secondary mb-4">No reviews yet</p>
            <p className="text-sm text-text-muted">Be the first to share your experience!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-border/30 pb-6 last:border-b-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-accent-blue to-accent-green rounded-full flex items-center justify-center">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{review.userName}</span>
                      {review.verified && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating, false, 16)}
                      <span className="text-sm text-text-secondary">
                        {format(new Date(review.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ml-13">
                <h4 className="font-semibold mb-2">{review.title}</h4>
                <p className="text-text-secondary mb-3 leading-relaxed">{review.content}</p>
                
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => markHelpfulMutation.mutate(review.id)}
                    className="flex items-center gap-1 text-sm text-text-secondary hover:text-accent-blue transition-colors"
                    disabled={markHelpfulMutation.isPending}
                  >
                    <ThumbsUp size={14} />
                    Helpful ({review.helpful})
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}