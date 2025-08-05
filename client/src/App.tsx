import { Switch, Route, useLocation } from "wouter";
import { ROUTES } from "@/config/routes";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/hooks/use-cart";
import { AuthProvider } from "@/hooks/use-auth";
import { ErrorBoundary } from "@/components/error-boundary";
import Navigation from "@/components/layout/navigation";
import Footer from "@/components/layout/footer";
import CartDrawer from "@/components/cart/cart-drawer";
import { PageLoader } from "@/components/ui/page-loader";

// Import critical pages directly to avoid lazy loading issues with routing
import Home from "@/pages/home";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import Cart from "@/pages/cart";
import NotFound from "@/pages/not-found";

// Lazy load less critical pages for better code splitting
const Checkout = lazy(() => import("@/pages/checkout"));
const SellToUs = lazy(() => import("@/pages/sell-to-us"));
const TrackSubmission = lazy(() => import("@/pages/track-submission"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const AdminDashboard = lazy(() => import("@/pages/admin"));
const ProductForm = lazy(() => import("@/pages/admin/ProductForm").then(module => ({ default: module.ProductForm })));
const Orders = lazy(() => import("@/pages/orders"));
const Wishlist = lazy(() => import("@/pages/wishlist"));
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const AuthPage = lazy(() => import("@/pages/auth"));

function ScrollRestoration() {
  const [location] = useLocation();
  
  useEffect(() => {
    // Prevent flash of unstyled content
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          document.documentElement.classList.add('loaded');
        });
      } else {
        document.documentElement.classList.add('loaded');
      }
    }
    
    // Don't restore scroll for hash links
    if (location.includes('#')) {
      const hash = location.split('#')[1];
      const element = document.querySelector(`#${hash}`);
      element?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    
    // Check if we have a saved position
    const savedPosition = sessionStorage.getItem(`scroll-${location}`);
    if (savedPosition) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedPosition));
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);
  
  // Save scroll position before navigation
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(`scroll-${location}`, window.scrollY.toString());
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);
  
  return null;
}

function Router() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        {/* Athletic atmosphere overlay */}
        <div className="gym-atmosphere" />
        <Navigation />
        <CartDrawer />
        <ScrollRestoration />
        <main className="flex-1">
          <Suspense fallback={<PageLoader />}>
            <Switch>
              {/* Public Routes */}
              <Route path={ROUTES.HOME} component={Home} />
              <Route path={ROUTES.PRODUCTS} component={Products} />
              <Route path={ROUTES.PRODUCT_DETAIL} component={ProductDetail} />
              <Route path={ROUTES.ABOUT} component={About} />
              <Route path={ROUTES.CONTACT} component={Contact} />
              
              {/* Shopping Routes */}
              <Route path={ROUTES.CART} component={Cart} />
              <Route path={ROUTES.CHECKOUT} component={Checkout} />
              
              {/* Auth Routes */}
              <Route path={ROUTES.LOGIN} component={AuthPage} />
              
              {/* User Routes - No longer wrapped in ProtectedRoute, pages handle auth internally */}
              <Route path={ROUTES.DASHBOARD} component={Dashboard} />
              <Route path={ROUTES.ORDERS} component={Orders} />
              <Route path={ROUTES.WISHLIST} component={Wishlist} />
              <Route path={ROUTES.SUBMIT_EQUIPMENT} component={SellToUs} />
              <Route path={ROUTES.TRACK_SUBMISSION} component={TrackSubmission} />
              
              {/* Admin Routes */}
              <Route path={ROUTES.ADMIN} component={AdminDashboard} />
              <Route path={ROUTES.ADMIN_PRODUCT_NEW} component={ProductForm} />
              <Route path={ROUTES.ADMIN_PRODUCT_EDIT} component={ProductForm} />
              
              {/* 404 */}
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster />
            <Router />
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
