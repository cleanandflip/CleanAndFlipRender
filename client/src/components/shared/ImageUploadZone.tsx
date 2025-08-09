import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';

interface ImageUploadZoneProps {
  maxImages: number;
  folder: string;
  onUploadComplete: (urls: string[]) => void;
  existingImages?: string[];
  className?: string;
}

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  maxImages,
  folder,
  onUploadComplete,
  existingImages = [],
  className = ""
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentImages, setCurrentImages] = useState<string[]>(existingImages);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadImages, uploadProgress, isUploading } = useCloudinaryUpload({
    maxImages: maxImages - currentImages.length,
    folder
  });

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    
    const urls = await uploadImages(files);
    if (urls.length > 0) {
      const newImages = [...currentImages, ...urls];
      setCurrentImages(newImages);
      onUploadComplete(newImages);
    }
  };

  const removeImage = (index: number) => {
    const newImages = currentImages.filter((_, i) => i !== index);
    setCurrentImages(newImages);
    onUploadComplete(newImages);
  };

  const remainingSlots = maxImages - currentImages.length;

  return (
    <div className={className}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Upload Zone */}
      {remainingSlots > 0 && (
        <div
          className="relative"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Invisible overlay when dragging */}
          {isDragging && (
            <div 
              className="absolute inset-0 z-10"
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
            />
          )}
          
          {/* Drop zone content */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-all duration-200
              ${isDragging 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-gray-600 hover:border-gray-500 hover:bg-white/5'
              }
              ${isUploading ? 'pointer-events-none opacity-75' : ''}
            `}
          >
            {isUploading ? (
              <Loader2 className="mx-auto mb-4 text-blue-400 animate-spin" size={48} />
            ) : (
              <Upload className="mx-auto mb-4 text-gray-400" size={48} />
            )}
            <h4 className="font-semibold mb-2 text-white">
              {isUploading 
                ? 'Uploading...' 
                : isDragging 
                ? 'Drop photos here' 
                : 'Upload Photos'
              }
            </h4>
            <p className="text-gray-400 mb-4">
              {isUploading 
                ? 'Please wait while images are being uploaded'
                : 'Drag and drop photos here, or click to select'
              }
            </p>
            {!isUploading && (
              <Button 
                type="button"
                variant="outline" 
                className="border-gray-600 hover:border-gray-500"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Choose Files
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="mt-4 space-y-2">
          {Object.entries(uploadProgress).map(([filename, progress]) => (
            <div key={filename} className="flex items-center space-x-2 text-sm">
              <span className="text-gray-400 truncate flex-1">{filename}</span>
              <div className="w-20 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-gray-400 w-10">{progress}%</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Image Preview Grid */}
      {currentImages.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          {currentImages.map((image, index) => (
            <div key={index} className="relative group">
              <img 
                src={image} 
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 rounded-full 
                           opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload hints */}
      <div className="mt-4 text-sm text-gray-400">
        <p>• Upload up to {maxImages} photos</p>
        <p>• Maximum 3MB per image</p>
        <p>• Large images will be automatically compressed</p>
        <p className="text-xs mt-2">
          {currentImages.length} of {maxImages} photos uploaded
        </p>
      </div>
    </div>
  );
};