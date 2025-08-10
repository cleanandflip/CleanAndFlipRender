# replit.md

## Overview
Clean & Flip is a full-stack web application designed as a weightlifting equipment exchange platform. It enables users to buy and sell gym equipment, featuring product catalog management, user authentication, a shopping cart, order processing, and administrative tools. The platform operates on a single-seller model, with the admin managing inventory and processing user equipment submissions. The project aims to provide a streamlined, user-friendly experience for fitness enthusiasts to exchange gear.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built with React 18, TypeScript, and leverages modern React patterns. Key decisions include:
- **Framework**: React with TypeScript for type safety.
- **Routing**: Wouter for lightweight client-side routing.
- **State Management**: TanStack Query for server state.
- **UI Components**: Radix UI primitives with shadcn/ui design system, emphasizing a comprehensive and unified admin dashboard theming (AdminLayout, UnifiedMetricCard, UnifiedDataTable, UnifiedButton).
- **Styling**: Tailwind CSS with CSS variables for theming.
- **Build System**: Vite for fast development.
- **Animations**: Framer Motion for enhanced transitions, including portal-based rendering.
- **UX**: Implements lazy loading, error boundaries, and responsive design for desktop and mobile.

### Backend Architecture
The server-side uses a layered REST API architecture built with Node.js:
- **Framework**: Express.js with TypeScript.
- **Database ORM**: Drizzle ORM for type-safe operations.
- **Authentication**: Passport.js for session-based authentication with bcrypt for password hashing.
- **Security**: Comprehensive middleware including rate limiting, input validation (Zod schemas), and CORS protection.
- **File Processing**: Multer for image uploads with Cloudinary integration.
- **Performance**: Request consolidation, caching, and database connection pooling.
- **Monitoring**: Structured logging for debugging.

### Data Storage Solutions
PostgreSQL is the primary database, utilizing:
- **Database**: Neon serverless PostgreSQL for scalability.
- **Schema Management**: Drizzle Kit for migrations.
- **Search**: PostgreSQL tsvector for full-text search.
- **Session Storage**: Database-backed session storage for authentication.
- **Schema**: Key tables include users, products, categories, orders, cart items, and equipment submissions with proper relationships.

### Authentication and Authorization
A comprehensive multi-layered security approach with Google OAuth integration and simplified role-based access control:
- **User Authentication**: Session-based auth via Passport.js with both local strategy and Google OAuth2.
- **Google Sign-In**: Fully integrated Google OAuth using passport-google-oauth20 with automatic user creation/linking.
- **Password Security**: bcrypt with 12 salt rounds for local accounts.
- **OAuth Security**: Google profile verification with email-based account linking for existing users.
- **Role Management**: Simplified two-role system (user/developer) with middleware-enforced permissions.
- **Multi-Provider Support**: Users can sign in with email/password or Google account seamlessly.
- **Local User Detection**: Automatic Asheville, NC zip code detection for local service determination.
- **Rate Limiting**: Tiered rate limiting for general API, auth, and developer operations.
- **Password Reset**: Secure token-based recovery for local accounts.
- **Session Management**: Secure session configuration with consolidated database connections.
- **Security Practices**: Implements security headers, input sanitization, and SQL injection prevention.
- **Production Database**: Complete dual-database system with environment-aware connections and full data migration capabilities.
- **OAuth Integration Completed**: August 2025 - Google Sign-In fully functional with database schema supporting both authentication methods.
- **Database Synchronization**: August 10, 2025 - Development and production databases synchronized with Google OAuth schema changes, immediate onboarding redirection implemented.
- **Production Deployment Tools**: August 10, 2025 - Created comprehensive database sync scripts (`sync-prod-db.sh`, `quick-deploy.sh`) with automated backup, schema comparison, and verification capabilities for seamless production deployments.
- **Codebase Cleanup**: August 10, 2025 - Removed all unnecessary scripts, documentation, and migration files. Kept only essential deployment tools and current documentation for a clean, maintainable codebase.
- **Google Auth Flow Verification**: August 10, 2025 - Complete Google authentication to verified user flow tested and confirmed working: OAuth redirect → callback → new user creation → onboarding redirect → address collection → profile completion → dashboard access.
- **Critical Google OAuth Fixes**: August 10, 2025 - Implemented comprehensive fixes: onboarding flow only forces profile completion at checkout (not on every login), TypeScript null safety fixes, ProtectedRoute component for selective profile completion, ProfilePrompt for seamless checkout guidance, WelcomeBanner for new user experience with URL parameter cleanup, enhanced products page with proper data fetching.

### Unified UI and Live Sync
The admin dashboard features a unified component architecture (AdminLayout, UnifiedMetricCard, UnifiedDataTable, UnifiedButton) with 7 consistent tabs. A comprehensive real-time synchronization system is implemented across all admin components and the user-facing home page using WebSockets, providing live updates for data changes. This includes advanced animations for a professional user experience.

## External Dependencies

### Payment Processing
- **Stripe**: Integrated for complete payment processing, including Products API, Prices API, and checkout sessions, with automated webhook handling.

### Cloud Services
- **Cloudinary**: Used for image storage and transformation, including upload optimization.
- **Google Cloud Storage**: An alternative file storage option.

### Database and Infrastructure
- **Replit Database**: Managed PostgreSQL for provisioning and environment variable integration.
- **Redis** (Optional): Considered for caching.

### Email Services
- **Resend**: Used for transactional email delivery (password resets, order confirmations).
- **SendGrid**: An alternative email provider.

### Development and Build Tools
- **ESBuild**: Production build system for server-side code.
- **TypeScript**: Enables full-stack type safety with shared schemas.
- **Drizzle Kit**: Utilized for database migration management.