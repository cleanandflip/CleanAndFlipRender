import { Link } from "wouter";
import Logo from "@/components/common/logo";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, Clock } from "lucide-react";

export default function Footer() {
  const shopLinks = [
    { name: "All Equipment", href: "/products" },
    { name: "Barbells", href: "/products?category=barbells" },
    { name: "Plates", href: "/products?category=plates" },
    { name: "Racks", href: "/products?category=racks" },
    { name: "Dumbbells", href: "/products?category=dumbbells" },
    { name: "Accessories", href: "/products?category=accessories" },
  ];

  const companyLinks = [
    { name: "About Us", href: "/about" },
    { name: "Sell To Us", href: "/sell-to-us" },
    { name: "Contact", href: "/contact" },
    { name: "FAQ", href: "/faq" },
    { name: "Reviews", href: "/reviews" },
    { name: "Blog", href: "/blog" },
  ];

  const policyLinks = [
    { name: "Terms of Service", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Shipping Info", href: "/shipping" },
    { name: "Returns", href: "/returns" },
    { name: "Warranty", href: "/warranty" },
    { name: "Inspection Process", href: "/inspection" },
  ];

  return (
    <footer className="footer-dark py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Shop Links */}
          <div>
            <h4 className="font-bebas text-xl mb-4 text-accent-blue">SHOP</h4>
            <div className="space-y-2">
              {shopLinks.map((link) => (
                <Link key={link.name} href={link.href}>
                  <span className="block text-text-secondary hover:text-white transition-colors text-sm cursor-pointer">
                    {link.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Company Info */}
          <div>
            <h4 className="font-bebas text-xl mb-4 text-accent-blue">COMPANY</h4>
            <div className="space-y-2">
              {companyLinks.map((link) => (
                <Link key={link.name} href={link.href}>
                  <span className="block text-text-secondary hover:text-white transition-colors text-sm cursor-pointer">
                    {link.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-bebas text-xl mb-4 text-accent-blue">POLICIES</h4>
            <div className="space-y-2">
              {policyLinks.map((link) => (
                <Link key={link.name} href={link.href}>
                  <span className="block text-text-secondary hover:text-white transition-colors text-sm cursor-pointer">
                    {link.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-bebas text-xl mb-4 text-accent-blue">CONNECT</h4>
            <div className="space-y-3">
              <div className="flex items-center text-text-secondary text-sm">
                <Mail className="mr-2 flex-shrink-0" size={16} />
                <a 
                  href="mailto:support@cleanandflip.com" 
                  className="hover:text-white transition-colors"
                >
                  support@cleanandflip.com
                </a>
              </div>
              
              <div className="flex items-center text-text-secondary text-sm">
                <Phone className="mr-2 flex-shrink-0" size={16} />
                <a 
                  href="tel:+18285550123" 
                  className="hover:text-white transition-colors"
                >
                  (828) 555-0123
                </a>
              </div>
              
              <div className="flex items-center text-text-secondary text-sm">
                <MapPin className="mr-2 flex-shrink-0" size={16} />
                <span>Asheville, NC</span>
              </div>
              
              <div className="flex items-center text-text-secondary text-sm">
                <Clock className="mr-2 flex-shrink-0" size={16} />
                <span>Mon-Fri 9AM-5PM EST</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4 mt-6">
              <a 
                href="#" 
                className="text-text-muted-foreground hover:text-accent-blue transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="#" 
                className="text-text-muted-foreground hover:text-accent-blue transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="#" 
                className="text-text-muted-foreground hover:text-accent-blue transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Logo />
          </div>

          <div className="text-text-muted-foreground text-sm mb-4 md:mb-0">
            <p>&copy; 2024 Clean & Flip. All rights reserved.</p>
          </div>

          {/* Payment Icons */}
          <div className="flex space-x-3">
            <div className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold">
              VISA
            </div>
            <div className="bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold">
              MASTER
            </div>
            <div className="bg-blue-800 text-white px-3 py-1 rounded text-xs font-semibold">
              PayPal
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
