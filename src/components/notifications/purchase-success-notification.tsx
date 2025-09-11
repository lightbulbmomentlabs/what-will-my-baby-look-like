'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Sparkles, 
  X, 
  Baby,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PurchaseSuccessNotificationProps {
  isVisible: boolean;
  creditsAdded: number;
  totalCredits: number;
  onClose: () => void;
  onStartGenerating?: () => void;
}

export function PurchaseSuccessNotification({
  isVisible,
  creditsAdded,
  totalCredits,
  onClose,
  onStartGenerating,
}: PurchaseSuccessNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Auto-close after 8 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <Card className={cn(
        "relative overflow-hidden w-[90vw] sm:w-[80vw] md:w-[60vw] lg:w-[50vw] xl:w-[40vw] max-w-2xl transition-all duration-500 transform",
        isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0",
        "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
        "border-green-200 dark:border-green-800 shadow-2xl"
      )}>
        {/* Sparkle animations */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <Sparkles
              key={i}
              className={cn(
                "absolute w-4 h-4 text-yellow-400 animate-pulse",
                i === 0 && "top-4 left-4 animation-delay-0",
                i === 1 && "top-8 right-8 animation-delay-200",
                i === 2 && "bottom-12 left-8 animation-delay-400",
                i === 3 && "bottom-6 right-12 animation-delay-600",
                i === 4 && "top-16 left-1/2 animation-delay-800",
                i === 5 && "bottom-16 right-1/4 animation-delay-1000"
              )}
            />
          ))}
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 hover:bg-white/20"
        >
          <X className="w-4 h-4" />
        </Button>

        <CardContent className="p-8 text-center space-y-6">
          {/* Success icon */}
          <div className="relative">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            {/* Pulse ring animation */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 border-4 border-green-400 rounded-full animate-ping opacity-20"></div>
          </div>

          {/* Success message */}
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-green-800 dark:text-green-200">
              🎉 Purchase Successful!
            </h3>
            
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  +{creditsAdded} Credits Added!
                </span>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You now have <span className="font-bold text-purple-600 dark:text-purple-400">{totalCredits} total credits</span>
              </p>
            </div>

            <p className="text-green-700 dark:text-green-300 text-lg font-medium">
              Ready to generate amazing baby predictions! ✨
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={onStartGenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
              size="lg"
            >
              <Baby className="w-5 h-5 mr-2" />
              Start Generating Images
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              I'll generate later
            </Button>
          </div>

          {/* Fun message */}
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            Time to discover what your future little one might look like! 👶
          </p>
        </CardContent>
      </Card>
    </div>
  );
}