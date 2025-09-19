'use client';

import { useState, useCallback, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Crop as CropIcon, X } from 'lucide-react';
import { canvasToFile } from '@/lib/image-processing';
import type { UploadedImage, CropData } from '@/types';

interface ImageCropModalProps {
  image: UploadedImage;
  onCropComplete: (croppedImage: UploadedImage) => void;
  onCancel: () => void;
  isAutoCrop?: boolean;
}

export function ImageCropModal({ image, onCropComplete, onCancel, isAutoCrop = false }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 70,
    height: 90,
    x: 15,
    y: 5,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    
    // Auto-set crop to portrait orientation focused on the center-top area (where faces usually are)
    const aspectRatio = 3 / 4; // Portrait aspect ratio
    let cropWidth, cropHeight, cropX, cropY;

    if (width / height > aspectRatio) {
      // Image is wider than target ratio
      cropHeight = 85; // Use most of the height
      cropWidth = (cropHeight * aspectRatio * height) / width;
      cropX = (100 - cropWidth) / 2;
      cropY = 5; // Start near the top for faces
    } else {
      // Image is taller than target ratio
      cropWidth = 85; // Use most of the width
      cropHeight = (cropWidth * width) / (aspectRatio * height);
      cropX = (100 - cropWidth) / 2;
      cropY = 10; // Start slightly from top for faces
    }

    const newCrop = {
      unit: '%' as const,
      width: cropWidth,
      height: cropHeight,
      x: cropX,
      y: cropY,
    };

    setCrop(newCrop);
    
    // Set initial completedCrop to enable the Apply Crop button
    const pixelCrop: PixelCrop = {
      unit: 'px' as const,
      x: (cropX / 100) * e.currentTarget.width,
      y: (cropY / 100) * e.currentTarget.height,
      width: (cropWidth / 100) * e.currentTarget.width,
      height: (cropHeight / 100) * e.currentTarget.height,
    };
    setCompletedCrop(pixelCrop);
  }, []);

  const getCroppedImg = useCallback(
    async (image: HTMLImageElement, crop: PixelCrop): Promise<File> => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Set canvas size to cropped dimensions
      canvas.width = crop.width;
      canvas.height = crop.height;

      // Draw the cropped image
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );

      // Convert canvas to file
      return canvasToFile(canvas, `${image.alt || 'cropped'}-cropped.jpg`, 0.9);
    },
    []
  );

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop) return;

    setIsProcessing(true);

    try {
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop);
      const croppedPreview = URL.createObjectURL(croppedFile);

      const croppedImage: UploadedImage = {
        ...image,
        croppedFile,
        croppedPreview,
      };

      onCropComplete(croppedImage);
    } catch (error) {
      console.error('Crop failed:', error);
      // Handle error - maybe show a toast
    } finally {
      setIsProcessing(false);
    }
  };

  const displayName = image.label === 'you' ? 'Your' : "Your Partner's";

  const handleCancel = () => {
    if (isAutoCrop) {
      // Auto-crop mode: remove the image entirely and return to empty state
      if (image.preview) {
        URL.revokeObjectURL(image.preview);
      }
      if (image.croppedPreview) {
        URL.revokeObjectURL(image.croppedPreview);
      }
    }
    // For both modes, call the onCancel callback
    onCancel();
  };

  return (
    <Dialog open onOpenChange={handleCancel}>
      <DialogContent className="!max-w-none w-[95vw] md:w-[80vw] lg:w-[60vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="w-5 h-5 text-primary" />
            Crop {displayName} Photo
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left Column - Crop Interface (60%) */}
          <div className="lg:col-span-6">
            <Card className="p-4 bg-gray-50 dark:bg-gray-800">
              <div className="relative flex justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={3 / 4} // Portrait aspect ratio
                  minWidth={100}
                  minHeight={133}
                  className="max-w-full"
                >
                  <img
                    ref={imgRef}
                    src={image.preview}
                    alt={`${displayName} photo to crop`}
                    onLoad={onImageLoad}
                    className="max-w-full h-auto block"
                    style={{
                      maxHeight: '70vh',
                      maxWidth: '100%',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                    }}
                  />
                </ReactCrop>
              </div>
            </Card>
          </div>

          {/* Right Column - Instructions & Controls (40%) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleCropComplete}
                disabled={isProcessing || !completedCrop}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CropIcon className="w-4 h-4 mr-2" />
                    Apply Crop to Continue
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={handleCancel} disabled={isProcessing} className="w-full">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>

            <Card className="p-4 bg-white dark:bg-gray-800">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
                Cropping Instructions
              </h3>
              <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                <li>• Position the crop area over the face</li>
                <li>• Make sure the face is centered</li>
                <li>• Include the full head and shoulders</li>
                <li>• Avoid cutting off important facial features</li>
              </ul>
            </Card>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}