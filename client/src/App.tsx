import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
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

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location]);

  return null;
}

function Router() {
  // Initialize real-time sync for cache management
  useRealtimeSync();
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <Navigation />
        <CartDrawer />
        <ScrollToTop />
        <main className="flex-1">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/products" component={Products} />
            <Route path="/products/:id" component={ProductDetail} />
            <Route path="/cart" component={Cart} />
            <Route path="/checkout" component={Checkout} />
            <Route path="/sell-to-us" component={SellToUs} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/products/new" component={ProductForm} />
            <Route path="/admin/products/edit/:id" component={ProductForm} />
            <Route path="/orders" component={Orders} />
            <Route path="/about" component={About} />
            <Route path="/contact" component={Contact} />
            <Route path="/auth" component={AuthPage} />
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
