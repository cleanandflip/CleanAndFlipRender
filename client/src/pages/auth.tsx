import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
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

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  const [addressData, setAddressData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    fullAddress: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined
  });
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
    
    // Determine if local customer
    const ashevilleZips = ['28801', '28802', '28803', '28804', '28805', '28806', '28810', '28813', '28814', '28815', '28816'];
    const isLocalCustomer = ashevilleZips.includes(addressData.zipCode);
    
    registerMutation.mutate({
      email: formData.get("email") as string,
      password,
      confirmPassword,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phone: formData.get("phone") as string,
      fullAddress: addressData.fullAddress,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      isLocalCustomer
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
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-xl" ref={formContainerRef}>
          {/* Just the logo - no redundant text */}
          <Logo size="lg" textOnly={true} className="mb-8" />

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
              <Card className="p-8">
                <div className="mb-8">
                  <h2 className="font-bebas text-3xl text-white tracking-wider mb-3">WELCOME BACK</h2>
                  <p className="text-white">
                    Sign in to your account to continue
                  </p>
                </div>
                <form ref={loginFormRef} onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-4">
                    <Label htmlFor="email" className="text-white font-medium text-xl">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="h-20 text-2xl px-8 transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30 placeholder:text-white"
                      placeholder="Enter your email"
                      onFocus={scrollToForm}
                    />
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="password" className="text-white font-medium text-xl">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="h-20 text-2xl px-8 transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30 placeholder:text-white"
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
              </Card>
            </TabsContent>

            <TabsContent value="register" className="transition-all duration-300 ease-in-out">
              <Card className="p-8">
                <div className="mb-6">
                  <h2 className="font-bebas text-3xl text-white tracking-wider mb-2">CREATE ACCOUNT</h2>
                  <p className="text-white">
                    Join Clean & Flip to buy and sell equipment
                  </p>
                </div>

                <form ref={registerFormRef} onSubmit={handleRegister} className="space-y-5">
                  {/* Name fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      className="h-12 px-4 transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30 placeholder:text-white"
                      placeholder="First Name"
                      onFocus={scrollToForm}
                    />
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      className="h-12 px-4 transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30 placeholder:text-white"
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
                    className="h-12 px-4 transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30 placeholder:text-white"
                    placeholder="Email Address"
                    onFocus={scrollToForm}
                  />
                  
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="h-12 px-4 transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30 placeholder:text-white"
                    placeholder="Phone Number (Optional)"
                    onFocus={scrollToForm}
                  />
                  
                  {/* Address Autocomplete */}
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-text-secondary text-sm">Address</Label>
                    <AddressAutocomplete
                      id="address"
                      name="address"
                      value={addressData.fullAddress}
                      onChange={(parsed) => {
                        setAddressData({
                          street: parsed.street,
                          city: parsed.city,
                          state: parsed.state,
                          zipCode: parsed.zipCode,
                          fullAddress: parsed.fullAddress,
                          latitude: parsed.coordinates?.lat,
                          longitude: parsed.coordinates?.lng
                        });
                      }}
                      placeholder="Start typing your address..."
                      className="h-12 px-4 transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30 placeholder:text-white"
                      required
                    />
                  </div>
                  
                  {/* Password with inline helper */}
                  <div className="space-y-1">
                    <div className="relative">
                      <PasswordInput
                        id="password"
                        name="password"
                        placeholder="Password"
                        required
                        className={`h-12 px-4 transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30 placeholder:text-white ${
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
                    </div>
                    <div className="text-xs text-text-muted">
                      Min 8 characters, include numbers & symbols
                    </div>
                    {passwordFocused && password && !isPasswordValid(password) && (
                      <div className="text-xs text-red-400">
                        Need: uppercase, lowercase, number, special character
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <PasswordInput
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      required
                      className={`h-12 px-4 transition-all duration-200 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30 placeholder:text-white ${
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
                    className="w-full bg-accent-blue hover:bg-blue-500 text-white font-medium h-12 text-lg transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-xl mt-6"
                    disabled={registerMutation.isPending || !passwordsMatch || (!!password && !isPasswordValid(password))}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>

                {/* Security info as subtle footer */}
                <div className="mt-6 pt-4 border-t border-border/50">
                  <button
                    type="button"
                    onClick={() => setShowSecurityInfo(!showSecurityInfo)}
                    className="text-sm text-text-muted hover:text-text-secondary transition-colors duration-200 flex items-center gap-2"
                  >
                    <Shield className="h-3 w-3" />
                    Secure Registration • Learn about our security
                    <span className={`transition-transform duration-200 ${showSecurityInfo ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  
                  {showSecurityInfo && (
                    <div className="mt-3 p-3 glass rounded border border-border text-sm text-text-secondary space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span>256-bit encryption protects your data</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span>Passwords never stored in plain text</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span>PCI compliant payment processing</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
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
            <Card className="p-8 glass-hover transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bebas text-2xl text-white tracking-wider mb-3">VERIFIED QUALITY</h3>
                  <p className="text-text-secondary text-lg">All equipment professionally inspected and guaranteed before sale</p>
                </div>
              </div>
            </Card>

            <Card className="p-8 glass-hover transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-accent-blue rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bebas text-2xl text-white tracking-wider mb-3">EXPERT KNOWLEDGE</h3>
                  <p className="text-text-secondary text-lg">Weightlifting specialists with years of experience in quality equipment</p>
                </div>
              </div>
            </Card>

            <Card className="p-8 glass-hover transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-warning rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bebas text-2xl text-white tracking-wider mb-3">FAIR PRICING</h3>
                  <p className="text-text-secondary text-lg">Best market value for both buyers and sellers in the fitness community</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}