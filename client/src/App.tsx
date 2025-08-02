import { Switch, Route, useLocation } from "wouter";
import { ROUTES } from "@/config/routes";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/hooks/use-cart";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import { ErrorBoundary } from "@/components/error-boundary";
import Home from "@/pages/home";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import SellToUs from "@/pages/sell-to-us";
import TrackSubmission from "@/pages/track-submission";
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin";
import { ProductForm } from "@/pages/admin/ProductForm";
import Orders from "@/pages/orders";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import AuthPage from "@/pages/auth";
import Navigation from "@/components/layout/navigation";
import Footer from "@/components/layout/footer";
import CartDrawer from "@/components/cart/cart-drawer";

function ScrollRestoration() {
  const [location] = useLocation();
  
  useEffect(() => {
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
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <Navigation />
        <CartDrawer />
        <ScrollRestoration />
        <main className="flex-1">
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
            
            {/* User Routes */}
            <Route path={ROUTES.DASHBOARD} component={Dashboard} />
            <Route path={ROUTES.ORDERS} component={Orders} />
            <Route path={ROUTES.SUBMIT_EQUIPMENT} component={SellToUs} />
            <Route path={ROUTES.TRACK_SUBMISSION} component={TrackSubmission} />
            
            {/* Admin Routes */}
            <Route path={ROUTES.ADMIN} component={AdminDashboard} />
            <Route path={ROUTES.ADMIN_PRODUCT_NEW} component={ProductForm} />
            <Route path={ROUTES.ADMIN_PRODUCT_EDIT} component={ProductForm} />
            
            {/* 404 */}
            <Route component={NotFound} />
          </Switch>
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
