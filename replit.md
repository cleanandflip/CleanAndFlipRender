# replit.md

## Overview
Clean & Flip is a production-hardened full-stack web application for exchanging weightlifting equipment. It offers features for buying and selling gym gear, including product catalog management, user authentication, a shopping cart, order processing, and administrative tools. The platform operates on a single-seller model, with admin managing inventory and processing user submissions. The project features enterprise-grade production hardening with automatic migrations, environment validation, complete onboarding system removal, and comprehensive data integrity constraints.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built with React 18, TypeScript, and leverages modern React patterns. Key decisions include:
- **Framework**: React with TypeScript.
- **Routing**: Wouter.
- **State Management**: TanStack Query.
- **UI Components**: Radix UI primitives with shadcn/ui design system, emphasizing a comprehensive and unified admin dashboard theming.
- **Styling**: Tailwind CSS with CSS variables.
- **Build System**: Vite.
- **Animations**: Framer Motion.
- **UX**: Implements lazy loading, error boundaries, and responsive design.

### Backend Architecture
The server-side uses a layered REST API architecture built with Node.js:
- **Framework**: Express.js with TypeScript.
- **Database ORM**: Drizzle ORM for type-safe operations.
- **Authentication**: Passport.js for session-based authentication with bcrypt for password hashing.
- **Security**: Comprehensive middleware including rate limiting, input validation (Zod schemas), and CORS protection.
- **File Processing**: Multer for image uploads.
- **Performance**: Request consolidation, caching, and database connection pooling, optimized queries with strategic indexing, bulk operations, fire-and-forget activity tracking, intelligent slow request detection thresholds, and gzip compression middleware.
- **Monitoring**: Structured logging and a comprehensive Local Error Tracking System (LETS) for production-ready error monitoring.

### Data Storage Solutions
PostgreSQL is the primary database, utilizing:
- **Database**: Neon serverless PostgreSQL with strict environment-specific database URLs and rotated security credentials.
- **Environment Configuration**: Environment-specific secrets system with DEV_APP_ENV/PROD_APP_ENV controlling database selection. DEV_DATABASE_URL (lucky-poetry) for development, PROD_DATABASE_URL (muddy-moon) for production.
- **Database Lockdown**: Complete environment isolation achieved (2025-08-18). All hardcoded database references removed. Development uses lucky-poetry exclusively, production uses muddy-moon exclusively. Cross-contamination is impossible.
- **Production Safety**: Critical safety guards implemented in server/index.ts block wrong database usage. Production deployment will fail-fast if attempting to use development database. Environment detection and database selection verified as bulletproof.
- **Google Auth Schema**: Both databases synchronized with complete Google OAuth schema including google_sub, google_email, google_email_verified, google_picture, and last_login_at columns (2025-08-18). Development database (lucky-poetry) and production database (muddy-moon) now have identical schemas for seamless environment switching.
- **Schema Management**: Drizzle Kit for migrations with automatic retry logic and environment-aware configuration, production-controlled migration system.
- **Search**: PostgreSQL tsvector for full-text search.
- **Session Storage**: Database-backed session storage with environment-aware configuration.
- **Schema**: Key tables include users, products, categories, orders, cart items, and equipment submissions with proper relationships. Legacy columns (profile_address_id, onboarding_completed_at) have been retired.
- **Safety Guards**: Enterprise-grade multi-layered production database validation with complete environment isolation using EXPECTED_DB_HOST validation. Environment classification prevents cross-contamination between development and production databases.
- **Security**: Complete DATABASE_URL elimination achieved (2025-08-17) with rotated database passwords, environment-specific secrets classification (2025-08-18), and pooled connections for maximum security. All lingering-flower references purged (2025-08-18).

### Authentication and Authorization
A comprehensive multi-layered security approach with Google OAuth integration and simplified role-based access control:
- **User Authentication**: Session-based auth via Passport.js with both local strategy and Google OAuth2.
- **Google Sign-In**: Fully integrated Google OAuth with automatic user creation/linking and mandatory profile completion.
- **Password Security**: bcrypt with 12 salt rounds for local accounts.
- **Role Management**: Simplified two-role system (user/developer) with middleware-enforced permissions.
- **Session Management**: Implemented comprehensive SSOT session system using unified cartOwner.ts with ONLY express-session connect.sid.
- **Cart Persistence**: Cart items persist correctly across all requests with consolidated duplicate detection and stock validation. Session-to-user migration handles authentication seamlessly.
- **Cart Consolidation**: Advanced cart service automatically merges duplicate items, validates stock limits, and maintains single owner per session with real-time cleanup.
- **Security Practices**: Implements security headers, input sanitization (DOMPurify), SQL injection prevention, tiered rate limiting, and secure session management.
- **Enterprise-Grade Features**: Comprehensive .gitignore protection, strict CSP headers, React ErrorBoundary components, SEO meta tags, PWA manifest, and legal compliance pages (Privacy Policy, Terms of Service).

### Real-Time Communication Architecture
The application implements a modern, typed WebSocket infrastructure for real-time updates:
- **Single Connection Pattern**: One WebSocket connection per browser tab shared across all components via singleton pattern.
- **Typed Message Contracts**: Comprehensive TypeScript interfaces for ServerToClient and ClientToServer messages.
- **Topic-Based Messaging**: Standardized "topic:event" naming convention (e.g., `category:update`, `product:update`, `user:update`).
- **Role-Based Broadcasting**: Server publishes updates to specific user rooms or global channels based on permissions.
- **Automatic Reconnection**: Resilient connection management with exponential backoff and subscription restoration.
- **Admin Real-Time Sync**: Live updates for all CRUD operations across admin dashboard components.
- **Error Handling**: Comprehensive error states, connection status indicators, and graceful degradation.
- **Client-Side**: `useSingletonSocket` hook provides global WebSocket access with TypeScript safety.
- **Server-Side**: Enhanced WebSocket manager with `publish()` and `publishToUser()` methods for typed message broadcasting.
- **Integration**: All admin routes (categories, products, users) automatically publish updates on data changes.
- **Performance**: Optimized connection pooling, efficient message routing, and minimal overhead.

## External Dependencies

### Payment Processing
- **Stripe**: Integrated for complete payment processing (Products API, Prices API, checkout sessions) with automated webhook handling.

### Cloud Services
- **Cloudinary**: Used for image storage and transformation.

### Database and Infrastructure
- **Neon**: Serverless PostgreSQL for the primary database.
- **Replit Database**: Managed PostgreSQL for provisioning and environment variable integration.

### Email Services
- **Resend**: Used for transactional email delivery (password resets, order confirmations).

### Development and Build Tools
- **ESBuild**: Production build system for server-side code.
- **TypeScript**: Enables full-stack type safety with shared schemas.
- **Drizzle Kit**: Utilized for database migration management.