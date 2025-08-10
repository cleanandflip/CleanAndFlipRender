import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground mt-2">
          Last updated: August 10, 2025
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Acceptance of Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            By accessing and using Clean & Flip, you accept and agree to be bound by the terms 
            and provision of this agreement. If you do not agree to abide by the above, 
            please do not use this service.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Use License</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Permission is granted to:</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Browse and purchase equipment listed on our platform</li>
              <li>Submit equipment for evaluation and potential purchase</li>
              <li>Use our services for personal, non-commercial purposes</li>
              <li>Contact customer support for assistance</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">This license does not include:</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Reselling or redistributing our content without permission</li>
              <li>Using automated systems to access or scrape our platform</li>
              <li>Attempting to reverse engineer or compromise our systems</li>
              <li>Violating any applicable laws or regulations</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Equipment Purchases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>All equipment is sold as-is with accurate condition descriptions</li>
            <li>Prices include applicable taxes and are subject to change</li>
            <li>Payment is processed securely through Stripe</li>
            <li>Local delivery available in Asheville, NC area</li>
            <li>Equipment inspection encouraged before purchase completion</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Equipment Submissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Equipment must be in working condition and accurately described</li>
            <li>We reserve the right to evaluate and decline any submission</li>
            <li>Pricing is determined based on condition, demand, and market value</li>
            <li>Payment for accepted equipment made within 7 business days</li>
            <li>Equipment becomes our property upon payment completion</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>You are responsible for maintaining account security</li>
            <li>Accurate information must be provided for all transactions</li>
            <li>One account per person; shared accounts are prohibited</li>
            <li>We may suspend accounts for policy violations</li>
            <li>Account deletion available upon request</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Limitations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Clean & Flip and its suppliers will not be liable for any damages arising 
            from the use or inability to use our service, including but not limited to 
            direct, indirect, incidental, punitive, and consequential damages.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Accuracy of Materials</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The materials appearing on Clean & Flip could include technical, typographical, 
            or photographic errors. We do not warrant that any of the materials on the 
            website are accurate, complete, or current. We may make changes to the materials 
            at any time without notice.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Governing Law</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            These terms and conditions are governed by and construed in accordance with 
            the laws of North Carolina, United States, and you irrevocably submit to the 
            exclusive jurisdiction of the courts in that state or location.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            If you have questions about these Terms of Service, please contact us at:
          </p>
          <div className="mt-4 space-y-1">
            <p><strong>Email:</strong> legal@cleanandflip.com</p>
            <p><strong>Address:</strong> Clean & Flip, Asheville, NC</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}