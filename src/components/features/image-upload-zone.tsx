'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Image as ImageIcon,
  User,
  X,
  AlertTriangle,
  Loader2,
  Camera,
  RefreshCw,
} from 'lucide-react';
import { cn, formatFileSize, isValidImageType, isValidImageSize } from '@/lib/utils';
import {
  convertHEICToJPEG,
  compressImage,
  detectFaces,
  createImageFromFile,
  loadFaceDetectionModels,
} from '@/lib/image-processing';
import type {
  UploadedImage,
  ImageUploadError,
  ImageProcessingState,
} from '@/types';
import { IMAGE_CONSTRAINTS } from '@/lib/constants';

interface ImageUploadZoneProps {
  label: 'you' | 'partner';
  uploadedImage?: UploadedImage;
  onImageUpload: (image: UploadedImage) => void;
  onImageRemove: () => void;
  onNameChange: (name: string) => void;
  onCropRequest: (image: UploadedImage, isAutoTrigger?: boolean) => void;
  disabled?: boolean;
}

export function ImageUploadZone({
  label,
  uploadedImage,
  onImageUpload,
  onImageRemove,
  onNameChange,
  onCropRequest,
  disabled = false,
}: ImageUploadZoneProps) {
  const [processingState, setProcessingState] = useState<ImageProcessingState>({
    isLoading: false,
    progress: 0,
    stage: 'uploading',
  });
  const [error, setError] = useState<ImageUploadError | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const processImage = useCallback(async (file: File): Promise<UploadedImage> => {
    setProcessingState({
      isLoading: true,
      progress: 10,
      stage: 'uploading',
    });
    setError(null);

    try {
      let processedFile = file;
      
      // Step 1: Convert HEIC if needed (all devices)
      const isHEIC = /\.(heic|heif)$/i.test(file.name) || 
                     file.type.includes('heic') || 
                     file.type.includes('heif');
      
      if (isHEIC) {
        setProcessingState(prev => ({ ...prev, progress: 20, stage: 'converting' }));
        processedFile = await convertHEICToJPEG(file);
      }

      // Step 2: Compress image
      setProcessingState(prev => ({ ...prev, progress: 40, stage: 'compressing' }));
      processedFile = await compressImage(processedFile);

      // Step 3: Create preview
      const preview = URL.createObjectURL(processedFile);
      
      // Step 4: Face detection
      setProcessingState(prev => ({ ...prev, progress: 70, stage: 'detecting' }));
      const imageElement = await createImageFromFile(processedFile);
      const hasFace = await detectFaces(imageElement);

      if (!hasFace) {
        throw new Error('No face detected in the image. Please upload a clear photo with a visible face.');
      }

      setProcessingState(prev => ({ ...prev, progress: 100, stage: 'complete' }));

      const uploadedImage: UploadedImage = {
        id: Math.random().toString(36).substring(2, 15),
        file: processedFile,
        preview,
        label,
        isProcessed: true,
        hasFace: true,
      };

      return uploadedImage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
      setError({
        type: 'processing',
        message: errorMessage,
        file,
      });
      throw err;
    } finally {
      setProcessingState(prev => ({ ...prev, isLoading: false }));
    }
  }, [label]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Validate file type (including HEIC by extension)
    const isHEICFile = /\.(heic|heif)$/i.test(file.name) || 
                       file.type.includes('heic') || 
                       file.type.includes('heif');
    
    if (!isValidImageType(file) && !isHEICFile) {
      setError({
        type: 'format',
        message: 'Please upload a valid image file (JPEG, PNG, WebP, or HEIC)',
        file,
      });
      return;
    }

    // Validate file size
    if (!isValidImageSize(file)) {
      setError({
        type: 'size',
        message: `File size too large. Maximum size is ${formatFileSize(IMAGE_CONSTRAINTS.maxSize)}`,
        file,
      });
      return;
    }

    try {
      await loadFaceDetectionModels(); // Load models if not already loaded
      const uploadedImage = await processImage(file);
      onImageUpload(uploadedImage);
      
      // Auto-launch crop modal after successful upload for better UX
      setTimeout(() => {
        onCropRequest(uploadedImage, true); // isAutoTrigger=true for auto-crop
      }, 100); // Small delay to ensure state updates
    } catch (err) {
      console.error('Image upload failed:', err);
    }
  }, [processImage, onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic', '.heif'],
    },
    maxFiles: 1,
    disabled: disabled || processingState.isLoading,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const handleRemove = () => {
    setError(null);
    setProcessingState({
      isLoading: false,
      progress: 0,
      stage: 'uploading',
    });
    onImageRemove();
  };

  const handleRetry = async () => {
    if (error?.file) {
      try {
        const uploadedImage = await processImage(error.file);
        onImageUpload(uploadedImage);
        setError(null);
      } catch (err) {
        console.error('Retry failed:', err);
      }
    }
  };

  const displayName = label === 'you' ? 'You' : 'Your Partner';
  const placeholderName = label === 'you' ? 'Your First Name' : "Your Partner's First Name";

  return (
    <div className="space-y-4">
      <Card 
        className={cn(
          "relative overflow-hidden transition-all duration-300 hover:shadow-lg py-0",
          "bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm",
          dragActive && "border-primary shadow-primary/25 shadow-lg scale-[1.02]",
          error && "border-destructive",
          uploadedImage && "border-success",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <CardContent className="p-0">
          {!uploadedImage ? (
            // Upload zone
            <div
              {...getRootProps()}
              className={cn(
                "relative px-8 py-0 min-h-[300px] flex flex-col items-center justify-center",
                "border-2 border-dashed border-gray-300 dark:border-gray-600",
                "cursor-pointer transition-all duration-300",
                "hover:border-primary hover:bg-primary/5",
                isDragActive && "border-primary bg-primary/10 scale-105",
                processingState.isLoading && "cursor-not-allowed",
                disabled && "cursor-not-allowed"
              )}
            >
              <input {...getInputProps()} />
              
              {processingState.isLoading ? (
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                      {processingState.stage}...
                    </p>
                    <Progress value={processingState.progress} className="w-full max-w-xs" />
                    <p className="text-xs text-gray-500">
                      {processingState.progress}% complete
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      {label === 'you' ? (
                        <User className="w-8 h-8 text-primary" />
                      ) : (
                        <Camera className="w-8 h-8 text-primary" />
                      )}
                    </div>
                    {dragActive && (
                      <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Upload Photo - {displayName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {dragActive 
                        ? "Drop your photo here!" 
                        : "Drag & drop your photo or click to choose"
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports JPEG, PNG, WebP, HEIC • Max {formatFileSize(IMAGE_CONSTRAINTS.maxSize)}
                    </p>
                  </div>
                  
                  <Button
                    size="sm"
                    className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium border-0 shadow-lg"
                    disabled={processingState.isLoading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Preview zone
            <div className="relative">
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={uploadedImage.croppedPreview || uploadedImage.preview}
                  alt={`${displayName} preview`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                <div className="flex gap-2">
                  {!uploadedImage.croppedFile && (
                    <Button
                      size="sm"
                      onClick={() => onCropRequest(uploadedImage)}
                      className="bg-white/90 text-gray-900 hover:bg-white"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Crop
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleRemove}
                    className="bg-white/90 text-gray-900 hover:bg-white"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
              
              {/* Status indicator */}
              <div className="absolute top-2 right-2 flex gap-1">
                {uploadedImage.hasFace && (
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    ✓ Face detected
                  </div>
                )}
                {uploadedImage.croppedFile && (
                  <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    ✓ Cropped
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error display */}
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-destructive">Upload Failed</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{error.message}</p>
                {error.file && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRetry}
                    className="mt-2"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Name input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          First Name
        </label>
        <Input
          placeholder={placeholderName}
          value={uploadedImage?.name || ''}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={disabled}
          className="bg-white/80 dark:bg-gray-800/80"
          tabIndex={label === 'you' ? 1 : 2}
        />
      </div>
    </div>
  );
}