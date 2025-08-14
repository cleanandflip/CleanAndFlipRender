import { AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { useLocality } from "@/hooks/useLocality";
import { Button } from "@/components/ui/button";

export default function SellToUsPage() {
  const { data: locality } = useLocality();

  if (!locality?.eligible) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-red-300/40 bg-red-50/50 p-6 dark:border-red-800/40 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">
                Unavailable in your area
              </h2>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                "Sell to Us" is only available for local pickup & delivery in our Asheville service area.
                Set a local default address to continue.
              </p>
              <div className="mt-4 flex gap-3">
                <Button asChild>
                  <Link href="/dashboard#addresses">Set a local address</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Browse products</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Existing form UI for eligible users would go here
  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-2xl border bg-card p-6">
        <h1 className="text-2xl font-bold mb-4">Sell Your Equipment</h1>
        <p className="text-muted-foreground mb-6">
          We're interested in purchasing quality fitness equipment. Submit details about your items below.
        </p>
        
        <div className="space-y-6">
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✅ You're in our local service area and eligible to sell equipment to us.
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-muted-foreground">
              Equipment submission form coming soon. 
              Contact us directly for immediate inquiries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}