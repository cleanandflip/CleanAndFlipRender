import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

interface AnalyticsEvent {
  event: string;
  page_title?: string;
  page_location?: string;
  user_id?: string;
  custom_parameters?: Record<string, any>;
}

class AnalyticsManager {
  private static initialized = false;
  private static queue: AnalyticsEvent[] = [];
  
  static init() {
    if (this.initialized) return;
    
    // Initialize Google Analytics 4 if GA_MEASUREMENT_ID is available
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (gaId && typeof window !== 'undefined') {
      // Load gtag script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      // Initialize gtag
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).gtag = function() {
        (window as any).dataLayer.push(arguments);
      };

      (window as any).gtag('js', new Date());
      (window as any).gtag('config', gaId, {
        page_title: document.title,
        page_location: window.location.href,
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false
      });

      console.log('Google Analytics 4 initialized');
    }

    // Process queued events
    this.queue.forEach(event => this.trackEvent(event));
    this.queue = [];
    
    this.initialized = true;
  }

  static trackEvent(event: AnalyticsEvent) {
    if (!this.initialized) {
      this.queue.push(event);
      return;
    }

    // Google Analytics 4
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', event.event, {
        page_title: event.page_title,
        page_location: event.page_location,
        user_id: event.user_id,
        ...event.custom_parameters
      });
    }

    // Internal analytics tracking
    this.trackInternalEvent(event);
  }

  static trackPageView(path: string, title?: string, userId?: string) {
    this.trackEvent({
      event: 'page_view',
      page_title: title || document.title,
      page_location: window.location.origin + path,
      user_id: userId
    });
  }

  static trackPurchase(orderId: string, value: number, currency: string = 'USD', items: any[] = []) {
    this.trackEvent({
      event: 'purchase',
      custom_parameters: {
        transaction_id: orderId,
        value: value,
        currency: currency,
        items: items
      }
    });
  }

  static trackAddToCart(itemId: string, itemName: string, price: number, quantity: number = 1) {
    this.trackEvent({
      event: 'add_to_cart',
      custom_parameters: {
        currency: 'USD',
        value: price * quantity,
        items: [{
          item_id: itemId,
          item_name: itemName,
          quantity: quantity,
          price: price
        }]
      }
    });
  }

  static trackRemoveFromCart(itemId: string, itemName: string, price: number, quantity: number = 1) {
    this.trackEvent({
      event: 'remove_from_cart',
      custom_parameters: {
        currency: 'USD',
        value: price * quantity,
        items: [{
          item_id: itemId,
          item_name: itemName,
          quantity: quantity,
          price: price
        }]
      }
    });
  }

  static trackSearch(searchTerm: string, resultsCount?: number) {
    this.trackEvent({
      event: 'search',
      custom_parameters: {
        search_term: searchTerm,
        results_count: resultsCount
      }
    });
  }

  static trackSignUp(method: string = 'email') {
    this.trackEvent({
      event: 'sign_up',
      custom_parameters: {
        method: method
      }
    });
  }

  static trackLogin(method: string = 'email') {
    this.trackEvent({
      event: 'login',
      custom_parameters: {
        method: method
      }
    });
  }

  static trackViewItem(itemId: string, itemName: string, category: string, price: number) {
    this.trackEvent({
      event: 'view_item',
      custom_parameters: {
        currency: 'USD',
        value: price,
        items: [{
          item_id: itemId,
          item_name: itemName,
          item_category: category,
          price: price
        }]
      }
    });
  }

  static trackCustomEvent(eventName: string, parameters: Record<string, any> = {}) {
    this.trackEvent({
      event: eventName,
      custom_parameters: parameters
    });
  }

  private static async trackInternalEvent(event: AnalyticsEvent) {
    try {
      // Send to our internal analytics API
      await fetch('/api/track-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: event.event,
          pageUrl: event.page_location || window.location.href,
          userId: event.user_id,
          metadata: event.custom_parameters
        })
      });
    } catch (error) {
      console.warn('Failed to track internal analytics event:', error);
    }
  }
}

// React component for tracking page views
export function Analytics() {
  const [location] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Initialize analytics on mount
    AnalyticsManager.init();
  }, []);

  useEffect(() => {
    // Track page view on location change
    const userId = user?.id;
    AnalyticsManager.trackPageView(location, document.title, userId);
  }, [location, user?.id]);

  return null;
}

// Hook for using analytics in components
export function useAnalytics() {
  return {
    trackEvent: AnalyticsManager.trackEvent.bind(AnalyticsManager),
    trackPurchase: AnalyticsManager.trackPurchase.bind(AnalyticsManager),
    trackAddToCart: AnalyticsManager.trackAddToCart.bind(AnalyticsManager),
    trackRemoveFromCart: AnalyticsManager.trackRemoveFromCart.bind(AnalyticsManager),
    trackSearch: AnalyticsManager.trackSearch.bind(AnalyticsManager),
    trackSignUp: AnalyticsManager.trackSignUp.bind(AnalyticsManager),
    trackLogin: AnalyticsManager.trackLogin.bind(AnalyticsManager),
    trackViewItem: AnalyticsManager.trackViewItem.bind(AnalyticsManager),
    trackCustomEvent: AnalyticsManager.trackCustomEvent.bind(AnalyticsManager)
  };
}

export { AnalyticsManager };