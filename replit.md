# Clean & Flip - E-Commerce Marketplace

## Overview
Clean & Flip is a comprehensive weightlifting equipment marketplace facilitating the buying and selling of premium fitness equipment. It operates as a two-sided marketplace where users can sell used equipment or purchase verified gear. The business vision is to provide a trusted platform for fitness enthusiasts, leveraging a local business presence in Asheville, NC, to ensure quality and trust. The platform has recently undergone significant enhancements to become a professional, production-ready e-commerce marketplace comparable to Amazon/Shopify.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, Vite
- **Routing**: Wouter
- **Styling**: Tailwind CSS with custom dark theme, glass morphism design, blue accent colors, Bebas Neue typography for headings, mobile-first responsive design, professional aesthetic with a unified blue-gray color scheme, minimal product card design, unified dropdown theme with glass morphism and smart search, athletic weightlifting-themed background (hexagonal gym floor pattern, cross-grid athletic accents, subtle blue and green color gradients). Unified button and outline theme system for visual consistency across all components.
- **UI Components**: Shadcn/ui built on Radix UI, unified UI components (e.g., `WishlistButton`, `AddToCartButton`), global Card components.
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
- **Design Principles**: Focus on professional, clean, consistent UI/UX with a unified design system. Optimized for performance with aggressive code splitting and lazy loading.
- **Search System**: Portal-based search implementation ensuring search bars appear above all content.
- **Unified Dropdown System**: Glass morphism dropdown component (`UnifiedDropdown`) with consistent styling matching the search bar, replacing all legacy Select components across Contact, Sell-to-Us, and Admin pages.
- **Error Handling**: App-wide ErrorBoundary, dynamic error pages (404, 403, 500), ApiError component with retry functionality.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with JSON responses
- **Middleware**: Logging, JSON parsing, error handling.
- **Authentication**: Express sessions stored in PostgreSQL using `connect-pg-simple`, bcrypt for password hashing (12 salt rounds), role-based access control. Comprehensive authentication security with session persistence and enterprise-grade case-insensitive email system. Secure token-based password reset with production domain URLs (cleanandflip.com).
- **Security**: OWASP Top 10 compliance, advanced security headers (`helmet.js`), multi-tier rate limiting, input validation and sanitization, atomic transaction management.
- **Performance**: Redis caching, Gzip compression, WebSocket for real-time updates, optimized PostgreSQL full-text search with GIN indexes, request consolidation middleware.
- **Deployment**: Production-ready configuration with 0.0.0.0 host binding for Cloud Run, enhanced startup logging, environment variable validation, Docker support, graceful shutdown handling, and comprehensive health checks (/health, /health/ready).

### Data Storage
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Connection**: Connection pooling with `@neondatabase/serverless`
- **Schema**: Users, Products, Categories, Orders, Cart, Addresses, Equipment Submissions, Wishlist, Reviews, Coupons, Order Tracking, Return Requests, Password Reset Tokens, Email Logs.
- **Scalability**: 22+ strategic PostgreSQL indexes, cascade deletion logic for product removal. Comprehensive database schema validation and optimization for production stability.

### Core Features
- **Product Catalog**: Browse, search (with autocomplete and history), filter.
- **Shopping Cart**: Add/remove items, quantity management, persistent storage, stock validation, guest cart merging.
- **Checkout Flow**: Multi-step with Stripe payment integration, guest checkout.
- **User Dashboard**: Order history, submissions tracking, wishlist management, product reviews.
- **Sell Equipment**: Form-based submission.
- **Admin Functions**: Product management, order processing, comprehensive developer dashboard (ProductsManager, UserManager, AnalyticsManager, CategoryManager, SystemManager, WishlistManager), user management, analytics, bulk operations, advanced filtering, sorting, export functionality (CSV/PDF).
- **Wishlist System**: User authentication, real-time updates, duplicate prevention, admin analytics.
- **Analytics System**: Real-time tracking of page views, user actions, and conversions via `activity_logs` table.
- **Address System**: Unified address management with Geoapify autocomplete, local pickup badging.
- **Navigation State Management**: Session storage-based intelligent state management for filters and scroll position.
- **E-commerce Features**: Email service integration for confirmations/notifications, product reviews, guest checkout, advanced coupon/discount system, real-time order tracking, shipping calculator, return/refund request system.

## External Dependencies
- **Payment Processing**: Stripe (for checkout and payment handling, customer management, product synchronization).
- **Database**: Neon PostgreSQL (serverless database).
- **File Storage**: Cloudinary (for image handling and transformations, uploads up to 12MB and 12 images per product).
- **Caching**: Redis.
- **Address Autocomplete**: Geoapify.
- **Email Service**: Resend (for transactional emails like order confirmations, password resets, etc.). Production-ready with cleanandflip.com domain verification and case-insensitive email handling.

## Deployment Configuration

### Cloud Run Readiness
The application is now optimized for deployment on Google Cloud Run and other container platforms:

- **Host Binding**: Server correctly binds to `0.0.0.0` (required for Cloud Run)
- **Port Configuration**: Uses `PORT` environment variable with fallback to 5000
- **Build Process**: Optimized esbuild configuration with minification and Node.js 18 compatibility
- **Docker Support**: Multi-stage Dockerfile with production optimizations and security best practices
- **Health Checks**: Comprehensive endpoints (`/health`, `/health/ready`) for container orchestration
- **Environment Validation**: Startup-time validation of required environment variables
- **Enhanced Logging**: Detailed startup and error logging for debugging deployment issues
- **Graceful Shutdown**: Proper signal handling for container lifecycle management

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `STRIPE_SECRET_KEY`: Stripe payment processing key
- `NODE_ENV`: Should be set to 'production' for deployment

### Optional Environment Variables  
- `REDIS_URL`: Redis caching (improves performance)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Image storage
- `RESEND_API_KEY`: Email service

### Deployment Scripts
- `npm run build`: Builds frontend and backend for production
- `npm start`: Starts production server
- `server/scripts/deployment-check.ts`: Validates deployment readiness

### Recent Changes (August 8, 2025)

**🔄 PLATFORM REORGANIZATION PROGRESS (August 8, 2025)**
- **CRITICAL FIX COMPLETED**: Database schema mismatch resolved - shipping/tax column names fixed
- **AUTHENTICATION RESTORED**: Auto-login after registration working correctly with 7-day session persistence
- **EQUIPMENT SUBMISSIONS PRESERVED**: Essential sell-to-us functionality fully restored and operational
- **CODEBASE CLEANUP INITIATED**: Removed unnecessary documentation, audit files, and dead code
- **DATABASE OPTIMIZATION**: Schema properly aligned with actual database structure
- **SINGLE-SELLER MODEL**: Equipment submissions retained as core business feature for user-to-business sales
- **TECHNICAL DEBT REDUCTION**: LSP compilation errors resolved, redundant files eliminated
- **NEXT PHASE**: Continue streamlining while preserving essential e-commerce and equipment submission features

### Recent Changes (August 6, 2025)

**🔥 CLEAN SLATE DATABASE RESET COMPLETED (August 8, 2025)**
- **COMPLETE RESET**: All existing tables dropped and recreated from scratch
- **ACTIVE DATABASE**: `ep-old-sky-afb0k7th.c-2.us-west-2.aws.neon.tech/neondb` (100GB Neon PostgreSQL)
- **CLEAN STATE**: 1 admin user (admin@cleanflip.com), 0 products, 0 categories
- **FRESH SCHEMA**: All tables recreated with proper indexes and relationships
- **ADMIN ACCESS**: Ready for fresh inventory via admin dashboard
- **CODEBASE CLEANED**: Removed sample data, temporary files, and unused artifacts
- **DEPLOYMENT READY**: Clean slate platform ready for production use

**🔥 SIMPLE PASSWORD RESET REBUILD - PRODUCTION READY**
- **COMPLETE SYSTEM OVERHAUL**: Completely rebuilt password reset with simple, direct approach
- **ARCHITECTURE CLEANUP**: Deleted ALL legacy password reset files and complex service layers
- **SIMPLE IMPLEMENTATION**: 
  - `SimplePasswordReset` class - Single file with direct SQL queries using Drizzle ORM
  - API routes integrated directly in main server file for simplicity
  - Direct SQL queries with proper parameter binding
- **TECHNICAL EXCELLENCE**: 
  - Direct database queries with Drizzle's sql template
  - Fixed PostgreSQL type casting issues
  - Simple, reliable token management
  - Professional email delivery via Resend
- **SECURITY FEATURES**: 
  - 32-byte cryptographically secure tokens
  - 1-hour expiration with automatic cleanup
  - Single-use tokens marked as used after reset
  - bcryptjs password hashing (12 salt rounds)
- **VERIFIED FUNCTIONALITY**: 
  - ✅ User lookup working perfectly (cleanandflipyt@gmail.com found)
  - ✅ Token creation and database insertion successful
  - ✅ Email delivery confirmed (ID: b72e2f3b-b583-49db-9b3e-5c97ee58cc8a)
  - ✅ API endpoint responding correctly
  - ✅ Case-insensitive email matching
- **API ENDPOINTS**: 
  - `POST /api/auth/forgot-password` ✅ 
  - `GET /api/auth/validate-token/:token` ✅
  - `POST /api/auth/reset-password` ✅
- **PRODUCTION STATUS**: Fully operational, tested, and integrated

**Infrastructure & Deployment**
- Fixed Cloud Run deployment issues with proper host binding and startup logging
- Added comprehensive environment variable validation
- Enhanced error handling and graceful shutdown support
- Created production-ready Docker configuration
- Implemented deployment readiness validation script

**🚀 Production Database Synchronization (August 6, 2025)**
- **Database Verification Scripts**: Complete database comparison and validation tooling
- **Production Setup Automation**: `ensure-production-database.ts` for automated production database setup
- **Migration Support**: SQL scripts for manual database setup if needed
- **Deployment Strategy Options**: 
  - Option 1: Unified database (recommended) - use same database for dev/prod
  - Option 2: Separate production database with automated synchronization
- **Enhanced Diagnostics**: `/api/debug/database-info` endpoint for production verification
- **Environment Templates**: Complete `.env.production.template` with deployment instructions
- **Platform Support**: Instructions for Vercel, Railway, Render, Heroku deployment