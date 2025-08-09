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
      // Client-side validation
      const validFiles = files.slice(0, maxFiles).filter(file => {
        // Check size
        if (file.size > maxFileSize * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds ${maxFileSize}MB limit`,
            variant: "destructive"
          });
          return false;
        }
        
        // Check type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file",
            description: `${file.name} is not an image`,
            variant: "destructive"
          });
          return false;
        }
        
        return true;
      });

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
            reject(new Error(`Upload failed: ${xhr.statusText}`));
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
      console.error('Upload error:', error);
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