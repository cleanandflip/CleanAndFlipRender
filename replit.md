# Clean & Flip - E-Commerce Marketplace

## Overview
Clean & Flip is a comprehensive weightlifting equipment marketplace facilitating the buying and selling of premium fitness equipment. It operates as a two-sided marketplace where users can sell used equipment or purchase verified gear. The business vision is to provide a trusted platform for fitness enthusiasts, leveraging a local business presence in Asheville, NC, to ensure quality and trust.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, Vite
- **Routing**: Wouter
- **Styling**: Tailwind CSS with custom dark theme, glass morphism design, blue accent colors, Bebas Neue typography for headings, mobile-first responsive design.
- **UI Components**: Shadcn/ui built on Radix UI, unified UI components (e.g., `WishlistButton`, `AddToCartButton`).
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
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
- **Admin Functions**: Product management, order processing, comprehensive developer dashboard, user management, analytics.
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

## Recent Updates (January 2025)

### Complete Unified Dashboard System Implementation ✅
✓ **Unified Dashboard Layout**: Complete DashboardLayout component with consistent interface patterns
✓ **Professional Admin Components**: MetricCard, DataTable, Pagination for all dashboard sections
✓ **Comprehensive Management Systems**: ProductsManager, UserManager, AnalyticsManager, CategoryManager, SystemManager, WishlistManager
✓ **Advanced Data Features**: Bulk operations, advanced filtering, sorting, export functionality (CSV/PDF)
✓ **Type-Safe Implementation**: Full TypeScript integration with proper error handling
✓ **Scalable Architecture**: Reusable components supporting thousands of items across all tabs
✓ **Real-Time Updates**: Live data synchronization with optimized query patterns
✓ **Clean Code Quality**: All LSP errors resolved, duplicate code eliminated

### Athletic Weightlifting-Themed Background Implementation ✅ (Latest - August 2025)
✓ **Complete Athletic Background System**: Successfully implemented professional weightlifting equipment marketplace aesthetic across entire website
✓ **Hexagonal Gym Floor Pattern**: Applied subtle hexagonal pattern mimicking gym rubber flooring with breathing animation
✓ **Cross-Grid Athletic Accents**: Added pulse-effect grid lines with blue athletic accent colors for industrial gym atmosphere
✓ **Global Background Consistency**: Ensured athletic theme applies uniformly across all pages, components, and the /sell-to-us page
✓ **Performance Optimized Animations**: Implemented smooth, non-distracting breathing and pulse effects using CSS-only animations
✓ **Athletic Atmosphere Enhancement**: Added subtle blue and green color gradients for authentic gym equipment environment
✓ **Production Ready Aesthetic**: Professional athletic equipment marketplace design system with proper z-index layering

### Foreign Key Constraint Fix ✅ (August 2025)
✓ **Product Deletion Issue Resolved**: Fixed database foreign key constraint error when deleting products referenced in wishlist
✓ **Storage Layer Integration**: Updated DELETE /api/admin/products/:id route to use storage.deleteProduct() method with proper constraint handling
✓ **Cascade Deletion Logic**: Ensured wishlist and cart items are removed before product deletion to prevent orphaned references
✓ **Error Prevention**: Eliminated "violates foreign key constraint wishlist_product_id_products_id_fk" database errors

### Complete White Text Implementation for Form Fields ✅ (August 2025)
✓ **Global Placeholder Text Fix**: Implemented comprehensive CSS solution with `::placeholder` rules for all browsers
✓ **Cross-Browser Compatibility**: Added webkit, moz, and ms-specific placeholder styling for universal white text
✓ **Input Text Color Enforcement**: Applied `text-white` classes to all form inputs for consistent white typed text
✓ **Conflict Resolution**: Added CSS rules to override any existing gray placeholder classes
✓ **Form Field Consistency**: All auth forms, admin forms, and input components now display white text and placeholders
✓ **Global Override Implementation**: Used `!important` declarations to ensure consistent white text across entire website
✓ **Production Ready Visibility**: Solved gray text visibility issues on dark backgrounds with professional white text styling
✓ **Soft Border Refinement**: Implemented elegant form field styling with subtle borders, smooth transitions, and backdrop blur effects
✓ **Enhanced User Experience**: Added gentle hover states, focus glows, and fade-in animations to prevent jarring visual transitions
✓ **FOUC Prevention**: Added flash of unstyled content prevention with smooth page load transitions
✓ **Enhanced Visibility**: Upgraded input backgrounds to lighter gray-600 with improved opacity for better visibility against dark backgrounds
✓ **Professional Typography**: Applied medium font-weight to input text and enhanced label/helper text contrast for optimal readability
✓ **Layered Visual Effects**: Added subtle inner glows and enhanced box-shadows for professional depth and visual hierarchy
✓ **Unified Dropdown Styling**: Matched all dropdown, select, and combobox elements to input field styling for complete form consistency
✓ **Native Select Enhancement**: Styled native select elements with custom arrow icons and consistent appearance across browsers
✓ **Component Library Support**: Added comprehensive support for Radix UI, React Select, and other dropdown component libraries
✓ **Search Dropdown Z-Index Fix**: Enhanced search dropdown positioning with proper z-index layering and backdrop blur effects
✓ **Contact Page Quick Actions Removal**: Removed quick actions section from contact page and adjusted layout for better user experience

### Contact Page Layout Optimization ✅ (August 2025)
✓ **Quick Actions Removal**: Removed Quick Actions section from contact page per user request
✓ **Layout Adjustment**: Properly adjusted contact page layout after Quick Actions removal
✓ **Clean Interface**: Streamlined contact page focusing on contact form and essential information
✓ **Import Cleanup**: Removed unused imports (DollarSign, ShoppingCart, User icons and Link component)

### Global Design System Deployment Complete ✅ (August 2025)
✓ **Complete Global Design System Migration**: Successfully converted all GlassCard components to unified Card components across entire website
✓ **Cross-Platform Component Unification**: Dashboard, Auth, Sell-to-us, Products, Contact, Category-grid, Track-submission, and Product-detail pages fully converted
✓ **Final Migration Completed**: Systematic conversion of product-detail.tsx and track-submission.tsx with all GlassCard references replaced
✓ **Design System Integration**: Applied cohesive blue-gray color scheme and glass morphism design consistently
✓ **LSP Error Resolution**: All TypeScript errors systematically resolved during comprehensive component migration
✓ **Application Stability Maintained**: Server functionality preserved throughout global component conversion
✓ **User-Approved Design**: Confirmed "good, continue with all else" feedback validates comprehensive conversion approach
✓ **Professional UI Consistency**: Unified Card components provide cohesive user experience across all website areas
✓ **Component Architecture**: Centralized design system with proper imports and type safety across all pages
✓ **Production Ready Interface**: Clean, consistent design language deployed across entire user-facing application

### Comprehensive Code Cleanup & Production Readiness ✅ (August 2025)
✓ **Complete Admin Dashboard Verification**: All 7 tabs (Products, Users, Analytics, Categories, Submissions, Wishlist, System) fully tested and working
✓ **Authentication System Verified**: Dean Flip admin account access confirmed, all protected endpoints functional
✓ **CRUD Operations Tested**: Category creation, update, and deletion operations verified working
✓ **Export Functions Confirmed**: CSV export endpoints for Products and Users operational
✓ **Complete TypeScript Error Resolution**: All LSP diagnostics resolved (0 errors) - proper interface definitions and type safety
✓ **Production Code Quality**: Removed all debug console.log statements across admin dashboard components and critical files
✓ **Clean Component Architecture**: Fixed missing state declarations (editingCategory, selectedSubmission) with proper type handling
✓ **Professional Error Handling**: Replaced debug statements with proper toast notifications and user-friendly messaging
✓ **Test Endpoint Cleanup**: Removed temporary debug and performance test endpoints for production deployment
✓ **Code Architecture**: Proper interface definitions for Submission types with optional fields for flexible data handling
✓ **Production Deployment Ready**: Clean codebase with no debugging artifacts, all functionality verified

### TanStack Query Cache Sync & Routing System Finalization ✅ (August 2025)
✓ **Critical Product Editing Sync Fix**: Resolved TanStack Query cache invalidation issue preventing UI updates after product edits
✓ **ProductModal.tsx Migration**: Converted direct fetch calls to proper useMutation hooks with comprehensive cache invalidation
✓ **Real-time UI Updates**: Implemented queryClient.invalidateQueries() and refetchQueries() for immediate product data refresh
✓ **Cache Key Optimization**: Standardized cache keys (['admin-products']) across all product-related queries
✓ **Global Broadcast Integration**: Enhanced with broadcastProductUpdate() for cross-component synchronization
✓ **Routing System Verification**: Confirmed clean Wouter setup (v3.3.5) with no React Router conflicts
✓ **Centralized Navigation**: Created comprehensive useNavigation hook for consistent routing patterns
✓ **Button Variant Type Safety**: Fixed all Button variant TypeScript errors in products.tsx for production compliance
✓ **Production-Ready Sync**: Product edits now trigger immediate UI refreshes with proper error handling

### Product Active/Inactive Toggle & Stock Field Fix ✅ (August 2025)
✓ **Schema Alignment Completed**: Fixed ProductModal to use `status` enum instead of `isActive` boolean to match database schema
✓ **Toggle Functionality Working**: Active/Inactive toggle properly switches between 'active' and 'draft' status values
✓ **Backend Field Mapping Fixed**: Corrected form submission to use proper field names (`stockQuantity`, `featured`, `status`)
✓ **Stock Field Issue Resolved**: Fixed stock field reset by properly mapping `product.stock` from API response
✓ **Visual Status Feedback**: Toggle now displays "(Published)" or "(Draft)" for clear user understanding
✓ **Production Ready**: All product editing functionality fully operational with real-time UI sync

### Previous Code Cleanup & Organization
✓ **Eliminated Duplicate Code**: Removed all duplicate function definitions across components
✓ **Centralized Utilities**: Created `client/src/utils/submissionHelpers.ts` and `server/utils/exportHelpers.ts`
✓ **Clean Component Architecture**: SubmissionsList.tsx and SubmissionsGrid.tsx now use shared utilities
✓ **Enhanced Backend**: Added comprehensive bulk operations, CSV/PDF export endpoints
✓ **Real Data Integration**: System confirmed working with live submission data (4 active submissions)
✓ **Production-Ready Interface**: Professional admin interface with advanced filtering and analytics