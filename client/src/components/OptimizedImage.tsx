import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  onError
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    // Add cache busting and optimization parameters
    const optimizeImageUrl = (url: string) => {
      if (!url) return '/placeholder.jpg';
      
      // Check if it's a Cloudinary URL
      if (url.includes('cloudinary.com')) {
        const baseUrl = url.split('?')[0];
        const timestamp = Date.now();
        
        // Add Cloudinary transformations
        const transformations = [
          'q_auto:best',
          'f_auto',
          width ? `w_${width}` : 'w_800',
          height ? `h_${height}` : 'h_800',
          'c_limit',
          'dpr_auto'
        ].join(',');
        
        // Insert transformations into URL
        const urlParts = baseUrl.split('/upload/');
        if (urlParts.length === 2) {
          return `${urlParts[0]}/upload/${transformations}/${urlParts[1]}?v=${timestamp}`;
        }
      }
      
      // For non-Cloudinary URLs, just add timestamp
      return `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
    };
    
    setImageSrc(optimizeImageUrl(src));
  }, [src, width, height]);
  
  const handleImageError = () => {
    setError(true);
    setLoading(false);
    setImageSrc('/placeholder.jpg');
    onError?.();
  };
  
  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
  };
  
  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}
      
      <img
        src={imageSrc}
        alt={alt}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={priority ? 'eager' : 'lazy'}
        width={width}
        height={height}
      />
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <span className="text-gray-500">Failed to load image</span>
        </div>
      )}
    </div>
  );
};