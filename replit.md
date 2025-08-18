# replit.md

## Overview
Clean & Flip is a production-hardened full-stack web application designed for the exchange of weightlifting equipment. It supports buying and selling gym gear, managing product catalogs, user authentication, shopping cart functionality, order processing, and administrative tools. The platform operates on a single-seller model, with administrators managing inventory and processing user submissions. The project emphasizes enterprise-grade production hardening through automatic migrations, environment validation, comprehensive data integrity constraints, and a streamlined onboarding process. Its vision is to create a robust and reliable marketplace for fitness enthusiasts.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built with React 18 and TypeScript. It uses Wouter for routing, TanStack Query for state management, and Radix UI primitives with shadcn/ui for UI components, focusing on a unified admin dashboard theme. Styling is handled by Tailwind CSS with CSS variables. Vite is used as the build system, and Framer Motion for animations. The architecture incorporates lazy loading, error boundaries, and responsive design for an optimized user experience.

### Backend Architecture
The server-side uses a layered REST API architecture built with Node.js and Express.js, leveraging TypeScript. Drizzle ORM is used for type-safe database operations. Authentication is managed via Passport.js for session-based authentication, with bcrypt for password hashing. Security middleware includes rate limiting, Zod schema-based input validation, and CORS protection. Multer handles image uploads. Performance optimizations include request consolidation, caching, database connection pooling, optimized queries with indexing, and gzip compression. Monitoring is supported by structured logging and a Local Error Tracking System (LETS). Real-time communication is handled by a typed WebSocket infrastructure with a singleton connection pattern, topic-based messaging, and role-based broadcasting, ensuring live updates across the admin dashboard.

### Data Storage Solutions
PostgreSQL is the primary database, utilizing Neon serverless PostgreSQL. The system employs strict environment-specific database URLs and rotated security credentials, with `DEV_DATABASE_URL` (lucky-poetry) for development and `PROD_DATABASE_URL` (muddy-moon) for production. Environment classification prevents cross-contamination between development and production databases, with critical safety guards in place. Drizzle Kit manages schema migrations. PostgreSQL's `tsvector` is used for full-text search, and session storage is database-backed. Key tables include users, products, categories, orders, cart items, and equipment submissions.

### Authentication and Authorization
The system employs a multi-layered security approach with Google OAuth integration and simplified role-based access control. Session-based authentication is provided via Passport.js, supporting both local strategy and Google OAuth2. bcrypt is used for password security. A two-role system (user/developer) is enforced through middleware. Session management is unified, and cart items persist across requests with automatic consolidation and stock validation. Security practices include security headers, input sanitization, SQL injection prevention, tiered rate limiting, and secure session management.

## External Dependencies

### Payment Processing
- **Stripe**: Integrated for payment processing, including Products API, Prices API, checkout sessions, and webhook handling.

### Cloud Services
- **Cloudinary**: Used for image storage and transformation.

### Database and Infrastructure
- **Neon**: Provides serverless PostgreSQL for the primary database.
- **Replit Database**: Used for provisioning and environment variable integration.

### Email Services
- **Resend**: Utilized for transactional email delivery.

### Development and Build Tools
- **ESBuild**: Server-side production build system.
- **TypeScript**: Enables full-stack type safety.
- **Drizzle Kit**: Manages database migrations.

## Recent Fixes and Improvements

✅ **COMPREHENSIVE DATABASE MANAGEMENT SYSTEM COMPLETED** - Full-stack database administration infrastructure:
- **INFRASTRUCTURE**: Complete database registry system with branch-aware connection pools (dev/prod isolation)
- **ADMIN TOOLS**: Enhanced database management with table inspection, schema visualization, SQL query execution
- **MIGRATION SYSTEM**: Professional migration management with node-pg-migrate integration and rollback protection
- **AUDIT TRAILS**: Complete admin action logging with audit tables (admin_actions, admin_checkpoints)
- **SECURITY**: Production-safe with confirmation phrases for destructive operations and role-based access control
- **UI**: Professional enhanced database tab with comprehensive features including query console and migration management
- **API ROUTES**: Full REST API for database operations at /api/admin/db/* with proper error handling
- **VERIFICATION**: Admin audit tables successfully created and migration system operational

✅ **DATABASE SCHEMA ERRORS COMPLETELY RESOLVED** - Fixed critical column missing error:
- **ROOT CAUSE**: products table missing continue_selling_when_out_of_stock boolean column
- **SOLUTION**: Created dual-database migration script adding column to both lucky-poetry and muddy-moon
- **FIXED**: /api/products/featured now returns 813 bytes of data instead of empty 2 bytes
- **SAFETY NET**: Added runtime schema verification with auto-repair in non-production
- **PUBLIC HEALTH**: Created authentication-free health endpoints (/api/healthz, /health, /api/admin/system/health)
- **VERIFICATION**: Both databases confirmed having boolean column with NOT NULL DEFAULT false

✅ **FOREIGN KEY CONSTRAINTS FIXED** - Resolved critical user deletion constraint violations:
- **ROOT CAUSE**: addresses_user_id_users_id_fk constraint preventing user deletion when addresses exist
- **SOLUTION**: Updated all user-related FK constraints (addresses, cart_items, orders) with CASCADE DELETE rules
- **FIXED**: User deletion now properly cascades to remove related addresses, cart items, and orders
- **SAFETY**: Both databases confirmed CASCADE DELETE rules working correctly
- **VERIFICATION**: All three main user relationship tables now have proper cascading deletion

✅ **GOOGLE OAUTH DOMAIN FIXED** - Corrected production redirect URLs:
- **ROOT CAUSE**: OAuth callbacks using replit.app domains instead of production domain
- **SOLUTION**: Updated all Google OAuth configurations to use cleanandflip.com in production
- **FIXED**: server/auth/google-strategy.ts, server/config/google.ts, and server/auth.ts now use correct domain
- **PRODUCTION**: Google OAuth will now redirect to https://cleanandflip.com/api/auth/google/callback
- **VERIFIED**: No more replit.app domain redirects for users in production

✅ **AUTHENTICATION & SESSION SYSTEM COMPLETELY REBUILT** - Eliminated "stuck on blank account" issue:
- **ROOT CAUSE**: Frontend cached stale user data while backend correctly logged out users
- **SOLUTION**: Unified session configuration, reliable logout, and fresh auth state management
- **NEW MIDDLEWARE**: session-config.ts with consistent cookie options and PostgreSQL store
- **UNIFIED AUTH**: auth-unified.ts with guest-safe /api/user (always 200) and reliable /api/logout
- **IMPROVED LOGGING**: auth-improved.ts with smart 401 handling (INFO for guests, WARN for issues)
- **FRONTEND HOOK**: use-auth-unified.tsx with staleTime:0 and proper cache invalidation
- **DATABASE SAFETY**: Confirmed lucky-poetry (dev) and muddy-moon (prod) environment isolation
- **SESSION SECURITY**: 30-day TTL, HttpOnly cookies, trust proxy for HTTPS, PostgreSQL persistence
- **VERIFIED**: No more "stuck account" states, clean authentication flow, reliable logout