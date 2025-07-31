# Clean & Flip - E-Commerce Marketplace

## Overview
Clean & Flip is a comprehensive weightlifting equipment marketplace facilitating the buying and selling of premium fitness equipment. It operates as a two-sided marketplace where users can sell used equipment or purchase verified gear. The business vision is to provide a trusted platform for fitness enthusiasts, leveraging a local business presence in Asheville, NC, to ensure quality and trust.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **Styling**: Tailwind CSS with custom dark theme and glass morphism design
- **UI Components**: Shadcn/ui built on Radix UI
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
- **UI/UX Design**: Dark theme with blue accent colors, glass morphism effects, Bebas Neue typography for headings, and a mobile-first responsive design. Professional aesthetic with a unified blue-gray color scheme. Minimal product card design focusing on essential information. Unified UI components for consistent functionality (e.g., `WishlistButton`, `AddToCartButton`).

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with JSON responses
- **Middleware**: Express middleware for logging, JSON parsing, and error handling.
- **Authentication**: Express sessions stored in PostgreSQL using `connect-pg-simple`. Uses bcrypt for password hashing (12 salt rounds) and role-based access control. Email-only authentication is simplified.
- **Security**: OWASP Top 10 compliance, advanced security headers (`helmet.js`), multi-tier rate limiting, input validation and sanitization (SQL injection, XSS prevention), atomic transaction management, and real-time monitoring.
- **Performance**: Redis caching layer for frequently accessed data (categories, featured/individual products), Gzip response compression, WebSocket for real-time updates (cart, wishlist, product modifications), and optimized PostgreSQL full-text search with GIN indexes.

### Data Storage
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Connection**: Connection pooling with `@neondatabase/serverless`
- **Schema**: Users, Products, Categories, Orders, Cart, Addresses, Equipment Submissions, Wishlist.
- **Scalability**: 22+ strategic PostgreSQL indexes for query performance improvement.

### Core Features
- **Product Catalog**: Browse, search, filter.
- **Shopping Cart**: Add/remove items, quantity management, persistent storage, stock validation, guest cart merging.
- **Checkout Flow**: Multi-step with Stripe payment integration.
- **User Dashboard**: Order history, submissions tracking, wishlist management.
- **Sell Equipment**: Form-based submission.
- **Admin Functions**: Product management, order processing, comprehensive developer dashboard with statistics, user management, and analytics.
- **Wishlist System**: User authentication required, real-time updates, duplicate prevention, and admin analytics dashboard.
- **Analytics System**: Real-time tracking of page views, user actions, and conversions via `activity_logs` table.

## External Dependencies
- **Payment Processing**: Stripe (for checkout and payment handling, customer management).
- **Database**: Neon PostgreSQL (serverless database).
- **File Storage**: Cloudinary (for image handling and transformations, configured for uploads up to 12MB and 12 images per product).
- **Redis**: For caching and performance optimization.