# Clean & Flip - E-Commerce Marketplace

## Overview
Clean & Flip is a comprehensive weightlifting equipment marketplace facilitating the buying and selling of premium fitness equipment. It operates as a two-sided marketplace where users can sell used equipment or purchase verified gear. The business vision is to provide a trusted platform for fitness enthusiasts, leveraging a local business presence in Asheville, NC, to ensure quality and trust.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, Vite
- **Routing**: Wouter
- **Styling**: Tailwind CSS with custom dark theme, glass morphism design, blue accent colors, Bebas Neue typography for headings, mobile-first responsive design.
- **UI Components**: Shadcn/ui built on Radix UI, unified UI components (e.g., `WishlistButton`, `AddToCartButton`).
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
- **Design Principles**: Professional aesthetic with a unified blue-gray color scheme, minimal product card design, unified dropdown theme with glass morphism and smart search.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with JSON responses
- **Middleware**: Logging, JSON parsing, error handling.
- **Authentication**: Express sessions stored in PostgreSQL using `connect-pg-simple`, bcrypt for password hashing (12 salt rounds), role-based access control.
- **Security**: OWASP Top 10 compliance, advanced security headers (`helmet.js`), multi-tier rate limiting, input validation and sanitization, atomic transaction management.
- **Performance**: Redis caching, Gzip compression, WebSocket for real-time updates, optimized PostgreSQL full-text search with GIN indexes, request consolidation middleware.

### Data Storage
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Connection**: Connection pooling with `@neondatabase/serverless`
- **Schema**: Users, Products, Categories, Orders, Cart, Addresses, Equipment Submissions, Wishlist.
- **Scalability**: 22+ strategic PostgreSQL indexes.

### Core Features
- **Product Catalog**: Browse, search, filter.
- **Shopping Cart**: Add/remove items, quantity management, persistent storage, stock validation, guest cart merging.
- **Checkout Flow**: Multi-step with Stripe payment integration.
- **User Dashboard**: Order history, submissions tracking, wishlist management.
- **Sell Equipment**: Form-based submission.
- **Admin Functions**: Product management, order processing, comprehensive developer dashboard, user management, analytics.
- **Wishlist System**: User authentication, real-time updates, duplicate prevention, admin analytics.
- **Analytics System**: Real-time tracking of page views, user actions, and conversions via `activity_logs` table.
- **Address System**: Unified address management with Geoapify autocomplete, local pickup badging.
- **Navigation State Management**: Session storage-based intelligent state management for filters and scroll position.
- **Error Handling**: App-wide ErrorBoundary, dynamic error pages (404, 403, 500), ApiError component with retry functionality.

## External Dependencies
- **Payment Processing**: Stripe (for checkout and payment handling, customer management).
- **Database**: Neon PostgreSQL (serverless database).
- **File Storage**: Cloudinary (for image handling and transformations, uploads up to 12MB and 12 images per product).
- **Caching**: Redis.

## Recent Updates (January 2025)

### Complete Unified Dashboard System Implementation ✅
✓ **Unified Dashboard Layout**: Complete DashboardLayout component with consistent interface patterns
✓ **Professional Admin Components**: MetricCard, DataTable, Pagination for all dashboard sections
✓ **Comprehensive Management Systems**: ProductsManager, UserManager, AnalyticsManager, CategoryManager, SystemManager, WishlistManager
✓ **Advanced Data Features**: Bulk operations, advanced filtering, sorting, export functionality (CSV/PDF)
✓ **Type-Safe Implementation**: Full TypeScript integration with proper error handling
✓ **Scalable Architecture**: Reusable components supporting thousands of items across all tabs
✓ **Real-Time Updates**: Live data synchronization with optimized query patterns
✓ **Clean Code Quality**: All LSP errors resolved, duplicate code eliminated

### Comprehensive Code Cleanup & Production Readiness ✅ (Latest - August 2025)
✓ **Complete TypeScript Error Resolution**: All LSP diagnostics resolved (0 errors) - proper interface definitions and type safety
✓ **Production Code Quality**: Removed all debug console.log statements across admin dashboard components and critical files
✓ **Database Query Optimization**: Eliminated all Drizzle ORM errors by replacing complex SQL aggregations with JavaScript processing
✓ **Admin Dashboard Full Functionality**: All 7 tabs working correctly - Products, Users, Analytics, Categories, Submissions, Wishlist, System
✓ **Clean Component Architecture**: Fixed missing state declarations (editingCategory, selectedSubmission) with proper type handling
✓ **Professional Error Handling**: Replaced debug statements with proper toast notifications and user-friendly messaging
✓ **Test Endpoint Cleanup**: Removed temporary debug and performance test endpoints for production deployment
✓ **Frontend Data Flow**: Corrected data access patterns in UserManager and AnalyticsManager components
✓ **Code Architecture**: Proper interface definitions for Submission types with optional fields for flexible data handling

### Previous Code Cleanup & Organization
✓ **Eliminated Duplicate Code**: Removed all duplicate function definitions across components
✓ **Centralized Utilities**: Created `client/src/utils/submissionHelpers.ts` and `server/utils/exportHelpers.ts`
✓ **Clean Component Architecture**: SubmissionsList.tsx and SubmissionsGrid.tsx now use shared utilities
✓ **Enhanced Backend**: Added comprehensive bulk operations, CSV/PDF export endpoints
✓ **Real Data Integration**: System confirmed working with live submission data (4 active submissions)
✓ **Production-Ready Interface**: Professional admin interface with advanced filtering and analytics