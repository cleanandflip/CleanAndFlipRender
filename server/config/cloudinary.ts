import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// SSOT Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your-api-key', 
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your-api-secret',
});

// Simple memory storage for uploads
const storage = multer.memoryStorage();

export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

export { cloudinary };