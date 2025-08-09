import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configure Cloudinary (clean slate setup)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo'
});

// Clean slate: Use memory storage
const storage = multer.memoryStorage();

// Legacy upload configuration - use imageUpload from routes.ts instead
export const upload = multer({ 
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB max (unified with new system)
    files: 8 // Maximum 8 images per upload
  },
  fileFilter: (req, file, cb) => {
    // Strict file validation matching unified system
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
    }
  }
});

export { cloudinary };