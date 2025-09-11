'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Sparkles, Baby, ArrowRight } from 'lucide-react';

export function HeroSection() {
  const [isHovered, setIsHovered] = useState(false);
  const { isSignedIn } = useUser();

  const handleGetStarted = () => {
    // Scroll to upload section when implemented
    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 ${isSignedIn ? '' : 'min-h-screen'}`} style={{ height: isSignedIn ? '300px' : undefined }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-500" />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          {/* Main heading */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 mb-6 shadow-sm border border-purple-200 dark:border-purple-800">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                AI-Powered Baby Prediction
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent leading-tight">
              What Will My Baby Look Like?
            </h1>

            {!isSignedIn && (
              <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Upload photos of both parents and let our advanced AI create
                adorable predictions of your future baby with amazing accuracy.
              </p>
            )}
          </div>

          {/* Feature highlights */}
          {!isSignedIn && (
            <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  Upload Parent Photos
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Simply upload clear photos of both parents
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-pink-200 dark:border-pink-800 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  AI Magic
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Our AI blends features to create realistic predictions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Baby className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  Share & Enjoy
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Download and share your baby predictions
                </p>
              </CardContent>
            </Card>
            </div>
          )}

          {/* CTA Button */}
          {!isSignedIn && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              onClick={handleGetStarted}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <span className="flex items-center gap-2">
                Create Your Baby
                <ArrowRight
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isHovered ? 'translate-x-1' : ''
                  }`}
                />
              </span>
            </Button>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              AI-powered predictions • Easy credit system • Privacy focused
            </p>
            </div>
          )}

          {/* Trust indicators */}
          {!isSignedIn && (
            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Trusted by thousands of expecting parents
            </p>
            <div className="flex justify-center items-center gap-8 opacity-60">
              <div className="text-2xl font-bold text-gray-400">10K+</div>
              <div className="text-sm text-gray-500">Happy Families</div>
              <div className="w-px h-8 bg-gray-300" />
              <div className="text-2xl font-bold text-gray-400">50K+</div>
              <div className="text-sm text-gray-500">Baby Predictions</div>
              <div className="w-px h-8 bg-gray-300" />
              <div className="text-2xl font-bold text-gray-400">4.9★</div>
              <div className="text-sm text-gray-500">User Rating</div>
            </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}