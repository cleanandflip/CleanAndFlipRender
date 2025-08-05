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
- **Error Handling**: App-wide ErrorBoundary, dynamic error pages (404, 403, 500), ApiError component with retry functionality.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with JSON responses
- **Middleware**: Logging, JSON parsing, error handling.
- **Authentication**: Express sessions stored in PostgreSQL using `connect-pg-simple`, bcrypt for password hashing (12 salt rounds), role-based access control. Comprehensive authentication security with session persistence and enterprise-grade case-insensitive email system. Secure token-based password reset with production domain URLs (cleanandflip.com).
- **Security**: OWASP Top 10 compliance, advanced security headers (`helmet.js`), multi-tier rate limiting, input validation and sanitization, atomic transaction management.
- **Performance**: Redis caching, Gzip compression, WebSocket for real-time updates, optimized PostgreSQL full-text search with GIN indexes, request consolidation middleware.

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