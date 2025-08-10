import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  price?: string;
  currency?: string;
  availability?: 'in stock' | 'out of stock';
}

const DEFAULT_SEO = {
  siteName: 'Clean & Flip',
  title: 'Clean & Flip - Professional Weightlifting Equipment Marketplace',
  description: 'Buy and sell professional weightlifting and fitness equipment. Quality used gym equipment, barbells, plates, racks, and more.',
  keywords: 'weightlifting equipment, fitness equipment, gym equipment, barbells, plates, power racks, used fitness equipment, buy sell gym equipment',
  image: '/images/og-default.jpg',
  type: 'website' as const,
  twitterCard: 'summary_large_image'
};

export function SEOHead({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  price,
  currency,
  availability
}: SEOHeadProps) {
  const [location] = useLocation();
  
  const seoTitle = title ? `${title} | ${DEFAULT_SEO.siteName}` : DEFAULT_SEO.title;
  const seoDescription = description || DEFAULT_SEO.description;
  const seoKeywords = keywords || DEFAULT_SEO.keywords;
  const seoImage = image || DEFAULT_SEO.image;
  const seoUrl = url || (typeof window !== 'undefined' ? `${window.location.origin}${location}` : location);

  useEffect(() => {
    // Update document title
    document.title = seoTitle;

    // Function to update or create meta tag
    const updateMetaTag = (name: string, content: string, useProperty = false) => {
      const attribute = useProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', seoDescription);
    updateMetaTag('keywords', seoKeywords);
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('author', 'Clean & Flip');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1');

    // Open Graph tags
    updateMetaTag('og:title', seoTitle, true);
    updateMetaTag('og:description', seoDescription, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', seoUrl, true);
    updateMetaTag('og:image', seoImage, true);
    updateMetaTag('og:site_name', DEFAULT_SEO.siteName, true);
    updateMetaTag('og:locale', 'en_US', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', DEFAULT_SEO.twitterCard);
    updateMetaTag('twitter:title', seoTitle);
    updateMetaTag('twitter:description', seoDescription);
    updateMetaTag('twitter:image', seoImage);

    // Product-specific structured data
    if (type === 'product' && price) {
      updateMetaTag('product:price:amount', price, true);
      updateMetaTag('product:price:currency', currency || 'USD', true);
      updateMetaTag('product:availability', availability || 'in stock', true);
    }

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = seoUrl;

    // JSON-LD structured data
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': type === 'product' ? 'Product' : 'WebSite',
      name: seoTitle,
      description: seoDescription,
      url: seoUrl,
      image: seoImage,
      ...(type === 'product' && price ? {
        offers: {
          '@type': 'Offer',
          price: price,
          priceCurrency: currency || 'USD',
          availability: availability === 'in stock' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
        }
      } : {}),
      ...(type === 'website' ? {
        potentialAction: {
          '@type': 'SearchAction',
          target: `${typeof window !== 'undefined' ? window.location.origin : ''}/products?search={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      } : {})
    };

    // Update structured data script
    let structuredDataScript = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script');
      structuredDataScript.type = 'application/ld+json';
      document.head.appendChild(structuredDataScript);
    }
    structuredDataScript.textContent = JSON.stringify(structuredData);

  }, [seoTitle, seoDescription, seoKeywords, seoImage, seoUrl, type, price, currency, availability, location]);

  return null;
}

// Pre-configured SEO components for common pages
export function HomeSEO() {
  return (
    <SEOHead
      title="Professional Weightlifting Equipment Marketplace"
      description="Buy and sell professional weightlifting equipment. Quality used gym equipment, barbells, plates, power racks, and more. Free shipping on orders over $200."
      keywords="weightlifting equipment, fitness equipment, gym equipment, barbells, plates, power racks, used fitness equipment"
    />
  );
}

export function ProductsSEO() {
  return (
    <SEOHead
      title="Weightlifting Equipment for Sale"
      description="Browse our extensive collection of professional weightlifting equipment. Find barbells, plates, racks, benches, and more at great prices."
      keywords="buy weightlifting equipment, fitness equipment for sale, gym equipment store, barbell plates, power racks"
    />
  );
}

export function ProductSEO({ 
  productName, 
  price, 
  description, 
  brand, 
  condition, 
  image,
  availability 
}: {
  productName: string;
  price: string;
  description: string;
  brand?: string;
  condition?: string;
  image?: string;
  availability?: 'in stock' | 'out of stock';
}) {
  const title = `${productName}${brand ? ` - ${brand}` : ''}${condition ? ` (${condition})` : ''}`;
  const seoDescription = description.length > 160 ? description.substring(0, 157) + '...' : description;
  
  return (
    <SEOHead
      title={title}
      description={seoDescription}
      keywords={`${productName}, ${brand || ''} weightlifting equipment, fitness equipment for sale, gym equipment`}
      type="product"
      price={price}
      currency="USD"
      availability={availability}
      image={image}
    />
  );
}

export function SellSEO() {
  return (
    <SEOHead
      title="Sell Your Weightlifting Equipment"
      description="Get instant cash for your fitness equipment. We buy barbells, plates, racks, machines, and more. Free equipment pickup and fair prices."
      keywords="sell weightlifting equipment, sell fitness equipment, sell gym equipment, equipment buyback, fitness equipment trade-in"
    />
  );
}