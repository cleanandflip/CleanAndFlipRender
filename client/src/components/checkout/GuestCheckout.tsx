import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card } from "@/components/shared/AnimatedComponents";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, MapPin, Lock } from "lucide-react";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const guestCheckoutSchema = z.object({
  email: z.string().email("Valid email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  street1: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "Valid ZIP code is required"),
  createAccount: z.boolean().default(false),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  marketingEmails: z.boolean().default(false),
}).refine((data) => {
  if (data.createAccount && (!data.password || data.password.length < 8)) {
    return false;
  }
  if (data.createAccount && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Password must be at least 8 characters and passwords must match",
  path: ["password"],
});

type GuestCheckoutForm = z.infer<typeof guestCheckoutSchema>;

interface GuestCheckoutProps {
  onSubmit: (data: GuestCheckoutForm) => void;
  isLoading?: boolean;
}

export function GuestCheckout({ onSubmit, isLoading = false }: GuestCheckoutProps) {
  const { toast } = useToast();
  const [showAccountCreation, setShowAccountCreation] = useState(false);

  const form = useForm<GuestCheckoutForm>({
    resolver: zodResolver(guestCheckoutSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      street1: '',
      city: '',
      state: '',
      zipCode: '',
      createAccount: false,
      password: '',
      confirmPassword: '',
      marketingEmails: false,
    },
  });

  // Track if form has changes by comparing with initial values
  const formValues = form.watch();
  const hasChanges = formValues.email !== '' || formValues.firstName !== '' ||
    formValues.lastName !== '' || formValues.phone !== '' ||
    formValues.street1 !== '' || formValues.city !== '' ||
    formValues.state !== '' || formValues.zipCode !== '';

  // Unsaved changes protection
  const unsavedChanges = useUnsavedChanges({
    hasChanges,
    message: 'You have unsaved checkout information. Would you like to complete your purchase before leaving?'
  });

  const createAccount = form.watch('createAccount');

  const handleSubmit = (data: GuestCheckoutForm) => {
    if (data.createAccount && (!data.password || data.password.length < 8)) {
      toast({
        title: "Password Required",
        description: "Please enter a password of at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    if (data.createAccount && data.password !== data.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    onSubmit(data);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-accent-blue to-accent-green rounded-full flex items-center justify-center">
          <User size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bebas">GUEST CHECKOUT</h2>
          <p className="text-sm text-text-secondary">Complete your purchase without creating an account</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-accent-blue">
              <Mail size={20} />
              Contact Information
            </div>
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="your@email.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Doe" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" placeholder="(555) 123-4567" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Shipping Address */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-accent-blue">
              <MapPin size={20} />
              Shipping Address
            </div>

            <FormField
              control={form.control}
              name="street1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="123 Main Street" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="City" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="NC" maxLength={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="12345" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Account Creation Option */}
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <FormField
              control={form.control}
              name="createAccount"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setShowAccountCreation(!!checked);
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="flex items-center gap-2">
                      <Lock size={16} />
                      Create an account for faster checkout next time
                    </FormLabel>
                    <p className="text-xs text-text-secondary">
                      Save your information and track your orders
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {createAccount && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="At least 8 characters" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="Confirm password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="marketingEmails"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Send me updates about new products and promotions</FormLabel>
                        <p className="text-xs text-text-secondary">
                          You can unsubscribe at any time
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Continue to Payment'}
          </Button>

          <p className="text-xs text-text-secondary text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </Form>
      
      {/* Unsaved Changes Dialog */}
      <ConfirmDialog
        isOpen={unsavedChanges.showDialog}
        title="Unsaved Checkout Information"
        message="You have unsaved checkout information. Would you like to complete your purchase before leaving?"
        onSave={() => unsavedChanges.handleSave(() => {
          form.handleSubmit(handleSubmit)();
        })}
        onDiscard={unsavedChanges.handleDiscard}
        onCancel={unsavedChanges.handleCancel}
        showSave={true}
      />
    </Card>
  );
}