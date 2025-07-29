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