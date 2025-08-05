import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, CheckCircle, X } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases with helpful messages
        if (response.status === 404) {
          throw new Error(errorData.error + '\n\n' + errorData.message);
        }
        if (response.status === 429) {
          throw new Error('Too many reset attempts. Please wait 15 minutes before trying again.');
        }
        
        throw new Error(errorData.error || 'Failed to send reset email');
      }

      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: 'Reset email sent',
        description: 'Check your email for password reset instructions.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Check Your Email</CardTitle>
            <CardDescription className="text-gray-300">
              We've sent password reset instructions to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-gray-300 text-sm">
              <p>Didn't receive the email? Check your spam folder or try again.</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={() => setIsSubmitted(false)}
                className="w-full bg-white/10 hover:bg-white/20 text-white border-white/30"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Another Email
              </Button>
              <Link href="/login">
                <Button variant="ghost" className="w-full text-gray-300 hover:text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Reset Password</CardTitle>
          <CardDescription className="text-gray-300">
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="email"
                          placeholder="Enter your email address"
                          className="bg-white/10 border-white/30 text-white placeholder-gray-400 focus:border-blue-400 pr-10"
                          {...field}
                        />
                        {field.value && (
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange('');
                              form.clearErrors('email');
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            tabIndex={-1}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              {forgotPasswordMutation.error && (
                <Alert className="bg-red-500/20 border-red-500/30">
                  <AlertDescription className="text-red-300 whitespace-pre-line">
                    {forgotPasswordMutation.error.message}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={forgotPasswordMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {forgotPasswordMutation.isPending ? 'Sending...' : 'Send Reset Email'}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}