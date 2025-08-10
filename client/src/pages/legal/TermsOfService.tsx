import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
            <p className="text-muted-foreground">Last updated: August 10, 2025</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Clean & Flip ("the Service"), you accept and agree to be bound by 
                the terms and provision of this agreement. If you do not agree to abide by the above, 
                please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">2. Description of Service</h2>
              <p>
                Clean & Flip is an online marketplace for buying and selling weightlifting and fitness 
                equipment. We provide a platform that connects buyers and sellers of used and new 
                fitness equipment.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. User Registration</h2>
              <p>
                To access certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Provide true, accurate, current, and complete information</li>
                <li>Maintain and promptly update your registration data</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">4. Equipment Sales and Purchases</h2>
              <p>
                When selling equipment through our platform, you agree to:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Provide accurate descriptions and images of your equipment</li>
                <li>Honor the agreed-upon sale price</li>
                <li>Package and ship items securely and promptly</li>
                <li>Respond to buyer inquiries in a timely manner</li>
              </ul>
              <p className="mt-4">
                When purchasing equipment, you agree to:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Pay for items promptly upon purchase</li>
                <li>Provide accurate shipping information</li>
                <li>Inspect items upon receipt and report any issues</li>
                <li>Treat equipment with reasonable care during evaluation period</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">5. Payment Terms</h2>
              <p>
                All payments are processed through Stripe, our secure payment processor. You agree to:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Provide valid payment information</li>
                <li>Pay all charges incurred by your account</li>
                <li>Accept responsibility for all taxes and fees</li>
                <li>Understand that refunds are subject to our return policy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">6. Prohibited Uses</h2>
              <p>You may not use our service:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>For any unlawful purpose or to solicit unlawful acts</li>
                <li>To violate any international, federal, provincial, or state regulations or laws</li>
                <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                <li>To submit false or misleading information</li>
                <li>To upload or transmit viruses or any other type of malicious code</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">7. Intellectual Property</h2>
              <p>
                The service and its original content, features, and functionality are and will remain 
                the exclusive property of Clean & Flip and its licensors. The service is protected by 
                copyright, trademark, and other laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">8. Disclaimer</h2>
              <p>
                The information on this website is provided on an "as is" basis. Clean & Flip disclaims 
                all warranties, whether express or implied, including without limitation, warranties of 
                merchantability, fitness for a particular purpose, and non-infringement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">9. Limitation of Liability</h2>
              <p>
                Clean & Flip shall not be liable for any indirect, incidental, special, consequential, 
                or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
                or other intangible losses.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">10. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. If a revision is 
                material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">11. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us through our 
                support system or email us directly.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}