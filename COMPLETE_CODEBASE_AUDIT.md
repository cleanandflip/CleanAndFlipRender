# Complete Codebase Audit - Clean & Flip

**Generated:** August 15, 2025  
**Project:** Clean & Flip - Full-Stack E-Commerce Platform for Weightlifting Equipment  
**Architecture:** Node.js/Express + React/TypeScript + PostgreSQL  

## Project Overview

Clean & Flip is a comprehensive e-commerce platform for buying and selling weightlifting equipment. It features advanced locality-based cart management, intelligent product fulfillment, robust stock validation, and consolidated cart functionality.

### Key Technologies
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (Neon serverless)
- **ORM:** Drizzle ORM + Drizzle Kit
- **Authentication:** Passport.js (Local + Google OAuth)
- **Payments:** Stripe integration
- **Real-time:** WebSocket (Socket.io)
- **Styling:** Tailwind CSS + shadcn/ui
- **File Storage:** Cloudinary
- **Email:** Resend

## Complete File Structure

### Root Directory
```
├── .env                          # Environment variables (development)
├── .env.example                  # Environment template
├── .env.production.template      # Production environment template
├── .eslintrc.cjs                 # ESLint configuration
├── .gitignore                    # Git ignore rules
├── .replit                       # Replit configuration
├── components.json               # shadcn/ui components config
├── cookies.txt                   # Cookie testing artifacts
├── drizzle.config.ts            # Drizzle ORM configuration
├── package-lock.json            # NPM lockfile
├── package.json                 # NPM dependencies & scripts
├── postcss.config.js            # PostCSS configuration
├── replit.md                    # Project documentation & architecture
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── vite.config.ts               # Vite build configuration
```

### Documentation & Audit Files
```
├── COMPLETE_CODEBASE_DOCUMENTATION.md        # Legacy documentation
├── DEPLOYMENT_GUIDE.md                       # Deployment instructions
├── FINAL_PRODUCTION_TEST_VERIFICATION.md     # Production testing results
├── PERFORMANCE_OPTIMIZATION_COMPLETE.md      # Performance optimization log
├── PRODUCTION_TEST_RESULTS.md               # Production test results
├── SSOT_ADDRESS_SYSTEM_IMPLEMENTATION.md    # Address system documentation
├── SSOT_LOCKDOWN_COMPLETE.md               # SSOT implementation log
├── ULTIMATE_COMPREHENSIVE_CODEBASE_DOCUMENTATION.md # Comprehensive docs
└── UNIFIED_LOCAL_DELIVERY_SYSTEM.md         # Local delivery system docs
```

### Frontend Structure (`client/`)
```
client/
├── index.html                   # HTML entry point
├── public/                      # Static assets
└── src/
    ├── App.tsx                  # Main React application
    ├── index.css                # Global styles & Tailwind imports
    ├── main.tsx                 # React entry point
    ├── vite-env.d.ts           # Vite type definitions
    ├── components/
    │   ├── ui/                  # shadcn/ui base components
    │   │   ├── accordion.tsx
    │   │   ├── alert-dialog.tsx
    │   │   ├── aspect-ratio.tsx
    │   │   ├── avatar.tsx
    │   │   ├── badge.tsx
    │   │   ├── button.tsx
    │   │   ├── calendar.tsx
    │   │   ├── card.tsx
    │   │   ├── carousel.tsx
    │   │   ├── checkbox.tsx
    │   │   ├── collapsible.tsx
    │   │   ├── dialog.tsx
    │   │   ├── drawer.tsx
    │   │   ├── dropdown-menu.tsx
    │   │   ├── form.tsx
    │   │   ├── hover-card.tsx
    │   │   ├── input-otp.tsx
    │   │   ├── input.tsx
    │   │   ├── label.tsx
    │   │   ├── menubar.tsx
    │   │   ├── navigation-menu.tsx
    │   │   ├── popover.tsx
    │   │   ├── progress.tsx
    │   │   ├── radio-group.tsx
    │   │   ├── resizable.tsx
    │   │   ├── scroll-area.tsx
    │   │   ├── select.tsx
    │   │   ├── separator.tsx
    │   │   ├── sheet.tsx
    │   │   ├── skeleton.tsx
    │   │   ├── slider.tsx
    │   │   ├── switch.tsx
    │   │   ├── table.tsx
    │   │   ├── tabs.tsx
    │   │   ├── textarea.tsx
    │   │   ├── toast.tsx
    │   │   ├── toaster.tsx
    │   │   ├── toggle-group.tsx
    │   │   ├── toggle.tsx
    │   │   └── tooltip.tsx
    │   ├── layout/
    │   │   ├── footer.tsx         # Site footer
    │   │   ├── header.tsx         # Site header
    │   │   └── navigation.tsx     # Main navigation
    │   ├── cart/
    │   │   ├── cart-drawer.tsx    # Cart sidebar
    │   │   └── cart-item.tsx      # Cart item component
    │   ├── admin/
    │   │   ├── admin-layout.tsx   # Admin dashboard layout
    │   │   ├── admin-sidebar.tsx  # Admin navigation
    │   │   ├── category-form.tsx  # Category management
    │   │   ├── product-form.tsx   # Product management
    │   │   └── user-management.tsx # User management
    │   ├── locality/
    │   │   ├── AddressForm.tsx    # Address input form
    │   │   ├── LocalityBadge.tsx  # Locality status indicator
    │   │   └── ProductAvailabilityChip.tsx # Product availability
    │   ├── products/
    │   │   ├── ProductCard.tsx    # Product display card
    │   │   ├── ProductGrid.tsx    # Product listing grid
    │   │   └── ProductModal.tsx   # Product detail modal
    │   ├── AddToCartButton.tsx    # Add to cart functionality
    │   ├── AuthDialog.tsx         # Authentication modal
    │   ├── ErrorBoundary.tsx      # React error boundary
    │   ├── LoadingSpinner.tsx     # Loading indicator
    │   └── ProtectedRoute.tsx     # Route protection
    ├── hooks/
    │   ├── use-auth.ts           # Authentication hook
    │   ├── use-toast.ts          # Toast notifications
    │   ├── useCart.ts            # Cart management
    │   ├── useLocality.ts        # Locality checking
    │   └── useWebSocketState.tsx  # WebSocket connection
    ├── lib/
    │   ├── api.ts                # API client utilities
    │   ├── cartKeys.ts           # React Query cache keys
    │   ├── queryClient.ts        # TanStack Query configuration
    │   ├── utils.ts              # General utilities
    │   └── locality.ts           # Locality utilities
    └── pages/
        ├── admin/
        │   ├── categories.tsx     # Category management page
        │   ├── dashboard.tsx      # Admin dashboard
        │   ├── orders.tsx         # Order management
        │   ├── products.tsx       # Product management
        │   └── users.tsx          # User management
        ├── auth/
        │   ├── login.tsx          # Login page
        │   ├── register.tsx       # Registration page
        │   └── reset-password.tsx # Password reset
        ├── cart.tsx               # Cart page
        ├── checkout.tsx           # Checkout process
        ├── contact.tsx            # Contact page
        ├── home.tsx               # Homepage
        ├── legal/
        │   ├── privacy.tsx        # Privacy policy
        │   └── terms.tsx          # Terms of service
        ├── products.tsx           # Product listing
        ├── profile.tsx            # User profile
        └── sell.tsx               # Equipment submission
```

### Backend Structure (`server/`)
```
server/
├── index.ts                     # Server entry point
├── auth.ts                      # Authentication configuration
├── routes.ts                    # Main route configuration
├── storage.ts                   # Database interface layer
├── vite.ts                      # Vite integration
├── websocket.ts                 # WebSocket server
├── @types/
│   └── compression.d.ts         # Type definitions
├── middleware/
│   ├── auth.ts                  # Authentication middleware
│   ├── ensureSession.ts         # Session management
│   ├── errorHandler.ts          # Error handling
│   ├── inputSanitization.ts     # Input validation
│   ├── performance.ts           # Performance monitoring
│   ├── rateLimiting.ts          # Rate limiting
│   ├── requestLogging.ts        # Request logging
│   ├── security.ts              # Security headers
│   └── transactionMiddleware.ts # Database transactions
├── routes/
│   ├── addresses.ts             # Address management API
│   ├── admin.ts                 # Admin API endpoints
│   ├── auth.ts                  # Authentication routes
│   ├── cart.ts                  # Legacy cart routes (deprecated)
│   ├── cart.v2.ts              # Current cart API
│   ├── cart-validation.ts       # Cart validation
│   ├── categories.ts            # Category management
│   ├── checkout.ts              # Checkout processing
│   ├── google-auth.ts           # Google OAuth
│   ├── locality.ts              # Locality checking
│   ├── observability.ts         # Health checks
│   ├── orders.ts                # Order management
│   ├── products.ts              # Product management
│   ├── shipping.ts              # Shipping quotes
│   ├── stripe-webhooks.ts       # Stripe webhook handling
│   └── users.ts                 # User management
├── services/
│   ├── cartGuard.ts            # Cart protection
│   ├── cartMigrate.ts          # Cart migration
│   ├── cartService.ts          # Cart business logic
│   ├── email.ts                # Email services
│   ├── errorLogger.ts          # Error logging
│   ├── globalErrorCatcher.ts   # Global error handling
│   ├── locality.ts             # Locality services
│   ├── localityService.ts      # Locality checking
│   ├── localService.ts         # Local delivery
│   ├── performanceMonitor.ts   # Performance tracking
│   ├── simple-password-reset.ts # Password reset
│   ├── stockService.ts         # Stock management
│   ├── stripe-sync.ts          # Stripe synchronization
│   └── systemMonitor.ts        # System monitoring
└── utils/
    ├── auth.ts                 # Auth utilities
    ├── cartOwner.ts            # Cart ownership
    ├── email.ts                # Email utilities
    ├── exportHelpers.ts        # Export utilities
    ├── fulfillment.ts          # Fulfillment logic
    ├── input-sanitization.ts   # Input sanitization
    ├── logger.ts               # Logging utilities
    ├── monitoring.ts           # Monitoring utilities
    ├── production-ready-email.ts # Production email
    ├── referenceGenerator.ts   # Reference generation
    ├── safe-query.ts           # Safe database queries
    └── startup-banner.ts       # Server startup banner
```

### Shared Code (`shared/`)
```
shared/
├── availability.ts              # Product availability logic
├── fulfillment.ts              # Fulfillment mode logic
├── geo.ts                      # Geographic utilities
├── locality.ts                 # Locality checking utilities
├── schema.ts                   # Database schema (Drizzle)
├── utils.ts                    # Shared utilities
├── schemas/
│   └── address.ts              # Address validation schemas
└── types/
    └── search.ts               # Search type definitions
```

### Scripts Directory (`scripts/`)
```
scripts/
├── db-migration.ts             # Database migration scripts
├── seed-data.ts                # Database seeding
└── test-data-generator.ts      # Test data generation
```

### Source Directory (`src/`)
```
src/
├── lib/
│   ├── cartKeys.ts             # Cart cache keys
│   └── locality.ts             # Locality utilities
└── utils/
    └── distance.ts             # Distance calculations
```

### Audit Directory (`audit/`)
```
audit/
├── locality-fetch-bypass.rg.txt      # Locality bypass audit
├── locality-offenders.rg.txt         # Locality violation audit
├── locality-ssot-allowlist.json      # SSOT allowlist
├── locality-ssot-report.json         # SSOT compliance report
└── locality-ui-touchpoints.rg.txt    # UI touchpoint audit
```

### Attached Assets (`attached_assets/`)
```
attached_assets/
├── [Multiple text files with development notes and fixes]
└── [Multiple PNG image files for documentation and debugging]
```

## Architecture Overview

### Database Schema (PostgreSQL)
The database uses Drizzle ORM with the following key tables:

**Core Tables:**
- `users` - User accounts and authentication
- `addresses` - User addresses for delivery
- `sessions` - Session storage for authentication
- `activity_logs` - User activity tracking

**Product Management:**
- `products` - Product catalog
- `categories` - Product categories
- `equipment_submissions` - User equipment submissions

**E-commerce:**
- `cart_items` - Shopping cart items
- `orders` - Order records
- `order_items` - Order line items

**System:**
- `error_logs` - Application error logging
- `stripe_events` - Stripe webhook events

### Key Architectural Patterns

**1. Single Source of Truth (SSOT)**
- Centralized locality checking via `shared/locality.ts`
- Unified cart management through `server/routes/cart.v2.ts`
- Consistent session handling across the platform

**2. Type Safety**
- Full TypeScript implementation
- Shared types between client and server
- Drizzle ORM for type-safe database operations

**3. Security**
- Multiple middleware layers for security
- Input sanitization and validation
- Rate limiting and CSRF protection
- Secure session management

**4. Performance**
- Optimized database queries with indexing
- Request caching and consolidation
- WebSocket for real-time updates
- Lazy loading and code splitting

**5. Error Handling**
- Global error catching and logging
- React error boundaries
- Comprehensive error reporting
- Graceful degradation

## Development Workflow

### Build Process
1. **Development:** `npm run dev` - Starts both frontend (Vite) and backend (tsx)
2. **Database:** `npm run db:push` - Applies schema changes
3. **Production:** `npm run build` - Builds optimized production bundle

### Key Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run db:push` - Database schema sync
- `npm run db:studio` - Database management UI

### Environment Configuration
- **Development:** Uses local `.env` file
- **Production:** Uses Replit environment variables
- **Database:** Neon PostgreSQL with automatic connection pooling

## Security Features

### Authentication
- Passport.js with local and Google OAuth strategies
- bcrypt password hashing with 12 salt rounds
- Session-based authentication with PostgreSQL storage
- Secure session cookies with proper flags

### Data Protection
- Input sanitization with DOMPurify
- SQL injection prevention via Drizzle ORM
- XSS protection middleware
- CSRF protection
- Rate limiting on API endpoints

### Infrastructure Security
- HTTPS enforcement in production
- Secure headers middleware
- CORS configuration
- Environment variable protection

## Performance Optimizations

### Frontend
- React Query for efficient data fetching and caching
- Lazy loading of routes and components
- Optimized bundle splitting with Vite
- Image optimization via Cloudinary

### Backend
- Connection pooling for database
- Request consolidation to prevent duplicate queries
- Gzip compression middleware
- Optimized database indexes

### Database
- Strategic indexing on frequently queried columns
- Bulk operations for cart management
- Efficient pagination for large datasets
- Query optimization with Drizzle ORM

## Testing & Quality Assurance

### Code Quality
- ESLint configuration for code standards
- TypeScript for compile-time error checking
- Comprehensive error logging and monitoring

### Performance Monitoring
- Request duration tracking
- Memory usage monitoring
- Database query performance analysis
- Real-time WebSocket connection monitoring

## Deployment & Infrastructure

### Hosting
- **Platform:** Replit for development and staging
- **Database:** Neon serverless PostgreSQL
- **File Storage:** Cloudinary for images
- **Email:** Resend for transactional emails
- **Payments:** Stripe for payment processing

### Environment Management
- Development environment with hot reloading
- Environment variable management
- Automated database migrations
- Health check endpoints for monitoring

## Recent Major Changes

### Session & Cart Management (August 2025)
- Implemented unified session management using express-session
- Fixed cart persistence issues for guest users
- Added cart migration service for legacy session handling
- Removed authentication requirement for cart operations

### Locality System Implementation
- Created Single Source of Truth (SSOT) for locality checking
- Implemented ZIP-based delivery area validation
- Added comprehensive fulfillment mode system
- Integrated locality checking across all product operations

### WebSocket Integration
- Implemented real-time updates for admin operations
- Added typed WebSocket message contracts
- Created singleton WebSocket connection pattern
- Integrated live updates across all CRUD operations

## Dependencies Summary

### Major Frontend Dependencies
- React 18 + TypeScript
- TanStack Query for state management
- Wouter for routing
- Tailwind CSS + shadcn/ui for styling
- Framer Motion for animations

### Major Backend Dependencies
- Express.js with TypeScript
- Drizzle ORM + Drizzle Kit
- Passport.js for authentication
- Socket.io for WebSocket
- Stripe for payments

### Development Tools
- Vite for build system
- ESLint for code quality
- tsx for TypeScript execution
- Various @types packages for TypeScript support

This audit represents the complete current state of the Clean & Flip codebase as of August 15, 2025, including all recent fixes and optimizations.