import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Dumbbell, Users, Shield, CheckCircle, TrendingUp } from "lucide-react";
import GlassCard from "@/components/common/glass-card";
import Logo from "@/components/common/logo";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { SecurityNotice } from "@/components/auth/security-notice";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);
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
    
    registerMutation.mutate({
      email: formData.get("email") as string,
      password,
      confirmPassword,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      address: formData.get("address") as string,
      cityStateZip: formData.get("cityStateZip") as string,
      phone: formData.get("phone") as string,
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-xl" ref={formContainerRef}>
          <div className="text-center mb-8">
            <Logo size="lg" className="mx-auto mb-6" />
            <h1 className="font-bebas text-5xl text-white tracking-wider mb-4">JOIN THE MARKETPLACE</h1>
            <p className="text-text-secondary text-xl leading-relaxed max-w-lg mx-auto">Turn unused gear into cash, buy quality equipment you can trust</p>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 glass h-14 text-lg">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-accent-blue data-[state=active]:text-white font-medium transition-all duration-200 text-lg"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="data-[state=active]:bg-accent-blue data-[state=active]:text-white font-medium transition-all duration-200 text-lg"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="transition-all duration-300 ease-in-out">
              <GlassCard className="p-8">
                <div className="mb-8">
                  <h2 className="font-bebas text-3xl text-white tracking-wider mb-3">WELCOME BACK</h2>
                  <p className="text-text-secondary">
                    Sign in to your account to continue
                  </p>
                </div>
                <form ref={loginFormRef} onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-4">
                    <Label htmlFor="email" className="text-text-secondary font-medium text-xl">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="glass bg-transparent border-glass-border text-white placeholder:text-text-muted h-20 text-2xl px-8 transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30"
                      placeholder="Enter your email"
                      onFocus={scrollToForm}
                    />
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="password" className="text-text-secondary font-medium text-xl">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="glass bg-transparent border-glass-border text-white placeholder:text-text-muted h-20 text-2xl px-8 transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30"
                      placeholder="Enter your password"
                      onFocus={scrollToForm}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-accent-blue hover:bg-blue-500 text-white font-medium h-16 text-xl transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-xl"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-4 h-8 w-8 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </GlassCard>
            </TabsContent>

            <TabsContent value="register" className="transition-all duration-300 ease-in-out">
              <GlassCard className="p-8">
                <div className="mb-6">
                  <h2 className="font-bebas text-3xl text-white tracking-wider mb-3">CREATE SECURE ACCOUNT</h2>
                  <p className="text-text-secondary">
                    Join Clean & Flip to buy and sell equipment securely
                  </p>
                </div>

                <SecurityNotice />

                <form ref={registerFormRef} onSubmit={handleRegister} className="space-y-6 mt-8">
                  {/* Personal Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-accent-blue" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-text-secondary font-medium">First Name *</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          type="text"
                          required
                          className="glass bg-transparent border-glass-border text-white placeholder:text-text-muted h-12 px-4 transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30"
                          placeholder="First Name"
                          onFocus={scrollToForm}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-text-secondary font-medium">Last Name *</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          type="text"
                          required
                          className="glass bg-transparent border-glass-border text-white placeholder:text-text-muted h-12 px-4 transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30"
                          placeholder="Last Name"
                          onFocus={scrollToForm}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-text-secondary font-medium">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="glass bg-transparent border-glass-border text-white placeholder:text-text-muted h-12 px-4 transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30"
                        placeholder="your.email@example.com"
                        onFocus={scrollToForm}
                      />
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Shield className="h-5 w-5 text-accent-blue" />
                      Location
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-text-secondary font-medium">Street Address *</Label>
                      <Input
                        id="address"
                        name="address"
                        type="text"
                        required
                        className="glass bg-transparent border-glass-border text-white placeholder:text-text-muted h-12 px-4 transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30"
                        placeholder="123 Main Street"
                        onFocus={scrollToForm}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cityStateZip" className="text-text-secondary font-medium">City, State ZIP *</Label>
                      <Input
                        id="cityStateZip"
                        name="cityStateZip"
                        type="text"
                        required
                        className="glass bg-transparent border-glass-border text-white placeholder:text-text-muted h-12 px-4 transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30"
                        placeholder="Asheville, NC 28806"
                        onFocus={scrollToForm}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-text-secondary font-medium">Phone Number <span className="text-text-muted">(Optional)</span></Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        className="glass bg-transparent border-glass-border text-white placeholder:text-text-muted h-12 px-4 transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30"
                        placeholder="(555) 123-4567"
                        onFocus={scrollToForm}
                      />
                    </div>
                  </div>

                  {/* Security Section */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Shield className="h-5 w-5 text-accent-blue" />
                      Create Secure Password
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-text-secondary font-medium">Password *</Label>
                      <PasswordInput
                        id="password"
                        name="password"
                        placeholder="Create a strong password"
                        required
                        className="glass bg-transparent border-glass-border text-white placeholder:text-text-muted h-12 px-4 transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30"
                        value={password}
                        onChange={handlePasswordChange}
                        onFocus={scrollToForm}
                      />
                    </div>

                    {password && <PasswordStrengthMeter password={password} />}
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-text-secondary font-medium">Confirm Password *</Label>
                      <PasswordInput
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        required
                        className={`glass bg-transparent border-glass-border text-white placeholder:text-text-muted h-12 px-4 transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30 ${
                          !passwordsMatch ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 
                          confirmPassword && passwordsMatch ? 'border-green-500 focus:border-green-500 focus:ring-green-500/30' : ''
                        }`}
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        onFocus={scrollToForm}
                      />
                      {!passwordsMatch && confirmPassword && (
                        <p className="text-red-400 text-sm mt-1">Passwords do not match</p>
                      )}
                      {passwordsMatch && confirmPassword && password && (
                        <p className="text-green-400 text-sm mt-1 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Passwords match
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-accent-blue hover:bg-blue-500 text-white font-medium h-14 text-lg transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-xl mt-8"
                    disabled={registerMutation.isPending || !passwordsMatch}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                        Creating Secure Account...
                      </>
                    ) : (
                      "Create Secure Account"
                    )}
                  </Button>
                </form>
              </GlassCard>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Side - Hero Section */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12">
        <div className="max-w-xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full glass mb-8 transition-all duration-300 hover:scale-110">
              <Dumbbell className="h-12 w-12 text-accent-blue" />
            </div>
            <h2 className="font-bebas text-6xl text-white tracking-wider mb-6">TRUSTED MARKETPLACE</h2>
            <p className="text-text-secondary text-xl leading-relaxed">
              Join hundreds of fitness enthusiasts buying and selling quality equipment with expert inspection and fair pricing.
            </p>
          </div>

          <div className="space-y-8">
            <GlassCard className="p-8 glass-hover transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bebas text-2xl text-white tracking-wider mb-3">VERIFIED QUALITY</h3>
                  <p className="text-text-secondary text-lg">All equipment professionally inspected and guaranteed before sale</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-8 glass-hover transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-accent-blue rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bebas text-2xl text-white tracking-wider mb-3">EXPERT KNOWLEDGE</h3>
                  <p className="text-text-secondary text-lg">Weightlifting specialists with years of experience in quality equipment</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-8 glass-hover transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-warning rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bebas text-2xl text-white tracking-wider mb-3">FAIR PRICING</h3>
                  <p className="text-text-secondary text-lg">Best market value for both buyers and sellers in the fitness community</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}