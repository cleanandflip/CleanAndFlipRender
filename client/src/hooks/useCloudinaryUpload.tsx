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
    return new Promise<File>((resolve) => {
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

  const uploadToCloudinary = async (file: File, signature: { apiKey: string; timestamp: string; signature: string; folder: string; cloudName: string }): Promise<string> => {
    // Try signed upload first
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signature.apiKey);
      formData.append('timestamp', signature.timestamp);
      formData.append('signature', signature.signature);
      formData.append('folder', signature.folder);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        return result.secure_url;
      }

      // Signed upload failed, falling back to unsigned upload
      
      // Fall back to unsigned upload if signed fails
      return await uploadUnsigned(file, signature.cloudName, signature.folder);
      
    } catch {
      // Signed upload error, falling back to unsigned upload
      return await uploadUnsigned(file, signature.cloudName, signature.folder);
    }
  };

  const uploadUnsigned = async (file: File, cloudName: string, folder: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default'); // Default unsigned preset
    formData.append('folder', folder);

    // Attempting unsigned upload

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Unsigned upload failed
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    // Unsigned upload successful
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

      // Enhanced server-side upload with progress tracking
      try {
        const formData = new FormData();
        processedFiles.forEach(file => {
          formData.append('images', file);
        });
        formData.append('folder', folder);

        // Client-side validation first
        const invalidFiles = processedFiles.filter(file => {
          if (file.size > 5 * 1024 * 1024) {
            toast({
              title: "File too large",
              description: `${file.name} exceeds 5MB limit`,
              variant: "destructive"
            });
            return true;
          }
          if (!file.type.startsWith('image/')) {
            toast({
              title: "Invalid file",
              description: `${file.name} is not an image`,
              variant: "destructive"
            });
            return true;
          }
          return false;
        });

        if (invalidFiles.length > 0) {
          throw new Error('Some files are invalid');
        }

        // Upload with XMLHttpRequest for progress tracking
        const response = await new Promise<{ success?: boolean; uploaded?: number; errors?: unknown[]; urls?: string[] }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentComplete = Math.round((e.loaded / e.total) * 100);
              processedFiles.forEach(file => {
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

        // Server-side upload completed
        
        // Show success/warning messages
        if ((response.errors?.length || 0) > 0) {
          toast({
            title: "Some uploads failed",
            description: `${response.errors?.length || 0} files failed to upload`,
            variant: "destructive"
          });
        } else if (response.success) {
          toast({
            title: "Upload successful",
            description: `${response.uploaded} images uploaded successfully`,
            variant: "default"
          });
        }
        
        return response.urls || [];
        
      } catch (error) {
        // Server-side upload error, trying direct upload
      }

      // Fallback to direct Cloudinary upload
      const sigRes = await apiRequest('GET', `/api/cloudinary/signature?folder=${folder}`);
      const signature = await sigRes.json() as { apiKey: string; timestamp: string; signature: string; folder: string; cloudName: string };

      // Upload all files
      const uploadPromises = processedFiles.map(async (file, index) => {
        try {
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
          
          const url = await uploadToCloudinary(file, signature);
          
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          return url;
        } catch (error) {
          // Upload failed for file
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
      // Upload error occurred
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