import { Lock, Shield, CheckCircle } from "lucide-react";

export function SecurityNotice() {
  return (
    <div className="space-y-4">
      {/* Security Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-5 w-5 text-accent-blue" />
          <h4 className="text-lg font-semibold text-primary">Your Security Matters</h4>
        </div>
        <p className="text-sm text-text-secondary">
          Your password is encrypted and never stored in plain text
        </p>
      </div>

      {/* Security Badges */}
      <div className="flex flex-wrap justify-center gap-2">
        <div className="flex items-center gap-1 px-3 py-1 bg-bg-card-secondary rounded-full border border-bg-card-border">
          <Lock className="h-3 w-3 text-green-400" />
          <span className="text-xs text-text-secondary">256-bit Encryption</span>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 bg-bg-card-secondary rounded-full border border-bg-card-border">
          <Shield className="h-3 w-3 text-blue-400" />
          <span className="text-xs text-text-secondary">Secure Connection</span>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 bg-bg-card-secondary rounded-full border border-bg-card-border">
          <CheckCircle className="h-3 w-3 text-accent-blue" />
          <span className="text-xs text-text-secondary">PCI Compliant</span>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="flex items-center justify-center gap-2 p-3 bg-card rounded-lg border border-bg-card-border">
        <Lock className="h-4 w-4 text-accent-blue" />
        <span className="text-sm text-text-secondary">
          Your information is encrypted and secure
        </span>
      </div>
    </div>
  );
}