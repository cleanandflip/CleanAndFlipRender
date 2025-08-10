import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground mt-2">
          Last updated: August 10, 2025
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Information We Collect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Personal Information</h3>
            <p className="text-muted-foreground">
              We collect information you provide directly to us, such as when you create an account, 
              make a purchase, or contact us. This includes your name, email address, phone number, 
              shipping address, and payment information.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Usage Information</h3>
            <p className="text-muted-foreground">
              We collect information about how you use our service, including pages visited, 
              products viewed, and interactions with our website.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Device Information</h3>
            <p className="text-muted-foreground">
              We may collect information about the device you use to access our service, 
              including IP address, browser type, and operating system.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>How We Use Your Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Process orders and manage your account</li>
            <li>Communicate with you about orders, updates, and support</li>
            <li>Improve our products and services</li>
            <li>Comply with legal obligations</li>
            <li>Prevent fraud and maintain security</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Information Sharing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            We do not sell, trade, or rent your personal information to third parties. 
            We may share your information only in the following circumstances:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>With service providers who help us operate our business</li>
            <li>To comply with legal requirements or protect our rights</li>
            <li>In connection with a business transfer or merger</li>
            <li>With your explicit consent</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Data Security</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            We implement appropriate technical and organizational measures to protect your 
            personal information against unauthorized access, alteration, disclosure, or destruction. 
            This includes encryption, secure servers, and regular security audits.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Rights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground mb-4">You have the right to:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Access and review your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Object to certain processing of your information</li>
            <li>Export your data in a portable format</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Cookies and Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            We use cookies and similar technologies to enhance your experience, analyze usage, 
            and provide personalized content. You can control cookie settings through your 
            browser preferences.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            If you have questions about this Privacy Policy or our data practices, 
            please contact us at:
          </p>
          <div className="mt-4 space-y-1">
            <p><strong>Email:</strong> privacy@cleanandflip.com</p>
            <p><strong>Address:</strong> Clean & Flip, Asheville, NC</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Changes to This Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time. We will notify you of 
            any changes by posting the new Privacy Policy on this page and updating 
            the "Last updated" date.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}