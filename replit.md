# replit.md

## Overview
Clean & Flip is a full-stack web application for exchanging weightlifting equipment. It offers features for buying and selling gym gear, including product catalog management, user authentication, a shopping cart, order processing, and administrative tools. The platform operates on a single-seller model, with admin managing inventory and processing user submissions. The project aims to provide a streamlined, user-friendly experience for fitness enthusiasts to exchange gear, with a business vision to become a leading marketplace in this niche.

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
- **Animations**: Framer Motion for enhanced transitions.
- **UX**: Implements lazy loading, error boundaries, and responsive design.

### Backend Architecture
The server-side uses a layered REST API architecture built with Node.js:
- **Framework**: Express.js with TypeScript.
- **Database ORM**: Drizzle ORM for type-safe operations.
- **Authentication**: Passport.js for session-based authentication with bcrypt for password hashing.
- **Security**: Comprehensive middleware including rate limiting, input validation (Zod schemas), and CORS protection.
- **File Processing**: Multer for image uploads with Cloudinary integration.
- **Performance**: Request consolidation, caching, and database connection pooling.
- **Monitoring**: Structured logging for debugging and a unified Local Error Tracking System (LETS) providing Sentry-style error monitoring without external dependencies.

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
- **Google Sign-In**: Fully integrated Google OAuth with automatic user creation/linking and mandatory profile completion.
- **Password Security**: bcrypt with 12 salt rounds for local accounts.
- **Role Management**: Simplified two-role system (user/developer) with middleware-enforced permissions.
- **Security Practices**: Implements security headers, input sanitization (DOMPurify), SQL injection prevention, tiered rate limiting, and secure session management.
- **Enterprise-Grade Features**: Comprehensive .gitignore protection, strict CSP headers, React ErrorBoundary components, SEO meta tags, PWA manifest, and legal compliance pages (Privacy Policy, Terms of Service).

### Unified UI and Live Sync
The admin dashboard features a unified component architecture (AdminLayout, UnifiedMetricCard, UnifiedDataTable, UnifiedButton) with consistent tabs. A comprehensive real-time synchronization system is implemented across all admin components and the user-facing home page using WebSockets, providing live updates for data changes and professional user experience with advanced animations.

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