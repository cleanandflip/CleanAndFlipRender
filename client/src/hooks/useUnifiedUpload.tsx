import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UploadOptions {
  folder?: string;
  maxFiles?: number;
  maxFileSize?: number; // in MB
}

interface UploadResponse {
  success: boolean;
  urls: string[];
  uploaded: number;
  failed: number;
  errors?: { filename: string; error: string }[];
  processingTime: number;
}

export function useUnifiedUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const uploadImages = async (
    files: File[], 
    options: UploadOptions = {}
  ): Promise<string[]> => {
    const {
      folder = 'equipment-submissions',
      maxFiles = 8,
      maxFileSize = 5 // 5MB default
    } = options;

    setIsUploading(true);
    setUploadProgress({});

    try {
      // Enhanced client-side validation
      const invalidFiles: string[] = [];
      const validFiles = files.slice(0, maxFiles).filter(file => {
        // Check size first (more important)
        if (file.size > maxFileSize * 1024 * 1024) {
          const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
          invalidFiles.push(`${file.name} (${sizeInMB}MB) exceeds ${maxFileSize}MB limit`);
          return false;
        }
        
        // Check type
        if (!file.type.startsWith('image/')) {
          invalidFiles.push(`${file.name} is not a valid image file`);
          return false;
        }
        
        // Check specific image formats
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type.toLowerCase())) {
          invalidFiles.push(`${file.name} must be JPEG, PNG, or WebP format`);
          return false;
        }
        
        return true;
      });

      // Show validation errors
      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid files detected",
          description: invalidFiles.slice(0, 3).join('. ') + (invalidFiles.length > 3 ? `... and ${invalidFiles.length - 3} more` : ''),
          variant: "destructive"
        });
      }

      if (validFiles.length === 0) {
        throw new Error('No valid files to upload');
      }

      // Create FormData
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('images', file);
      });
      formData.append('folder', folder);

      // Upload with XMLHttpRequest for progress tracking
      const response = await new Promise<UploadResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            validFiles.forEach(file => {
              setUploadProgress(prev => ({ ...prev, [file.name]: percentComplete }));
            });
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } else {
            try {
              const errorResult = JSON.parse(xhr.responseText);
              reject(new Error(errorResult.message || `Upload failed: ${xhr.statusText}`));
            } catch {
              reject(new Error(`Upload failed: ${xhr.statusText}`));
            }
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });
        
        xhr.open('POST', '/api/upload/images');
        xhr.withCredentials = true;
        xhr.send(formData);
      });

      // Show success/warning messages
      if (response.errors?.length > 0) {
        toast({
          title: "Some uploads failed",
          description: `${response.errors.length} files failed to upload`,
          variant: "destructive"
        });
      } else if (response.success) {
        toast({
          title: "Upload successful",
          description: `${response.uploaded} images uploaded successfully`
        });
      }
      
      return response.urls || [];
      
    } catch (error) {
      // Upload error occurred
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Failed to upload images',
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  // Single file upload (for convenience)
  const uploadSingleImage = async (
    file: File,
    options: UploadOptions = {}
  ): Promise<string | null> => {
    const urls = await uploadImages([file], options);
    return urls[0] || null;
  };

  return {
    uploadImages,
    uploadSingleImage,
    isUploading,
    uploadProgress
  };
}