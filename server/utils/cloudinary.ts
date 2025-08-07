import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

class CloudinaryManager {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
  }
  
  async uploadImage(file: any, folder = 'products') {
    try {
      // Generate unique version ID
      const versionId = crypto.randomBytes(4).toString('hex');
      
      const result = await cloudinary.uploader.upload(file, {
        folder: `clean-flip/${folder}`,
        resource_type: 'auto',
        overwrite: true,
        invalidate: true, // Invalidate CDN cache
        unique_filename: false,
        use_filename: true,
        context: `version=${versionId}`,
        transformation: [
          { quality: 'auto:best' },
          { fetch_format: 'auto' }
        ]
      });
      
      // Return URL with version parameter
      return {
        url: result.secure_url,
        publicId: result.public_id,
        version: result.version,
        versionedUrl: `${result.secure_url}?v=${result.version}`
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }
  
  async updateImage(publicId: string, newFile: any) {
    // Delete old version
    await this.deleteImage(publicId);
    // Upload new version
    return this.uploadImage(newFile);
  }
  
  async deleteImage(publicId: string) {
    try {
      await cloudinary.uploader.destroy(publicId, { invalidate: true });
    } catch (error) {
      console.error('Cloudinary delete error:', error);
    }
  }
  
  getOptimizedUrl(publicId: string, options: any = {}) {
    const defaults = {
      quality: 'auto',
      fetch_format: 'auto',
      width: options.width || 800,
      height: options.height || 800,
      crop: 'limit',
      dpr: 'auto'
    };
    
    return cloudinary.url(publicId, {
      ...defaults,
      ...options,
      version: Date.now(), // Force cache bust
      secure: true
    });
  }
}

export const cloudinaryManager = new CloudinaryManager();