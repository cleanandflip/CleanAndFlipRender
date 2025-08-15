import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddressAutocomplete from "@/components/ui/address-autocomplete";
import { Loader2, Dumbbell, Users, Shield, CheckCircle, TrendingUp } from "lucide-react";
import { Card } from "@/components/shared/AnimatedComponents";
import { globalDesignSystem as theme } from "@/styles/design-system/theme";
import Logo from "@/components/common/logo";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { SecurityNotice } from "@/components/auth/security-notice";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import type { RegisterData } from "@shared/schema";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  // SSOT: Using unified address system
  const formContainerRef = useRef<HTMLDivElement>(null);
  const loginFormRef = useRef<HTMLFormElement>(null);
  const registerFormRef = useRef<HTMLFormElement>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  const scrollToForm = () => {
    if (formContainerRef.current) {
      formContainerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setTimeout(scrollToForm, 100); // Small delay to ensure tab content renders
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    scrollToForm();
    const formData = new FormData(e.currentTarget);
    loginMutation.mutate({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });
  };

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    scrollToForm();
    
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    
    // Client-side password validation
    if (password !== confirmPassword) {
      setPasswordsMatch(false);
      return;
    }
    
    // FIXED: Register without address - user will complete onboarding after registration
    registerMutation.mutate({
      email: formData.get("email") as string,
      password,
      confirmPassword,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phone: (formData.get("phone") as string) || undefined,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    // Check if passwords match when password changes
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordsMatch(false);
    } else {
      setPasswordsMatch(true);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    // Check if passwords match
    if (password && password !== newConfirmPassword) {
      setPasswordsMatch(false);
    } else {
      setPasswordsMatch(true);
    }
  };

  // Simple password validation for inline display
  const isPasswordValid = (pwd: string) => {
    return pwd.length >= 8 && 
           /[A-Z]/.test(pwd) && 
           /[a-z]/.test(pwd) && 
           /\d/.test(pwd) && 
           /[!@#$%^&*]/.test(pwd);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:items-center lg:gap-12 min-h-[calc(100vh-144px)]">
        
        {/* Left Side - Form (Narrower) */}
        <div className="lg:col-span-5 flex items-center justify-center">
          <div className="w-full max-w-md" ref={formContainerRef}>
            
            {/* Form Card */}
            <div className="p-6 md:p-8 rounded-2xl border bg-card/60 backdrop-blur shadow-sm">
              
              {/* Logo */}
              <div className="text-center mb-6">
                <Logo size="md" textOnly={true} />
              </div>

              {/* Compact Tabs */}
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 h-10 text-sm">
                  <TabsTrigger 
                    value="login" 
                    className="data-[state=active]:bg-accent-blue data-[state=active]:text-white font-medium text-sm"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register" 
                    className="data-[state=active]:bg-accent-blue data-[state=active]:text-white font-medium text-sm"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-6">
                  <form ref={loginFormRef} onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-medium text-white">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          className="field h-11 text-sm px-4"
                          placeholder="Enter your email"
                          onFocus={scrollToForm}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-xs font-medium text-white">Password</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          required
                          className="field h-11 text-sm px-4"
                          placeholder="Enter your password"
                          onFocus={scrollToForm}
                        />
                        <div className="text-right">
                          <Link href="/forgot-password">
                            <button type="button" className="text-accent-blue hover:text-blue-300 text-xs underline transition-colors">
                              Forgot Password?
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full h-11 text-sm px-4 md:px-5 rounded-xl"
                      loading={loginMutation.isPending}
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                  
                  <div className="space-y-3">
                    <div className="text-center text-xs text-gray-400">
                      Or continue with
                    </div>
                    <GoogleSignInButton disabled={loginMutation.isPending} className="h-11" />
                  </div>
                </TabsContent>

                <TabsContent value="register" className="space-y-6">
                  <form ref={registerFormRef} onSubmit={handleRegister} className="space-y-6">
                    {/* Name fields */}
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        className="field h-11 px-4 text-sm"
                        placeholder="First Name"
                        onFocus={scrollToForm}
                      />
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        className="field h-11 px-4 text-sm"
                        placeholder="Last Name"
                        onFocus={scrollToForm}
                      />
                    </div>
                    
                    {/* Contact */}
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="field h-11 px-4 text-sm"
                      placeholder="Email Address"
                      onFocus={scrollToForm}
                    />
                    
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      className="field h-11 px-4 text-sm"
                      placeholder="Phone Number (Optional)"
                      onFocus={scrollToForm}
                    />
                    
                    {/* Password with inline helper */}
                    <div className="space-y-2">
                      <PasswordInput
                        id="password"
                        name="password"
                        placeholder="Password"
                        required
                        className={`h-11 px-4 text-sm transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30 text-white ${
                          password && !isPasswordValid(password) ? 'border-red-500/50' : 
                          password && isPasswordValid(password) ? 'border-green-500/50' : ''
                        }`}
                        value={password}
                        onChange={handlePasswordChange}
                        onFocus={() => {
                          setPasswordFocused(true);
                          scrollToForm();
                        }}
                        onBlur={() => setPasswordFocused(false)}
                      />
                      <div className="text-xs text-text-muted">
                        Min 8 characters, include numbers & symbols
                      </div>
                      {passwordFocused && password && !isPasswordValid(password) && (
                        <div className="text-xs text-red-400">
                          Need: uppercase, lowercase, number, special character
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <PasswordInput
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        required
                        className={`h-11 px-4 text-sm transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30 text-white ${
                          !passwordsMatch && confirmPassword ? 'border-red-500/50' : 
                          passwordsMatch && confirmPassword && password ? 'border-green-500/50' : ''
                        }`}
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        onFocus={scrollToForm}
                      />
                      {!passwordsMatch && confirmPassword && (
                        <div className="text-xs text-red-400">Passwords do not match</div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full h-11 text-sm px-4 md:px-5 rounded-xl"
                      loading={registerMutation.isPending}
                      disabled={registerMutation.isPending || !passwordsMatch || (!!password && !isPasswordValid(password))}
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                  
                  <div className="space-y-3">
                    <div className="text-center text-xs text-gray-400">
                      Or continue with
                    </div>
                    <GoogleSignInButton disabled={registerMutation.isPending} className="h-11" />
                  </div>

                  {/* Security info as subtle footer */}
                  <div className="pt-4 border-t border-border/50">
                    <button
                      type="button"
                      onClick={() => setShowSecurityInfo(!showSecurityInfo)}
                      className="text-xs text-text-muted hover:text-text-secondary transition-colors duration-200 flex items-center gap-2"
                    >
                      <Shield className="h-3 w-3" />
                      Security & Privacy
                      <span className={`transition-transform duration-200 ${showSecurityInfo ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    
                    {showSecurityInfo && (
                      <div className="mt-3 p-3 glass rounded border border-border text-xs text-text-secondary space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          <span>256-bit encryption protects your data</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          <span>Passwords never stored in plain text</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          <span>PCI compliant payment processing</span>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Right Side - Marketing (Wider) */}
        <div className="lg:col-span-7 hidden lg:block">
          <div className="max-w-xl">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight max-w-xl text-white mb-3 md:mb-4">
              Your trusted marketplace for quality fitness equipment
            </h1>
            
            {/* Body copy */}
            <p className="text-sm/6 md:text-base/7 text-muted-foreground max-w-md mb-8">
              Join hundreds of fitness enthusiasts buying and selling quality equipment with expert inspection and fair pricing.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="p-4 md:p-5 rounded-xl border bg-muted/30 flex gap-3">
                <CheckCircle className="size-5 shrink-0 text-green-400" />
                <div>
                  <div className="text-sm font-medium text-white">Verified Quality</div>
                  <div className="text-xs text-muted-foreground">All equipment professionally inspected</div>
                </div>
              </div>
              
              <div className="p-4 md:p-5 rounded-xl border bg-muted/30 flex gap-3">
                <Shield className="size-5 shrink-0 text-blue-400" />
                <div>
                  <div className="text-sm font-medium text-white">Expert Knowledge</div>
                  <div className="text-xs text-muted-foreground">Weightlifting specialists with years of experience</div>
                </div>
              </div>
              
              <div className="p-4 md:p-5 rounded-xl border bg-muted/30 flex gap-3">
                <TrendingUp className="size-5 shrink-0 text-yellow-400" />
                <div>
                  <div className="text-sm font-medium text-white">Fair Pricing</div>
                  <div className="text-xs text-muted-foreground">Best market value for buyers and sellers</div>
                </div>
              </div>
              
              <div className="p-4 md:p-5 rounded-xl border bg-muted/30 flex gap-3">
                <Users className="size-5 shrink-0 text-purple-400" />
                <div>
                  <div className="text-sm font-medium text-white">Community</div>
                  <div className="text-xs text-muted-foreground">Trusted by fitness enthusiasts nationwide</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}