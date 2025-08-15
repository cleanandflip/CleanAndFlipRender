import React, { useEffect, lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { ROUTES } from "@/config/routes";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// CartProvider removed - using direct TanStack Query hooks
import { AuthProvider } from "@/hooks/use-auth";
import ErrorBoundary from "@/components/ErrorBoundary";
import Navigation from "@/components/layout/navigation";
import Footer from "@/components/layout/footer";
import CartDrawer from "@/components/cart/cart-drawer";
import { PageLoader } from "@/components/ui/page-loader";
import { environment } from "@/lib/environment";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Analytics } from "@/components/Analytics";
import { PWAInstaller } from "@/components/PWAInstaller";
import { useWebSocketState } from "@/hooks/useWebSocketState";


// Import critical pages directly to avoid lazy loading issues with routing
import Home from "@/pages/home";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import CartPage from "@/pages/cart.tsx";

import NotFound from "@/pages/not-found";

// Lazy load less critical pages for better code splitting
const Checkout = lazy(() => import("@/pages/checkout"));
const SellToUs = lazy(() => import("@/pages/sell-to-us"));
const TrackSubmission = lazy(() => import("@/pages/track-submission"));
// Removed Wishlist for single-seller model
const Dashboard = lazy(() => import("@/pages/dashboard"));
const AdminDashboard = lazy(() => import("@/pages/admin"));
const ProductForm = lazy(() => import("@/pages/admin/ProductForm").then(module => ({ default: module.ProductForm })));
const Orders = lazy(() => import("@/pages/orders"));
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const LegalPrivacyPolicy = lazy(() => import("@/pages/legal/PrivacyPolicy"));
const LegalTermsOfService = lazy(() => import("@/pages/legal/TermsOfService"));
const ObservabilityPage = lazy(() => import("@/pages/observability"));
const AuthPage = lazy(() => import("@/pages/auth"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const AddressesPage = lazy(() => import("@/pages/addresses").then(module => ({ default: module.AddressesPage })));

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
        <Analytics />
        <PWAInstaller />
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
              <Route path="/privacy-policy" component={LegalPrivacyPolicy} />
              <Route path="/terms-of-service" component={LegalTermsOfService} />
              
              {/* Shopping Routes - Profile completion required */}
              <Route path={ROUTES.CART} component={() => (
                <ProtectedRoute requireCompleteProfile={true}>
                  <CartPage />
                </ProtectedRoute>
              )} />
              <Route path={ROUTES.CHECKOUT} component={() => (
                <ProtectedRoute requireCompleteProfile={true}>
                  <Checkout />
                </ProtectedRoute>
              )} />
              
              {/* Auth Routes */}
              <Route path={ROUTES.LOGIN} component={AuthPage} />

              <Route path="/forgot-password" component={ForgotPassword} />
              <Route path="/reset-password" component={ResetPassword} />
              
              {/* User Routes - No longer wrapped in ProtectedRoute, pages handle auth internally */}
              <Route path={ROUTES.DASHBOARD} component={Dashboard} />
              <Route path={ROUTES.ORDERS} component={Orders} />
              <Route path={ROUTES.SUBMIT_EQUIPMENT} component={SellToUs} />
              <Route path={ROUTES.TRACK_SUBMISSION} component={TrackSubmission} />
              {/* Addresses route removed - functionality integrated into dashboard */}

              
              {/* Admin Routes */}
              <Route path="/admin/:tab?" component={AdminDashboard} />
              <Route path={ROUTES.ADMIN} component={AdminDashboard} />
              <Route path={ROUTES.ADMIN_PRODUCT_NEW} component={ProductForm} />
              <Route path={ROUTES.ADMIN_PRODUCT_EDIT} component={ProductForm} />
              <Route path="/admin/observability" component={ObservabilityPage} />
              
              {/* Legal Routes */}
              <Route path="/terms-of-service" component={LegalTermsOfService} />
              <Route path="/privacy-policy" component={LegalPrivacyPolicy} />
              
              {/* 404 */}
              <Route path="*" component={() => <NotFound />} />
            </Switch>
          </Suspense>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}

function App() {
  // Initialize singleton WebSocket connection to prevent duplicates
  const { connected } = useWebSocketState();
  useEffect(() => {
    // Disable Replit's embed warnings globally
    environment.disableReplitEmbeds();
    
    // Override any Replit beforeunload handlers
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = function(type: string, listener: any, options?: any) {
      if (type === 'beforeunload' && listener?.toString().includes('replit')) {
        return;
      }
      return originalAddEventListener.call(this, type, listener, options);
    };

    // Removed global window focus invalidation - was causing reload loops in Replit environment
    // Individual components now handle their own focus refreshing as needed

    // Clean up on unmount
    return () => {
      window.onbeforeunload = null;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <React.Fragment>
            <Toaster />
            <Router />
          </React.Fragment>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
