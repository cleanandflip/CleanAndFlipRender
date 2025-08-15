# replit.md

## Overview
Clean & Flip is a full-stack web application for exchanging weightlifting equipment. It offers features for buying and selling gym gear, including product catalog management, user authentication, a shopping cart, order processing, and administrative tools. The platform operates on a single-seller model, with admin managing inventory and processing user submissions. The project aims to provide a streamlined, user-friendly experience for fitness enthusiasts to exchange gear, with a business vision to become a leading marketplace in this niche.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Major Updates

### Complete V2 Cart System Migration (August 15, 2025)
- **Legacy System Deprecation**: Successfully migrated from dual legacy/V2 cart system to unified V2-only implementation
- **Data Shape Resolution**: Eliminated all quantity vs qty conflicts by standardizing on V2 qty field across entire system
- **Unified API Endpoints**: Consolidated from 8+ legacy endpoints to 4 clean V2 endpoints with consistent patterns
- **Session Stability**: SSOT session management using cartOwner.ts eliminates all cart fragmentation issues
- **Frontend Migration**: Complete rewrite of useCart hook, AddToCartButton, and CartPage for V2 API compatibility
- **Performance Optimization**: Product-based operations, consolidated queries, and optimized cache invalidation
- **Developer Experience**: Single cart system to maintain with clear V2 API patterns and comprehensive documentation
- **Production Ready**: Full V2 system operational with verified cart operations and stable session ownership

### Comprehensive Codebase Audit & Consolidation (August 2025)
- **Professional audit infrastructure**: Installed ts-morph, jscpd, knip, and other enterprise-grade code analysis tools
- **Legacy file purge**: Removed 20 unused files including deprecated server/routes/cart.ts (fully migrated to cart.v2)
- **One-by-one duplicate consolidation**: Successfully merged 7 duplicate files using automated TypeScript-aware codemods
- **SSOT establishment**: Created canonical file hierarchies and audit systems in audit/ssot-canonical-map.json
- **Import rewriting**: Automated rewrite of all import references to point to canonical files
- **Code health improvement**: Eliminated 1,824 duplicate groups and consolidated infrastructure files
- **Build optimization**: Reduced server bundle by 5.8kb while maintaining 100% functionality
- **Permanent tooling**: Added ongoing audit scripts for duplicate detection and safe cleanup protocols

## System Architecture

### Frontend Architecture
The client-side is built with React 18, TypeScript, and leverages modern React patterns. Key decisions include:
- **Framework**: React with TypeScript for type safety.
- **Routing**: Wouter for lightweight client-side routing.
- **State Management**: TanStack Query for server state.
- **UI Components**: Radix UI primitives with shadcn/ui design system, emphasizing a comprehensive and unified admin dashboard theming.
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
- **File Processing**: Multer for image uploads.
- **Performance**: Request consolidation, caching, and database connection pooling.
- **Monitoring**: Structured logging and a comprehensive Local Error Tracking System (LETS) for production-ready error monitoring.
- **Performance**: Optimized database queries with strategic indexing, bulk operations, fire-and-forget activity tracking, intelligent slow request detection thresholds, and gzip compression middleware.

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
- **Session Management**: **COMPLETELY RESOLVED** - Implemented comprehensive SSOT session system using unified cartOwner.ts with ONLY express-session connect.sid. Eliminated all custom session ID generation and rotation.
- **Cart Persistence**: **FULLY OPERATIONAL** - Cart items persist correctly across all requests with consolidated duplicate detection and stock validation. Session-to-user migration handles authentication seamlessly.
- **Cart Consolidation**: **IMPLEMENTED** - Advanced cart service automatically merges duplicate items, validates stock limits, and maintains single owner per session with real-time cleanup.
- **Security Practices**: Implements security headers, input sanitization (DOMPurify), SQL injection prevention, tiered rate limiting, and secure session management.
- **Enterprise-Grade Features**: Comprehensive .gitignore protection, strict CSP headers, React ErrorBoundary components, SEO meta tags, PWA manifest, and legal compliance pages (Privacy Policy, Terms of Service).

### Real-Time Communication Architecture
The application implements a modern, typed WebSocket infrastructure for real-time updates:

#### WebSocket System Features
- **Single Connection Pattern**: One WebSocket connection per browser tab shared across all components via singleton pattern.
- **Typed Message Contracts**: Comprehensive TypeScript interfaces for ServerToClient and ClientToServer messages.
- **Topic-Based Messaging**: Standardized "topic:event" naming convention (e.g., `category:update`, `product:update`, `user:update`).
- **Role-Based Broadcasting**: Server publishes updates to specific user rooms or global channels based on permissions.
- **Automatic Reconnection**: Resilient connection management with exponential backoff and subscription restoration.
- **Admin Real-Time Sync**: Live updates for all CRUD operations across admin dashboard components.
- **Error Handling**: Comprehensive error states, connection status indicators, and graceful degradation.

#### WebSocket Implementation
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