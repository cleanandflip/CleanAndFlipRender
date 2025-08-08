import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use memory storage for now (can be enhanced later)
const storage = multer.memoryStorage();

export const upload = multer({ 
  storage,
  limits: { 
    fileSize: 12 * 1024 * 1024, // 12MB max (industry standard)
    files: 12 // Maximum 12 images per product
  },
  fileFilter: (req, file, cb) => {
    // Industry standard image types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
    }
  }
});

export { cloudinary };