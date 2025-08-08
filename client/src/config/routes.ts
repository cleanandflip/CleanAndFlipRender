// 🎯 SINGLE SOURCE OF TRUTH for all application routes
// This file centralizes all route definitions to prevent duplication and typos

export const ROUTES = {
  // Public routes
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  SEARCH: '/search',
  
  // Shopping routes
  CART: '/cart',
  CHECKOUT: '/checkout',
  CHECKOUT_SUCCESS: '/checkout/success',
  
  // Auth routes (handled by Replit Auth)
  LOGIN: '/auth',
  REGISTER: '/auth',
  
  // User routes
  DASHBOARD: '/dashboard',
  ORDERS: '/orders',
  // Removed WISHLIST, SUBMIT_EQUIPMENT, TRACK_SUBMISSION for single-seller model
  
  // Admin routes
  ADMIN: '/admin',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_USERS: '/admin/users',
  ADMIN_ANALYTICS: '/admin/analytics',
  // Removed ADMIN_SUBMISSIONS and ADMIN_WISHLIST for single-seller model
  ADMIN_SYSTEM: '/admin/system',
  ADMIN_PRODUCT_NEW: '/admin/products/new',
  ADMIN_PRODUCT_EDIT: '/admin/products/edit/:id',
  
  // Static pages
  ABOUT: '/about',
  CONTACT: '/contact',
} as const;

// Helper functions for dynamic routes
export const routes = {
  productDetail: (id: string) => `/products/${id}`,
  orderDetail: (id: string) => `/orders/${id}`,
  // Removed submissionDetail helper for single-seller model
  adminProduct: (id: string) => `/admin/products/edit/${id}`,
  adminTab: (tab: string) => `/admin?tab=${tab}`,
} as const;

// Route groups for guards/middleware
export const routeGroups = {
  public: [
    ROUTES.HOME, 
    ROUTES.PRODUCTS, 
    ROUTES.PRODUCT_DETAIL, 
    ROUTES.SEARCH,
    ROUTES.ABOUT, 
    ROUTES.CONTACT,
    ROUTES.LOGIN, 
    ROUTES.REGISTER
  ],
  authenticated: [
    ROUTES.DASHBOARD, 
    ROUTES.ORDERS, 
    ROUTES.CART,
    ROUTES.CHECKOUT
  ],
  admin: [
    ROUTES.ADMIN,
    ROUTES.ADMIN_PRODUCTS,
    ROUTES.ADMIN_CATEGORIES,
    ROUTES.ADMIN_USERS,
    ROUTES.ADMIN_ANALYTICS,
    ROUTES.ADMIN_SYSTEM,
    ROUTES.ADMIN_PRODUCT_NEW,
    ROUTES.ADMIN_PRODUCT_EDIT
  ],
} as const;

// Type definitions for better TypeScript support
export type RoutePath = typeof ROUTES[keyof typeof ROUTES];
export type DynamicRoute = keyof typeof routes;
export type RouteGroup = keyof typeof routeGroups;

// Route metadata for SEO and navigation
export const routeMetadata = {
  [ROUTES.HOME]: {
    title: 'Clean & Flip - Premium Weightlifting Equipment',
    description: 'Buy and sell premium weightlifting equipment. Trusted marketplace for fitness enthusiasts.',
  },
  [ROUTES.PRODUCTS]: {
    title: 'Browse Equipment - Clean & Flip',
    description: 'Discover high-quality weightlifting equipment from trusted sellers.',
  },
  [ROUTES.CART]: {
    title: 'Shopping Cart - Clean & Flip',
    description: 'Review your selected equipment before checkout.',
  },
  [ROUTES.DASHBOARD]: {
    title: 'Dashboard - Clean & Flip',
    description: 'Manage your orders and equipment submissions.',
  },
  [ROUTES.ADMIN]: {
    title: 'Admin Dashboard - Clean & Flip',
    description: 'Manage products, users, and system settings.',
  },
} as const;