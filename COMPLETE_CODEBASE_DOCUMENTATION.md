# Clean & Flip - Complete Codebase Documentation

## Table of Contents

1. [Complete File Structure Analysis](#1-complete-file-structure-analysis)
2. [Routing Documentation](#2-routing-documentation)
3. [Database Schema Documentation](#3-database-schema-documentation)
4. [Component Inventory](#4-component-inventory)
5. [Authentication & Authorization Flow](#5-authentication--authorization-flow)
6. [State Management](#6-state-management)
7. [Business Logic Documentation](#7-business-logic-documentation)
8. [External Integrations](#8-external-integrations)
9. [UI/UX Specifications](#9-uiux-specifications)
10. [Forms Documentation](#10-forms-documentation)
11. [Security Implementations](#11-security-implementations)
12. [Performance Optimizations](#12-performance-optimizations)
13. [Error Handling](#13-error-handling)
14. [WebSocket Implementation](#14-websocket-implementation)
15. [Build & Deployment](#15-build--deployment)
16. [Code Patterns & Standards](#16-code-patterns--standards)
17. [Missing or Broken Features](#17-missing-or-broken-features)
18. [Configuration Files](#18-configuration-files)
19. [API Response Formats](#19-api-response-formats)
20. [User Flows](#20-user-flows)
21. [Data Validation Rules](#21-data-validation-rules)
22. [Testing Touchpoints](#22-testing-touchpoints)

---

## 1. Complete File Structure Analysis

### Project Structure Overview
```
Clean & Flip/
├── client/                          # Frontend React application
│   ├── index.html                   # Main HTML entry point
│   ├── public/                      # Static assets
│   └── src/                         # React source code
│       ├── components/              # Reusable UI components
│       ├── pages/                   # Page components
│       ├── hooks/                   # Custom React hooks
│       ├── lib/                     # Utility libraries
│       └── assets/                  # Images and static files
├── server/                          # Backend Express application
│   ├── index.ts                     # Server entry point
│   ├── routes.ts                    # Main API routes
│   ├── auth.ts                      # Authentication logic
│   ├── db.ts                        # Database connection
│   ├── storage.ts                   # Data access layer
│   ├── config/                      # Configuration files
│   ├── middleware/                  # Express middleware
│   ├── routes/                      # Route modules
│   └── utils/                       # Server utilities
├── shared/                          # Shared types and schemas
│   └── schema.ts                    # Database schema definitions
├── migrations/                      # Database migration files
├── scripts/                         # Build and deployment scripts
├── package.json                     # Dependencies and scripts
├── drizzle.config.ts               # Database ORM configuration
├── vite.config.ts                  # Frontend build configuration
├── tailwind.config.ts              # CSS framework configuration
└── replit.md                       # Project documentation
```

### Active Files Inventory

#### Core Application Files
| File Path | Purpose | Size | Last Modified | Status |
|-----------|---------|------|---------------|--------|
| `server/index.ts` | Express server entry point | ~5KB | Active | Production |
| `server/routes.ts` | Main API route definitions | ~150KB | Active | Production |
| `server/auth.ts` | Authentication middleware | ~8KB | Active | Production |
| `server/db.ts` | Database connection setup | ~2KB | Active | Production |
| `server/storage.ts` | Data access layer | ~45KB | Active | Production |
| `client/src/App.tsx` | React app entry point | ~8KB | Active | Production |
| `shared/schema.ts` | Database schema & types | ~25KB | Active | Production |

#### Configuration Files
| File | Purpose | Status |
|------|---------|--------|
| `package.json` | Dependencies (159 packages) | Active |
| `drizzle.config.ts` | Database ORM config | Active |
| `vite.config.ts` | Frontend build config | Active |
| `tailwind.config.ts` | CSS framework config | Active |
| `tsconfig.json` | TypeScript config | Active |
| `components.json` | shadcn/ui config | Active |

#### Dependencies Overview

**Production Dependencies (130+ packages):**
- **Frontend Core:** React 18.3.1, TypeScript 5.6.3, Vite 7.1.1
- **UI Components:** @radix-ui (40+ components), shadcn/ui, lucide-react
- **State Management:** @tanstack/react-query 5.84.2
- **Routing:** wouter 3.7.1
- **Styling:** tailwindcss 3.4.17, framer-motion 11.18.2
- **Backend Core:** Express 4.21.2, Node.js 20+
- **Database:** drizzle-orm 0.39.3, @neondatabase/serverless 0.10.4
- **Authentication:** passport 0.7.0, bcrypt 6.0.0, openid-client 6.6.3
- **Payment:** stripe 18.4.0, @stripe/react-stripe-js 3.9.0
- **File Upload:** cloudinary 2.7.0, multer 2.0.2
- **Real-time:** socket.io 4.8.1, ws 8.18.0
- **Email:** resend 6.0.0, @sendgrid/mail 8.1.5

**Development Dependencies (24 packages):**
- **Build Tools:** esbuild 0.25.0, drizzle-kit 0.31.4
- **Type Definitions:** @types/* for all major libraries
- **Replit Integration:** @replit/vite-plugin-cartographer

---

## 2. Routing Documentation

### Frontend Routes (React/Wouter)

#### Public Routes
| Path | Component | Description | Parameters | Protected |
|------|-----------|-------------|------------|-----------|
| `/` | `Home` | Landing page with product showcase | None | No |
| `/products` | `Products` | Product catalog with search/filter | `search`, `category`, `page`, `limit` | No |
| `/products/:id` | `ProductDetail` | Individual product view | `id` (product UUID) | No |
| `/about` | `About` | Company information | None | No |
| `/contact` | `Contact` | Contact form and information | None | No |
| `/sell-to-us` | `SellToUs` | Equipment submission form | None | No |
| `/track-submission` | `TrackSubmission` | Track equipment submission | `ref` (reference number) | No |
| `/auth` | `AuthPage` | Login/register forms | `tab` (login/register) | No |
| `/forgot-password` | `ForgotPassword` | Password reset request | None | No |
| `/reset-password` | `ResetPassword` | Password reset form | `token` | No |

#### Protected Routes (Require Authentication)
| Path | Component | Description | Protection Level | Redirect |
|------|-----------|-------------|------------------|----------|
| `/onboarding` | `Onboarding` | Profile completion flow | Auth only | `/auth` |
| `/cart` | `Cart` | Shopping cart view | Complete profile | `/onboarding` |
| `/checkout` | `Checkout` | Checkout process | Complete profile | `/onboarding` |
| `/orders` | `Orders` | Order history | Complete profile | `/onboarding` |
| `/dashboard` | `Dashboard` | User dashboard | Complete profile | `/onboarding` |

#### Admin Routes (Developer Role Required)
| Path | Component | Description | Access Level |
|------|-----------|-------------|--------------|
| `/admin` | `AdminDashboard` | Admin dashboard | Developer |
| `/admin/products/new` | `ProductForm` | Create new product | Developer |
| `/admin/products/:id/edit` | `ProductForm` | Edit existing product | Developer |

### Backend API Routes (Express)

#### Authentication Routes
| Method | Path | Description | Auth Required | Rate Limit |
|--------|------|-------------|---------------|------------|
| `POST` | `/api/auth/login` | User login | No | 5/min |
| `POST` | `/api/auth/register` | User registration | No | 3/min |
| `POST` | `/api/auth/logout` | User logout | Yes | 10/min |
| `GET` | `/api/auth/google` | Google OAuth initiation | No | 5/min |
| `GET` | `/api/auth/google/callback` | Google OAuth callback | No | 10/min |
| `POST` | `/api/auth/onboarding/address` | Save onboarding address | Yes | 10/min |
| `POST` | `/api/auth/onboarding/complete` | Complete onboarding | Yes | 5/min |
| `POST` | `/api/auth/forgot-password` | Request password reset | No | 3/min |
| `POST` | `/api/auth/reset-password` | Reset password | No | 3/min |

#### User Management Routes
| Method | Path | Description | Auth Required | Profile Complete |
|--------|------|-------------|---------------|------------------|
| `GET` | `/api/user` | Get current user | Yes | No |
| `PUT` | `/api/user` | Update user profile | Yes | No |
| `GET` | `/api/users` | Get all users (admin) | Developer | Yes |

#### Product Routes
| Method | Path | Description | Auth Required | Tables Touched |
|--------|------|-------------|---------------|----------------|
| `GET` | `/api/products` | List products with filters | No | `products`, `categories` |
| `GET` | `/api/products/featured` | Get featured products | No | `products` |
| `GET` | `/api/products/:id` | Get single product | No | `products`, `categories`, `reviews` |
| `POST` | `/api/products` | Create product (admin) | Developer | `products` |
| `PUT` | `/api/products/:id` | Update product (admin) | Developer | `products` |
| `DELETE` | `/api/products/:id` | Delete product (admin) | Developer | `products` |

#### Category Routes
| Method | Path | Description | Auth Required | Cache Duration |
|--------|------|-------------|---------------|----------------|
| `GET` | `/api/categories` | List all categories | No | 5 minutes |
| `POST` | `/api/categories` | Create category (admin) | Developer | None |
| `PUT` | `/api/categories/:id` | Update category (admin) | Developer | None |

#### Cart Routes
| Method | Path | Description | Auth Required | Profile Complete |
|--------|------|-------------|---------------|------------------|
| `GET` | `/api/cart` | Get cart items | Optional | No |
| `POST` | `/api/cart` | Add item to cart | Optional | No |
| `PUT` | `/api/cart/:id` | Update cart item | Optional | No |
| `DELETE` | `/api/cart/:id` | Remove cart item | Optional | No |

#### Order Routes
| Method | Path | Description | Auth Required | Profile Complete |
|--------|------|-------------|---------------|------------------|
| `GET` | `/api/orders` | Get user orders | Yes | Yes |
| `GET` | `/api/orders/:id` | Get single order | Yes | Yes |
| `POST` | `/api/orders` | Create new order | Yes | Yes |

#### Payment Routes
| Method | Path | Description | Auth Required | Profile Complete |
|--------|------|-------------|---------------|------------------|
| `POST` | `/api/create-payment-intent` | Create Stripe payment | Yes | Yes |
| `POST` | `/api/stripe/webhook` | Stripe webhook handler | No | No |

#### Search Routes
| Method | Path | Description | Response Format | Cache |
|--------|------|-------------|-----------------|-------|
| `GET` | `/api/search` | Full-text product search | `{ products: [], total: number }` | 1 minute |

#### File Upload Routes
| Method | Path | Description | File Limits | Auth Required |
|--------|------|-------------|-------------|---------------|
| `POST` | `/api/upload/images` | Upload multiple images | 8 files, 5MB each | Yes |

#### Admin Routes
| Method | Path | Description | Auth Required | Response |
|--------|------|-------------|---------------|----------|
| `GET` | `/api/admin/dashboard/metrics` | Dashboard metrics | Developer | JSON metrics |
| `GET` | `/api/admin/users` | User management | Developer | User list |
| `GET` | `/api/admin/orders` | Order management | Developer | Order list |
| `GET` | `/api/admin/submissions` | Equipment submissions | Developer | Submission list |

---

## 3. Database Schema Documentation

### Core Tables

#### users
**Purpose:** Store user account information and authentication data

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | VARCHAR | PRIMARY KEY | `gen_random_uuid()` | Unique user identifier |
| `email` | VARCHAR | UNIQUE, NOT NULL | None | User email address |
| `password` | VARCHAR | NULL | None | Hashed password (bcrypt, 12 rounds) |
| `firstName` | VARCHAR | NOT NULL | None | User's first name |
| `lastName` | VARCHAR | NOT NULL | None | User's last name |
| `phone` | VARCHAR | NULL | None | Phone number (optional) |
| `street` | VARCHAR(255) | NULL | None | Street address |
| `city` | VARCHAR(100) | NULL | None | City name |
| `state` | VARCHAR(2) | NULL | None | State abbreviation |
| `zipCode` | VARCHAR(10) | NULL | None | ZIP/postal code |
| `latitude` | DECIMAL(10,8) | NULL | None | GPS latitude |
| `longitude` | DECIMAL(11,8) | NULL | None | GPS longitude |
| `isLocalCustomer` | BOOLEAN | NOT NULL | `false` | Local delivery eligibility |
| `role` | user_role | NOT NULL | `'user'` | User role (user/developer) |
| `stripeCustomerId` | VARCHAR | NULL | None | Stripe customer ID |
| `stripeSubscriptionId` | VARCHAR | NULL | None | Stripe subscription ID |
| `googleId` | VARCHAR | UNIQUE | None | Google OAuth ID |
| `googleEmail` | VARCHAR | NULL | None | Google account email |
| `googlePicture` | TEXT | NULL | None | Google profile picture URL |
| `profileImageUrl` | TEXT | NULL | None | Profile image URL |
| `authProvider` | VARCHAR | NOT NULL | `'local'` | Auth method (local/google) |
| `isEmailVerified` | BOOLEAN | NOT NULL | `false` | Email verification status |
| `profileComplete` | BOOLEAN | NOT NULL | `false` | Profile completion status |
| `onboardingStep` | INTEGER | NOT NULL | `0` | Current onboarding step |
| `createdAt` | TIMESTAMP | NOT NULL | `NOW()` | Account creation time |
| `updatedAt` | TIMESTAMP | NOT NULL | `NOW()` | Last update time |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `email`
- UNIQUE on `googleId`
- INDEX on `role`
- INDEX on `profileComplete`
- INDEX on `authProvider`

#### products
**Purpose:** Store product catalog information

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | VARCHAR | PRIMARY KEY | `gen_random_uuid()` | Product identifier |
| `name` | VARCHAR | NOT NULL | None | Product name |
| `description` | TEXT | NULL | None | Product description |
| `price` | DECIMAL(10,2) | NOT NULL | None | Product price in USD |
| `categoryId` | VARCHAR | FOREIGN KEY | None | Reference to categories.id |
| `condition` | product_condition | NOT NULL | None | Product condition |
| `status` | product_status | NOT NULL | `'active'` | Product status |
| `stockQuantity` | INTEGER | NOT NULL | `0` | Available stock |
| `sku` | VARCHAR | UNIQUE | NULL | Stock keeping unit |
| `brand` | VARCHAR | NULL | None | Product brand |
| `model` | VARCHAR | NULL | None | Product model |
| `weight` | DECIMAL(8,2) | NULL | None | Weight in pounds |
| `dimensions` | VARCHAR | NULL | None | Dimensions string |
| `images` | TEXT[] | NOT NULL | `'{}'` | Array of image URLs |
| `features` | TEXT[] | NOT NULL | `'{}'` | Array of features |
| `stripeProductId` | VARCHAR | NULL | None | Stripe product ID |
| `stripePriceId` | VARCHAR | NULL | None | Stripe price ID |
| `isFeatured` | BOOLEAN | NOT NULL | `false` | Featured product flag |
| `viewCount` | INTEGER | NOT NULL | `0` | Product view counter |
| `salesCount` | INTEGER | NOT NULL | `0` | Sales counter |
| `searchVector` | TSVECTOR | NULL | None | Full-text search vector |
| `createdAt` | TIMESTAMP | NOT NULL | `NOW()` | Creation time |
| `updatedAt` | TIMESTAMP | NOT NULL | `NOW()` | Last update time |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY on `categoryId`
- INDEX on `status`
- INDEX on `condition`
- INDEX on `isFeatured`
- UNIQUE on `sku`
- GIN INDEX on `searchVector`

#### categories
**Purpose:** Product categorization and organization

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | VARCHAR | PRIMARY KEY | `gen_random_uuid()` | Category identifier |
| `name` | VARCHAR | NOT NULL | None | Category name |
| `slug` | VARCHAR | UNIQUE, NOT NULL | None | URL-friendly name |
| `imageUrl` | TEXT | NULL | None | Category image URL |
| `description` | TEXT | NULL | None | Category description |
| `displayOrder` | INTEGER | NOT NULL | `0` | Sort order |
| `isActive` | BOOLEAN | NOT NULL | `true` | Active status |
| `productCount` | INTEGER | NOT NULL | `0` | Cached product count |
| `filterConfig` | JSONB | NOT NULL | `'{}'` | Filter configuration |
| `createdAt` | TIMESTAMP | NOT NULL | `NOW()` | Creation time |
| `updatedAt` | TIMESTAMP | NOT NULL | `NOW()` | Last update time |

#### orders
**Purpose:** Store customer orders and transaction data

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | VARCHAR | PRIMARY KEY | `gen_random_uuid()` | Order identifier |
| `userId` | VARCHAR | FOREIGN KEY, NOT NULL | None | Customer reference |
| `orderNumber` | VARCHAR | UNIQUE, NOT NULL | None | Human-readable order number |
| `status` | order_status | NOT NULL | `'pending'` | Order status |
| `totalAmount` | DECIMAL(10,2) | NOT NULL | None | Total order amount |
| `subtotalAmount` | DECIMAL(10,2) | NOT NULL | None | Subtotal before tax |
| `taxAmount` | DECIMAL(10,2) | NOT NULL | `0` | Tax amount |
| `shippingAmount` | DECIMAL(10,2) | NOT NULL | `0` | Shipping cost |
| `discountAmount` | DECIMAL(10,2) | NOT NULL | `0` | Discount applied |
| `shippingAddress` | JSONB | NOT NULL | None | Shipping address object |
| `billingAddress` | JSONB | NULL | None | Billing address object |
| `paymentMethod` | VARCHAR | NULL | None | Payment method used |
| `stripePaymentIntentId` | VARCHAR | NULL | None | Stripe payment intent ID |
| `notes` | TEXT | NULL | None | Order notes |
| `createdAt` | TIMESTAMP | NOT NULL | `NOW()` | Order creation time |
| `updatedAt` | TIMESTAMP | NOT NULL | `NOW()` | Last update time |

### Enums

#### user_role
- `'user'` - Standard customer
- `'developer'` - Admin/developer access

#### product_condition
- `'new'` - Brand new condition
- `'like_new'` - Excellent condition
- `'good'` - Good condition with minor wear
- `'fair'` - Fair condition with visible wear
- `'needs_repair'` - Requires repair

#### product_status
- `'active'` - Available for purchase
- `'inactive'` - Not available
- `'sold'` - Sold out
- `'pending'` - Pending approval
- `'draft'` - Draft status
- `'archived'` - Archived

#### order_status
- `'pending'` - Order placed, awaiting payment
- `'paid'` - Payment confirmed
- `'processing'` - Being prepared
- `'shipped'` - Order shipped
- `'delivered'` - Order delivered
- `'cancelled'` - Order cancelled
- `'refunded'` - Order refunded

### Relationships

```sql
-- User to Orders (1:N)
users.id -> orders.userId

-- Category to Products (1:N)
categories.id -> products.categoryId

-- User to Cart Items (1:N)
users.id -> cartItems.userId

-- Product to Cart Items (1:N)
products.id -> cartItems.productId

-- Order to Order Items (1:N)
orders.id -> orderItems.orderId

-- Product to Order Items (1:N)
products.id -> orderItems.productId

-- User to Reviews (1:N)
users.id -> reviews.userId

-- Product to Reviews (1:N)
products.id -> reviews.productId
```

---

## 4. Component Inventory

### Layout Components

#### Navigation (`client/src/components/layout/navigation.tsx`)
**Props Interface:**
```typescript
interface NavigationProps {
  className?: string;
}
```

**State Variables:**
- `isMenuOpen: boolean` - Mobile menu state
- `user: User | null` - Current user from auth context
- `cartItemCount: number` - Cart item counter

**Hooks Used:**
- `useAuth()` - Authentication state
- `useCart()` - Cart state
- `useState()` - Local state management
- `useEffect()` - Side effects

**Child Components:**
- `UnifiedSearchBar` - Search functionality
- `CartIcon` - Cart with item count
- `UserDropdown` - User menu
- `NavigationMenu` - Main navigation

**API Calls:**
- None (uses context data)

**CSS Classes:**
- `sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b`
- `container mx-auto px-4 sm:px-6 lg:px-8`
- `flex items-center justify-between h-16`

#### Footer (`client/src/components/layout/footer.tsx`)
**Props Interface:**
```typescript
interface FooterProps {
  className?: string;
}
```

**State Variables:**
- None (static component)

**Child Components:**
- Newsletter signup form
- Social media links
- Legal links

### Product Components

#### ProductCard (`client/src/components/products/product-card.tsx`)
**Props Interface:**
```typescript
interface ProductCardProps {
  product: Product;
  showQuickActions?: boolean;
  className?: string;
}
```

**State Variables:**
- `isLoading: boolean` - Add to cart loading state
- `imageError: boolean` - Image load error state

**Hooks Used:**
- `useCart()` - Cart operations
- `useToast()` - Notification system
- `useState()` - Local state

**Events Handled:**
- `onClick` - Navigate to product detail
- `onAddToCart` - Add product to cart
- `onImageError` - Handle image load errors

**API Calls:**
- `POST /api/cart` - Add item to cart

#### ProductGrid (`client/src/components/products/product-grid.tsx`)
**Props Interface:**
```typescript
interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  className?: string;
}
```

**Child Components:**
- `ProductCard` (repeated)
- `ProductCardSkeleton` (loading state)

### Form Components

#### UnifiedSearchBar (`client/src/components/search/unified-search-bar.tsx`)
**Props Interface:**
```typescript
interface UnifiedSearchBarProps {
  variant?: 'navbar' | 'page' | 'modal';
  placeholder?: string;
  autoFocus?: boolean;
  onSearchExecuted?: (query: string) => void;
}
```

**State Variables:**
- `query: string` - Search input value
- `isOpen: boolean` - Dropdown visibility
- `recentSearches: string[]` - User's recent searches
- `searchResults: Product[]` - Live search results
- `isLoading: boolean` - Search loading state

**Hooks Used:**
- `useDebounce(query, 300)` - Debounced search
- `useClickOutside()` - Close dropdown
- `useLocalStorage()` - Persist recent searches
- `useQuery()` - API data fetching

**API Calls:**
- `GET /api/search?q=${query}` - Live search
- `GET /api/products/trending` - Trending products

#### AddressAutocomplete (`client/src/components/ui/address-autocomplete.tsx`)
**Props Interface:**
```typescript
interface AddressAutocompleteProps {
  value?: string;
  onChange?: (address: ParsedAddress) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}
```

**State Variables:**
- `input: string` - Address input
- `suggestions: any[]` - Geoapify suggestions
- `loading: boolean` - API loading state
- `showDropdown: boolean` - Suggestions visibility
- `selectedAddress: ParsedAddress | null` - Selected address

**External Dependencies:**
- Geoapify Geocoding API
- Environment variable: `VITE_GEOAPIFY_API_KEY`

**API Calls:**
- `GET https://api.geoapify.com/v1/geocode/autocomplete` - Address suggestions

### Admin Components

#### AdminLayout (`client/src/components/admin/admin-layout.tsx`)
**Props Interface:**
```typescript
interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}
```

**Child Components:**
- `AdminSidebar` - Navigation sidebar
- `AdminHeader` - Page header with actions
- `BreadcrumbNavigation` - Navigation breadcrumbs

#### UnifiedDataTable (`client/src/components/admin/unified-data-table.tsx`)
**Props Interface:**
```typescript
interface UnifiedDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchKey?: string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  actions?: ActionButton[];
}
```

**Features:**
- Sortable columns
- Search filtering
- Row selection
- Bulk actions
- Pagination
- Loading states

#### UnifiedMetricCard (`client/src/components/admin/unified-metric-card.tsx`)
**Props Interface:**
```typescript
interface UnifiedMetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: LucideIcon;
  className?: string;
}
```

**CSS Specifications:**
- Card dimensions: `min-h-[120px]`
- Padding: `p-6`
- Border radius: `rounded-lg`
- Border: `border border-gray-200 dark:border-gray-800`

### Cart Components

#### CartDrawer (`client/src/components/cart/cart-drawer.tsx`)
**Props Interface:**
```typescript
interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}
```

**State Variables:**
- `isUpdating: boolean` - Update operations
- `cartItems: CartItem[]` - Cart contents

**Hooks Used:**
- `useCart()` - Cart state and operations
- `useAuth()` - User authentication state

**Child Components:**
- `CartItem` - Individual cart item
- `CartSummary` - Order summary
- `CheckoutButton` - Proceed to checkout

#### CartItem (`client/src/components/cart/cart-item.tsx`)
**Props Interface:**
```typescript
interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}
```

**Events Handled:**
- Quantity increment/decrement
- Remove item confirmation
- Input quantity validation

---

## 5. Authentication & Authorization Flow

### Complete Login Flow

#### Step 1: User Authentication Request
1. **Local Login (`POST /api/auth/login`)**
   ```typescript
   // Input validation
   const schema = z.object({
     email: z.string().email(),
     password: z.string().min(8)
   });
   
   // Rate limiting: 5 attempts per minute
   // Password verification: bcrypt.compare(password, hashedPassword)
   // Session creation: req.session.userId = user.id
   ```

2. **Google OAuth Login (`GET /api/auth/google`)**
   ```typescript
   // Redirect to Google OAuth consent screen
   // Scopes: ['profile', 'email']
   // Callback URL: /api/auth/google/callback
   ```

#### Step 2: Session Management
```typescript
// Session configuration (server/auth.ts)
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  store: new PostgreSQLStore({
    conString: process.env.DATABASE_URL,
    tableName: 'sessions'
  }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};
```

#### Step 3: Password Security
- **Hashing Method:** bcrypt with 12 salt rounds
- **Password Requirements:** Minimum 8 characters
- **Storage:** Only hashed passwords stored in database

#### Step 4: Token Generation/Validation
```typescript
// Password reset tokens
const token = crypto.randomBytes(32).toString('hex');
const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

// Token expiration: 1 hour
const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
```

### Google OAuth Integration Flow

#### Step 1: OAuth Initiation
```typescript
// Route: GET /api/auth/google
passport.authenticate('google', {
  scope: ['profile', 'email'],
  accessType: 'offline',
  prompt: 'consent'
});
```

#### Step 2: Callback Processing
```typescript
// Route: GET /api/auth/google/callback
passport.authenticate('google', {
  failureRedirect: '/auth?error=oauth_failed'
}, async (req, res) => {
  const { profile } = req.user;
  
  // User creation/update logic
  const userData = {
    googleId: profile.id,
    email: profile.emails[0].value,
    firstName: profile.name.givenName,
    lastName: profile.name.familyName,
    profileImageUrl: profile.photos[0].value,
    authProvider: 'google',
    isEmailVerified: true
  };
  
  // Force redirect logic for incomplete profiles
  if (!user.profileComplete) {
    return res.redirect(`/onboarding?step=1&google=true&new=${isNewUser}`);
  }
  
  res.redirect('/dashboard');
});
```

#### Step 3: Profile Completion Enforcement
```typescript
// Middleware: requireCompleteProfile
export function requireCompleteProfile(req, res, next) {
  if (!req.user?.profileComplete) {
    return res.status(403).json({
      error: 'Profile incomplete',
      redirect: '/onboarding'
    });
  }
  next();
}
```

### Protected Route Logic

#### Frontend Protection
```typescript
// ProtectedRoute component
function ProtectedRoute({ children, requireCompleteProfile = false }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Redirect to="/auth" />;
  
  if (requireCompleteProfile && !user.profileComplete) {
    return <Redirect to="/onboarding" />;
  }
  
  return <>{children}</>;
}
```

#### Backend Protection
```typescript
// Authentication middleware
export const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Role-based authorization
export const requireRole = (role: 'user' | 'developer') => {
  return (req, res, next) => {
    if (req.user?.role !== role && req.user?.role !== 'developer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

### User Role Permissions Matrix

| Resource | User | Developer |
|----------|------|-----------|
| View Products | ✅ | ✅ |
| Add to Cart | ✅ | ✅ |
| Place Orders | ✅ | ✅ |
| View Own Orders | ✅ | ✅ |
| Create Products | ❌ | ✅ |
| Edit Products | ❌ | ✅ |
| Delete Products | ❌ | ✅ |
| View All Orders | ❌ | ✅ |
| User Management | ❌ | ✅ |
| Admin Dashboard | ❌ | ✅ |
| System Settings | ❌ | ✅ |

### Password Reset Flow

#### Step 1: Reset Request
```typescript
// POST /api/auth/forgot-password
const resetToken = crypto.randomBytes(32).toString('hex');
const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

await db.insert(passwordResetTokens).values({
  userId: user.id,
  token: hashedToken,
  expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
});

// Send email with reset link
await sendResetEmail(user.email, resetToken);
```

#### Step 2: Password Reset
```typescript
// POST /api/auth/reset-password
const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
const resetRecord = await db.select().from(passwordResetTokens)
  .where(eq(passwordResetTokens.token, hashedToken))
  .where(gt(passwordResetTokens.expiresAt, new Date()));

if (!resetRecord) {
  return res.status(400).json({ error: 'Invalid or expired token' });
}

// Update password and delete token
const hashedPassword = await bcrypt.hash(newPassword, 12);
await db.update(users).set({ password: hashedPassword })
  .where(eq(users.id, resetRecord.userId));
```

---

## 6. State Management

### React Context Providers

#### AuthProvider (`client/src/hooks/use-auth.tsx`)
**Context Data:**
```typescript
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};
```

**Features:**
- Auto-redirect for incomplete profiles
- Session persistence
- Google OAuth state management
- Error handling with toast notifications

#### CartProvider (`client/src/hooks/use-cart.tsx`)
**Context Data:**
```typescript
type CartContextType = {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  isLoading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};
```

**Persistence Method:**
- Session-based for guests
- Database-backed for authenticated users
- Automatic migration on login

### TanStack Query Cache Keys

#### User Data
```typescript
["/api/user"] // Current user information
["/api/users"] // Admin: All users list
```

#### Product Data
```typescript
["/api/products"] // Product list with filters
["/api/products", productId] // Single product details
["/api/products/featured"] // Featured products
["/api/search", query] // Search results
```

#### Category Data
```typescript
["/api/categories"] // All categories (cached 5 min)
["/api/categories", categoryId] // Single category
```

#### Cart Data
```typescript
["/api/cart"] // User's cart items
["/api/cart", "count"] // Cart item count
```

#### Order Data
```typescript
["/api/orders"] // User's order history
["/api/orders", orderId] // Single order details
```

#### Admin Data
```typescript
["/api/admin/dashboard/metrics"] // Dashboard metrics
["/api/admin/users"] // User management
["/api/admin/orders"] // Order management
["/api/admin/submissions"] // Equipment submissions
```

### WebSocket Events and Handlers

#### Connection Events
```typescript
// Client connection
{
  type: 'connection',
  status: 'connected' | 'disconnected',
  clientId: string,
  timestamp: string
}
```

#### Cart Updates
```typescript
// Real-time cart synchronization
{
  type: 'cart_update',
  userId: string,
  action: 'add' | 'update' | 'remove' | 'clear',
  data: CartItem | null,
  timestamp: string
}
```

#### Product Updates
```typescript
// Inventory and product changes
{
  type: 'product_update',
  productId: string,
  action: 'created' | 'updated' | 'deleted' | 'stock_changed',
  data: Partial<Product>,
  timestamp: string
}
```

#### Order Updates
```typescript
// Order status changes
{
  type: 'order_update',
  orderId: string,
  userId: string,
  status: OrderStatus,
  timestamp: string
}
```

### Local Storage Usage

#### Recent Searches
```typescript
// Key: 'clean-flip-recent-searches'
// Value: string[] (max 10 items)
const recentSearches = JSON.parse(
  localStorage.getItem('clean-flip-recent-searches') || '[]'
);
```

#### Shopping Preferences
```typescript
// Key: 'clean-flip-preferences'
// Value: UserPreferences object
interface UserPreferences {
  preferredCurrency: 'USD';
  notifications: boolean;
  emailUpdates: boolean;
  theme: 'light' | 'dark' | 'system';
}
```

#### Cart Persistence (Guests)
```typescript
// Key: 'clean-flip-guest-cart'
// Value: CartItem[]
// Migrated to database on user login
```

### Session Storage Usage

#### Navigation State
```typescript
// Scroll position restoration
const scrollKey = `scroll-${location}`;
sessionStorage.setItem(scrollKey, window.scrollY.toString());
```

#### Form State Preservation
```typescript
// Temporary form data during page navigation
const formStateKey = 'form-state-product-submission';
sessionStorage.setItem(formStateKey, JSON.stringify(formData));
```

---

## 7. Business Logic Documentation

### Cart System

#### Add to Cart Logic
```typescript
// client/src/hooks/use-cart.tsx
async function addItem(productId: string, quantity: number = 1) {
  // 1. Validate product availability
  const product = await queryClient.fetchQuery({
    queryKey: ["/api/products", productId]
  });
  
  if (!product || product.stockQuantity < 1) {
    throw new Error('Product not available');
  }
  
  // 2. Check existing cart item
  const existingItem = items.find(item => item.productId === productId);
  
  if (existingItem) {
    // Update quantity instead of creating duplicate
    const newQuantity = existingItem.quantity + quantity;
    if (newQuantity > product.stockQuantity) {
      throw new Error(`Only ${product.stockQuantity} items available`);
    }
    
    await updateQuantity(existingItem.id, newQuantity);
  } else {
    // Add new item
    await addItemMutation.mutateAsync({
      productId,
      quantity
    });
  }
  
  // 3. Broadcast update via WebSocket
  broadcastCartUpdate(userId, 'add', { productId, quantity });
  
  // 4. Show success notification
  toast({
    title: "Added to cart",
    description: `${product.name} has been added to your cart.`
  });
}
```

#### Cart Persistence Method
```typescript
// server/storage.ts - Cart operations
class DatabaseStorage {
  async getCartItems(userId?: string, sessionId?: string): Promise<CartItem[]> {
    // Prioritize user-specific cart over session cart
    const whereClause = userId 
      ? eq(cartItems.userId, userId)
      : eq(cartItems.sessionId, sessionId);
    
    return await db.select({
      cartItem: cartItems,
      product: products
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(and(whereClause, eq(products.status, 'active')));
  }
  
  async migrateGuestCart(sessionId: string, userId: string): Promise<void> {
    // Transfer guest cart items to user account on login
    await db.update(cartItems)
      .set({ 
        userId, 
        sessionId: null, 
        updatedAt: new Date() 
      })
      .where(eq(cartItems.sessionId, sessionId));
  }
}
```

#### Stock Validation
```typescript
// server/routes.ts - Add to cart endpoint
app.post("/api/cart", async (req, res) => {
  const { productId, quantity } = req.body;
  
  // 1. Get current product stock
  const product = await storage.getProduct(productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  // 2. Check availability
  if (product.stockQuantity < quantity) {
    return res.status(400).json({ 
      error: 'Insufficient stock',
      available: product.stockQuantity,
      requested: quantity
    });
  }
  
  // 3. Check existing cart quantity
  const existingItem = await storage.getCartItem(userId, sessionId, productId);
  const totalQuantity = (existingItem?.quantity || 0) + quantity;
  
  if (totalQuantity > product.stockQuantity) {
    return res.status(400).json({
      error: 'Would exceed available stock',
      maxQuantity: product.stockQuantity,
      currentInCart: existingItem?.quantity || 0
    });
  }
  
  // 4. Add or update cart item
  const cartItem = await storage.addToCart({
    userId,
    sessionId,
    productId,
    quantity,
    priceAtTime: product.price
  });
  
  res.json(cartItem);
});
```

#### Price Calculation
```typescript
// Cart total calculation with tax and shipping
function calculateCartTotal(items: CartItem[]): CartSummary {
  const subtotal = items.reduce((sum, item) => 
    sum + (item.priceAtTime * item.quantity), 0
  );
  
  // Tax calculation (8.25% for NC, 0% for other states)
  const taxRate = isLocalCustomer ? 0.0825 : 0;
  const taxAmount = subtotal * taxRate;
  
  // Shipping calculation
  const shippingAmount = calculateShipping(items, isLocalCustomer);
  
  return {
    subtotal: subtotal.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    shippingAmount: shippingAmount.toFixed(2),
    total: (subtotal + taxAmount + shippingAmount).toFixed(2)
  };
}

function calculateShipping(items: CartItem[], isLocal: boolean): number {
  if (isLocal) return 0; // Free local delivery
  
  const totalWeight = items.reduce((sum, item) => 
    sum + ((item.product.weight || 0) * item.quantity), 0
  );
  
  // Weight-based shipping rates
  if (totalWeight <= 50) return 15.99;
  if (totalWeight <= 100) return 29.99;
  return 49.99; // Heavy equipment shipping
}
```

### Checkout Process

#### Step 1: Cart Validation
```typescript
// Validate cart before checkout
async function validateCheckout(cartItems: CartItem[]): Promise<ValidationResult> {
  const errors: string[] = [];
  
  for (const item of cartItems) {
    // Check product availability
    const product = await storage.getProduct(item.productId);
    if (!product || product.status !== 'active') {
      errors.push(`${item.product.name} is no longer available`);
      continue;
    }
    
    // Check stock quantity
    if (product.stockQuantity < item.quantity) {
      errors.push(`Only ${product.stockQuantity} of ${item.product.name} available`);
    }
    
    // Check price changes
    if (item.priceAtTime !== product.price) {
      errors.push(`Price for ${item.product.name} has changed`);
    }
  }
  
  return { isValid: errors.length === 0, errors };
}
```

#### Step 2: Payment Processing with Stripe
```typescript
// Create payment intent
app.post("/api/create-payment-intent", requireAuth, requireCompleteProfile, async (req, res) => {
  const { amount, currency = "usd", metadata } = req.body;
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        userId: req.user.id,
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
      // Add customer if exists
      customer: req.user.stripeCustomerId || undefined
    });
    
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Step 3: Order Creation Logic
```typescript
// Create order after successful payment
async function createOrderFromCart(userId: string, paymentIntentId: string): Promise<Order> {
  return await db.transaction(async (tx) => {
    // 1. Get cart items
    const cartItems = await storage.getCartItems(userId);
    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }
    
    // 2. Calculate totals
    const { subtotal, taxAmount, shippingAmount, total } = calculateCartTotal(cartItems);
    
    // 3. Create order
    const order = await tx.insert(orders).values({
      userId,
      orderNumber: generateOrderNumber(),
      status: 'paid',
      subtotalAmount: parseFloat(subtotal),
      taxAmount: parseFloat(taxAmount),
      shippingAmount: parseFloat(shippingAmount),
      totalAmount: parseFloat(total),
      stripePaymentIntentId: paymentIntentId,
      shippingAddress: user.shippingAddress,
      billingAddress: user.billingAddress
    }).returning();
    
    // 4. Create order items
    const orderItems = cartItems.map(item => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      priceAtTime: item.priceAtTime,
      productName: item.product.name
    }));
    
    await tx.insert(orderItems).values(orderItems);
    
    // 5. Update product stock
    for (const item of cartItems) {
      await tx.update(products)
        .set({ 
          stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`,
          salesCount: sql`${products.salesCount} + ${item.quantity}`
        })
        .where(eq(products.id, item.productId));
    }
    
    // 6. Clear cart
    await tx.delete(cartItems).where(eq(cartItems.userId, userId));
    
    return order;
  });
}
```

#### Step 4: Inventory Updates
```typescript
// Automatic inventory management
async function updateInventoryAfterSale(orderItems: OrderItem[]): Promise<void> {
  for (const item of orderItems) {
    await db.update(products)
      .set({
        stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`,
        salesCount: sql`${products.salesCount} + ${item.quantity}`,
        updatedAt: new Date()
      })
      .where(eq(products.id, item.productId));
    
    // Check for low stock alerts
    const product = await storage.getProduct(item.productId);
    if (product.stockQuantity <= 5) {
      await sendLowStockAlert(product);
    }
    
    // Mark as sold out if stock reaches 0
    if (product.stockQuantity === 0) {
      await db.update(products)
        .set({ status: 'sold' })
        .where(eq(products.id, item.productId));
    }
  }
}
```

#### Step 5: Email Notifications
```typescript
// Order confirmation email
async function sendOrderConfirmation(order: Order): Promise<void> {
  const user = await storage.getUser(order.userId);
  const orderItems = await storage.getOrderItems(order.id);
  
  await resend.emails.send({
    from: 'orders@cleanflip.com',
    to: user.email,
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: await renderOrderConfirmationEmail({
      user,
      order,
      orderItems,
      trackingUrl: `${process.env.FRONTEND_URL}/orders/${order.id}`
    })
  });
}
```

### Search System

#### PostgreSQL tsvector Configuration
```sql
-- Update search vector on product changes
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(NEW.features, ' ')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic search vector updates
CREATE TRIGGER update_product_search_vector_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_search_vector();

-- GIN index for fast full-text search
CREATE INDEX idx_products_search_vector ON products USING GIN(search_vector);
```

#### Search Implementation Details
```typescript
// server/config/search.ts
export async function searchProducts(query: string, filters?: SearchFilters): Promise<SearchResult> {
  const searchQuery = query
    .split(' ')
    .filter(term => term.length > 2)
    .map(term => `${term}:*`)
    .join(' & ');
  
  let whereClause = sql`${products.searchVector} @@ to_tsquery('english', ${searchQuery})`;
  
  // Add filters
  if (filters.categoryId) {
    whereClause = and(whereClause, eq(products.categoryId, filters.categoryId));
  }
  
  if (filters.condition) {
    whereClause = and(whereClause, eq(products.condition, filters.condition));
  }
  
  if (filters.priceMin || filters.priceMax) {
    whereClause = and(
      whereClause,
      filters.priceMin ? gte(products.price, filters.priceMin) : undefined,
      filters.priceMax ? lte(products.price, filters.priceMax) : undefined
    );
  }
  
  const results = await db.select({
    product: products,
    category: categories,
    rank: sql<number>`ts_rank(${products.searchVector}, to_tsquery('english', ${searchQuery}))`
  })
  .from(products)
  .leftJoin(categories, eq(products.categoryId, categories.id))
  .where(whereClause)
  .orderBy(sql`rank DESC`, desc(products.createdAt))
  .limit(filters.limit || 20)
  .offset(filters.offset || 0);
  
  return {
    products: results.map(r => r.product),
    total: results.length,
    query: query
  };
}
```

#### Search Ranking Logic
1. **Name matches (Weight A):** Highest priority
2. **Description matches (Weight B):** High priority  
3. **Brand matches (Weight C):** Medium priority
4. **Feature matches (Weight D):** Low priority
5. **Recency:** Newer products ranked higher for tie-breaking

#### Filter Implementation
```typescript
// Advanced filtering with URL state persistence
interface SearchFilters {
  category?: string;
  condition?: ProductCondition[];
  priceMin?: number;
  priceMax?: number;
  brand?: string[];
  inStock?: boolean;
  featured?: boolean;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'popular';
}

// URL serialization
function serializeFilters(filters: SearchFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      params.set(key, value.join(','));
    } else if (value !== undefined) {
      params.set(key, value.toString());
    }
  });
  return params.toString();
}
```

### Admin Features

#### Product CRUD Operations
```typescript
// Create product with Stripe sync
async function createProduct(productData: InsertProduct): Promise<Product> {
  return await db.transaction(async (tx) => {
    // 1. Create local product
    const product = await tx.insert(products).values(productData).returning();
    
    // 2. Create Stripe product
    if (process.env.STRIPE_SECRET_KEY) {
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
        images: product.images,
        metadata: {
          localProductId: product.id
        }
      });
      
      const stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(product.price * 100),
        currency: 'usd'
      });
      
      // 3. Update local product with Stripe IDs
      await tx.update(products)
        .set({
          stripeProductId: stripeProduct.id,
          stripePriceId: stripePrice.id
        })
        .where(eq(products.id, product.id));
    }
    
    // 4. Update category product count
    await tx.update(categories)
      .set({ 
        productCount: sql`${categories.productCount} + 1` 
      })
      .where(eq(categories.id, product.categoryId));
    
    return product;
  });
}
```

#### Order Management Workflow
```typescript
// Order status transitions
const ORDER_STATUS_TRANSITIONS = {
  'pending': ['paid', 'cancelled'],
  'paid': ['processing', 'cancelled'],
  'processing': ['shipped', 'cancelled'],
  'shipped': ['delivered', 'returned'],
  'delivered': ['completed', 'returned'],
  'cancelled': [], // Terminal state
  'refunded': [], // Terminal state
  'completed': [] // Terminal state
};

async function updateOrderStatus(orderId: string, newStatus: OrderStatus, adminId: string): Promise<void> {
  const order = await storage.getOrder(orderId);
  const allowedTransitions = ORDER_STATUS_TRANSITIONS[order.status];
  
  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(`Cannot transition from ${order.status} to ${newStatus}`);
  }
  
  await db.transaction(async (tx) => {
    // Update order status
    await tx.update(orders)
      .set({ 
        status: newStatus,
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId));
    
    // Log status change
    await tx.insert(orderTracking).values({
      orderId,
      status: newStatus,
      notes: `Status updated by admin ${adminId}`,
      createdAt: new Date()
    });
    
    // Send customer notification
    await sendOrderStatusUpdate(order, newStatus);
  });
}
```

#### Dashboard Metrics Calculations
```typescript
// Real-time dashboard metrics
async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [
    totalProducts,
    totalUsers,
    totalOrders,
    revenueData,
    lowStockProducts
  ] = await Promise.all([
    // Product count
    db.select({ count: count() }).from(products).where(eq(products.status, 'active')),
    
    // User count (last 30 days)
    db.select({ count: count() }).from(users)
      .where(gte(users.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))),
    
    // Order count (last 30 days)
    db.select({ count: count() }).from(orders)
      .where(gte(orders.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))),
    
    // Revenue calculation
    db.select({ 
      revenue: sum(orders.totalAmount),
      orderCount: count()
    }).from(orders)
      .where(and(
        gte(orders.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        inArray(orders.status, ['paid', 'processing', 'shipped', 'delivered'])
      )),
    
    // Low stock alerts
    db.select().from(products)
      .where(and(
        eq(products.status, 'active'),
        lte(products.stockQuantity, 5)
      ))
  ]);
  
  return {
    products: {
      total: totalProducts[0].count,
      lowStock: lowStockProducts.length
    },
    users: {
      total: totalUsers[0].count,
      growth: calculateGrowthRate('users', 30)
    },
    orders: {
      total: totalOrders[0].count,
      revenue: revenueData[0]?.revenue || 0
    },
    alerts: lowStockProducts.map(p => ({
      type: 'low_stock',
      message: `${p.name} has only ${p.stockQuantity} items left`,
      productId: p.id
    }))
  };
}
```

---

## 8. External Integrations

### Stripe Payment Processing

#### Configuration
```typescript
// server/routes.ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil" as any,
});
```

#### API Calls Made
| Endpoint | Purpose | Frequency | Error Handling |
|----------|---------|-----------|----------------|
| `stripe.products.create()` | Create product in Stripe | On product creation | Rollback local product |
| `stripe.prices.create()` | Create price for product | On product creation | Update without price |
| `stripe.customers.create()` | Create customer profile | On user registration | Continue without Stripe ID |
| `stripe.paymentIntents.create()` | Process payments | Per checkout | Show payment error |
| `stripe.paymentIntents.list()` | Admin transaction view | Dashboard load | Show cached data |
| `stripe.webhooks.constructEvent()` | Handle webhooks | Real-time | Log and retry |

#### Webhook Handling
```typescript
// POST /api/stripe/webhook
app.post("/api/stripe/webhook", express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    Logger.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;
    case 'customer.created':
      await syncCustomerData(event.data.object);
      break;
    default:
      Logger.warn(`Unhandled event type: ${event.type}`);
  }

  res.json({received: true});
});
```

#### Product Sync Logic
```typescript
// Automatic product synchronization
export const autoSyncProducts = async (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' && req.path.includes('/api/products')) {
    res.on('finish', async () => {
      if (res.statusCode === 201) {
        try {
          await syncProductToStripe(res.locals.createdProduct);
        } catch (error) {
          Logger.error('Failed to sync product to Stripe:', error);
        }
      }
    });
  }
  next();
};
```

### Cloudinary Image Management

#### Upload Configuration
```typescript
// server/config/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Multer configuration for file uploads
const storage = multer.memoryStorage();
export const imageUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 8 // Maximum 8 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});
```

#### Image Optimization Process
```typescript
// server/routes.ts - Image upload endpoint
async function uploadToCloudinary(buffer: Buffer, filename: string, folder: string): Promise<string> {
  // Sharp optimization before upload
  const optimizedBuffer = await sharp(buffer)
    .resize(1200, 1200, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .jpeg({ 
      quality: 85,
      progressive: true 
    })
    .toBuffer();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: `${Date.now()}-${filename.replace(/\.[^/.]+$/, '')}`,
        resource_type: 'image',
        transformation: [
          { 
            width: 1200, 
            height: 1200, 
            crop: 'limit',
            quality: 'auto:good',
            fetch_format: 'auto'
          }
        ],
        tags: [folder],
        context: {
          upload_source: 'clean_flip_app',
          upload_date: new Date().toISOString()
        }
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );
    
    uploadStream.end(optimizedBuffer);
  });
}
```

#### Image Transformation URLs
```typescript
// Dynamic image transformations
const getOptimizedImageUrl = (publicId: string, options: TransformOptions) => {
  const transformations = [];
  
  if (options.width || options.height) {
    transformations.push(`w_${options.width || 'auto'},h_${options.height || 'auto'},c_fill`);
  }
  
  if (options.quality) {
    transformations.push(`q_${options.quality}`);
  }
  
  transformations.push('f_auto'); // Auto format
  
  return cloudinary.url(publicId, {
    transformation: transformations
  });
};

// Usage in components
const productImageUrl = getOptimizedImageUrl(product.images[0], {
  width: 400,
  height: 400,
  quality: 'auto:good'
});
```

### Resend Email Service

#### Configuration
```typescript
// server/config/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_TEMPLATES = {
  ORDER_CONFIRMATION: 'order-confirmation',
  PASSWORD_RESET: 'password-reset',
  WELCOME: 'welcome',
  LOW_STOCK_ALERT: 'low-stock-alert'
};
```

#### Email Templates and Logic
```typescript
// Order confirmation email
export async function sendOrderConfirmation(order: Order, user: User): Promise<void> {
  const orderItems = await storage.getOrderItems(order.id);
  
  await resend.emails.send({
    from: 'Clean & Flip <orders@cleanflip.com>',
    to: user.email,
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Thank you for your order!</h1>
        <p>Hi ${user.firstName},</p>
        <p>We've received your order and it's being processed.</p>
        
        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
          <h2>Order Details</h2>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Total:</strong> $${order.totalAmount}</p>
          <p><strong>Status:</strong> ${order.status}</p>
        </div>
        
        <h3>Items Ordered:</h3>
        ${orderItems.map(item => `
          <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
            <p><strong>${item.productName}</strong></p>
            <p>Quantity: ${item.quantity} × $${item.priceAtTime} = $${(item.quantity * item.priceAtTime).toFixed(2)}</p>
          </div>
        `).join('')}
        
        <p>Track your order: <a href="${process.env.FRONTEND_URL}/orders/${order.id}">View Order</a></p>
        
        <p>Thanks,<br>The Clean & Flip Team</p>
      </div>
    `
  });
}

// Password reset email
export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  await resend.emails.send({
    from: 'Clean & Flip <auth@cleanflip.com>',
    to: email,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Reset Your Password</h1>
        <p>You requested a password reset for your Clean & Flip account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `
  });
}
```

### Neon PostgreSQL Database

#### Connection Configuration
```typescript
// server/db.ts
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const db = drizzle({ client: pool, schema });
```

#### Connection Pooling
```typescript
// Connection pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // Maximum connections
  min: 5,  // Minimum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
```

#### SSL Configuration
```typescript
// Production SSL settings
const sslConfig = process.env.NODE_ENV === 'production' ? {
  ssl: {
    rejectUnauthorized: false,
    ca: process.env.DATABASE_CA_CERT,
    cert: process.env.DATABASE_CLIENT_CERT,
    key: process.env.DATABASE_CLIENT_KEY
  }
} : {};
```

### Geoapify Address Search

#### API Integration
```typescript
// client/src/components/ui/address-autocomplete.tsx
useEffect(() => {
  if (debouncedInput.length < 3) {
    setSuggestions([]);
    return;
  }

  const searchAddresses = async () => {
    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
      
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?` +
        `text=${encodeURIComponent(debouncedInput)}&` +
        `filter=countrycode:us&` +
        `format=json&` +
        `apiKey=${apiKey}`
      );
      
      const data = await response.json();
      
      if (data.results && Array.isArray(data.results)) {
        setSuggestions(data.results);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  searchAddresses();
}, [debouncedInput]);
```

#### Address Parsing Logic
```typescript
const parseAddress = (result: any): ParsedAddress => {
  const streetNumber = result.housenumber || '';
  const streetName = result.street || '';
  const street = `${streetNumber} ${streetName}`.trim();
  const city = result.city || result.town || result.village || '';
  const state = result.state_code || result.state || '';
  const zipCode = result.postcode || '';
  
  return {
    street,
    city,
    state,
    zipCode,
    fullAddress: `${street}, ${city}, ${state} ${zipCode}`,
    coordinates: {
      lat: result.lat,
      lng: result.lon
    }
  };
};

const isLocalCustomer = (address: ParsedAddress): boolean => {
  const ashevilleZips = [
    '28801', '28802', '28803', '28804', '28805', '28806',
    '28810', '28813', '28814', '28815', '28816'
  ];
  return ashevilleZips.includes(address.zipCode);
};
```

---

## 9. UI/UX Specifications

### Design System Tokens

#### Colors (CSS Variables)
```css
:root {
  /* Primary Colors */
  --primary: 222.2 84% 4.9%;           /* #020817 - Dark blue */
  --primary-foreground: 210 40% 98%;   /* #F8FAFC - Light text */
  
  /* Secondary Colors */
  --secondary: 210 40% 96%;            /* #F1F5F9 - Light gray */
  --secondary-foreground: 222.2 84% 4.9%; /* #020817 - Dark text */
  
  /* Accent Colors */
  --accent: 210 40% 96%;               /* #F1F5F9 */
  --accent-foreground: 222.2 84% 4.9%; /* #020817 */
  
  /* Muted Colors */
  --muted: 210 40% 96%;                /* #F1F5F9 */
  --muted-foreground: 215.4 16.3% 46.9%; /* #64748B */
  
  /* Destructive Colors */
  --destructive: 0 84.2% 60.2%;        /* #EF4444 - Red */
  --destructive-foreground: 210 40% 98%; /* #F8FAFC */
  
  /* Background */
  --background: 0 0% 100%;             /* #FFFFFF */
  --foreground: 222.2 84% 4.9%;        /* #020817 */
  
  /* Card */
  --card: 0 0% 100%;                   /* #FFFFFF */
  --card-foreground: 222.2 84% 4.9%;   /* #020817 */
  
  /* Border */
  --border: 214.3 31.8% 91.4%;        /* #E2E8F0 */
  --input: 214.3 31.8% 91.4%;         /* #E2E8F0 */
  
  /* Ring */
  --ring: 222.2 84% 4.9%;              /* #020817 */
  
  /* Chart Colors */
  --chart-1: 12 76% 61%;               /* #E16259 */
  --chart-2: 173 58% 39%;              /* #3D9970 */
  --chart-3: 197 37% 24%;              /* #2C5F2D */
  --chart-4: 43 74% 66%;               /* #F39C12 */
  --chart-5: 27 87% 67%;               /* #E67E22 */
}

.dark {
  --background: 222.2 84% 4.9%;        /* #020817 */
  --foreground: 210 40% 98%;           /* #F8FAFC */
  --card: 222.2 84% 4.9%;              /* #020817 */
  --card-foreground: 210 40% 98%;      /* #F8FAFC */
  --primary: 210 40% 98%;              /* #F8FAFC */
  --primary-foreground: 222.2 84% 4.9%; /* #020817 */
  --secondary: 217.2 32.6% 17.5%;      /* #1E293B */
  --secondary-foreground: 210 40% 98%; /* #F8FAFC */
  --muted: 217.2 32.6% 17.5%;          /* #1E293B */
  --muted-foreground: 215 20.2% 65.1%; /* #94A3B8 */
  --accent: 217.2 32.6% 17.5%;         /* #1E293B */
  --accent-foreground: 210 40% 98%;    /* #F8FAFC */
  --destructive: 0 62.8% 30.6%;        /* #7F1D1D */
  --destructive-foreground: 210 40% 98%; /* #F8FAFC */
  --border: 217.2 32.6% 17.5%;         /* #1E293B */
  --input: 217.2 32.6% 17.5%;          /* #1E293B */
  --ring: 212.7 26.8% 83.9%;           /* #CBD5E1 */
}
```

#### Typography Scale
```css
/* Font Sizes */
.text-xs { font-size: 0.75rem; line-height: 1rem; }      /* 12px */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }  /* 14px */
.text-base { font-size: 1rem; line-height: 1.5rem; }     /* 16px */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }  /* 18px */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }   /* 20px */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }      /* 24px */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; } /* 30px */
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }   /* 36px */

/* Font Weights */
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
```

#### Spacing System
```css
/* Spacing Scale (rem values) */
.p-1 { padding: 0.25rem; }    /* 4px */
.p-2 { padding: 0.5rem; }     /* 8px */
.p-3 { padding: 0.75rem; }    /* 12px */
.p-4 { padding: 1rem; }       /* 16px */
.p-6 { padding: 1.5rem; }     /* 24px */
.p-8 { padding: 2rem; }       /* 32px */
.p-12 { padding: 3rem; }      /* 48px */
.p-16 { padding: 4rem; }      /* 64px */

/* Container Sizes */
.container { 
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .container { max-width: 640px; padding: 0 1.5rem; }
}

@media (min-width: 768px) {
  .container { max-width: 768px; }
}

@media (min-width: 1024px) {
  .container { max-width: 1024px; }
}

@media (min-width: 1280px) {
  .container { max-width: 1280px; }
}
```

### Component Specifications

#### UnifiedButton
```css
/* Base Button Styles */
.btn-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  border-radius: 0.375rem; /* 6px */
  font-size: 0.875rem;     /* 14px */
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  border: 1px solid transparent;
}

/* Size Variants */
.btn-sm {
  height: 2.25rem;    /* 36px */
  padding: 0 0.75rem; /* 12px horizontal */
  font-size: 0.875rem; /* 14px */
}

.btn-default {
  height: 2.5rem;     /* 40px */
  padding: 0 1rem;    /* 16px horizontal */
  font-size: 0.875rem; /* 14px */
}

.btn-lg {
  height: 2.75rem;    /* 44px */
  padding: 0 2rem;    /* 32px horizontal */
  font-size: 1rem;    /* 16px */
}

/* Variant Styles */
.btn-primary {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.btn-primary:hover {
  background-color: hsl(var(--primary) / 0.9);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px hsl(var(--primary) / 0.4);
}

.btn-secondary {
  background-color: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
  border: 1px solid hsl(var(--border));
}

.btn-secondary:hover {
  background-color: hsl(var(--secondary) / 0.8);
}

.btn-destructive {
  background-color: hsl(var(--destructive));
  color: hsl(var(--destructive-foreground));
}

.btn-destructive:hover {
  background-color: hsl(var(--destructive) / 0.9);
}

.btn-outline {
  border: 1px solid hsl(var(--border));
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}

.btn-outline:hover {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}

/* Ghost Variant */
.btn-ghost {
  background-color: transparent;
  color: hsl(var(--foreground));
}

.btn-ghost:hover {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}

/* Disabled State */
.btn-disabled {
  pointer-events: none;
  opacity: 0.5;
}

/* Loading State */
.btn-loading {
  color: transparent;
  position: relative;
}

.btn-loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: button-loading-spinner 1s ease infinite;
}

@keyframes button-loading-spinner {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

#### ProductCard
```css
.product-card {
  /* Dimensions */
  width: 100%;
  max-width: 300px;
  
  /* Layout */
  display: flex;
  flex-direction: column;
  
  /* Styling */
  background-color: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem; /* 8px */
  overflow: hidden;
  
  /* Effects */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-color: hsl(var(--ring));
}

.product-card-image {
  /* Dimensions */
  width: 100%;
  height: 200px;
  
  /* Layout */
  position: relative;
  overflow: hidden;
  
  /* Background */
  background-color: hsl(var(--muted));
}

.product-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-card-image img {
  transform: scale(1.05);
}

.product-card-content {
  /* Layout */
  padding: 1rem; /* 16px */
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-card-title {
  /* Typography */
  font-size: 1rem;      /* 16px */
  font-weight: 600;
  line-height: 1.25;
  color: hsl(var(--foreground));
  
  /* Layout */
  margin-bottom: 0.5rem; /* 8px */
  
  /* Truncation */
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-card-price {
  /* Typography */
  font-size: 1.25rem;   /* 20px */
  font-weight: 700;
  color: hsl(var(--primary));
  
  /* Layout */
  margin-top: auto;
}

.product-card-badge {
  /* Position */
  position: absolute;
  top: 0.5rem;    /* 8px */
  right: 0.5rem;  /* 8px */
  
  /* Styling */
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  padding: 0.25rem 0.5rem; /* 4px 8px */
  border-radius: 0.25rem;  /* 4px */
  font-size: 0.75rem;      /* 12px */
  font-weight: 500;
}
```

#### UnifiedDataTable
```css
.data-table {
  /* Layout */
  width: 100%;
  border-collapse: collapse;
  
  /* Styling */
  background-color: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem; /* 8px */
  overflow: hidden;
}

.data-table-header {
  background-color: hsl(var(--muted));
  border-bottom: 1px solid hsl(var(--border));
}

.data-table-header th {
  /* Layout */
  padding: 0.75rem 1rem; /* 12px 16px */
  text-align: left;
  
  /* Typography */
  font-size: 0.875rem;   /* 14px */
  font-weight: 600;
  color: hsl(var(--muted-foreground));
  
  /* Sorting indicators */
  position: relative;
  cursor: pointer;
  user-select: none;
}

.data-table-header th:hover {
  background-color: hsl(var(--muted) / 0.8);
}

.data-table-header th.sortable::after {
  content: '↕';
  position: absolute;
  right: 0.5rem;
  opacity: 0.5;
}

.data-table-header th.sorted-asc::after {
  content: '↑';
  opacity: 1;
}

.data-table-header th.sorted-desc::after {
  content: '↓';
  opacity: 1;
}

.data-table-body tr {
  border-bottom: 1px solid hsl(var(--border));
  transition: background-color 0.2s ease;
}

.data-table-body tr:hover {
  background-color: hsl(var(--muted) / 0.3);
}

.data-table-body td {
  /* Layout */
  padding: 0.75rem 1rem; /* 12px 16px */
  
  /* Typography */
  font-size: 0.875rem;   /* 14px */
  color: hsl(var(--foreground));
}

.data-table-body tr:last-child {
  border-bottom: none;
}
```

### Mobile Responsive Breakpoints

#### Breakpoint System
```css
/* Mobile First Approach */
/* Default: 0px - 639px (Mobile) */

/* Small tablets: 640px+ */
@media (min-width: 640px) {
  .container { max-width: 640px; }
  .grid-cols-sm-2 { grid-template-columns: repeat(2, 1fr); }
  .text-sm-lg { font-size: 1.125rem; }
}

/* Tablets: 768px+ */
@media (min-width: 768px) {
  .container { max-width: 768px; }
  .grid-cols-md-3 { grid-template-columns: repeat(3, 1fr); }
  .hidden-md { display: none; }
  .block-md { display: block; }
}

/* Small laptops: 1024px+ */
@media (min-width: 1024px) {
  .container { max-width: 1024px; }
  .grid-cols-lg-4 { grid-template-columns: repeat(4, 1fr); }
  .px-lg-8 { padding-left: 2rem; padding-right: 2rem; }
}

/* Desktops: 1280px+ */
@media (min-width: 1280px) {
  .container { max-width: 1280px; }
  .grid-cols-xl-5 { grid-template-columns: repeat(5, 1fr); }
}

/* Large desktops: 1536px+ */
@media (min-width: 1536px) {
  .container { max-width: 1536px; }
  .grid-cols-2xl-6 { grid-template-columns: repeat(6, 1fr); }
}
```

#### Mobile Navigation
```css
.mobile-nav {
  /* Mobile only (hidden on larger screens) */
  display: block;
}

@media (min-width: 768px) {
  .mobile-nav {
    display: none;
  }
}

.mobile-nav-toggle {
  /* Hamburger menu button */
  width: 2rem;    /* 32px */
  height: 2rem;   /* 32px */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.mobile-nav-toggle span {
  width: 1.5rem;  /* 24px */
  height: 2px;
  background-color: hsl(var(--foreground));
  transition: all 0.3s ease;
  margin: 2px 0;
}

/* Hamburger to X animation */
.mobile-nav-toggle.open span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.mobile-nav-toggle.open span:nth-child(2) {
  opacity: 0;
}

.mobile-nav-toggle.open span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

.mobile-nav-menu {
  /* Full screen overlay */
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: hsl(var(--background));
  z-index: 50;
  
  /* Animation */
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.mobile-nav-menu.open {
  transform: translateX(0);
}
```

### Animation and Transition Details

#### Framer Motion Variants
```typescript
// Page transition animations
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  in: {
    opacity: 1,
    y: 0
  },
  out: {
    opacity: 0,
    y: -20
  }
};

export const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4
};

// Modal animations
export const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
};

// Cart drawer animation
export const drawerVariants = {
  hidden: {
    x: "100%"
  },
  visible: {
    x: 0,
    transition: {
      type: "spring",
      damping: 30,
      stiffness: 300
    }
  },
  exit: {
    x: "100%",
    transition: {
      duration: 0.3
    }
  }
};

// Stagger animation for product grid
export const gridVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const gridItemVariants = {
  hidden: {
    opacity: 0,
    y: 30
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4
    }
  }
};
```

#### CSS Animations
```css
/* Loading spinner */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Pulse animation for loading states */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Bounce animation for notifications */
@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
    transform: translate3d(0,0,0);
  }
  40%, 43% {
    animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
    transform: translate3d(0, -30px, 0);
  }
  70% {
    animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
    transform: translate3d(0, -15px, 0);
  }
  90% {
    transform: translate3d(0,-4px,0);
  }
}

.animate-bounce {
  animation: bounce 1s ease infinite;
}

/* Fade in/out transitions */
.fade-enter {
  opacity: 0;
}

.fade-enter-active {
  opacity: 1;
  transition: opacity 0.3s ease;
}

.fade-exit {
  opacity: 1;
}

.fade-exit-active {
  opacity: 0;
  transition: opacity 0.3s ease;
}

/* Slide transitions */
.slide-enter {
  transform: translateX(100%);
}

.slide-enter-active {
  transform: translateX(0);
  transition: transform 0.3s ease;
}

.slide-exit {
  transform: translateX(0);
}

.slide-exit-active {
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}
```

---

## 10. Forms Documentation

### Authentication Forms

#### Login Form
**Location:** `client/src/pages/auth.tsx`

**Form Schema:**
```typescript
const loginSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
});

type LoginFormData = z.infer<typeof loginSchema>;
```

**Field Validation Rules:**
| Field | Rules | Error Messages |
|-------|-------|----------------|
| Email | Required, valid email format | "Please enter a valid email address" |
| Password | Min 8 chars, max 128 chars | "Password must be at least 8 characters" |

**Form Implementation:**
```typescript
const form = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
  defaultValues: {
    email: "",
    password: ""
  }
});

const onSubmit = async (data: LoginFormData) => {
  try {
    await loginMutation.mutateAsync(data);
    navigate('/dashboard');
  } catch (error) {
    form.setError('root', {
      message: error.message || 'Login failed'
    });
  }
};
```

**Success Flow:**
1. Form validates client-side
2. API call to `/api/auth/login`
3. Session created on success
4. Redirect to dashboard or intended page
5. Auth context updated

**Error Flow:**
1. Validation errors shown inline
2. API errors shown as toast notifications
3. Rate limiting errors (429) show cooldown message
4. Form remains enabled for retry

#### Registration Form
**Location:** `client/src/pages/auth.tsx`

**Form Schema:**
```typescript
const registerSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirmPassword: z.string(),
  firstName: z.string()
    .min(1, "First name is required")
    .max(50, "First name too long"),
  lastName: z.string()
    .min(1, "Last name is required")
    .max(50, "Last name too long"),
  acceptTerms: z.boolean()
    .refine(val => val === true, "You must accept the terms and conditions")
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- Maximum 128 characters

#### Password Reset Form
**Location:** `client/src/pages/forgot-password.tsx`

**Form Schema:**
```typescript
const forgotPasswordSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address")
    .min(1, "Email is required")
});
```

**Reset Process:**
1. User enters email
2. System generates secure token
3. Email sent with reset link
4. Link expires in 1 hour
5. User sets new password

### Product Management Forms

#### Product Creation Form
**Location:** `client/src/pages/admin/ProductForm.tsx`

**Form Schema:**
```typescript
const productSchema = z.object({
  name: z.string()
    .min(1, "Product name is required")
    .max(200, "Product name too long"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description too long"),
  price: z.number()
    .min(0.01, "Price must be greater than $0.01")
    .max(99999.99, "Price too high"),
  categoryId: z.string()
    .min(1, "Please select a category"),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'needs_repair']),
  stockQuantity: z.number()
    .int("Stock quantity must be a whole number")
    .min(0, "Stock quantity cannot be negative")
    .max(9999, "Stock quantity too high"),
  brand: z.string()
    .max(100, "Brand name too long")
    .optional(),
  model: z.string()
    .max(100, "Model name too long")
    .optional(),
  weight: z.number()
    .min(0, "Weight cannot be negative")
    .max(9999, "Weight too high")
    .optional(),
  dimensions: z.string()
    .max(100, "Dimensions too long")
    .optional(),
  features: z.array(z.string())
    .max(10, "Maximum 10 features allowed"),
  images: z.array(z.string())
    .min(1, "At least one image is required")
    .max(8, "Maximum 8 images allowed"),
  isFeatured: z.boolean().default(false),
  sku: z.string()
    .regex(/^[A-Z0-9-]+$/, "SKU must contain only uppercase letters, numbers, and hyphens")
    .max(50, "SKU too long")
    .optional()
});
```

**Field Specifications:**
| Field | Type | Required | Validation | Max Length |
|-------|------|----------|------------|------------|
| Name | Text | Yes | Min 1 char | 200 |
| Description | Textarea | Yes | Min 10 chars | 2000 |
| Price | Number | Yes | $0.01 - $99,999.99 | - |
| Category | Select | Yes | Valid category ID | - |
| Condition | Select | Yes | Enum value | - |
| Stock | Number | Yes | 0 - 9999 | - |
| Brand | Text | No | - | 100 |
| Model | Text | No | - | 100 |
| Weight | Number | No | 0 - 9999 lbs | - |
| Dimensions | Text | No | - | 100 |
| Features | Array | No | Max 10 items | - |
| Images | Array | Yes | 1-8 images | - |
| SKU | Text | No | Alphanumeric + hyphens | 50 |

**Image Upload Handling:**
```typescript
const handleImageUpload = async (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => formData.append('images', file));
  
  try {
    setUploading(true);
    const response = await fetch('/api/upload/images', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const { urls } = await response.json();
    form.setValue('images', [...form.getValues('images'), ...urls]);
  } catch (error) {
    toast({
      title: "Upload Error",
      description: error.message,
      variant: "destructive"
    });
  } finally {
    setUploading(false);
  }
};
```

### Address Forms

#### Onboarding Address Form
**Location:** `client/src/pages/onboarding.tsx`

**Form Schema:**
```typescript
const addressSchema = z.object({
  street: z.string()
    .min(1, "Street address is required")
    .max(255, "Street address too long"),
  city: z.string()
    .min(1, "City is required")
    .max(100, "City name too long"),
  state: z.string()
    .length(2, "State must be 2 characters")
    .regex(/^[A-Z]{2}$/, "State must be uppercase letters"),
  zipCode: z.string()
    .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format")
    .min(5, "ZIP code is required"),
  phone: z.string()
    .regex(/^\(\d{3}\) \d{3}-\d{4}$/, "Phone format: (555) 123-4567")
    .optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});
```

**Address Autocomplete Integration:**
- Uses Geoapify API for suggestions
- Debounced input (300ms delay)
- Auto-fills all address fields
- Determines local customer status
- Stores coordinates for delivery optimization

#### Checkout Address Form
**Location:** `client/src/pages/checkout.tsx`

**Dual Address Handling:**
```typescript
const checkoutAddressSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  sameAsShipping: z.boolean().default(true)
}).refine(data => {
  if (!data.sameAsShipping && !data.billingAddress) {
    return false;
  }
  return true;
}, {
  message: "Billing address is required when different from shipping",
  path: ["billingAddress"]
});
```

### Equipment Submission Form
**Location:** `client/src/pages/sell-to-us.tsx`

**Form Schema:**
```typescript
const submissionSchema = z.object({
  // Equipment Details
  equipmentType: z.string()
    .min(1, "Equipment type is required"),
  brand: z.string()
    .min(1, "Brand is required")
    .max(100, "Brand name too long"),
  model: z.string()
    .max(100, "Model name too long")
    .optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  yearPurchased: z.number()
    .int("Year must be a whole number")
    .min(1950, "Year too old")
    .max(new Date().getFullYear(), "Year cannot be in the future")
    .optional(),
  
  // Pricing
  originalPrice: z.number()
    .min(0, "Original price cannot be negative")
    .max(99999.99, "Original price too high")
    .optional(),
  askingPrice: z.number()
    .min(1, "Asking price must be at least $1")
    .max(99999.99, "Asking price too high"),
  
  // Description
  description: z.string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description too long"),
  defects: z.string()
    .max(500, "Defects description too long")
    .optional(),
  
  // Images
  images: z.array(z.string())
    .min(2, "At least 2 images are required")
    .max(8, "Maximum 8 images allowed"),
  
  // Contact Info (pre-filled from user account)
  contactName: z.string()
    .min(1, "Contact name is required"),
  contactEmail: z.string()
    .email("Valid email required"),
  contactPhone: z.string()
    .regex(/^\(\d{3}\) \d{3}-\d{4}$/, "Phone format: (555) 123-4567"),
  
  // Pickup Details
  pickupAddress: addressSchema,
  pickupInstructions: z.string()
    .max(500, "Instructions too long")
    .optional(),
  preferredPickupDate: z.date()
    .min(new Date(), "Pickup date must be in the future")
    .optional(),
  
  // Terms
  agreeToTerms: z.boolean()
    .refine(val => val === true, "You must agree to the terms")
});
```

**Multi-Step Form Flow:**
1. **Equipment Details** - Type, brand, model, condition
2. **Pricing Information** - Original price, asking price
3. **Description & Defects** - Detailed description, known issues
4. **Photo Upload** - 2-8 high-quality images
5. **Contact Information** - Auto-filled from user account
6. **Pickup Details** - Address and special instructions
7. **Review & Submit** - Final review before submission

**Form Persistence:**
```typescript
// Save form data to sessionStorage on each step
useEffect(() => {
  const formData = form.getValues();
  sessionStorage.setItem('equipment-submission', JSON.stringify(formData));
}, [form.watch()]);

// Restore form data on page load
useEffect(() => {
  const savedData = sessionStorage.getItem('equipment-submission');
  if (savedData) {
    const parsedData = JSON.parse(savedData);
    form.reset(parsedData);
  }
}, []);
```

### Search Forms

#### Unified Search Bar
**Location:** `client/src/components/search/unified-search-bar.tsx`

**Search Validation:**
```typescript
const searchSchema = z.object({
  query: z.string()
    .min(1, "Search query cannot be empty")
    .max(100, "Search query too long")
    .refine(val => val.trim().length > 0, "Search query cannot be only spaces")
});
```

**Advanced Filter Form:**
```typescript
const filterSchema = z.object({
  category: z.string().optional(),
  condition: z.array(z.enum(['new', 'like_new', 'good', 'fair', 'needs_repair'])).optional(),
  priceMin: z.number()
    .min(0, "Minimum price cannot be negative")
    .optional(),
  priceMax: z.number()
    .min(0, "Maximum price cannot be negative")
    .optional(),
  brand: z.array(z.string()).optional(),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional()
}).refine(data => {
  if (data.priceMin && data.priceMax) {
    return data.priceMin <= data.priceMax;
  }
  return true;
}, {
  message: "Minimum price cannot be greater than maximum price",
  path: ["priceMax"]
});
```

### Form Error Handling Patterns

#### Client-Side Validation
```typescript
// Real-time validation with debouncing
const { formState: { errors }, watch, trigger } = useForm();

useEffect(() => {
  const subscription = watch((value, { name }) => {
    if (name && errors[name]) {
      // Clear error and re-validate after 500ms
      setTimeout(() => {
        trigger(name);
      }, 500);
    }
  });
  
  return () => subscription.unsubscribe();
}, [watch, errors, trigger]);
```

#### Server-Side Error Display
```typescript
// Handle API validation errors
const handleSubmitError = (error: any) => {
  if (error.status === 422 && error.data?.errors) {
    // Set field-specific errors
    Object.entries(error.data.errors).forEach(([field, message]) => {
      form.setError(field as any, {
        type: 'server',
        message: message as string
      });
    });
  } else {
    // Set general form error
    form.setError('root', {
      type: 'server',
      message: error.message || 'Something went wrong'
    });
    
    // Show toast notification
    toast({
      title: "Error",
      description: error.message || 'Something went wrong',
      variant: "destructive"
    });
  }
};
```

#### Loading States
```typescript
// Form submission loading state
const [isSubmitting, setIsSubmitting] = useState(false);

const onSubmit = async (data: FormData) => {
  setIsSubmitting(true);
  try {
    await submitMutation.mutateAsync(data);
    // Success handling
  } catch (error) {
    handleSubmitError(error);
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## 11. Security Implementations

### CORS Configuration
```typescript
// server/index.ts
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL,
      ...process.env.ALLOWED_ORIGINS?.split(',') || []
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
}));
```

### Rate Limiting Rules
```typescript
// server/middleware/rate-limiting.ts
import rateLimit from 'express-rate-limit';

// General API rate limiting
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication rate limiting
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Admin operations rate limiting
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per minute
  message: 'Too many admin requests, please slow down.',
});

// File upload rate limiting
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 uploads per minute
  message: 'Too many upload requests, please wait before uploading again.',
});
```

### Input Sanitization Methods
```typescript
// server/middleware/sanitization.ts
import { body, param, query, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';

// HTML sanitization for user content
export const sanitizeHtml = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};

// SQL injection prevention (using parameterized queries)
export const validateProductInput = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 200 })
    .escape()
    .customSanitizer(sanitizeHtml),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .customSanitizer(sanitizeHtml),
  body('price')
    .isFloat({ min: 0.01, max: 99999.99 })
    .toFloat(),
  body('categoryId')
    .isUUID()
    .trim(),
  body('sku')
    .optional()
    .matches(/^[A-Z0-9-]+$/)
    .trim()
    .toUpperCase()
];

// Path traversal prevention
export const validateFilePath = param('filename')
  .matches(/^[a-zA-Z0-9._-]+$/)
  .customSanitizer((value) => {
    // Remove any potential path traversal attempts
    return value.replace(/\.\./g, '').replace(/[\/\\]/g, '');
  });
```

### XSS Protection Measures
```typescript
// server/middleware/security.ts
import helmet from 'helmet';

// Comprehensive security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com", "wss:", "ws:"],
      frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"]
    }
  },
  crossOriginEmbedderPolicy: false, // Required for Stripe
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// XSS filtering for user inputs
export const xssFilter = (req: Request, res: Response, next: NextFunction) => {
  const recursivelyClean = (obj: any): any => {
    if (typeof obj === 'string') {
      return DOMPurify.sanitize(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(recursivelyClean);
    }
    if (obj && typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        cleaned[key] = recursivelyClean(value);
      }
      return cleaned;
    }
    return obj;
  };
  
  if (req.body) {
    req.body = recursivelyClean(req.body);
  }
  
  next();
};
```

### File Upload Restrictions
```typescript
// server/config/upload-security.ts
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 8;

export const uploadSecurity = {
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only images are allowed.'));
    }
    
    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      return cb(new Error('Invalid file extension.'));
    }
    
    // Additional security: Check magic numbers
    if (!isValidImageFile(file.buffer)) {
      return cb(new Error('File content does not match extension.'));
    }
    
    cb(null, true);
  },
  
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
    fieldNameSize: 100,
    fieldSize: 1024
  }
};

// Magic number validation
const isValidImageFile = (buffer: Buffer): boolean => {
  const jpeg = Buffer.from([0xFF, 0xD8, 0xFF]);
  const png = Buffer.from([0x89, 0x50, 0x4E, 0x47]);
  const webp = Buffer.from([0x57, 0x45, 0x42, 0x50]);
  const gif = Buffer.from([0x47, 0x49, 0x46]);
  
  return (
    buffer.subarray(0, 3).equals(jpeg) ||
    buffer.subarray(0, 4).equals(png) ||
    buffer.subarray(8, 12).equals(webp) ||
    buffer.subarray(0, 3).equals(gif)
  );
};
```

### Session Security Settings
```typescript
// server/config/session.ts
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  name: 'cleanflip.sid', // Custom session name
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on each request
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS access
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'strict' as const, // CSRF protection
    domain: process.env.COOKIE_DOMAIN // Set for subdomain sharing
  },
  store: new PostgreSQLStore({
    conString: process.env.DATABASE_URL,
    tableName: 'sessions',
    createTableIfMissing: false,
    ttl: 7 * 24 * 60 * 60, // 7 days in seconds
    pruneSessionInterval: 60 * 60, // Cleanup every hour
    errorLog: (error) => {
      Logger.error('Session store error:', error);
    }
  })
};
```

---

## 12. Performance Optimizations

### Lazy Loading Implementations
```typescript
// client/src/App.tsx - Route-based code splitting
const Checkout = lazy(() => import("@/pages/checkout"));
const SellToUs = lazy(() => import("@/pages/sell-to-us"));
const AdminDashboard = lazy(() => import("@/pages/admin"));

// Component-level lazy loading
const LazyProductGrid = lazy(() => 
  import("@/components/products/product-grid").then(module => ({
    default: module.ProductGrid
  }))
);

// Suspense wrapper with loading fallback
function LazyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  );
}
```

### Image Optimization Settings
```typescript
// client/src/components/ui/optimized-image.tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: 'auto' | 'low' | 'medium' | 'high';
  className?: string;
}

export function OptimizedImage({ 
  src, 
  alt, 
  width = 400, 
  height = 400, 
  quality = 'auto',
  className 
}: OptimizedImageProps) {
  // Generate responsive image URLs
  const srcSet = [
    `${getCloudinaryUrl(src, { width: width, quality })} 1x`,
    `${getCloudinaryUrl(src, { width: width * 2, quality })} 2x`
  ].join(', ');
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      <img
        src={getCloudinaryUrl(src, { width, height, quality })}
        srcSet={srcSet}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={`
          transition-opacity duration-300
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
          ${error ? 'hidden' : ''}
        `}
      />
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-gray-400">Image not available</span>
        </div>
      )}
    </div>
  );
}

// Cloudinary URL generation with optimization
function getCloudinaryUrl(src: string, options: {
  width?: number;
  height?: number;
  quality?: string;
}): string {
  const baseUrl = src.includes('cloudinary') ? src : src;
  const transformations = [];
  
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  
  transformations.push('f_auto'); // Auto format selection
  transformations.push('c_fill'); // Smart cropping
  
  return baseUrl.replace('/upload/', `/upload/${transformations.join(',')}/`);
}
```

### Database Query Optimizations
```typescript
// server/storage.ts - Optimized queries with indexing
class DatabaseStorage {
  // Optimized product search with proper indexing
  async searchProducts(query: string, filters: SearchFilters): Promise<SearchResult> {
    // Use materialized view for better performance
    const searchQuery = sql`
      SELECT p.*, c.name as category_name,
             ts_rank(p.search_vector, plainto_tsquery('english', ${query})) as rank
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.search_vector @@ plainto_tsquery('english', ${query})
        AND p.status = 'active'
        ${filters.categoryId ? sql`AND p.category_id = ${filters.categoryId}` : sql``}
        ${filters.priceMin ? sql`AND p.price >= ${filters.priceMin}` : sql``}
        ${filters.priceMax ? sql`AND p.price <= ${filters.priceMax}` : sql``}
      ORDER BY rank DESC, p.created_at DESC
      LIMIT ${filters.limit || 20}
      OFFSET ${filters.offset || 0}
    `;
    
    return await db.execute(searchQuery);
  }
  
  // Batch operations for cart updates
  async updateCartItems(updates: CartUpdate[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (const update of updates) {
        await tx.update(cartItems)
          .set({ 
            quantity: update.quantity,
            updatedAt: new Date()
          })
          .where(eq(cartItems.id, update.id));
      }
    });
  }
  
  // Optimized order history with pagination
  async getUserOrders(userId: string, pagination: Pagination): Promise<PaginatedOrders> {
    const [orders, totalCount] = await Promise.all([
      db.select({
        order: orders,
        itemCount: sql<number>`COUNT(oi.id)`,
        totalItems: sql<number>`SUM(oi.quantity)`
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(eq(orders.userId, userId))
      .groupBy(orders.id)
      .orderBy(desc(orders.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset),
      
      db.select({ count: count() })
        .from(orders)
        .where(eq(orders.userId, userId))
    ]);
    
    return {
      orders,
      total: totalCount[0].count,
      hasMore: (pagination.offset + pagination.limit) < totalCount[0].count
    };
  }
}
```

### Caching Strategies
```typescript
// server/middleware/cache.ts
import { Request, Response, NextFunction } from 'express';

// In-memory cache for frequently accessed data
const cache = new Map<string, { data: any; expiry: number }>();

export const cacheMiddleware = (duration: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.method}:${req.originalUrl}`;
    const cached = cache.get(key);
    
    if (cached && cached.expiry > Date.now()) {
      return res.json(cached.data);
    }
    
    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data: any) {
      if (res.statusCode === 200) {
        cache.set(key, {
          data,
          expiry: Date.now() + duration
        });
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Cache invalidation for data changes
export const invalidateCache = (pattern: string) => {
  for (const [key] of cache) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

// Usage in routes
app.get('/api/categories', cacheMiddleware(5 * 60 * 1000), getCategoriesHandler); // 5 minutes
app.get('/api/products/featured', cacheMiddleware(10 * 60 * 1000), getFeaturedProductsHandler); // 10 minutes
```

### Bundle Splitting Configuration
```typescript
// vite.config.ts - Advanced bundle splitting
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          react: ['react', 'react-dom'],
          router: ['wouter'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          forms: ['react-hook-form', '@hookform/resolvers'],
          query: ['@tanstack/react-query'],
          
          // Feature chunks
          admin: [
            './src/pages/admin',
            './src/components/admin'
          ],
          auth: [
            './src/pages/auth',
            './src/pages/forgot-password',
            './src/pages/reset-password'
          ],
          checkout: [
            './src/pages/checkout',
            './src/pages/cart'
          ],
          
          // Utility chunks
          utils: [
            'lodash-es',
            'date-fns',
            'clsx'
          ]
        }
      }
    },
    
    // Optimize chunk sizes
    chunkSizeWarningLimit: 1000,
    
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  
  // Preload optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'wouter'
    ]
  }
});
```

---

## 13. Error Handling

### Global Error Boundaries
```typescript
// client/src/components/error-boundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    Logger.error('React Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userId: localStorage.getItem('userId'),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Report to external service (if configured)
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          metadata: {
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: localStorage.getItem('userId')
          }
        })
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Something went wrong
              </h1>
            </div>
            
            <p className="text-gray-600 mb-4">
              We've encountered an unexpected error. Our team has been notified.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Reload Page
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Go Home
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### API Error Responses
```typescript
// server/middleware/error-handler.ts
interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  err: ApiError, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // Default error response
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';
  let details = err.details || null;

  // Log all errors
  Logger.error('API Error:', {
    error: err.message,
    stack: err.stack,
    statusCode,
    code,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Invalid input data';
    details = err.details;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Authentication required';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    code = 'FORBIDDEN';
    message = 'Insufficient permissions';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'Resource not found';
  } else if (err.name === 'ConflictError') {
    statusCode = 409;
    code = 'CONFLICT';
    message = 'Resource conflict';
  } else if (err.name === 'RateLimitError') {
    statusCode = 429;
    code = 'RATE_LIMIT_EXCEEDED';
    message = 'Too many requests';
  }

  // Database errors
  if (err.code === '23505') { // PostgreSQL unique violation
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'Resource already exists';
  } else if (err.code === '23503') { // PostgreSQL foreign key violation
    statusCode = 400;
    code = 'INVALID_REFERENCE';
    message = 'Referenced resource does not exist';
  }

  // Don't expose sensitive information in production
  if (process.env.NODE_ENV === 'production') {
    if (statusCode === 500) {
      message = 'Internal server error';
      details = null;
    }
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        timestamp: new Date().toISOString()
      })
    }
  });
};

// Custom error classes
export class ValidationError extends Error {
  statusCode = 422;
  code = 'VALIDATION_ERROR';
  
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';
  
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  code = 'UNAUTHORIZED';
  
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
```

### Database Error Handling
```typescript
// server/storage.ts - Database error handling
import { PostgresError } from 'postgres';

class DatabaseStorage {
  private handleDatabaseError(error: any): never {
    Logger.error('Database error:', error);
    
    if (error instanceof PostgresError) {
      switch (error.code) {
        case '23505': // Unique violation
          throw new ValidationError('Resource already exists', {
            constraint: error.constraint_name,
            detail: error.detail
          });
          
        case '23503': // Foreign key violation
          throw new ValidationError('Referenced resource does not exist', {
            constraint: error.constraint_name,
            detail: error.detail
          });
          
        case '23514': // Check violation
          throw new ValidationError('Data validation failed', {
            constraint: error.constraint_name,
            detail: error.detail
          });
          
        case '08006': // Connection failure
          throw new Error('Database connection failed');
          
        case '57P01': // Admin shutdown
          throw new Error('Database is temporarily unavailable');
          
        default:
          throw new Error('Database operation failed');
      }
    }
    
    throw error;
  }
  
  async createProduct(data: InsertProduct): Promise<Product> {
    try {
      const [product] = await db.insert(products).values(data).returning();
      return product;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
  
  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    try {
      const [product] = await db
        .update(products)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning();
        
      if (!product) {
        throw new NotFoundError('Product not found');
      }
      
      return product;
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }
}
```

### User-Facing Error Messages
```typescript
// client/src/lib/error-messages.ts
export const ERROR_MESSAGES = {
  // Authentication errors
  'INVALID_CREDENTIALS': 'Invalid email or password. Please try again.',
  'ACCOUNT_LOCKED': 'Your account has been temporarily locked. Please try again later.',
  'EMAIL_NOT_VERIFIED': 'Please verify your email address before signing in.',
  'PASSWORD_EXPIRED': 'Your password has expired. Please reset it.',
  
  // Validation errors
  'INVALID_EMAIL': 'Please enter a valid email address.',
  'PASSWORD_TOO_WEAK': 'Password must be at least 8 characters with uppercase, lowercase, and number.',
  'REQUIRED_FIELD': 'This field is required.',
  'INVALID_PHONE': 'Please enter a valid phone number.',
  
  // Cart/Order errors
  'INSUFFICIENT_STOCK': 'Sorry, there isn\'t enough stock for this item.',
  'PRODUCT_UNAVAILABLE': 'This product is no longer available.',
  'CART_EMPTY': 'Your cart is empty.',
  'ORDER_NOT_FOUND': 'Order not found.',
  
  // Payment errors
  'PAYMENT_FAILED': 'Payment failed. Please check your payment information and try again.',
  'CARD_DECLINED': 'Your card was declined. Please try a different payment method.',
  'INSUFFICIENT_FUNDS': 'Insufficient funds. Please use a different payment method.',
  
  // File upload errors
  'FILE_TOO_LARGE': 'File is too large. Maximum size is 5MB.',
  'INVALID_FILE_TYPE': 'Invalid file type. Only images are allowed.',
  'UPLOAD_FAILED': 'Upload failed. Please try again.',
  
  // Network errors
  'NETWORK_ERROR': 'Network error. Please check your connection and try again.',
  'SERVER_ERROR': 'Server error. Please try again later.',
  'TIMEOUT_ERROR': 'Request timed out. Please try again.',
  
  // Rate limiting
  'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait before trying again.',
  
  // Default fallback
  'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.'
};

// Error message mapper
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error;
  }
  
  if (error?.code) {
    return ERROR_MESSAGES[error.code] || error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
};
```

### Logging Configuration
```typescript
// server/config/logger.ts
import winston from 'winston';

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.colorize({ all: isDevelopment })
  ),
  defaultMeta: {
    service: 'clean-flip-api',
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version
  },
  transports: [
    // Console logging
    new winston.transports.Console({
      format: isDevelopment 
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        : winston.format.json()
    }),
    
    // File logging for production
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    ] : [])
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({ filename: 'logs/exceptions.log' })
    ] : [])
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({ filename: 'logs/rejections.log' })
    ] : [])
  ]
});

export { logger as Logger };

// HTTP request logging middleware
export const httpLogger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      level: 'info'
    }),
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: 'logs/access.log',
        level: 'info'
      })
    ] : [])
  ]
});
```

---

## 14. WebSocket Implementation

### Connection Management
```typescript
// server/websocket.ts
import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Logger } from './config/logger';

interface ClientInfo {
  id: string;
  userId?: string;
  sessionId?: string;
  connectedAt: Date;
  lastActivity: Date;
  rooms: Set<string>;
}

class WebSocketManager {
  private io: SocketServer;
  private clients: Map<string, ClientInfo> = new Map();
  private userSockets: Map<string, Set<string>> = new Map();
  
  constructor(server: HttpServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });
    
    this.setupEventHandlers();
    this.startCleanupInterval();
  }
  
  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const clientId = socket.id;
      const clientInfo: ClientInfo = {
        id: clientId,
        connectedAt: new Date(),
        lastActivity: new Date(),
        rooms: new Set()
      };
      
      this.clients.set(clientId, clientInfo);
      
      Logger.info('WebSocket client connected', {
        clientId,
        totalClients: this.clients.size
      });
      
      // Authentication
      socket.on('authenticate', (data: { userId?: string; sessionId?: string }) => {
        this.authenticateClient(socket, data);
      });
      
      // Join specific rooms
      socket.on('join_room', (roomName: string) => {
        this.joinRoom(socket, roomName);
      });
      
      // Leave specific rooms
      socket.on('leave_room', (roomName: string) => {
        this.leaveRoom(socket, roomName);
      });
      
      // Handle cart updates
      socket.on('cart_update', (data) => {
        this.handleCartUpdate(socket, data);
      });
      
      // Handle activity tracking
      socket.on('activity', () => {
        this.updateActivity(clientId);
      });
      
      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this.handleDisconnection(socket, reason);
      });
      
      // Send connection confirmation
      socket.emit('connection_established', {
        clientId,
        timestamp: new Date().toISOString()
      });
    });
  }
  
  private authenticateClient(socket: any, data: { userId?: string; sessionId?: string }) {
    const clientInfo = this.clients.get(socket.id);
    if (!clientInfo) return;
    
    // Update client info with authentication data
    clientInfo.userId = data.userId;
    clientInfo.sessionId = data.sessionId;
    
    // Track user's sockets for multi-tab support
    if (data.userId) {
      if (!this.userSockets.has(data.userId)) {
        this.userSockets.set(data.userId, new Set());
      }
      this.userSockets.get(data.userId)!.add(socket.id);
      
      // Join user-specific room
      socket.join(`user:${data.userId}`);
      clientInfo.rooms.add(`user:${data.userId}`);
    }
    
    Logger.info('WebSocket client authenticated', {
      clientId: socket.id,
      userId: data.userId,
      sessionId: data.sessionId
    });
  }
  
  private joinRoom(socket: any, roomName: string) {
    const clientInfo = this.clients.get(socket.id);
    if (!clientInfo) return;
    
    socket.join(roomName);
    clientInfo.rooms.add(roomName);
    
    Logger.debug('Client joined room', {
      clientId: socket.id,
      room: roomName
    });
  }
  
  private leaveRoom(socket: any, roomName: string) {
    const clientInfo = this.clients.get(socket.id);
    if (!clientInfo) return;
    
    socket.leave(roomName);
    clientInfo.rooms.delete(roomName);
    
    Logger.debug('Client left room', {
      clientId: socket.id,
      room: roomName
    });
  }
  
  private updateActivity(clientId: string) {
    const clientInfo = this.clients.get(clientId);
    if (clientInfo) {
      clientInfo.lastActivity = new Date();
    }
  }
  
  private handleCartUpdate(socket: any, data: any) {
    const clientInfo = this.clients.get(socket.id);
    if (!clientInfo?.userId) return;
    
    // Broadcast cart update to all user's connected devices
    this.broadcastToUser(clientInfo.userId, 'cart_updated', {
      action: data.action,
      item: data.item,
      timestamp: new Date().toISOString()
    });
    
    Logger.debug('Cart update broadcasted', {
      userId: clientInfo.userId,
      action: data.action
    });
  }
  
  private handleDisconnection(socket: any, reason: string) {
    const clientInfo = this.clients.get(socket.id);
    if (!clientInfo) return;
    
    // Remove from user sockets tracking
    if (clientInfo.userId) {
      const userSockets = this.userSockets.get(clientInfo.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.userSockets.delete(clientInfo.userId);
        }
      }
    }
    
    this.clients.delete(socket.id);
    
    Logger.info('WebSocket client disconnected', {
      clientId: socket.id,
      userId: clientInfo.userId,
      reason,
      duration: Date.now() - clientInfo.connectedAt.getTime(),
      totalClients: this.clients.size
    });
  }
  
  // Public methods for broadcasting
  public broadcastToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }
  
  public broadcastToRoom(room: string, event: string, data: any) {
    this.io.to(room).emit(event, data);
  }
  
  public broadcastToAll(event: string, data: any) {
    this.io.emit(event, data);
  }
  
  public getConnectedUserCount(): number {
    return this.userSockets.size;
  }
  
  public getClientCount(): number {
    return this.clients.size;
  }
  
  private startCleanupInterval() {
    // Clean up inactive connections every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const timeoutMs = 10 * 60 * 1000; // 10 minutes
      
      for (const [clientId, clientInfo] of this.clients) {
        if (now - clientInfo.lastActivity.getTime() > timeoutMs) {
          const socket = this.io.sockets.sockets.get(clientId);
          if (socket) {
            socket.disconnect(true);
          }
        }
      }
    }, 5 * 60 * 1000);
  }
}

export default WebSocketManager;
```

### Message Formats
```typescript
// shared/websocket-types.ts
export interface WebSocketMessage {
  type: string;
  timestamp: string;
  data?: any;
}

// Cart update messages
export interface CartUpdateMessage extends WebSocketMessage {
  type: 'cart_update';
  data: {
    action: 'add' | 'update' | 'remove' | 'clear';
    item?: CartItem;
    userId: string;
  };
}

// Product update messages
export interface ProductUpdateMessage extends WebSocketMessage {
  type: 'product_update';
  data: {
    action: 'created' | 'updated' | 'deleted' | 'stock_changed';
    productId: string;
    changes?: Partial<Product>;
  };
}

// Order status messages
export interface OrderStatusMessage extends WebSocketMessage {
  type: 'order_status_update';
  data: {
    orderId: string;
    userId: string;
    status: OrderStatus;
    previousStatus: OrderStatus;
  };
}

// Admin notification messages
export interface AdminNotificationMessage extends WebSocketMessage {
  type: 'admin_notification';
  data: {
    category: 'order' | 'product' | 'user' | 'system';
    message: string;
    severity: 'info' | 'warning' | 'error';
    actionUrl?: string;
  };
}

// Connection status messages
export interface ConnectionMessage extends WebSocketMessage {
  type: 'connection';
  data: {
    status: 'connected' | 'disconnected' | 'reconnected';
    clientId: string;
  };
}
```

### Broadcast Logic
```typescript
// server/services/websocket-service.ts
class WebSocketService {
  constructor(private wsManager: WebSocketManager) {}
  
  // Cart-related broadcasts
  async broadcastCartUpdate(userId: string, action: string, item?: CartItem) {
    const message: CartUpdateMessage = {
      type: 'cart_update',
      timestamp: new Date().toISOString(),
      data: {
        action: action as any,
        item,
        userId
      }
    };
    
    this.wsManager.broadcastToUser(userId, 'cart_update', message);
    
    // Also broadcast to admin dashboard for real-time monitoring
    this.wsManager.broadcastToRoom('admin', 'user_activity', {
      type: 'cart_activity',
      userId,
      action,
      timestamp: message.timestamp
    });
  }
  
  // Product-related broadcasts
  async broadcastProductUpdate(productId: string, action: string, changes?: Partial<Product>) {
    const message: ProductUpdateMessage = {
      type: 'product_update',
      timestamp: new Date().toISOString(),
      data: {
        action: action as any,
        productId,
        changes
      }
    };
    
    // Broadcast to all connected clients
    this.wsManager.broadcastToAll('product_update', message);
    
    // Log for analytics
    Logger.info('Product update broadcasted', {
      productId,
      action,
      changes: Object.keys(changes || {})
    });
  }
  
  // Order status updates
  async broadcastOrderStatusUpdate(order: Order, previousStatus: OrderStatus) {
    const message: OrderStatusMessage = {
      type: 'order_status_update',
      timestamp: new Date().toISOString(),
      data: {
        orderId: order.id,
        userId: order.userId,
        status: order.status,
        previousStatus
      }
    };
    
    // Notify the specific user
    this.wsManager.broadcastToUser(order.userId, 'order_status_update', message);
    
    // Notify admins
    this.wsManager.broadcastToRoom('admin', 'order_status_update', message);
  }
  
  // Admin notifications
  async sendAdminNotification(
    category: string, 
    message: string, 
    severity: 'info' | 'warning' | 'error',
    actionUrl?: string
  ) {
    const notification: AdminNotificationMessage = {
      type: 'admin_notification',
      timestamp: new Date().toISOString(),
      data: {
        category: category as any,
        message,
        severity,
        actionUrl
      }
    };
    
    this.wsManager.broadcastToRoom('admin', 'admin_notification', notification);
  }
  
  // Low stock alerts
  async broadcastLowStockAlert(product: Product) {
    await this.sendAdminNotification(
      'product',
      `Low stock alert: ${product.name} has only ${product.stockQuantity} items left`,
      'warning',
      `/admin/products/${product.id}`
    );
  }
  
  // System status updates
  async broadcastSystemStatus(status: 'maintenance' | 'normal' | 'degraded', message?: string) {
    this.wsManager.broadcastToAll('system_status', {
      type: 'system_status',
      timestamp: new Date().toISOString(),
      data: {
        status,
        message
      }
    });
  }
}

export default WebSocketService;
```

### Reconnection Strategy
```typescript
// client/src/hooks/use-websocket.ts
import { useEffect, useRef, useState } from 'react';
import { useAuth } from './use-auth';

interface WebSocketConfig {
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
}

export function useWebSocket(config: WebSocketConfig = {}) {
  const {
    maxReconnectAttempts = 5,
    reconnectInterval = 3000,
    heartbeatInterval = 30000
  } = config;
  
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const socketRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;
    
    console.log('🔄 Connecting to WebSocket...');
    
    socketRef.current = io({
      withCredentials: true,
      transports: ['websocket', 'polling'],
      timeout: 10000
    });
    
    socketRef.current.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      setReconnectAttempt(0);
      
      // Authenticate if user is logged in
      if (user?.id) {
        socketRef.current.emit('authenticate', {
          userId: user.id,
          sessionId: sessionStorage.getItem('sessionId')
        });
      }
      
      // Start heartbeat
      startHeartbeat();
    });
    
    socketRef.current.on('disconnect', (reason: string) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
      stopHeartbeat();
      
      // Attempt reconnection unless explicitly disconnected
      if (reason !== 'io client disconnect') {
        scheduleReconnect();
      }
    });
    
    socketRef.current.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
      scheduleReconnect();
    });
    
    // Handle specific events
    socketRef.current.on('cart_update', handleCartUpdate);
    socketRef.current.on('product_update', handleProductUpdate);
    socketRef.current.on('order_status_update', handleOrderStatusUpdate);
    
  }, [user?.id]);
  
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    stopHeartbeat();
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);
  
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempt >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }
    
    const delay = reconnectInterval * Math.pow(2, reconnectAttempt); // Exponential backoff
    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempt + 1})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempt(prev => prev + 1);
      connect();
    }, delay);
  }, [reconnectAttempt, maxReconnectAttempts, reconnectInterval, connect]);
  
  const startHeartbeat = useCallback(() => {
    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('heartbeat', { timestamp: Date.now() });
      }
    }, heartbeatInterval);
  }, [heartbeatInterval]);
  
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
  }, []);
  
  // Event handlers
  const handleCartUpdate = useCallback((message: CartUpdateMessage) => {
    // Invalidate cart cache to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    
    // Show toast notification
    toast({
      title: "Cart Updated",
      description: `Your cart was updated from another device.`,
    });
  }, []);
  
  const handleProductUpdate = useCallback((message: ProductUpdateMessage) => {
    // Invalidate product queries
    queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    
    if (message.data.action === 'stock_changed') {
      toast({
        title: "Stock Updated",
        description: "Product availability has changed.",
      });
    }
  }, []);
  
  const handleOrderStatusUpdate = useCallback((message: OrderStatusMessage) => {
    // Invalidate orders cache
    queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    
    toast({
      title: "Order Update",
      description: `Your order status has been updated to ${message.data.status}.`,
    });
  }, []);
  
  // Auto-connect/disconnect based on auth state
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);
  
  // Public API
  return {
    isConnected,
    reconnectAttempt,
    socket: socketRef.current,
    emit: (event: string, data?: any) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(event, data);
      }
    },
    disconnect
  };
}
```

---

## 15. Build & Deployment

### Build Process Steps
```json
// package.json scripts
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  }
}
```

#### Frontend Build (Vite)
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Replit-specific plugins
    cartographer({
      includeDefaultLanguages: false,
      languageOptions: {
        typescript: true,
        javascript: true
      }
    }),
    runtimeErrorModal()
  ],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@assets": path.resolve(__dirname, "./client/public")
    }
  },
  
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
    
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          utils: ['lodash-es', 'date-fns', 'clsx']
        }
      }
    }
  },
  
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
```

#### Backend Build (ESBuild)
```bash
# ESBuild configuration for server bundle
esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outdir=dist \
  --sourcemap \
  --minify
```

### Environment Variables Required

#### Development Environment
```bash
# .env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cleanflip
DATABASE_URL_PROD=postgresql://user:password@prod-host:5432/cleanflip

# Authentication
SESSION_SECRET=your-session-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# External Services
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
RESEND_API_KEY=re_...
VITE_GEOAPIFY_API_KEY=your-geoapify-key

# Optional
ALLOWED_ORIGINS=https://yourdomain.com,https://staging.yourdomain.com
COOKIE_DOMAIN=.yourdomain.com
```

#### Production Environment
```bash
# .env.production
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com

# Database (automatically set by Replit)
DATABASE_URL=$DATABASE_URL_PROD
PGHOST=your-db-host
PGPORT=5432
PGUSER=your-db-user
PGPASSWORD=your-db-password
PGDATABASE=your-db-name

# All other environment variables same as development
# but with production values
```

### Deployment Configuration

#### Replit Deployment Setup
```toml
# .replit
run = "npm run dev"
entrypoint = "server/index.ts"

[env]
PATH = "/home/runner/$REPL_SLUG/.config/npm/node_global/bin:/home/runner/$REPL_SLUG/node_modules/.bin:$PATH"
npm_config_prefix = "/home/runner/$REPL_SLUG/.config/npm/node_global"

[gitHubImport]
requiredFiles = [".replit", "replit.nix"]

[languages]

[languages.typescript]
pattern = "**/{*.ts,*.tsx}"

[languages.javascript]
pattern = "**/{*.js,*.jsx}"

[deployment]
run = ["sh", "-c", "npm run build && npm start"]
deploymentTarget = "cloudrun"
ignorePorts = false

[[ports]]
localPort = 5000
externalPort = 80
```

#### Database Migration Process
```typescript
// Migration workflow using Drizzle
// 1. Development changes
npm run db:push  // Push schema changes to development DB

// 2. Generate migration files (if needed for production)
npx drizzle-kit generate:pg --schema=./shared/schema.ts

// 3. Deploy to production (automatic via Replit deployment)
// Database schema is automatically synchronized
```

### Production vs Development Differences

#### Build Optimizations
| Feature | Development | Production |
|---------|-------------|------------|
| Source Maps | Enabled | Disabled |
| Minification | Disabled | Enabled |
| Code Splitting | Basic | Advanced |
| Bundle Size | Not optimized | Optimized |
| CSS Extraction | Inline | External files |
| Asset Optimization | None | Compressed |

#### Security Settings
| Setting | Development | Production |
|---------|-------------|------------|
| HTTPS Enforcement | Disabled | Enabled |
| Security Headers | Basic | Comprehensive |
| Session Security | Relaxed | Strict |
| CORS | Permissive | Restrictive |
| Error Details | Full stack traces | Sanitized messages |
| Logging Level | Debug | Info/Error only |

#### Performance Settings
| Setting | Development | Production |
|---------|-------------|------------|
| Cache Headers | Disabled | Enabled |
| Compression | Disabled | Enabled |
| Database Pool | Small | Optimized |
| Static Assets | Dev server | CDN |
| Image Optimization | Disabled | Enabled |

---

## 16. Code Patterns & Standards

### Naming Conventions Used

#### File and Directory Names
```
// Components - PascalCase
ProductCard.tsx
UserDropdown.tsx
AdminLayout.tsx

// Pages - kebab-case
product-detail.tsx
forgot-password.tsx
admin-dashboard.tsx

// Hooks - camelCase with 'use' prefix
useAuth.ts
useCart.ts
useWebSocket.ts

// Utilities - camelCase
queryClient.ts
error-handler.ts
validation-rules.ts

// API Routes - kebab-case
auth-routes.ts
product-routes.ts
user-routes.ts
```

#### Variable and Function Names
```typescript
// Variables - camelCase
const userName = "John Doe";
const productList = [];
const isAuthenticated = true;

// Functions - camelCase, descriptive verbs
function getUserById(id: string) {}
function createProduct(data: ProductData) {}
function validateEmail(email: string) {}

// Constants - SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const DEFAULT_PAGE_SIZE = 20;
const API_BASE_URL = "/api";

// Types/Interfaces - PascalCase
interface UserProfile {}
type ProductStatus = "active" | "inactive";
interface ApiResponse<T> {}

// Components - PascalCase
function ProductCard({ product }: ProductCardProps) {}
const UserAvatar = ({ user }: UserAvatarProps) => {}
```

### File Organization Patterns

#### Component Structure
```typescript
// client/src/components/products/product-card.tsx
import React from 'react';
import { Product } from '@shared/schema';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import './product-card.css';

// Types at the top
interface ProductCardProps {
  product: Product;
  showQuickActions?: boolean;
  className?: string;
}

// Main component
export function ProductCard({
  product,
  showQuickActions = true,
  className
}: ProductCardProps) {
  // Hooks first
  const { addItem, isLoading } = useCart();
  
  // Local state
  const [imageError, setImageError] = useState(false);
  
  // Event handlers
  const handleAddToCart = async () => {
    try {
      await addItem(product.id);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };
  
  // Render
  return (
    <div className={`product-card ${className}`}>
      {/* Component JSX */}
    </div>
  );
}

// Default export at the bottom
export default ProductCard;
```

#### API Route Structure
```typescript
// server/routes/products.ts
import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
import { requireAuth, requireRole } from '../middleware/auth';
import { storage } from '../storage';

const router = Router();

// Validation schemas at the top
const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().min(0.01),
  categoryId: z.string().uuid()
});

// Route handlers
router.get('/', async (req, res, next) => {
  try {
    // Route implementation
  } catch (error) {
    next(error);
  }
});

router.post('/', 
  requireAuth,
  requireRole('developer'),
  validateRequest(createProductSchema),
  async (req, res, next) => {
    try {
      // Route implementation
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

### Component Composition Patterns

#### Higher-Order Components
```typescript
// client/src/components/hoc/with-auth.tsx
import { ComponentType } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Navigate } from 'wouter';

interface WithAuthOptions {
  requireRole?: 'user' | 'developer';
  redirectTo?: string;
}

export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const { requireRole, redirectTo = '/auth' } = options;
  
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading } = useAuth();
    
    if (isLoading) {
      return <LoadingSpinner />;
    }
    
    if (!user) {
      return <Navigate to={redirectTo} />;
    }
    
    if (requireRole && user.role !== requireRole && user.role !== 'developer') {
      return <Navigate to="/unauthorized" />;
    }
    
    return <WrappedComponent {...props} />;
  };
}

// Usage
const ProtectedAdminPage = withAuth(AdminDashboard, {
  requireRole: 'developer',
  redirectTo: '/auth'
});
```

#### Render Props Pattern
```typescript
// client/src/components/data/data-fetcher.tsx
interface DataFetcherProps<T> {
  queryKey: string[];
  children: (data: {
    data: T | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  }) => React.ReactNode;
}

export function DataFetcher<T>({ queryKey, children }: DataFetcherProps<T>) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey
  });
  
  return children({ data, isLoading, error, refetch });
}

// Usage
<DataFetcher<Product[]> queryKey={['/api/products']}>
  {({ data: products, isLoading, error }) => (
    <>
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}
      {products && <ProductGrid products={products} />}
    </>
  )}
</DataFetcher>
```

#### Compound Components
```typescript
// client/src/components/ui/modal.tsx
interface ModalContextType {
  isOpen: boolean;
  onClose: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

function Modal({ children, isOpen, onClose }: ModalProps) {
  return (
    <ModalContext.Provider value={{ isOpen, onClose }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}

function ModalOverlay({ className }: { className?: string }) {
  const { onClose } = useContext(ModalContext)!;
  return (
    <div
      className={`absolute inset-0 bg-black/50 ${className}`}
      onClick={onClose}
    />
  );
}

function ModalContent({ children, className }: ModalContentProps) {
  return (
    <motion.div
      className={`relative bg-white rounded-lg shadow-lg ${className}`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  );
}

// Compound component pattern
Modal.Overlay = ModalOverlay;
Modal.Content = ModalContent;

// Usage
<Modal isOpen={isOpen} onClose={closeModal}>
  <Modal.Overlay />
  <Modal.Content className="max-w-md p-6">
    <h2>Modal Title</h2>
    <p>Modal content</p>
  </Modal.Content>
</Modal>
```

### Reusable Utilities

#### Custom Hooks Implementation
```typescript
// client/src/hooks/use-local-storage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Set value and update localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

// client/src/hooks/use-debounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// client/src/hooks/use-click-outside.ts
import { useEffect, useRef } from 'react';

export function useClickOutside<T extends HTMLElement>(
  callback: () => void
): React.RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [callback]);

  return ref;
}
```

#### Utility Functions
```typescript
// client/src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind CSS class merging utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

// Format date
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }).format(dateObj);
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// Generate random ID
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sleep utility for testing
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Deep clone object
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

// Query string utilities
export function parseQueryString(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }
  return searchParams.toString();
}
```

---

## 17. Missing or Broken Features

### Non-functional Components

#### Known Issues
1. **WebSocket Reconnection Edge Cases**
   - Location: `client/src/hooks/use-websocket.ts`
   - Issue: Exponential backoff may fail on network changes
   - Impact: Users may lose real-time updates
   - Status: Needs improvement
   - Fix Required: Better network state detection

2. **Image Upload Error Recovery**
   - Location: `client/src/components/admin/image-upload.tsx`
   - Issue: Failed uploads don't clear from queue
   - Impact: Users see stale upload progress
   - Status: Minor bug
   - Fix Required: Reset upload state on error

3. **Cart Synchronization Race Conditions**
   - Location: `client/src/hooks/use-cart.tsx`
   - Issue: Rapid cart updates can cause inconsistent state
   - Impact: Cart items may not reflect latest changes
   - Status: Intermittent
   - Fix Required: Implement optimistic updates with conflict resolution

### TODO Comments in Code

#### High Priority TODOs
```typescript
// server/routes.ts:145
// TODO: Implement order refund processing
// Impact: Admin cannot process refunds through dashboard
// Required for: Customer service operations

// client/src/pages/checkout.tsx:89
// TODO: Add shipping rate calculator integration
// Impact: Fixed shipping rates, not dynamic
// Required for: Accurate shipping costs

// server/services/email.ts:67
// TODO: Implement email template system
// Impact: All emails use hardcoded HTML
// Required for: Email customization

// client/src/components/search/advanced-filters.tsx:23
// TODO: Add saved search functionality
// Impact: Users cannot save filter preferences
// Required for: Better user experience
```

#### Medium Priority TODOs
```typescript
// client/src/hooks/use-auth.tsx:156
// TODO: Implement remember me functionality
// Impact: Users must log in frequently
// Required for: User convenience

// server/middleware/analytics.ts:34
// TODO: Add comprehensive analytics tracking
// Impact: Limited business insights
// Required for: Data-driven decisions

// client/src/components/products/product-reviews.tsx
// TODO: Implement product review system
// Impact: No customer feedback mechanism
// Required for: Social proof
```

### Incomplete Implementations

#### Partial Features
1. **Wishlist System**
   - Status: 30% complete
   - Location: `client/src/pages/wishlist.tsx`
   - Missing: Backend API, persistence
   - Impact: Users cannot save favorite products

2. **Advanced Search Filters**
   - Status: 60% complete
   - Location: `client/src/components/search/`
   - Missing: Brand filtering, date range
   - Impact: Limited search capabilities

3. **Order Tracking System**
   - Status: 40% complete
   - Location: `client/src/pages/track-order.tsx`
   - Missing: Shipping provider integration
   - Impact: No real-time tracking updates

4. **Multi-currency Support**
   - Status: 20% complete
   - Location: `shared/types/currency.ts`
   - Missing: Exchange rate API, price conversion
   - Impact: Limited to USD only

### Deprecated Code Still Present

#### Legacy Components
```typescript
// client/src/components/legacy/old-navigation.tsx
// Status: Deprecated since v2.0
// Replacement: client/src/components/layout/navigation.tsx
// Removal date: Next major version
// Impact: Unused, safe to remove

// server/routes/legacy-auth.ts
// Status: Deprecated since Google OAuth implementation
// Replacement: server/routes/auth-google.ts
// Removal date: After all users migrated
// Impact: Fallback for old sessions
```

#### Unused Utilities
```typescript
// client/src/lib/deprecated-utils.ts
// Functions: oldFormatDate, legacyValidation
// Status: Replaced by modern implementations
// Removal: Next cleanup cycle

// server/utils/old-encryption.ts
// Status: Replaced by bcrypt implementation
// Risk: Security vulnerability if used
// Action: Remove immediately
```

### Performance Issues

#### Known Bottlenecks
1. **Product Search Performance**
   - Location: `server/storage.ts:searchProducts()`
   - Issue: Full-text search on large datasets
   - Impact: Slow search response times
   - Solution: Implement search indexing

2. **Image Loading Delays**
   - Location: Product grid components
   - Issue: Large image files not optimized
   - Impact: Slow page load times
   - Solution: Implement progressive loading

3. **Cart Update Latency**
   - Location: WebSocket broadcasting
   - Issue: Synchronous cart updates
   - Impact: UI blocking on cart changes
   - Solution: Implement async processing

### Browser Compatibility Issues

#### Known Incompatibilities
1. **Safari WebSocket Support**
   - Issue: Intermittent connection drops
   - Versions: Safari < 15
   - Workaround: Polling fallback implemented
   - Status: Monitoring

2. **Internet Explorer Support**
   - Status: Not supported
   - Decision: Modern browsers only
   - Impact: <1% of users
   - Documentation: Browser requirements listed

3. **Mobile Safari Touch Events**
   - Issue: Touch interactions on image carousel
   - Impact: Poor mobile UX
   - Status: Investigating
   - Priority: High

### Security Vulnerabilities

#### Identified Issues
1. **File Upload Validation**
   - Location: `server/middleware/upload.ts`
   - Issue: MIME type spoofing possible
   - Severity: Medium
   - Status: Mitigation in place
   - Action: Enhanced validation needed

2. **Session Fixation**
   - Location: Authentication flow
   - Issue: Session ID not regenerated on login
   - Severity: Low
   - Status: Documented
   - Action: Implement session regeneration

### Missing Error Handling

#### Unhandled Edge Cases
1. **Database Connection Loss**
   - Location: Long-running operations
   - Issue: No graceful degradation
   - Impact: Application crashes
   - Priority: Critical

2. **Third-party Service Outages**
   - Services: Stripe, Cloudinary, Geoapify
   - Issue: No fallback mechanisms
   - Impact: Feature unavailability
   - Priority: High

3. **Memory Leaks in WebSocket Connections**
   - Location: `server/websocket.ts`
   - Issue: Connections not properly cleaned
   - Impact: Server performance degradation
   - Priority: Medium

---

## 18. Configuration Files

### Environment Variables (.env)
```bash
# Application Settings
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/cleanflip_dev
DATABASE_URL_PROD=postgresql://user:password@prod-host:5432/cleanflip_prod

# PostgreSQL Connection Details (Auto-set by Replit)
PGHOST=your-postgres-host
PGPORT=5432
PGUSER=your-postgres-user
PGPASSWORD=your-postgres-password
PGDATABASE=cleanflip

# Authentication Secrets
SESSION_SECRET=your-super-secret-session-key-change-in-production
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Payment Processing
STRIPE_SECRET_KEY=sk_test_51234567890abcdefghijklmnop
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnop
STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdefghijklmnop

# File Storage & CDN
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Email Service
RESEND_API_KEY=re_abcdefghijklmnop1234567890
SENDGRID_API_KEY=SG.abcdefghijklmnopqrstuvwxyz.1234567890abcdefghijklmnop

# Address/Location Services
VITE_GEOAPIFY_API_KEY=your-geoapify-api-key-for-address-autocomplete

# Security & CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://staging.yourdomain.com
COOKIE_DOMAIN=.yourdomain.com

# External Service URLs
REDIS_URL=redis://localhost:6379 # Optional for caching
WEBHOOK_SECRET=your-webhook-validation-secret

# Monitoring & Analytics (Optional)
SENTRY_DSN=https://your-sentry-dsn
GOOGLE_ANALYTICS_ID=GA-123456789-1

# Development Tools
VITE_DEV_SERVER_PORT=5173
API_BASE_URL=/api
```

### TypeScript Configuration (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    
    // Type Checking
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    
    // Module Resolution
    "baseUrl": ".",
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"],
      "@assets/*": ["./client/public/*"],
      "@server/*": ["./server/*"]
    },
    
    // Emit
    "declaration": false,
    "declarationMap": false,
    "sourceMap": true,
    "removeComments": false,
    "importHelpers": true,
    
    // Interop Constraints
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  
  "include": [
    "client/src/**/*",
    "server/**/*",
    "shared/**/*",
    "*.ts",
    "*.tsx"
  ],
  
  "exclude": [
    "node_modules",
    "dist",
    "build",
    "*.config.js",
    "*.config.ts"
  ],
  
  "ts-node": {
    "esm": true,
    "compilerOptions": {
      "module": "ESNext",
      "moduleResolution": "bundler"
    }
  }
}
```

### Tailwind CSS Configuration (tailwind.config.ts)
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './client/index.html',
    './client/src/**/*.{js,ts,jsx,tsx}',
    './shared/**/*.{js,ts,jsx,tsx}'
  ],
  
  darkMode: ['class'],
  
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        }
      },
      
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace']
      },
      
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'bounce-in': 'bounce-in 0.6s ease-out'
      },
      
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' }
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      
      screens: {
        'xs': '475px',
        '3xl': '1600px'
      }
    }
  },
  
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio')
  ]
};

export default config;
```

### Drizzle Configuration (drizzle.config.ts)
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './shared/schema.ts',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },
  verbose: true,
  strict: true,
  
  // Generate migrations in TypeScript
  migrations: {
    prefix: 'timestamp',
    table: '__drizzle_migrations__',
    schema: 'public'
  },
  
  // Introspection settings
  introspect: {
    casing: 'camelCase'
  }
} satisfies Config;
```

### shadcn/ui Configuration (components.json)
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "client/src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### ESLint Configuration (.eslintrc.json)
```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "project": "./tsconfig.json",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": [
    "@typescript-eslint",
    "react",
    "react-hooks"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "prefer-const": "error",
    "no-var": "error"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  },
  "env": {
    "browser": true,
    "node": true,
    "es6": true
  }
}
```

### PostCSS Configuration (postcss.config.js)
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

---

## 19. API Response Formats

### Success Response Structure
```typescript
// Standard success response format
interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    timestamp: string;
    version: string;
  };
}

// Example: Get Products
GET /api/products?page=1&limit=20
{
  "success": true,
  "data": [
    {
      "id": "product-uuid-123",
      "name": "Olympic Barbell Set",
      "description": "Professional grade Olympic barbell with weights",
      "price": 299.99,
      "condition": "like_new",
      "status": "active",
      "stockQuantity": 5,
      "images": [
        "https://res.cloudinary.com/cleanflip/image/upload/v1/products/barbell-1.jpg"
      ],
      "categoryId": "category-uuid-456",
      "category": {
        "id": "category-uuid-456",
        "name": "Weight Training",
        "slug": "weight-training"
      },
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    },
    "timestamp": "2025-01-15T15:45:30Z",
    "version": "1.0.0"
  }
}
```

### Error Response Structure
```typescript
// Standard error response format
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string; // For validation errors
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

// Example: Validation Error (422)
POST /api/products
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "name": "Product name is required",
      "price": "Price must be greater than 0.01",
      "categoryId": "Invalid category ID format"
    }
  },
  "meta": {
    "timestamp": "2025-01-15T15:45:30Z",
    "requestId": "req_abc123def456"
  }
}

// Example: Authentication Error (401)
GET /api/admin/users
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "details": "Valid session token required"
  },
  "meta": {
    "timestamp": "2025-01-15T15:45:30Z",
    "requestId": "req_xyz789uvw012"
  }
}

// Example: Not Found Error (404)
GET /api/products/invalid-id
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Product not found",
    "details": "No product exists with ID: invalid-id"
  },
  "meta": {
    "timestamp": "2025-01-15T15:45:30Z",
    "requestId": "req_mno345pqr678"
  }
}
```

### Status Codes Used
| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT, DELETE requests |
| 201 | Created | Successful POST requests (resource created) |
| 204 | No Content | Successful DELETE requests (no response body) |
| 400 | Bad Request | Invalid request format or parameters |
| 401 | Unauthorized | Authentication required or invalid |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource already exists or constraint violation |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

### Specific Endpoint Responses

#### Authentication Endpoints
```typescript
// POST /api/auth/login
// Success Response (200)
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "profileComplete": true,
      "createdAt": "2025-01-10T08:00:00Z"
    },
    "session": {
      "expiresAt": "2025-01-22T15:45:30Z"
    }
  },
  "message": "Login successful"
}

// Error Response (401)
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

#### Product Endpoints
```typescript
// GET /api/products/:id
// Success Response (200)
{
  "success": true,
  "data": {
    "id": "product-uuid-123",
    "name": "Olympic Barbell Set",
    "description": "Professional grade Olympic barbell with weights...",
    "price": 299.99,
    "condition": "like_new",
    "status": "active",
    "stockQuantity": 5,
    "brand": "Rogue Fitness",
    "model": "Ohio Bar",
    "weight": 45.0,
    "dimensions": "84\" x 1.1\" diameter",
    "images": [
      "https://res.cloudinary.com/cleanflip/image/upload/v1/products/barbell-1.jpg",
      "https://res.cloudinary.com/cleanflip/image/upload/v1/products/barbell-2.jpg"
    ],
    "features": [
      "Olympic standard 2\" sleeves",
      "Knurled grip surface",
      "Chrome finish",
      "1500 lb weight capacity"
    ],
    "categoryId": "category-uuid-456",
    "category": {
      "id": "category-uuid-456",
      "name": "Weight Training",
      "slug": "weight-training"
    },
    "isFeatured": true,
    "viewCount": 127,
    "salesCount": 3,
    "stripeProductId": "prod_stripe123",
    "stripePriceId": "price_stripe456",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}

// POST /api/products (Admin only)
// Success Response (201)
{
  "success": true,
  "data": {
    "id": "product-uuid-789",
    "name": "Kettlebell Set",
    // ... full product object
  },
  "message": "Product created successfully"
}
```

#### Cart Endpoints
```typescript
// GET /api/cart
// Success Response (200)
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cart-item-uuid-123",
        "productId": "product-uuid-456",
        "product": {
          "id": "product-uuid-456",
          "name": "Dumbbells Set",
          "price": 149.99,
          "images": ["https://..."],
          "condition": "good",
          "stockQuantity": 3
        },
        "quantity": 2,
        "priceAtTime": 149.99,
        "addedAt": "2025-01-15T14:20:00Z"
      }
    ],
    "summary": {
      "itemCount": 2,
      "subtotal": 299.98,
      "taxAmount": 24.75,
      "shippingAmount": 15.99,
      "total": 340.72
    }
  }
}

// POST /api/cart
// Success Response (201)
{
  "success": true,
  "data": {
    "id": "cart-item-uuid-789",
    "productId": "product-uuid-123",
    "quantity": 1,
    "priceAtTime": 299.99,
    "addedAt": "2025-01-15T15:45:30Z"
  },
  "message": "Item added to cart"
}
```

#### Order Endpoints
```typescript
// GET /api/orders
// Success Response (200)
{
  "success": true,
  "data": [
    {
      "id": "order-uuid-123",
      "orderNumber": "CF-2025-001234",
      "status": "shipped",
      "totalAmount": 340.72,
      "subtotalAmount": 299.98,
      "taxAmount": 24.75,
      "shippingAmount": 15.99,
      "items": [
        {
          "id": "order-item-uuid-456",
          "productId": "product-uuid-789",
          "productName": "Dumbbells Set",
          "quantity": 2,
          "priceAtTime": 149.99
        }
      ],
      "shippingAddress": {
        "street": "123 Main St",
        "city": "Asheville",
        "state": "NC",
        "zipCode": "28801"
      },
      "trackingNumber": "1Z999AA1234567890",
      "createdAt": "2025-01-14T10:00:00Z",
      "updatedAt": "2025-01-15T09:30:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}

// POST /api/orders
// Success Response (201)
{
  "success": true,
  "data": {
    "id": "order-uuid-456",
    "orderNumber": "CF-2025-001235",
    "status": "pending",
    "totalAmount": 340.72,
    "paymentIntentId": "pi_stripe123456789",
    "createdAt": "2025-01-15T15:45:30Z"
  },
  "message": "Order created successfully"
}
```

#### Search Endpoints
```typescript
// GET /api/search?q=barbell&category=weight-training&page=1
// Success Response (200)
{
  "success": true,
  "data": {
    "query": "barbell",
    "filters": {
      "category": "weight-training",
      "condition": null,
      "priceMin": null,
      "priceMax": null
    },
    "results": [
      {
        "id": "product-uuid-123",
        "name": "Olympic Barbell Set",
        "price": 299.99,
        "images": ["https://..."],
        "condition": "like_new",
        "category": "Weight Training",
        "relevanceScore": 0.95
      }
    ],
    "facets": {
      "categories": [
        { "name": "Weight Training", "count": 15 },
        { "name": "Cardio Equipment", "count": 3 }
      ],
      "conditions": [
        { "name": "new", "count": 5 },
        { "name": "like_new", "count": 8 },
        { "name": "good", "count": 5 }
      ],
      "priceRanges": [
        { "range": "0-100", "count": 3 },
        { "range": "100-300", "count": 10 },
        { "range": "300+", "count": 5 }
      ]
    }
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 18,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    },
    "searchTime": "0.045s"
  }
}
```

#### Admin Dashboard Endpoints
```typescript
// GET /api/admin/dashboard/metrics
// Success Response (200)
{
  "success": true,
  "data": {
    "overview": {
      "totalProducts": 245,
      "totalUsers": 1,847,
      "totalOrders": 156,
      "totalRevenue": 45,675.25
    },
    "recentActivity": {
      "newOrders": 12,
      "newUsers": 8,
      "lowStockAlerts": 3
    },
    "salesMetrics": {
      "last30Days": {
        "orders": 156,
        "revenue": 45,675.25,
        "averageOrderValue": 292.79
      },
      "growth": {
        "ordersGrowth": 15.2,
        "revenueGrowth": 22.8,
        "userGrowth": 8.5
      }
    },
    "topProducts": [
      {
        "id": "product-uuid-123",
        "name": "Olympic Barbell Set",
        "sales": 15,
        "revenue": 4,499.85
      }
    ],
    "alerts": [
      {
        "type": "low_stock",
        "message": "Olympic Barbell Set has only 2 items left",
        "severity": "warning",
        "createdAt": "2025-01-15T14:30:00Z"
      }
    ]
  }
}
```

#### File Upload Endpoints
```typescript
// POST /api/upload/images
// Success Response (200)
{
  "success": true,
  "data": {
    "urls": [
      "https://res.cloudinary.com/cleanflip/image/upload/v1/products/img1.jpg",
      "https://res.cloudinary.com/cleanflip/image/upload/v1/products/img2.jpg"
    ],
    "uploadedCount": 2,
    "failedCount": 0
  },
  "message": "Images uploaded successfully"
}

// Error Response (400)
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Invalid file type. Only JPEG, PNG, and WebP are allowed.",
    "details": {
      "acceptedTypes": ["image/jpeg", "image/png", "image/webp"],
      "maxFileSize": "5MB",
      "maxFiles": 8
    }
  }
}
```

---

## 20. User Flows

### New User Registration Flow
```
1. Landing Page Visit
   ↓
2. Click "Sign Up" / "Get Started"
   ↓
3. Registration Form
   - Email address
   - Password (with requirements)
   - First name
   - Last name
   - Accept terms checkbox
   ↓
4. Email Verification (if enabled)
   ↓
5. Onboarding Process
   Step 1: Address Information
   - Street address (with Geoapify autocomplete)
   - City, State, ZIP
   - Phone number
   - Local customer determination
   ↓
   Step 2: Profile Completion
   - Shipping preferences
   - Email preferences
   - Profile picture (optional)
   ↓
6. Welcome to Dashboard
   - Account setup complete
   - Browse products CTA
   - Quick tour overlay (optional)
```

### Google Sign-In Flow
```
1. Auth Page
   ↓
2. Click "Continue with Google"
   ↓
3. Google OAuth Consent Screen
   - Scope: profile, email
   - User grants permission
   ↓
4. Google Callback Processing
   - Extract user profile data
   - Check if user exists (by Google ID or email)
   ↓
5A. Existing User Path:
    - Update profile with latest Google data
    - Create session
    - Redirect to dashboard
    ↓
5B. New User Path:
    - Create user account with Google data
    - Mark email as verified
    - Force redirect to onboarding
    ↓
6. Onboarding (New Users Only)
   - Address collection (required)
   - Phone number (required)
   - Preferences (optional)
   ↓
7. Dashboard Access
   - Profile complete
   - Full application access
```

### Product Discovery to Purchase Flow
```
1. Product Discovery
   Entry Points:
   - Homepage featured products
   - Category browsing
   - Search results
   - Direct product links
   ↓
2. Product Catalog Browsing
   - Grid/list view toggle
   - Filter by category, condition, price
   - Sort by relevance, price, date
   - Pagination or infinite scroll
   ↓
3. Product Detail View
   - Image gallery with zoom
   - Detailed description
   - Specifications
   - Condition information
   - Stock availability
   - Add to cart button
   - Related products
   ↓
4. Add to Cart Decision
   4A. Guest User:
       - Add to session cart
       - Continue browsing or checkout
   4B. Authenticated User:
       - Add to database cart
       - Real-time cart sync across devices
   ↓
5. Cart Review
   - View all items
   - Update quantities
   - Remove items
   - See price calculations
   - Shipping estimate
   ↓
6. Checkout Process
   Step 1: Review Cart
   - Final item verification
   - Quantity adjustments
   ↓
   Step 2: Shipping Information
   - Use saved address or enter new
   - Select shipping method
   - Delivery instructions
   ↓
   Step 3: Payment
   - Payment method selection
   - Billing address (if different)
   - Apply coupon codes
   ↓
   Step 4: Order Review
   - Final order summary
   - Terms acceptance
   - Place order confirmation
   ↓
7. Payment Processing
   - Stripe payment intent creation
   - Payment method collection
   - 3D Secure authentication (if required)
   - Payment confirmation
   ↓
8. Order Confirmation
   - Order number generation
   - Confirmation email sent
   - Order tracking page access
   - Continue shopping option
```

### Equipment Submission Flow
```
1. Equipment Submission Entry
   Entry Points:
   - "Sell to Us" navigation link
   - Homepage CTA
   - Product page "Sell Similar" link
   ↓
2. Multi-Step Submission Form
   Step 1: Equipment Details
   - Equipment type/category
   - Brand and model
   - Year purchased
   - Current condition assessment
   ↓
   Step 2: Pricing Information
   - Original purchase price
   - Asking price
   - Market research helper (optional)
   ↓
   Step 3: Description & Photos
   - Detailed description
   - Known defects/issues
   - Photo upload (2-8 images required)
   - Photo guidelines display
   ↓
   Step 4: Contact & Pickup
   - Contact information (pre-filled)
   - Pickup address
   - Preferred pickup date
   - Special instructions
   ↓
   Step 5: Terms & Submit
   - Submission terms agreement
   - Evaluation process explanation
   - Final review and submit
   ↓
3. Submission Processing
   - Unique reference number generation
   - Confirmation email sent
   - Admin notification triggered
   - Submission tracking page redirect
   ↓
4. Admin Review Process
   - Internal evaluation
   - Price assessment
   - Condition verification
   - Decision: Accept/Decline/Request More Info
   ↓
5. Customer Notification
   5A. Accepted:
       - Offer email with price
       - Pickup scheduling
       - Payment method setup
   5B. Declined:
       - Polite decline email
       - Reason explanation
       - Alternative suggestions
   5C. More Info Needed:
       - Request for additional photos/details
       - Form link for updates
   ↓
6. Pickup & Payment (if accepted)
   - Pickup appointment scheduling
   - Equipment inspection
   - Payment processing
   - Receipt and completion
```

### Admin Product Management Flow
```
1. Admin Dashboard Access
   - Developer role required
   - Admin navigation visible
   ↓
2. Product Management Entry
   - View all products table
   - Search and filter options
   - Bulk actions available
   ↓
3. Product Creation
   Step 1: Basic Information
   - Product name and description
   - Category selection
   - SKU generation/manual entry
   ↓
   Step 2: Pricing & Inventory
   - Price setting
   - Stock quantity
   - Condition assessment
   ↓
   Step 3: Media & Details
   - Image upload (required)
   - Feature list creation
   - Specifications entry
   ↓
   Step 4: Stripe Integration
   - Automatic Stripe product creation
   - Price object setup
   - Tax configuration
   ↓
   Step 5: Publication
   - Review all details
   - Set active/inactive status
   - Featured product toggle
   - Publish to catalog
   ↓
4. Product Updates
   - Edit any product field
   - Image management
   - Stock adjustments
   - Price modifications
   - Stripe synchronization
   ↓
5. Inventory Management
   - Stock level monitoring
   - Low stock alerts
   - Bulk stock updates
   - Product deactivation
```

### Order Management Flow
```
1. Order Monitoring
   - Real-time order dashboard
   - Status-based filtering
   - Search by order number/customer
   ↓
2. Order Processing
   New Order Received:
   - Automatic status: "paid"
   - Inventory deduction
   - Customer notification
   ↓
   Processing Stage:
   - Status update to "processing"
   - Pick and pack preparation
   - Shipping label generation
   ↓
   Shipping Stage:
   - Status update to "shipped"
   - Tracking number assignment
   - Customer shipping notification
   ↓
   Delivery Confirmation:
   - Status update to "delivered"
   - Customer satisfaction follow-up
   - Review request email
   ↓
3. Special Cases
   Cancellation Request:
   - Customer or admin initiated
   - Refund processing
   - Inventory restoration
   ↓
   Return Processing:
   - Return authorization
   - Item inspection
   - Refund or exchange
   ↓
   Problem Resolution:
   - Damage claims
   - Missing items
   - Customer service escalation
```

### Customer Support Flow
```
1. Support Request Initiation
   Entry Points:
   - Contact form
   - Email to support
   - Live chat (if implemented)
   - Phone call
   ↓
2. Issue Categorization
   - Order issues
   - Product questions
   - Account problems
   - Technical support
   - Equipment submission queries
   ↓
3. Resolution Process
   Tier 1: Standard Support
   - FAQ resolution
   - Order status updates
   - Basic troubleshooting
   ↓
   Tier 2: Advanced Support
   - Account modifications
   - Refund processing
   - Technical escalation
   ↓
   Tier 3: Management Review
   - Policy exceptions
   - Complex technical issues
   - Legal or compliance matters
   ↓
4. Follow-up & Closure
   - Resolution confirmation
   - Customer satisfaction survey
   - Case documentation
   - Process improvement feedback
```

---

## 21. Data Validation Rules

### User Input Validation

#### Authentication Fields
```typescript
// Email validation
const emailValidation = z.string()
  .min(1, "Email is required")
  .max(254, "Email too long")
  .email("Invalid email format")
  .refine(email => {
    // Additional email domain validation
    const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const domain = email.split('@')[1];
    return !email.includes('+') || allowedDomains.includes(domain);
  }, "Email format not supported");

// Password validation
const passwordValidation = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(/^(?=.*[a-z])/, "Password must contain at least one lowercase letter")
  .regex(/^(?=.*[A-Z])/, "Password must contain at least one uppercase letter")
  .regex(/^(?=.*\d)/, "Password must contain at least one number")
  .regex(/^(?=.*[!@#$%^&*(),.?":{}|<>])/, "Password must contain at least one special character");

// Name validation
const nameValidation = z.string()
  .min(1, "Name is required")
  .max(50, "Name too long")
  .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
  .refine(name => name.trim().length > 0, "Name cannot be only whitespace");
```

#### Contact Information
```typescript
// Phone number validation
const phoneValidation = z.string()
  .regex(/^\(\d{3}\) \d{3}-\d{4}$/, "Phone format: (555) 123-4567")
  .refine(phone => {
    // Additional phone number validation
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 && !digits.startsWith('0') && !digits.startsWith('1');
  }, "Invalid phone number");

// Address validation
const addressValidation = z.object({
  street: z.string()
    .min(1, "Street address is required")
    .max(255, "Street address too long")
    .refine(street => /\d/.test(street), "Street address must include a number"),
  
  city: z.string()
    .min(1, "City is required")
    .max(100, "City name too long")
    .regex(/^[a-zA-Z\s'-]+$/, "City name can only contain letters, spaces, hyphens, and apostrophes"),
  
  state: z.string()
    .length(2, "State must be 2 characters")
    .regex(/^[A-Z]{2}$/, "State must be uppercase letters")
    .refine(state => {
      const validStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
      return validStates.includes(state);
    }, "Invalid state code"),
  
  zipCode: z.string()
    .regex(/^\d{5}(-\d{4})?$/, "ZIP code format: 12345 or 12345-6789")
    .refine(zip => {
      const digits = zip.replace('-', '');
      return digits.length === 5 || digits.length === 9;
    }, "Invalid ZIP code")
});
```

#### Product Data Validation
```typescript
// Product creation validation
const productValidation = z.object({
  name: z.string()
    .min(1, "Product name is required")
    .max(200, "Product name too long")
    .refine(name => name.trim().length > 0, "Product name cannot be only whitespace"),
  
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description too long")
    .refine(desc => {
      // Ensure description has meaningful content
      const wordCount = desc.trim().split(/\s+/).length;
      return wordCount >= 5;
    }, "Description must contain at least 5 words"),
  
  price: z.number()
    .min(0.01, "Price must be at least $0.01")
    .max(99999.99, "Price cannot exceed $99,999.99")
    .refine(price => {
      // Ensure price has at most 2 decimal places
      return Number(price.toFixed(2)) === price;
    }, "Price can have at most 2 decimal places"),
  
  categoryId: z.string()
    .uuid("Invalid category ID format"),
  
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'needs_repair'], {
    errorMap: () => ({ message: "Invalid condition value" })
  }),
  
  stockQuantity: z.number()
    .int("Stock quantity must be a whole number")
    .min(0, "Stock quantity cannot be negative")
    .max(9999, "Stock quantity too high"),
  
  brand: z.string()
    .max(100, "Brand name too long")
    .optional()
    .refine(brand => !brand || brand.trim().length > 0, "Brand cannot be only whitespace"),
  
  model: z.string()
    .max(100, "Model name too long")
    .optional(),
  
  weight: z.number()
    .min(0, "Weight cannot be negative")
    .max(9999, "Weight too high")
    .optional(),
  
  dimensions: z.string()
    .max(100, "Dimensions description too long")
    .optional(),
  
  images: z.array(z.string().url("Invalid image URL"))
    .min(1, "At least one image is required")
    .max(8, "Maximum 8 images allowed"),
  
  features: z.array(z.string().max(200, "Feature description too long"))
    .max(10, "Maximum 10 features allowed"),
  
  sku: z.string()
    .regex(/^[A-Z0-9-]+$/, "SKU must contain only uppercase letters, numbers, and hyphens")
    .max(50, "SKU too long")
    .optional()
});
```

### Financial Validation

#### Payment Validation
```typescript
// Price validation with currency constraints
const priceValidation = z.number()
  .min(0.01, "Price must be at least $0.01")
  .max(99999.99, "Price cannot exceed $99,999.99")
  .refine(price => {
    // Validate currency precision (2 decimal places)
    const cents = Math.round(price * 100);
    return Math.abs(cents / 100 - price) < 0.001;
  }, "Invalid price precision");

// Tax calculation validation
const taxValidation = z.number()
  .min(0, "Tax cannot be negative")
  .max(999999.99, "Tax amount too high")
  .refine(tax => {
    const cents = Math.round(tax * 100);
    return Math.abs(cents / 100 - tax) < 0.001;
  }, "Invalid tax precision");

// Discount validation
const discountValidation = z.object({
  type: z.enum(['percentage', 'fixed_amount']),
  value: z.number()
    .min(0, "Discount value cannot be negative")
    .refine((value, ctx) => {
      if (ctx.parent.type === 'percentage') {
        return value <= 100;
      }
      return value <= 99999.99;
    }, "Invalid discount value"),
  
  minimumOrderAmount: z.number()
    .min(0, "Minimum order amount cannot be negative")
    .optional(),
  
  expiresAt: z.date()
    .min(new Date(), "Expiration date must be in the future")
    .optional()
});
```

#### Order Validation
```typescript
// Order creation validation
const orderValidation = z.object({
  items: z.array(z.object({
    productId: z.string().uuid("Invalid product ID"),
    quantity: z.number()
      .int("Quantity must be a whole number")
      .min(1, "Quantity must be at least 1")
      .max(99, "Quantity cannot exceed 99"),
    priceAtTime: priceValidation
  }))
  .min(1, "Order must contain at least one item")
  .max(20, "Order cannot contain more than 20 different items"),
  
  shippingAddress: addressValidation,
  
  billingAddress: addressValidation.optional(),
  
  paymentMethodId: z.string()
    .min(1, "Payment method is required"),
  
  couponCode: z.string()
    .max(50, "Coupon code too long")
    .regex(/^[A-Z0-9-_]+$/, "Invalid coupon code format")
    .optional()
});
```

### File Upload Validation

#### Image Upload Validation
```typescript
// Client-side file validation
const imageFileValidation = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, "File size must be less than 5MB")
    .refine(file => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      return allowedTypes.includes(file.type);
    }, "File must be JPEG, PNG, WebP, or GIF")
    .refine(file => {
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      return allowedExtensions.includes(extension);
    }, "Invalid file extension"),
  
  dimensions: z.object({
    width: z.number().min(100, "Image width must be at least 100px").max(4000, "Image width cannot exceed 4000px"),
    height: z.number().min(100, "Image height must be at least 100px").max(4000, "Image height cannot exceed 4000px")
  }).optional()
});

// Server-side upload validation
const uploadValidation = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 8,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  
  validateFile: (file: Express.Multer.File): boolean => {
    // MIME type validation
    if (!uploadValidation.allowedMimeTypes.includes(file.mimetype)) {
      return false;
    }
    
    // File size validation
    if (file.size > uploadValidation.maxFileSize) {
      return false;
    }
    
    // Magic number validation for security
    const isValidImage = validateImageMagicNumbers(file.buffer);
    return isValidImage;
  }
};
```

### Business Logic Validation

#### Inventory Validation
```typescript
// Stock availability validation
const stockValidation = z.object({
  productId: z.string().uuid("Invalid product ID"),
  requestedQuantity: z.number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
}).refine(async ({ productId, requestedQuantity }) => {
  const product = await storage.getProduct(productId);
  if (!product) return false;
  
  if (product.status !== 'active') return false;
  if (product.stockQuantity < requestedQuantity) return false;
  
  return true;
}, "Insufficient stock or product unavailable");

// Cart validation
const cartValidation = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(99)
  }))
}).refine(async ({ items }) => {
  // Validate total cart value doesn't exceed limits
  const totalValue = await calculateCartTotal(items);
  return totalValue <= 50000; // $50,000 max cart value
}, "Cart total exceeds maximum allowed amount")
.refine(async ({ items }) => {
  // Validate all products are still available
  for (const item of items) {
    const product = await storage.getProduct(item.productId);
    if (!product || product.status !== 'active') {
      return false;
    }
  }
  return true;
}, "One or more items in cart are no longer available");
```

#### Equipment Submission Validation
```typescript
// Equipment submission validation
const equipmentSubmissionValidation = z.object({
  equipmentType: z.string()
    .min(1, "Equipment type is required")
    .max(100, "Equipment type too long"),
  
  brand: z.string()
    .min(1, "Brand is required")
    .max(100, "Brand name too long")
    .regex(/^[a-zA-Z0-9\s&'-]+$/, "Brand name contains invalid characters"),
  
  model: z.string()
    .max(100, "Model name too long")
    .optional(),
  
  condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  
  yearPurchased: z.number()
    .int("Year must be a whole number")
    .min(1950, "Year too old")
    .max(new Date().getFullYear(), "Year cannot be in the future")
    .optional(),
  
  originalPrice: z.number()
    .min(0, "Original price cannot be negative")
    .max(99999.99, "Original price too high")
    .optional(),
  
  askingPrice: z.number()
    .min(1, "Asking price must be at least $1")
    .max(99999.99, "Asking price too high")
    .refine(async (askingPrice, ctx) => {
      const originalPrice = ctx.parent.originalPrice;
      if (originalPrice && askingPrice > originalPrice) {
        return false;
      }
      return true;
    }, "Asking price cannot exceed original price"),
  
  description: z.string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description too long")
    .refine(desc => {
      const wordCount = desc.trim().split(/\s+/).length;
      return wordCount >= 10;
    }, "Description must contain at least 10 words"),
  
  defects: z.string()
    .max(500, "Defects description too long")
    .optional(),
  
  images: z.array(z.string().url("Invalid image URL"))
    .min(2, "At least 2 images are required")
    .max(8, "Maximum 8 images allowed"),
  
  contactName: z.string()
    .min(1, "Contact name is required")
    .max(100, "Contact name too long"),
  
  contactEmail: z.string()
    .email("Invalid email format"),
  
  contactPhone: phoneValidation,
  
  pickupAddress: addressValidation,
  
  pickupInstructions: z.string()
    .max(500, "Instructions too long")
    .optional(),
  
  preferredPickupDate: z.date()
    .min(new Date(), "Pickup date must be in the future")
    .max(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), "Pickup date cannot be more than 90 days in the future")
    .optional(),
  
  agreeToTerms: z.boolean()
    .refine(val => val === true, "You must agree to the terms and conditions")
});
```

### Search and Filter Validation

#### Search Query Validation
```typescript
// Search input validation
const searchValidation = z.object({
  query: z.string()
    .min(1, "Search query cannot be empty")
    .max(100, "Search query too long")
    .refine(query => query.trim().length > 0, "Search query cannot be only whitespace")
    .refine(query => {
      // Prevent potential injection attacks
      const forbiddenChars = ['<', '>', '"', "'", '&', ';'];
      return !forbiddenChars.some(char => query.includes(char));
    }, "Search query contains invalid characters"),
  
  filters: z.object({
    category: z.string().uuid("Invalid category ID").optional(),
    
    condition: z.array(z.enum(['new', 'like_new', 'good', 'fair', 'needs_repair']))
      .max(5, "Too many condition filters")
      .optional(),
    
    priceMin: z.number()
      .min(0, "Minimum price cannot be negative")
      .max(99999.99, "Minimum price too high")
      .optional(),
    
    priceMax: z.number()
      .min(0, "Maximum price cannot be negative")
      .max(99999.99, "Maximum price too high")
      .optional(),
    
    brand: z.array(z.string().max(100, "Brand name too long"))
      .max(10, "Too many brand filters")
      .optional(),
    
    inStock: z.boolean().optional(),
    
    featured: z.boolean().optional(),
    
    sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'newest', 'popular'])
      .optional()
  }).refine(filters => {
    if (filters.priceMin && filters.priceMax) {
      return filters.priceMin <= filters.priceMax;
    }
    return true;
  }, "Minimum price cannot be greater than maximum price"),
  
  pagination: z.object({
    page: z.number()
      .int("Page must be a whole number")
      .min(1, "Page must be at least 1")
      .max(1000, "Page number too high"),
    
    limit: z.number()
      .int("Limit must be a whole number")
      .min(1, "Limit must be at least 1")
      .max(100, "Limit cannot exceed 100")
  })
});
```

---

## 22. Testing Touchpoints

### Critical Paths That Need Testing

#### Authentication Flow Testing
```typescript
// Authentication test scenarios
const authTestCases = [
  {
    scenario: "User Registration",
    steps: [
      "Visit registration page",
      "Fill valid registration form",
      "Submit form",
      "Verify email verification flow",
      "Complete onboarding process",
      "Access dashboard"
    ],
    expectedResult: "User account created and fully onboarded",
    testData: {
      email: "test@example.com",
      password: "SecurePass123!",
      firstName: "John",
      lastName: "Doe"
    }
  },
  
  {
    scenario: "Google OAuth Registration",
    steps: [
      "Click 'Continue with Google'",
      "Complete Google OAuth flow",
      "Verify new user redirect to onboarding",
      "Complete address information",
      "Complete phone verification",
      "Access dashboard"
    ],
    expectedResult: "Google user created and onboarded",
    criticalAssertions: [
      "User profile contains Google data",
      "Email marked as verified",
      "Profile marked as complete"
    ]
  },
  
  {
    scenario: "Password Reset",
    steps: [
      "Request password reset",
      "Check email for reset link",
      "Click reset link",
      "Enter new password",
      "Login with new password"
    ],
    expectedResult: "Password successfully reset and user logged in"
  }
];
```

#### E-commerce Flow Testing
```typescript
// Product discovery to purchase flow
const ecommerceTestCases = [
  {
    scenario: "Guest Checkout",
    steps: [
      "Browse products as guest",
      "Add multiple items to cart",
      "Proceed to checkout",
      "Enter shipping information",
      "Enter payment information",
      "Complete purchase",
      "Receive order confirmation"
    ],
    expectedResult: "Order created, payment processed, confirmation sent",
    testData: {
      products: ["product-uuid-123", "product-uuid-456"],
      quantities: [2, 1],
      shippingAddress: {
        street: "123 Test St",
        city: "Asheville",
        state: "NC",
        zipCode: "28801"
      }
    }
  },
  
  {
    scenario: "Authenticated User Purchase",
    steps: [
      "Login as existing user",
      "Add items to cart",
      "Verify cart persistence",
      "Checkout with saved address",
      "Pay with saved payment method",
      "Track order status"
    ],
    expectedResult: "Streamlined checkout with saved data"
  },
  
  {
    scenario: "Stock Validation",
    steps: [
      "Add last available item to cart",
      "Attempt to increase quantity beyond stock",
      "Complete checkout",
      "Verify stock deduction",
      "Attempt to add same product again"
    ],
    expectedResult: "Stock properly managed and validated"
  }
];
```

#### Admin Dashboard Testing
```typescript
// Admin functionality testing
const adminTestCases = [
  {
    scenario: "Product Management",
    steps: [
      "Login as developer",
      "Create new product",
      "Upload product images",
      "Verify Stripe product creation",
      "Update product details",
      "Deactivate product",
      "Verify frontend changes"
    ],
    expectedResult: "Complete product lifecycle management",
    validations: [
      "Product visible in catalog",
      "Stripe product/price created",
      "Images properly uploaded",
      "Search index updated"
    ]
  },
  
  {
    scenario: "Order Management",
    steps: [
      "View pending orders",
      "Update order status",
      "Add tracking information",
      "Process refund",
      "Send customer notification"
    ],
    expectedResult: "Order properly managed through lifecycle"
  },
  
  {
    scenario: "Equipment Submission Review",
    steps: [
      "Review new equipment submission",
      "Evaluate photos and description",
      "Accept submission with offer",
      "Schedule pickup",
      "Process payment to seller"
    ],
    expectedResult: "Equipment submission processed end-to-end"
  }
];
```

### Edge Cases to Consider

#### Data Validation Edge Cases
```typescript
// Edge case testing scenarios
const edgeCaseTests = [
  {
    category: "Authentication",
    cases: [
      {
        name: "Duplicate Email Registration",
        test: "Attempt to register with existing email",
        expected: "Appropriate error message, no account creation"
      },
      {
        name: "Google Account Email Conflict",
        test: "Google sign-in with email matching existing local account",
        expected: "Account linking or clear conflict resolution"
      },
      {
        name: "Session Expiration During Checkout",
        test: "User session expires while in checkout process",
        expected: "Graceful handling, cart preservation"
      }
    ]
  },
  
  {
    category: "E-commerce",
    cases: [
      {
        name: "Out of Stock During Checkout",
        test: "Product stock depleted between add-to-cart and checkout",
        expected: "Clear error, cart update, alternative suggestions"
      },
      {
        name: "Payment Failure Recovery",
        test: "Stripe payment fails due to declined card",
        expected: "Order remains pending, user can retry payment"
      },
      {
        name: "Concurrent Cart Modifications",
        test: "Multiple devices modifying cart simultaneously",
        expected: "Consistent cart state across devices"
      }
    ]
  },
  
  {
    category: "File Uploads",
    cases: [
      {
        name: "Large File Upload",
        test: "Upload file exceeding size limit",
        expected: "Clear error message, upload prevention"
      },
      {
        name: "Invalid File Type",
        test: "Upload non-image file with .jpg extension",
        expected: "File rejected, security validation passed"
      },
      {
        name: "Network Interruption During Upload",
        test: "Network fails during image upload",
        expected: "Upload failure handled gracefully"
      }
    ]
  }
];
```

#### Performance Testing Scenarios
```typescript
// Performance test cases
const performanceTests = [
  {
    scenario: "High Traffic Product Search",
    testConditions: {
      concurrentUsers: 100,
      searchQueries: ["barbell", "dumbbells", "treadmill"],
      duration: "5 minutes"
    },
    expectedResults: {
      averageResponseTime: "< 500ms",
      maxResponseTime: "< 2s",
      errorRate: "< 1%"
    }
  },
  
  {
    scenario: "Large Product Catalog Loading",
    testConditions: {
      productCount: 10000,
      categoryFilters: 20,
      imageOptimization: true
    },
    expectedResults: {
      initialPageLoad: "< 3s",
      infiniteScrollLoad: "< 1s",
      imageLoadTime: "< 2s"
    }
  },
  
  {
    scenario: "Concurrent Checkout Processing",
    testConditions: {
      simultaneousCheckouts: 50,
      paymentProcessing: true,
      inventoryUpdates: true
    },
    expectedResults: {
      checkoutSuccess: "> 95%",
      inventoryConsistency: "100%",
      paymentAccuracy: "100%"
    }
  }
];
```

### Browser Compatibility Requirements

#### Supported Browsers and Versions
```typescript
// Browser compatibility matrix
const browserSupport = {
  desktop: {
    chrome: ">= 90",
    firefox: ">= 88",
    safari: ">= 14",
    edge: ">= 90"
  },
  mobile: {
    chromeMobile: ">= 90",
    safariMobile: ">= 14",
    samsungInternet: ">= 14"
  },
  excluded: [
    "Internet Explorer (all versions)",
    "Opera Mini",
    "UC Browser"
  ]
};

// Feature-specific compatibility tests
const compatibilityTests = [
  {
    feature: "WebSocket Connections",
    testScenario: "Real-time cart synchronization",
    fallback: "Polling-based updates",
    browserSpecific: {
      safari: "Test connection stability",
      firefox: "Test reconnection logic"
    }
  },
  
  {
    feature: "File Upload",
    testScenario: "Multiple image upload with drag-drop",
    fallback: "Traditional file input",
    browserSpecific: {
      mobile: "Test touch interactions",
      safari: "Test file size validation"
    }
  },
  
  {
    feature: "Payment Processing",
    testScenario: "Stripe payment elements",
    fallback: "Basic card form",
    browserSpecific: {
      safari: "Test 3D Secure authentication",
      mobile: "Test mobile payment flows"
    }
  }
];
```

### Mobile Device Testing Needs

#### Device Testing Matrix
```typescript
// Mobile testing requirements
const mobileTestingMatrix = {
  devices: [
    {
      category: "iPhone",
      models: ["iPhone 12", "iPhone 13", "iPhone 14", "iPhone SE"],
      screenSizes: ["375x812", "390x844", "393x852", "375x667"],
      testPriority: "High"
    },
    {
      category: "Android",
      models: ["Pixel 6", "Samsung Galaxy S21", "OnePlus 9"],
      screenSizes: ["412x915", "384x854", "412x892"],
      testPriority: "High"
    },
    {
      category: "Tablet",
      models: ["iPad Air", "Samsung Galaxy Tab"],
      screenSizes: ["820x1180", "800x1280"],
      testPriority: "Medium"
    }
  ],
  
  testScenarios: [
    {
      name: "Mobile Navigation",
      tests: [
        "Hamburger menu functionality",
        "Touch target sizes (minimum 44px)",
        "Scroll behavior",
        "Responsive layout adaptation"
      ]
    },
    {
      name: "Mobile Checkout",
      tests: [
        "Form input accessibility",
        "Payment method selection",
        "Address autocomplete on mobile",
        "Cart drawer functionality"
      ]
    },
    {
      name: "Image Interactions",
      tests: [
        "Product image gallery swipe",
        "Zoom functionality",
        "Upload camera integration",
        "Image optimization loading"
      ]
    }
  ]
};
```

#### Accessibility Testing Requirements
```typescript
// Accessibility test cases
const accessibilityTests = [
  {
    category: "Keyboard Navigation",
    tests: [
      "Tab order logical and complete",
      "All interactive elements reachable",
      "Focus indicators visible",
      "Skip links functional"
    ],
    tools: ["axe-core", "keyboard testing"]
  },
  
  {
    category: "Screen Reader Compatibility",
    tests: [
      "Alt text for all images",
      "Proper heading hierarchy",
      "Form labels associated",
      "ARIA labels for complex widgets"
    ],
    tools: ["NVDA", "JAWS", "VoiceOver"]
  },
  
  {
    category: "Visual Accessibility",
    tests: [
      "Color contrast ratios (WCAG AA)",
      "Text scaling up to 200%",
      "Focus indicators visible",
      "No content conveyed by color alone"
    ],
    tools: ["Colour Contrast Analyser", "WAVE"]
  },
  
  {
    category: "Motor Accessibility",
    tests: [
      "Large touch targets (44px minimum)",
      "Drag and drop alternatives",
      "Timeout warnings and extensions",
      "Click target spacing"
    ]
  }
];
```

### API Testing Requirements

#### API Endpoint Testing
```typescript
// API testing framework
const apiTestSuite = {
  authenticationEndpoints: [
    {
      endpoint: "POST /api/auth/login",
      testCases: [
        {
          name: "Valid credentials",
          payload: { email: "test@example.com", password: "ValidPass123!" },
          expectedStatus: 200,
          expectedResponse: { success: true, data: { user: expect.objectContaining({ email: "test@example.com" }) } }
        },
        {
          name: "Invalid credentials",
          payload: { email: "test@example.com", password: "wrongpassword" },
          expectedStatus: 401,
          expectedResponse: { success: false, error: { code: "INVALID_CREDENTIALS" } }
        },
        {
          name: "Rate limiting",
          payload: { email: "test@example.com", password: "wrongpassword" },
          repeatCount: 6,
          expectedStatus: 429,
          expectedResponse: { success: false, error: { code: "RATE_LIMIT_EXCEEDED" } }
        }
      ]
    }
  ],
  
  productEndpoints: [
    {
      endpoint: "GET /api/products",
      testCases: [
        {
          name: "Product listing with pagination",
          query: { page: 1, limit: 20 },
          expectedStatus: 200,
          expectedResponse: {
            success: true,
            data: expect.arrayContaining([]),
            meta: expect.objectContaining({ pagination: expect.any(Object) })
          }
        },
        {
          name: "Product search",
          query: { search: "barbell", category: "weight-training" },
          expectedStatus: 200,
          validation: (response) => {
            expect(response.data.every(product => 
              product.name.toLowerCase().includes('barbell') ||
              product.description.toLowerCase().includes('barbell')
            )).toBe(true);
          }
        }
      ]
    }
  ],
  
  cartEndpoints: [
    {
      endpoint: "POST /api/cart",
      testCases: [
        {
          name: "Add item to cart",
          payload: { productId: "valid-product-id", quantity: 2 },
          headers: { authorization: "Bearer valid-token" },
          expectedStatus: 201,
          expectedResponse: { success: true, data: expect.objectContaining({ quantity: 2 }) }
        },
        {
          name: "Add item exceeding stock",
          payload: { productId: "low-stock-product-id", quantity: 100 },
          headers: { authorization: "Bearer valid-token" },
          expectedStatus: 400,
          expectedResponse: { success: false, error: { code: "INSUFFICIENT_STOCK" } }
        }
      ]
    }
  ]
};
```

### Security Testing Protocols

#### Security Test Cases
```typescript
// Security testing requirements
const securityTests = [
  {
    category: "Authentication Security",
    tests: [
      {
        name: "Session Fixation",
        test: "Verify session ID changes on login",
        severity: "High"
      },
      {
        name: "Password Strength",
        test: "Enforce password complexity requirements",
        severity: "Medium"
      },
      {
        name: "Brute Force Protection",
        test: "Rate limiting on authentication endpoints",
        severity: "High"
      }
    ]
  },
  
  {
    category: "Input Validation",
    tests: [
      {
        name: "SQL Injection",
        test: "Parameterized queries prevent SQL injection",
        severity: "Critical"
      },
      {
        name: "XSS Prevention",
        test: "User input properly sanitized and escaped",
        severity: "High"
      },
      {
        name: "File Upload Security",
        test: "File type validation and virus scanning",
        severity: "High"
      }
    ]
  },
  
  {
    category: "Authorization",
    tests: [
      {
        name: "Privilege Escalation",
        test: "Users cannot access higher privilege functions",
        severity: "Critical"
      },
      {
        name: "Direct Object Reference",
        test: "Users cannot access other users' data",
        severity: "High"
      }
    ]
  }
];
```

---

## Summary

This comprehensive documentation provides an exhaustive technical analysis of the Clean & Flip e-commerce platform, covering:

- **Complete file structure** with 159 dependencies across frontend and backend
- **Detailed routing system** with 25+ API endpoints and protected route logic
- **Full database schema** with 12+ tables and complex relationships
- **Component inventory** documenting 50+ React components with props and functionality
- **Authentication flow** including Google OAuth integration and onboarding
- **State management** with TanStack Query, WebSocket real-time sync, and local storage
- **Business logic** covering cart management, checkout, search, and admin operations
- **External integrations** with Stripe, Cloudinary, Resend, and Geoapify
- **UI/UX specifications** with complete design tokens and responsive breakpoints
- **Form validation** covering 10+ forms with comprehensive Zod schemas
- **Security implementations** including CORS, rate limiting, and input sanitization
- **Performance optimizations** with lazy loading, caching, and bundle splitting
- **Error handling** with global boundaries, logging, and user-friendly messages
- **WebSocket implementation** for real-time cart and product updates
- **Build and deployment** configuration for Replit with environment management
- **Code patterns** and architectural standards throughout the application
- **Missing features** and technical debt documentation
- **Configuration files** for all build tools and frameworks
- **API response formats** with comprehensive examples
- **User flows** covering registration, purchase, and admin workflows
- **Data validation** rules for all input types and business logic
- **Testing touchpoints** with browser compatibility and security requirements

The platform demonstrates enterprise-grade architecture with modern React patterns, comprehensive security measures, real-time functionality, and production-ready deployment configuration. All systems are documented with specific implementation details, making this a complete technical reference for the Clean & Flip e-commerce application.