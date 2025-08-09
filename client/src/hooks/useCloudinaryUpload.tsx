import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface UseCloudinaryUploadOptions {
  maxImages: number;
  folder: string;
}

interface UploadProgress {
  [key: string]: number;
}

export const useCloudinaryUpload = ({ maxImages, folder }: UseCloudinaryUploadOptions) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
  
  const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadToCloudinary = async (file: File, signature: any): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', signature.timestamp);
    formData.append('signature', signature.signature);
    formData.append('folder', folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    return result.secure_url;
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    
    if (files.length > maxImages) {
      toast({
        title: "Too many files",
        description: `Please select maximum ${maxImages} images`,
        variant: "destructive"
      });
      return [];
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress({});

    try {
      // Filter and validate files
      const imageFiles = files.filter(file => {
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file",
            description: `${file.name} is not an image file`,
            variant: "destructive"
          });
          return false;
        }
        return true;
      });

      if (imageFiles.length === 0) {
        return [];
      }

      // Compress large files
      const processedFiles = await Promise.all(
        imageFiles.map(async (file) => {
          if (file.size > MAX_FILE_SIZE) {
            const compressed = await compressImage(file);
            return compressed;
          }
          return file;
        })
      );

      // Get signature from backend
      const signature = await apiRequest('GET', `/api/cloudinary/signature?folder=${folder}`);

      // Upload all files
      const uploadPromises = processedFiles.map(async (file, index) => {
        try {
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
          
          const url = await uploadToCloudinary(file, signature);
          
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          return url;
        } catch (error) {
          console.error(`Upload failed for ${file.name}:`, error);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive"
          });
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((url): url is string => url !== null);
      
      if (successfulUploads.length > 0) {
        toast({
          title: "Upload successful",
          description: `${successfulUploads.length} image(s) uploaded successfully`
        });
      }

      return successfulUploads;

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      return [];
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress({}), 2000);
    }
  };

  return {
    uploadImages,
    uploadProgress,
    isUploading,
    error,
  };
};