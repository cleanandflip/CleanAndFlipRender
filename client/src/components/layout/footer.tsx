import { Link } from "wouter";
import Logo from "@/components/common/logo";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, Clock } from "lucide-react";
import { ROUTES } from "@/config/routes";

export default function Footer() {
  // Function to scroll to top when clicking footer links
  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const shopLinks = [
    { name: "All Equipment", href: `${ROUTES.PRODUCTS}?page=1` },
    { name: "Barbells", href: `${ROUTES.PRODUCTS}?category=barbells&page=1` },
    { name: "Plates", href: `${ROUTES.PRODUCTS}?category=weight-plates&page=1` },
    { name: "Racks", href: `${ROUTES.PRODUCTS}?category=racks&page=1` },
    { name: "Dumbbells", href: `${ROUTES.PRODUCTS}?category=dumbbells&page=1` },
    { name: "Kettlebells", href: `${ROUTES.PRODUCTS}?category=kettlebells&page=1` },
    { name: "Accessories", href: `${ROUTES.PRODUCTS}?category=mats-accessories&page=1` },
  ];

  const companyLinks = [
    { name: "About Us", href: ROUTES.ABOUT },
    { name: "Sell To Us", href: ROUTES.SUBMIT_EQUIPMENT },
    { name: "Contact", href: ROUTES.CONTACT },
    { name: "FAQ", href: "/faq" },
    { name: "Reviews", href: "/reviews" },
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
            <h4 className="font-bebas text-xl mb-4 text-slate-300">SHOP</h4>
            <div className="space-y-2">
              {shopLinks.map((link) => (
                <Link key={link.name} href={link.href}>
                  <span 
                    className="block text-text-secondary hover:text-white transition-colors text-sm cursor-pointer"
                    onClick={handleLinkClick}
                  >
                    {link.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Company Info */}
          <div>
            <h4 className="font-bebas text-xl mb-4 text-slate-300">COMPANY</h4>
            <div className="space-y-2">
              {companyLinks.map((link) => (
                <Link key={link.name} href={link.href}>
                  <span 
                    className="block text-text-secondary hover:text-white transition-colors text-sm cursor-pointer"
                    onClick={handleLinkClick}
                  >
                    {link.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-bebas text-xl mb-4 text-slate-300">POLICIES</h4>
            <div className="space-y-2">
              {policyLinks.map((link) => (
                <Link key={link.name} href={link.href}>
                  <span 
                    className="block text-text-secondary hover:text-white transition-colors text-sm cursor-pointer"
                    onClick={handleLinkClick}
                  >
                    {link.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-bebas text-xl mb-4 text-slate-300">CONNECT</h4>
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
                  href="tel:+18283389682" 
                  className="hover:text-white transition-colors"
                >
                  (828) 338-9682
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
                className="text-text-muted-foreground hover:text-slate-200 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="#" 
                className="text-text-muted-foreground hover:text-slate-200 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="#" 
                className="text-text-muted-foreground hover:text-slate-200 transition-colors"
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
