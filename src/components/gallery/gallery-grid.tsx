'use client';

import { GalleryImageCard } from './gallery-image-card';
import { CreateNewCard } from './create-new-card';
import { Loader2, ImageIcon, Baby } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GalleryImage } from '@/hooks/use-gallery-images';

interface GalleryGridProps {
  images: GalleryImage[];
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  className?: string;
}

export function GalleryGrid({ 
  images, 
  isLoading, 
  error, 
  onRetry,
  className 
}: GalleryGridProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600 dark:text-gray-400">Loading your gallery...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="w-full">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Failed to load gallery
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-primary hover:text-primary/80 font-medium"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  if (images.length === 0) {
    return (
      <div className={cn("text-center py-16", className)}>
        <div className="w-full">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Baby className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No baby predictions yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first AI-generated baby prediction to see it here in your personal gallery.
          </p>
          <CreateNewCard />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
      className
    )}>
      {/* CTA Card - always first position */}
      <CreateNewCard />
      
      {/* Gallery Images */}
      {images.map((image) => (
        <GalleryImageCard
          key={image.id}
          image={image}
        />
      ))}
    </div>
  );
}