# Clean & Flip - E-Commerce Marketplace

## Overview
Clean & Flip is a comprehensive weightlifting equipment marketplace facilitating the buying and selling of premium fitness equipment. It operates as a two-sided marketplace where users can sell used equipment or purchase verified gear. The business vision is to provide a trusted platform for fitness enthusiasts, leveraging a local business presence in Asheville, NC, to ensure quality and trust.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, Vite
- **Routing**: Wouter
- **Styling**: Tailwind CSS with custom dark theme, glass morphism design, blue accent colors, Bebas Neue typography for headings, mobile-first responsive design, subtle hexagonal gym floor pattern, cross-grid athletic accents, and blue/green gradients.
- **UI Components**: Shadcn/ui built on Radix UI, unified UI components (e.g., `WishlistButton`, `AddToCartButton`), and a unified `Card` component system.
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation. Form fields use white text and placeholders with soft borders, smooth transitions, and backdrop blur effects.
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
- **Admin Functions**: Product management, order processing, comprehensive developer dashboard (including Products, Users, Analytics, Categories, Submissions, Wishlist, System management), user management, analytics, bulk operations, advanced filtering, sorting, and export functionality (CSV/PDF).
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

## Recent Form Styling Enhancements
✓ **Global Form Field Styling**: Comprehensive form styling system with consistent white text, elegant soft borders, and enhanced visibility
✓ **FOUC Prevention**: Added flash of unstyled content prevention with smooth page load transitions
✓ **Enhanced Visibility**: Upgraded input backgrounds to lighter gray-600 with improved opacity for better visibility against dark backgrounds
✓ **Professional Typography**: Applied medium font-weight to input text and enhanced label/helper text contrast for optimal readability
✓ **Layered Visual Effects**: Added subtle inner glows and enhanced box-shadows for professional depth and visual hierarchy
✓ **Unified Dropdown Styling**: Matched all dropdown, select, and combobox elements to input field styling for complete form consistency
✓ **Native Select Enhancement**: Styled native select elements with custom arrow icons and consistent appearance across browsers
✓ **Component Library Support**: Added comprehensive support for Radix UI, React Select, and other dropdown component libraries
✓ **Search Dropdown Z-Index Fix**: Enhanced search dropdown positioning with proper z-index layering and backdrop blur effects
✓ **Contact Page Quick Actions Removal**: Removed quick actions section from contact page and adjusted layout for better user experience  
✓ **Nuclear Search Dropdown Fix**: Implemented maximum z-index positioning with fixed layout and overflow visible enforcement across all parent containers