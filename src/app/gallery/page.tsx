'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { GalleryGrid } from '@/components/gallery/gallery-grid';
import { useGalleryImages } from '@/hooks/use-gallery-images';
import { trackPageView } from '@/lib/supabase';
import { Images, Sparkles } from 'lucide-react';

export default function GalleryPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const { images, isLoading, error, count, refetch } = useGalleryImages();

  // Handle client-side authentication redirect
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname));
    }
  }, [isSignedIn, isLoaded, router]);

  // Track page view for analytics
  useEffect(() => {
    if (isSignedIn) {
      trackPageView('gallery');
    }
  }, [isSignedIn]);

  // Show loading while checking auth
  if (!isLoaded || (!isSignedIn && isLoaded)) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Your Personal Collection</span>
            </div>
            
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <Images className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100">
                My Gallery
              </h1>
            </div>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Your collection of AI-generated baby predictions. Each image represents a unique blend of features and possibilities.
            </p>
            
            {/* Gallery Stats */}
            {!isLoading && !error && (
              <div className="mt-6 inline-flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-6 py-2 border border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {count === 0 ? 'No predictions yet' : 
                   count === 1 ? '1 prediction' : 
                   `${count} predictions`}
                </span>
              </div>
            )}
          </div>

          {/* Gallery Grid */}
          <div className="max-w-6xl mx-auto">
            <GalleryGrid
              images={images}
              isLoading={isLoading}
              error={error}
              onRetry={refetch}
            />
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}