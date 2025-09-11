'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Heart, Calendar, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GalleryImage } from '@/hooks/use-gallery-images';

interface GalleryImageCardProps {
  image: GalleryImage;
  className?: string;
}

export function GalleryImageCard({ image, className }: GalleryImageCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDownload = async () => {
    if (!image.original_image_url) return;

    setIsDownloading(true);
    try {
      const response = await fetch(image.original_image_url);
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `baby-prediction-${image.baby_name || 'image'}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card 
      className={cn(
        "group hover:shadow-xl transition-all duration-300 overflow-hidden",
        "hover:scale-[1.02] py-0",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0 relative">
        <div className="relative aspect-square">
          {imageError || !image.original_image_url ? (
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
              <div className="text-center p-4">
                <Heart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {image.baby_name}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Image unavailable
                </p>
              </div>
            </div>
          ) : (
            <img
              src={image.original_image_url}
              alt={`Baby prediction: ${image.baby_name}`}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImageError(true)}
              onLoad={() => setImageError(false)}
            />
          )}
          
          {/* Baby name overlay - only show when image is available */}
          {!imageError && image.original_image_url && (
            <div className="absolute top-4 left-4">
              <div className="bg-black/80 backdrop-blur-sm rounded-full px-3 py-1">
                <div className="flex items-center gap-2">
                  <Heart className="w-3 h-3 text-pink-400" />
                  <span className="text-white text-sm font-medium truncate">
                    {image.baby_name}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Download button overlay - only show when image is available */}
          {!imageError && image.original_image_url && (
            <div className={cn(
              "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300",
              isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="bg-white/90 hover:bg-white text-black hover:text-black backdrop-blur-sm"
                size="lg"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download
              </Button>
            </div>
          )}
        </div>

        {/* Image details footer */}
        <div className="p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(image.created_at)}</span>
            </div>
            <div className="flex items-center gap-3">
              {image.parent1_name && image.parent2_name && (
                <span className="text-xs">
                  {image.parent1_name} + {image.parent2_name}
                </span>
              )}
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                {image.baby_age}yr {image.baby_gender === 'random' ? '👶' : image.baby_gender === 'male' ? '👦' : '👧'}
              </span>
            </div>
          </div>
          
          {image.baby_name_explanation && (
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
              {image.baby_name_explanation}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}