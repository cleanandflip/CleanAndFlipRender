# Clean & Flip - E-Commerce Marketplace

## Overview
Clean & Flip is a comprehensive two-sided e-commerce marketplace for buying and selling premium weightlifting equipment. The platform aims to provide a trusted environment for fitness enthusiasts, leveraging a local business presence in Asheville, NC, to ensure quality and trust. Key capabilities include a robust product catalog, secure shopping cart and checkout, user dashboards, and administrative functions for managing the marketplace.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, Vite
- **Routing**: Wouter
- **Styling**: Tailwind CSS with custom dark theme, glass morphism design, blue accent colors, Bebas Neue typography for headings, mobile-first responsive design. Implements an athletic weightlifting-themed background with hexagonal gym floor patterns and cross-grid accents.
- **UI Components**: Shadcn/ui built on Radix UI, unified UI components (e.g., `WishlistButton`, `AddToCartButton`). All form fields and text are consistently white for visibility on dark backgrounds, with soft borders and animated visual effects.
- **State Management**: TanStack Query (React Query) for efficient data fetching and cache management.
- **Form Handling**: React Hook Form with Zod validation.
- **Design Principles**: Professional aesthetic with a unified blue-gray color scheme, minimal product card design, unified dropdown theme with glass morphism and smart search. A global design system unifies all card components across the application.

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
- **Scalability**: 22+ strategic PostgreSQL indexes. Foreign key constraints are handled for data integrity, including cascade deletion logic for related items like wishlists and carts.

### Core Features
- **Product Catalog**: Browse, search, filter, with active/inactive toggles for product status.
- **Shopping Cart**: Add/remove items, quantity management, persistent storage, stock validation, guest cart merging.
- **Checkout Flow**: Multi-step with integrated payment processing.
- **User Dashboard**: Order history, submissions tracking, wishlist management.
- **Sell Equipment**: Form-based submission process.
- **Admin Functions**: Comprehensive unified dashboard system for product, user, analytics, category, submission, wishlist, and system management. Includes bulk operations, advanced filtering, sorting, and export functionality (CSV/PDF).
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
- **Location Services**: Geoapify (for address autocomplete).