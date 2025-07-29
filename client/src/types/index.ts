// Common types used across the application
export interface SearchFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  brand?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export type ViewMode = 'grid' | 'list';

export type ProductCondition = 'new' | 'like_new' | 'good' | 'fair' | 'needs_repair';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export type SubmissionStatus = 'pending' | 'reviewed' | 'offer_made' | 'accepted' | 'rejected';
