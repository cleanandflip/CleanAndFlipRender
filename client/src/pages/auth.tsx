import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Dumbbell, Users, Shield, CheckCircle, TrendingUp } from "lucide-react";
import GlassCard from "@/components/common/glass-card";
import Logo from "@/components/common/logo";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    loginMutation.mutate({
      username: formData.get("username") as string,
      password: formData.get("password") as string,
    });
  };

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    registerMutation.mutate({
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phone: formData.get("phone") as string,
    });
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
      <div className="flex-1 flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <Logo size="lg" className="mx-auto mb-6" />
            <h1 className="font-bebas text-3xl text-white tracking-wider mb-3">JOIN THE MARKETPLACE</h1>
            <p className="text-text-secondary text-base leading-relaxed">Turn unused gear into cash, buy quality equipment you can trust</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 glass h-11">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-accent-blue data-[state=active]:text-white font-medium transition-all duration-200"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="data-[state=active]:bg-accent-blue data-[state=active]:text-white font-medium transition-all duration-200"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="transition-all duration-300 ease-in-out">
              <GlassCard className="p-8">
                <div className="mb-6">
                  <h2 className="font-bebas text-2xl text-white tracking-wider mb-2">WELCOME BACK</h2>
                  <p className="text-text-secondary text-sm">
                    Sign in to your account to continue
                  </p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="username" className="text-text-secondary font-medium">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      required
                      className="glass bg-transparent border-glass-border text-white placeholder:text-text-muted h-14 text-lg transition-all duration-200 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                      placeholder="Enter your username"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-text-secondary font-medium">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="glass bg-transparent border-glass-border text-white placeholder:text-text-muted h-14 text-lg transition-all duration-200 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                      placeholder="Enter your password"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full glass hover:bg-accent-blue/80 border border-accent-blue/30 text-accent-blue hover:text-white font-medium h-14 text-lg transition-all duration-200 hover:scale-[1.02] hover:border-accent-blue"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
                  <h2 className="font-bebas text-2xl text-white tracking-wider mb-2">CREATE ACCOUNT</h2>
                  <p className="text-text-secondary text-sm">
                    Join Clean & Flip to buy and sell equipment
                  </p>
                </div>
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="firstName" className="text-text-secondary font-medium">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        className="glass bg-transparent border-glass-border text-white placeholder:text-text-muted h-12 transition-all duration-200 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="lastName" className="text-text-secondary font-medium">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        className="glass bg-transparent border-glass-border text-white placeholder:text-text-muted h-12 transition-all duration-200 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="username" className="text-text-secondary font-medium">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      required
                      className="glass bg-transparent border-glass-border text-white placeholder:text-text-muted h-12 transition-all duration-200 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                      placeholder="Choose a username"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-text-secondary font-medium">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="glass bg-transparent border-glass-border text-white placeholder:text-text-muted h-12 transition-all duration-200 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-text-secondary font-medium">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      className="glass bg-transparent border-glass-border text-white placeholder:text-text-muted h-12 transition-all duration-200 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-text-secondary font-medium">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="glass bg-transparent border-glass-border text-white placeholder:text-text-muted h-12 transition-all duration-200 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                      placeholder="Create a strong password"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full glass hover:bg-accent-blue/80 border border-accent-blue/30 text-accent-blue hover:text-white font-medium h-14 text-lg transition-all duration-200 hover:scale-[1.02] hover:border-accent-blue mt-6"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </GlassCard>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Side - Hero Section */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8">
        <div className="max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full glass mb-6 transition-all duration-300 hover:scale-110">
              <Dumbbell className="h-8 w-8 text-accent-blue" />
            </div>
            <h2 className="font-bebas text-4xl text-white tracking-wider mb-4">TRUSTED MARKETPLACE</h2>
            <p className="text-text-secondary leading-relaxed">
              Join hundreds of fitness enthusiasts buying and selling quality equipment with expert inspection and fair pricing.
            </p>
          </div>

          <div className="space-y-6">
            <GlassCard className="p-5 glass-hover transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-success rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bebas text-lg text-white tracking-wider mb-1">VERIFIED QUALITY</h3>
                  <p className="text-text-secondary text-sm">All equipment professionally inspected and guaranteed before sale</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-5 glass-hover transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-accent-blue rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bebas text-lg text-white tracking-wider mb-1">EXPERT KNOWLEDGE</h3>
                  <p className="text-text-secondary text-sm">Weightlifting specialists with years of experience in quality equipment</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-5 glass-hover transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-warning rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bebas text-lg text-white tracking-wider mb-1">FAIR PRICING</h3>
                  <p className="text-text-secondary text-sm">Best market value for both buyers and sellers in the fitness community</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}