'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CreditCard, 
  Sparkles, 
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CREDIT_PACKAGES } from '@/lib/credit-constants';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits?: number;
  onCreditsPurchased?: () => void;
}

export function BuyCreditsModal({ isOpen, onClose, currentCredits = 0, onCreditsPurchased }: BuyCreditsModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>('10_credits');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async (packageId: string) => {
    setIsProcessing(true);
    
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
      
    } catch (error) {
      console.error('Purchase failed:', error);
      setIsProcessing(false);
      // TODO: Show error message to user
      alert(error instanceof Error ? error.message : 'Purchase failed. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-none w-[95vw] md:w-[60vw] lg:w-[50vw] xl:w-[40vw] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <CreditCard className="w-5 h-5 text-primary" />
            Buy Credits
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Choose a credit package to continue generating baby predictions. 
            You currently have {currentCredits} credit{currentCredits !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Package Selection */}
          <div className="space-y-3">
            {CREDIT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={cn(
                  "relative cursor-pointer transition-all duration-300 hover:shadow-lg rounded-lg border-2 p-4",
                  selectedPackage === pkg.id 
                    ? "ring-2 ring-primary border-primary bg-primary/5 dark:bg-primary/10" 
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                  pkg.popular && "border-purple-200 dark:border-purple-700"
                )}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                {pkg.popular && (
                  <div className="absolute -top-2 left-4">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded text-xs font-medium">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  {/* Left side - Package info */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {pkg.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Check className="w-3 h-3 text-green-500" />
                        <span>{pkg.credits} generations</span>
                      </div>
                    </div>
                  </div>

                  {/* Center - Price */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      ${(pkg.price / 100).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ${(pkg.pricePerCredit / 100).toFixed(2)} per credit
                    </div>
                  </div>

                  {/* Right side - Selection indicator */}
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                    selectedPackage === pkg.id 
                      ? "border-primary bg-primary" 
                      : "border-gray-300 dark:border-gray-500"
                  )}>
                    {selectedPackage === pkg.id && (
                      <Check className="w-4 h-4 text-primary-foreground" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Purchase Button */}
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            
            <Button
              onClick={() => handlePurchase(selectedPackage)}
              disabled={isProcessing}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              size="lg"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isProcessing ? 'Processing...' : `Purchase ${CREDIT_PACKAGES.find(p => p.id === selectedPackage)?.name}`}
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Secure payment powered by Stripe
            </p>
            <div className="flex justify-center items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
              <span>🔒 SSL Encrypted</span>
              <span>💳 All Cards Accepted</span>
              <span>🛡️ Secure Checkout</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}