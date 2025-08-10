import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
            <p className="text-muted-foreground">Last updated: August 10, 2025</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Information We Collect</h2>
              
              <h3 className="text-xl font-medium mb-2">Personal Information</h3>
              <p>We collect information you provide directly to us, such as when you:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Create an account</li>
                <li>Make a purchase or sale</li>
                <li>Contact us for support</li>
                <li>Subscribe to our newsletter</li>
                <li>Participate in surveys or promotions</li>
              </ul>
              
              <h3 className="text-xl font-medium mb-2 mt-4">Automatically Collected Information</h3>
              <p>When you access our service, we automatically collect:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Device information (browser type, operating system)</li>
                <li>Usage information (pages visited, time spent)</li>
                <li>Location information (IP address, general location)</li>
                <li>Cookies and similar technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and security alerts</li>
                <li>Respond to your comments and questions</li>
                <li>Communicate about products, services, and events</li>
                <li>Monitor and analyze trends and usage</li>
                <li>Detect, investigate, and prevent fraudulent activities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. Information Sharing</h2>
              <p>We may share your information in the following situations:</p>
              
              <h3 className="text-xl font-medium mb-2">With Your Consent</h3>
              <p>We may share your information when you give us explicit consent to do so.</p>
              
              <h3 className="text-xl font-medium mb-2 mt-4">Service Providers</h3>
              <p>We may share your information with third-party service providers who help us operate our business:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Payment processors (Stripe)</li>
                <li>Cloud storage providers (Cloudinary)</li>
                <li>Email service providers (Resend)</li>
                <li>Analytics providers (Google Analytics)</li>
                <li>Authentication providers (Google OAuth)</li>
              </ul>
              
              <h3 className="text-xl font-medium mb-2 mt-4">Legal Requirements</h3>
              <p>We may disclose your information if required by law or if we believe such action is necessary to:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Comply with legal obligations</li>
                <li>Protect our rights and property</li>
                <li>Prevent fraud or security issues</li>
                <li>Protect the safety of our users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">4. Data Security</h2>
              <p>
                We implement appropriate technical and organizational security measures to protect your 
                personal information against unauthorized access, alteration, disclosure, or destruction. 
                These measures include:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication requirements</li>
                <li>Secure payment processing through Stripe</li>
                <li>Regular backup and recovery procedures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">5. Your Rights and Choices</h2>
              <p>You have the following rights regarding your personal information:</p>
              
              <h3 className="text-xl font-medium mb-2">Access and Update</h3>
              <p>You can access and update your account information through your profile settings.</p>
              
              <h3 className="text-xl font-medium mb-2 mt-4">Data Deletion</h3>
              <p>You can request deletion of your account and associated data by contacting our support team.</p>
              
              <h3 className="text-xl font-medium mb-2 mt-4">Marketing Communications</h3>
              <p>You can opt out of promotional emails by following the unsubscribe instructions in those emails.</p>
              
              <h3 className="text-xl font-medium mb-2 mt-4">Cookies</h3>
              <p>You can control cookies through your browser settings, though this may affect site functionality.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">6. Data Retention</h2>
              <p>
                We retain your personal information for as long as necessary to provide our services 
                and fulfill the purposes outlined in this privacy policy. We may also retain information 
                to comply with legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">7. International Data Transfers</h2>
              <p>
                Your information may be transferred to and maintained on computers located outside of 
                your state, province, country, or other governmental jurisdiction where data protection 
                laws may differ from those in your jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">8. Children's Privacy</h2>
              <p>
                Our service is not intended for children under the age of 13. We do not knowingly 
                collect personal information from children under 13. If you become aware that a child 
                has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">9. Changes to This Privacy Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of any changes 
                by posting the new privacy policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">10. Contact Us</h2>
              <p>
                If you have any questions about this privacy policy or our privacy practices, please 
                contact us through our support system or email us directly.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}