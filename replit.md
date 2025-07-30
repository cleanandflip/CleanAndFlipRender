# Clean & Flip - E-Commerce Marketplace

## Overview

Clean & Flip is a comprehensive weightlifting equipment marketplace that facilitates buying and selling of premium fitness equipment. The application provides a two-sided marketplace where users can either sell their used equipment for cash or purchase verified quality gear from a trusted local business in Asheville, NC.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with custom dark theme and glass morphism design
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with JSON responses
- **Middleware**: Express middleware for request logging, JSON parsing, and error handling

### Data Storage Solutions
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Connection**: Connection pooling with @neondatabase/serverless
- **Schema**: Centralized schema definitions in shared directory

### Authentication and Authorization
- **Session Management**: Express sessions stored in PostgreSQL using connect-pg-simple
- **User System**: User table with profile information, admin flags, and Stripe integration
- **Temporary Auth**: Currently uses mock user IDs for development (to be replaced)

### External Service Integrations
- **Payment Processing**: Stripe integration for checkout and payment handling
- **File Storage**: Prepared for image upload functionality (implementation pending)

## Key Components

### Database Schema
- **Users**: Profile management with Stripe customer integration
- **Products**: Equipment catalog with categories, conditions, pricing, and inventory
- **Categories**: Hierarchical product categorization
- **Orders**: Complete order management with status tracking
- **Cart**: Shopping cart functionality with user sessions
- **Addresses**: User shipping and billing address management
- **Equipment Submissions**: Sell-to-us form submissions for equipment evaluation
- **Wishlist**: User product favorites and saved items

### Core Features
- **Product Catalog**: Browse, search, and filter weightlifting equipment
- **Shopping Cart**: Add/remove items, quantity management, persistent storage
- **Checkout Flow**: Multi-step checkout with Stripe payment integration
- **User Dashboard**: Order history, submissions tracking, wishlist management
- **Sell Equipment**: Form-based submission system for equipment selling
- **Admin Functions**: Product management and order processing capabilities

### UI/UX Design
- **Theme**: Dark theme with blue accent colors and glass morphism effects
- **Typography**: Bebas Neue for headings, system fonts for body text
- **Responsive**: Mobile-first design with breakpoint-based layouts
- **Components**: Reusable glass card components and consistent styling patterns

## Data Flow

### Product Discovery
1. Users browse products via category or search
2. Filter sidebar applies real-time filtering
3. Product grid displays results with pagination
4. Individual product pages show detailed information

### Purchase Flow
1. Users add products to cart (stored in database)
2. Cart drawer provides quick access and modification
3. Checkout page collects shipping and payment information
4. Stripe processes payment and creates order record
5. Order confirmation and tracking information provided

### Selling Flow
1. Users submit equipment details via sell-to-us form
2. Submissions stored for business review and evaluation
3. Business contacts users with offers
4. Accepted offers result in equipment pickup and payment

## External Dependencies

### Payment Processing
- **Stripe**: Full payment processing including customer management and subscriptions
- **Environment Variables**: STRIPE_SECRET_KEY and VITE_STRIPE_PUBLIC_KEY required

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Connection**: DATABASE_URL environment variable required
- **WebSocket Support**: Configured for real-time database connections

### Development Tools
- **Replit Integration**: Configured with replit-specific plugins and error handling
- **Development Server**: Hot module replacement and development middleware

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React application to dist/public
- **Backend**: esbuild bundles Express server to dist/index.js
- **Assets**: Static file serving for production builds

### Environment Configuration
- **Development**: NODE_ENV=development with Vite dev server
- **Production**: NODE_ENV=production with static file serving
- **Database**: Requires provisioned PostgreSQL database with connection string

### Scaling Considerations
- **Database**: Configured for serverless PostgreSQL (Neon)
- **File Storage**: Prepared for external storage service integration
- **CDN**: Static assets can be served from CDN in production
- **Load Balancing**: Express server can be horizontally scaled behind load balancer

### Security Measures
- **Environment Variables**: Sensitive configuration stored in environment
- **CORS**: Configurable for production domain restrictions
- **Session Security**: Secure session configuration with database storage
- **Input Validation**: Zod schemas for comprehensive input validation

## Recent Progress (July 30, 2025)

### Critical Database & Authentication Fixes - Complete System Stabilization
- ✅ **Enhanced Database Connection Handling**: Implemented robust connection pooling with automatic retry logic
- ✅ **Connection Termination Recovery**: Added error handling for Neon "57P01" connection termination errors
- ✅ **Keep-Alive System**: Prevents connection timeouts with 60-second heartbeat queries
- ✅ **Exponential Backoff Retry**: Automatic reconnection with progressive delay on failures
- ✅ **Graceful Shutdown Handling**: Proper cleanup on SIGTERM/SIGINT signals
- ✅ **Enhanced Error Logging**: Detailed logging for all database operations and authentication attempts
- ✅ **Case-Insensitive Authentication**: Complete email normalization across login/registration flows
- ✅ **Utility Functions Library**: Centralized normalization functions for email, search, and address handling

### Database Infrastructure Improvements
- ✅ **Connection Pool Configuration**: Max 20 connections, 30s idle timeout, 10s connection timeout
- ✅ **WebSocket Optimization**: Disabled pipeline connect, enabled secure WebSocket for Neon
- ✅ **Query Timeout Protection**: 30-second statement and query timeouts
- ✅ **Automatic Pool Recreation**: Intelligent pool replacement on connection failures
- ✅ **Connection State Monitoring**: Real-time pool error and connection event handling

### Authentication System Hardening
- ✅ **Email Normalization**: All emails stored and compared in lowercase with trimming
- ✅ **Case-Insensitive SQL Queries**: LOWER() function usage for all email comparisons
- ✅ **Enhanced Password Security**: bcrypt with 12 salt rounds maintained
- ✅ **Detailed Authentication Logging**: Login/registration attempts tracked for debugging
- ✅ **Frontend Email Normalization**: Client-side email processing before API calls

## Recent Progress (July 30, 2025)

### Streamlined Authentication UX + Enhanced Security System
- ✅ **Simplified Registration Form**: Condensed from complex multi-section layout to clean single-column form
- ✅ **Smart Password Validation**: Real-time border color feedback, requirements shown only on focus
- ✅ **Collapsible Security Information**: Moved detailed security info to expandable section at form bottom
- ✅ **Enhanced Password Security**: bcrypt hashing with 12 salt rounds, industry-standard encryption
- ✅ **Comprehensive Address Collection**: Street address and city/state/ZIP with format validation
- ✅ **Local Customer Detection**: Automatic identification of Asheville, NC area customers (15 ZIP codes)
- ✅ **Professional Form Design**: Clean inputs, consistent spacing, mobile-friendly layout
- ✅ **Visual Validation Feedback**: Green/red border colors, inline error messages, password matching
- ✅ **Session Management**: Fixed PostgreSQL session storage for stable authentication
- ✅ **Email-Only Authentication**: Simplified login using email as primary credential

### Complete UI/UX Redesign - Professional Clean & Flip Theme
- ✅ **Auth Pages Redesigned**: Complete two-column layout with professional glass morphism forms
- ✅ **Navigation Header Optimized**: Reduced width, cleaner spacing, better login/logout visibility
- ✅ **Smooth Animations**: Added focus states, hover effects, and transition animations throughout
- ✅ **Form Organization**: Compact, clean layout with proper spacing and typography hierarchy
- ✅ **Professional Color Scheme**: Consistent Clean & Flip branding (no pink/purple elements)
- ✅ **Glass Morphism Effects**: Applied throughout auth pages and navigation components

### Complete Database Deployment - Fresh Neon Setup
- ✅ **Fresh Database Deployment**: New Neon PostgreSQL database connected and fully operational
- ✅ **Schema Push Complete**: All 10+ tables deployed with proper constraints and relations
- ✅ **Enhanced User Schema**: Added address, cityStateZip, isLocalCustomer fields
- ✅ **Session Storage**: Proper PostgreSQL session management with connect-pg-simple
- ✅ **Comprehensive Product Catalog**: 12 authentic weightlifting products across 6 categories
- ✅ **API Integration Verified**: All CRUD endpoints working with live database
- ✅ **Stripe Integration Active**: Payment processing tested and operational with latest API version

### Technical Infrastructure Complete
- ✅ **DatabaseStorage**: Full implementation with comprehensive CRUD operations for all entities
- ✅ **API Endpoints**: Complete REST API for products, categories, cart, orders, wishlist, submissions
- ✅ **Payment Processing**: Stripe integration with latest API version (2025-06-30.basil)
- ✅ **Enhanced Authentication**: bcrypt password hashing, session management, role-based access
- ✅ **Security Components**: PasswordStrengthMeter, PasswordInput, SecurityNotice components
- ✅ **Address Validation**: City/State/ZIP format validation and local area detection
- ✅ **Error-Free Code**: All TypeScript compilation issues resolved

### Comprehensive Product Catalog (12 Products)
**Featured Items ($3,439 total value):**
- Concept2 RowErg ($900) - Olympic-grade rowing machine
- Rogue R-3 Power Rack ($695) - Heavy-duty home gym rack  
- Rogue Echo Bike ($695) - High-intensity cardio equipment
- Bumper Plate Set 260lbs ($520) - Professional Olympic plates
- Rogue Ohio Power Bar ($395) - Gold standard powerlifting bar
- Bowflex SelectTech 552 ($329) - Space-saving adjustable dumbbells

**Complete Inventory by Category:**
- **Barbells (2)**: Rogue Ohio Power Bar, Texas Deadlift Bar
- **Plates (2)**: Bumper Plate Set, Iron Olympic Plates  
- **Racks & Stands (2)**: Rogue R-3, Rep PR-1100 Power Rack
- **Dumbbells (2)**: PowerBlock Sport 24, Bowflex SelectTech 552
- **Benches (2)**: Rep AB-3000, Rogue Flat Utility Bench
- **Accessories (2)**: Concept2 RowErg, Rogue Echo Bike

### Integration Status
- ✅ **Neon PostgreSQL**: Clean database with authentic weightlifting equipment data
- ✅ **Stripe Payments**: API keys configured, payment intents tested successfully
- ✅ **API Endpoints**: All 15+ endpoints operational (products, cart, orders, submissions, wishlist)
- ✅ **Cart System**: Database-persistent shopping cart functionality
- ✅ **Product Management**: Full CRUD operations with categories, filtering, search
- ✅ **Order Processing**: Complete order management system ready for checkout flow