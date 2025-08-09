# replit.md

## Overview

Clean & Flip is a weightlifting equipment exchange platform built as a full-stack web application. The system enables users to buy and sell gym equipment with features including product catalog management, user authentication, shopping cart functionality, order processing, and administrative tools. The application follows a single-seller model where the admin manages inventory and processes equipment submissions from users.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built with React 18 using TypeScript and leverages modern React patterns:
- **Framework**: React with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state with custom hooks for cart and authentication
- **UI Components**: Radix UI primitives with shadcn/ui design system and comprehensive unified admin dashboard with consistent theming across all components including AdminLayout, UnifiedMetricCard, UnifiedDataTable, and UnifiedButton
- **Styling**: Tailwind CSS with CSS variables for theming and scrollbar-hide utility for clean dropdown appearance
- **Build System**: Vite for fast development and optimized production builds
- **Animations**: Framer Motion for enhanced dropdown animations and transitions with portal-based rendering

The frontend implements lazy loading for non-critical pages, error boundaries for graceful error handling, and a responsive design optimized for both desktop and mobile experiences.

### Backend Architecture
The server-side follows a layered REST API architecture built with Node.js:
- **Framework**: Express.js with TypeScript for API endpoints
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with session-based authentication using bcrypt for password hashing
- **Security**: Comprehensive security middleware including rate limiting, input validation, and CORS protection
- **File Processing**: Multer for handling image uploads with Cloudinary integration for storage
- **Performance**: Request consolidation, caching layer, and database connection pooling

The API implements proper error handling, request validation using Zod schemas, and structured logging for monitoring and debugging.

### Data Storage Solutions
The application uses PostgreSQL as the primary database with the following key design decisions:
- **Database**: Neon serverless PostgreSQL for scalability and managed hosting
- **Schema Management**: Drizzle Kit for migrations and schema versioning
- **Connection Pooling**: Optimized connection pool configuration for performance
- **Full-Text Search**: PostgreSQL tsvector for advanced product search functionality
- **Session Storage**: Database-backed session storage for authentication persistence

Key tables include users, products, categories, orders, cart items, and equipment submissions with proper foreign key relationships and indexes.

### Authentication and Authorization
Multi-layered security approach with role-based access control:
- **User Authentication**: Session-based auth with Passport.js local strategy
- **Password Security**: bcrypt with industry-standard salt rounds (12)
- **Role Management**: Admin, developer, and user roles with middleware-enforced permissions
- **Rate Limiting**: Tiered rate limiting (general API, auth endpoints, admin operations)
- **Password Reset**: Secure token-based password recovery with email delivery
- **Session Management**: Secure session configuration with proper cookie settings

The system implements proper security headers, input sanitization, and SQL injection prevention.

## External Dependencies

### Payment Processing
- **Stripe**: Complete payment processing integration including Products API, Prices API, and checkout sessions
- **Webhook Handling**: Automated synchronization between internal catalog and Stripe product data

### Cloud Services
- **Cloudinary**: Image storage and transformation for product photos with upload optimization
- **Google Cloud Storage**: Alternative file storage option with proper service account authentication

### Database and Infrastructure
- **Replit Database**: Managed PostgreSQL database with automatic provisioning and secure environment variable integration
- **Redis** (Optional): Caching layer for improved performance with graceful degradation when unavailable

### Email Services
- **Resend**: Transactional email delivery for password resets, order confirmations, and system notifications
- **SendGrid**: Alternative email provider with comprehensive templating system

### Development and Build Tools
- **ESBuild**: Production build system for server-side code with optimized bundling
- **TypeScript**: Full-stack type safety with shared schemas between client and server
- **Drizzle Kit**: Database migration management and schema introspection tools

The application is designed to be deployed on cloud platforms like Google Cloud Run with proper health checks, graceful shutdown handling, and environment-specific configurations.

## Recent Changes (August 9, 2025)

### Complete Developer Dashboard Enhancement & Testing ✅
- **Enhanced Analytics Tab**: Comprehensive working analytics with inventory value ($1,899.93), product views (32 total), stock tracking (7 items)
- **Real Product Performance Charts**: Live bar charts showing product views with "Adjustable Dumbbell" (30 views) and "Olympic Barbell" (2 views)
- **Business Metrics Integration**: Total inventory value calculations, product performance tables with views/stock/pricing data
- **Professional Zero-State Handling**: Clear distinction between sales data (0 orders) and operational metrics (views, inventory, users)
- **All API Endpoints Verified**: Analytics, Products, Users, Categories, Stripe, Submissions, and System Health all returning authentic data
- **WebSocket Live Sync**: Real-time updates functioning across all admin components with proper connection management
- **Complete Data Authentication**: 100% elimination of mock data - all 7 admin tabs display live database and API data exclusively
- **System Health Monitoring**: Database connectivity, memory usage, storage status, and performance metrics all operational

### Image Modal UI Fixes & Positioning Improvements  
- **Fixed Modal Overflow**: Resolved modal cut-off issues by constraining images to 85vh max height
- **Consistent Modal Centering**: Modal position now stable regardless of image dimensions using proper flex layout
- **Navigation Arrow Alignment**: Fixed arrow positioning using fixed positioning instead of absolute for consistent placement
- **Prevented Text Cut-Off**: Help text now always visible at bottom with proper fixed positioning and z-index
- **Added Max Height Constraints**: Images properly contained within viewport with overflow-hidden on modal container
- **Enhanced Mobile Support**: Responsive padding (p-4 md:p-8) for better experience across screen sizes
- **Improved Click-Outside**: Restructured modal DOM to ensure click-outside detection works in all areas
- **Better Control Positioning**: Close button, arrows, and dots now use fixed positioning for consistent placement

### Navigation Dropdown Complete Implementation & Fixes
- **Fixed Double Border Issue**: Resolved persistent double border problem by matching user button styling exactly to cart button
- **Working Dropdown Functionality**: Fixed broken click handler by correcting click-outside detection to use dropdownRef instead of class selector
- **Theme-Consistent Avatar**: Changed user avatar from gradient to simple gray background matching site theme
- **Professional Styling**: Applied glass-morphism background, proper z-index (9999), and consistent border styling
- **Enhanced User Experience**: Added event.stopPropagation() to prevent event bubbling and proper state management
- **Clean UI Design**: Minimal user button with icon and chevron, dropdown with user info section and menu items
- **Developer Access**: Maintained conditional developer dashboard access with purple accent styling
- **Click-Outside Functionality**: Implemented proper dropdown closing with timeout delay to prevent immediate close
- **Enhanced Hover Visibility**: Increased hover background opacity from 5% to 15-20% with text and icon color transitions

### Complete Live Sync Implementation Across Platform
- **WebSocket Integration**: Added WebSocket hook to home page for real-time product updates in "Latest Activity" section
- **Featured Products Display**: Fixed missing products in Latest Activity by marking products as featured in database
- **Live Status Indicator**: Added visual WebSocket connection status indicator with green/red dot
- **Cross-Platform Sync**: Ensured product updates broadcast correctly from admin dashboard to all pages
- **Event Handling**: Implemented both WebSocket messages and legacy event listeners for comprehensive coverage
- **Real-Time Updates**: Home page now receives instant product updates when admin makes changes
- **Query Invalidation**: Added proper React Query cache invalidation for seamless data refresh

### Comprehensive System Overhaul: Live Sync & Perfect Animations (Previous)
- **Live WebSocket Integration**: Complete real-time synchronization system across all admin components
- **Enhanced Modal System**: Professional modals with live sync broadcasting for Products, Categories, Users, and Submissions
- **Beautiful Sync Animations**: Custom keyframe animations (fadeIn, slideUp, scaleIn, shimmer, syncPulse, liveSync)
- **Stripe Tab Overhaul**: Animated sync button with progress stages, live connection status, and real-time transaction updates
- **Role Simplification**: Streamlined user roles to just 'user' and 'developer' for cleaner access control
- **WebSocket Features**: 
  - Real-time notifications for data updates
  - Live connection status indicators
  - Automatic reconnection with visual feedback
  - Cross-client synchronization for all CRUD operations
- **Advanced Animations**: Progress bars with glow effects, modal transitions, table row updates, metric card animations
- **Enhanced UX**: Sync stage indicators, connection status animations, notification slides with professional styling
- **CSS Animation System**: Comprehensive animation framework with utility classes for consistent motion design
- **System Cleanup**: Removed all wishlist functionality - not needed for single-seller marketplace model

### Complete Admin Dashboard Rebuild - Unified UI System (Previous)
- **Architectural Change**: Completely rebuilt admin dashboard with unified component architecture
- **New Components**: Created AdminLayout, UnifiedMetricCard, UnifiedDataTable, UnifiedButton for consistent theming
- **Tab System**: Implemented 7 unified admin tabs (Products, Analytics, Categories, Users, System, Stripe, Submissions)
- **Dark Theme**: Applied comprehensive dark theme (#0f172a background) with consistent styling across all admin components
- **Data Visualization**: Integrated Recharts library for professional analytics charts and graphs
- **Navigation**: Unified tab-based navigation with blue accent colors and smooth transitions
- **Performance**: Maintained lazy loading and React Query optimization for all admin data fetching
- **User Experience**: Consistent search, filtering, pagination, and action buttons across all data tables

The enhanced modal system provides a professional e-commerce management experience with comprehensive features for product, category, user, and submission management across the Clean & Flip platform.