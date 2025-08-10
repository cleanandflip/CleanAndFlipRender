import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed (standalone mode)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isInStandaloneMode);

    // Handle the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      const lastDismissed = dismissed ? parseInt(dismissed) : 0;
      const daysSinceDismissed = (Date.now() - lastDismissed) / (1000 * 60 * 60 * 24);
      
      // Show prompt if not dismissed recently (7 days cooloff)
      if (!dismissed || daysSinceDismissed > 7) {
        setShowInstallPrompt(true);
      }
    };

    // Handle successful installation
    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      
      // Track installation
      if ('gtag' in window) {
        (window as any).gtag('event', 'app_installed', {
          event_category: 'PWA',
          event_label: 'Clean & Flip PWA'
        });
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted');
      } else {
        console.log('PWA installation declined');
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't show if already installed or no prompt available
  if (isStandalone || (!deferredPrompt && !isIOS) || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:w-96">
      <Card className="shadow-lg border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
              {isIOS ? (
                <Smartphone className="w-5 h-5 text-primary" />
              ) : (
                <Monitor className="w-5 h-5 text-primary" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">Install Clean & Flip</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isIOS 
                  ? "Add to Home Screen for quick access and app-like experience"
                  : "Install our app for faster loading and offline access"
                }
              </p>
              
              {isIOS ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    1. Tap the share button <span className="inline-block w-4 h-4 bg-blue-500 rounded text-white text-center leading-4">↗</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    2. Select "Add to Home Screen"
                  </p>
                </div>
              ) : (
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={handleInstallClick}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Install
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                  >
                    Later
                  </Button>
                </div>
              )}
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="flex-shrink-0 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}