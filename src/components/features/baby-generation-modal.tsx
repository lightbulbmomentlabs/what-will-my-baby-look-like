'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Baby, 
  Download, 
  Share, 
  RefreshCcw, 
  AlertTriangle, 
  Sparkles,
  Heart,
  Twitter,
  Facebook,
  Instagram,
  Copy,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BabyGenerationResult } from '@/hooks/use-baby-generation';

interface BabyGenerationModalProps {
  isOpen: boolean;
  isGenerating: boolean;
  progress: number;
  stage: 'preparing' | 'uploading' | 'processing' | 'downloading' | 'complete' | 'error';
  error: string | null;
  result: BabyGenerationResult | null;
  retryCount: number;
  onClose: () => void;
  onRetry: () => void;
  onReset: () => void;
  parentNames: {
    you: string;
    partner: string;
  };
}

const STAGE_MESSAGES = {
  preparing: 'Preparing your images...',
  uploading: 'Analyzing faces...',
  processing: 'Generating baby prediction...',
  downloading: 'Adding final touches...',
  complete: 'Your baby prediction is ready!',
  error: 'Something went wrong',
};

export function BabyGenerationModal({
  isOpen,
  isGenerating,
  progress,
  stage,
  error,
  result,
  retryCount,
  onClose,
  onRetry,
  onReset,
  parentNames,
}: BabyGenerationModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareMessage, setShareMessage] = useState<string>('');
  const [showShareSuccess, setShowShareSuccess] = useState(false);

  const stageMessage = STAGE_MESSAGES[stage];
  const isError = stage === 'error';
  const isComplete = stage === 'complete' && result?.success;


  // Handle image download
  const handleDownload = async () => {
    if (!result?.imageUrl) return;

    setIsDownloading(true);
    try {
      const response = await fetch(result.imageUrl);
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `baby-prediction-${result?.babyName?.name || Date.now()}.jpg`;
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

  // Handle share functionality
  const generateShareText = () => {
    const babyName = result?.babyName?.name || 'our little one';
    return `Check out what our future baby ${babyName} might look like! 👶✨ Generated with AI at [your-domain].com #BabyPredictor #AI #Family`;
  };

  const handleShare = async (platform: string) => {
    const shareText = generateShareText();
    const url = window.location.origin;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct link sharing, so copy to clipboard
        await navigator.clipboard.writeText(shareText);
        setShareMessage('Caption copied! Open Instagram and paste when posting.');
        setShowShareSuccess(true);
        setTimeout(() => setShowShareSuccess(false), 3000);
        return;
      case 'copy':
        await navigator.clipboard.writeText(`${shareText} ${url}`);
        setShareMessage('Link copied to clipboard!');
        setShowShareSuccess(true);
        setTimeout(() => setShowShareSuccess(false), 3000);
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const handleClose = () => {
    onReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!max-w-none w-[95vw] md:w-[80vw] lg:w-[60vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Baby className="w-5 h-5 text-primary" />
            {isError ? 'Generation Failed' : isComplete ? 'Baby Prediction Ready!' : 'Generating Your Baby'}
          </DialogTitle>
          <DialogDescription>
            {isError ? 'We encountered an issue generating your baby prediction.' : 
             isComplete ? 'Your AI-generated baby prediction is complete!' :
             'Please wait while we create your baby prediction...'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error State */}
          {isError && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm text-destructive font-medium">
                      {error || 'An unexpected error occurred'}
                    </p>
                    {retryCount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Attempted {retryCount} time{retryCount > 1 ? 's' : ''}
                      </p>
                    )}
                    <Button
                      onClick={onRetry}
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/20"
                    >
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress State */}
          {isGenerating && !isError && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{stageMessage}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Blending features from {parentNames.you} and {parentNames.partner}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
              </div>

              {retryCount > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Retry attempt {retryCount}...
                </p>
              )}
            </div>
          )}

          {/* Success State */}
          {isComplete && result && (
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
              {/* Left Column - Generated Image (60%) */}
              <div className="lg:col-span-6">
                <Card className="overflow-hidden py-0">
                  <div className="relative">
                    <img
                      src={result.imageUrl}
                      alt="Generated baby prediction"
                      className="w-full h-auto rounded-t-lg object-contain"
                      style={{ aspectRatio: '768/1024' }}
                    />
                    <div className="absolute top-4 left-4">
                      <div className="bg-black/80 backdrop-blur-sm rounded-full px-3 py-1">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-yellow-400" />
                          <span className="text-white text-sm font-medium">AI Generated</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column - Details (40%) */}
              <div className="lg:col-span-4 space-y-4">
                {/* Baby Name */}
                {result.babyName && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <Heart className="w-4 h-4 text-pink-500" />
                          <h3 className="font-semibold text-lg">Meet {result.babyName.name}</h3>
                          <Heart className="w-4 h-4 text-pink-500" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {result.babyName.explanation}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Download Button */}
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  size="lg"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download Image
                </Button>

                {/* Share Buttons */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-center">Share Your Baby Prediction</h4>
                  
                  {showShareSuccess && (
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-4 h-4" />
                          <p className="text-sm">{shareMessage}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare('twitter')}
                      className="flex items-center gap-2 text-xs"
                    >
                      <Twitter className="w-3 h-3 text-blue-500" />
                      Twitter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare('facebook')}
                      className="flex items-center gap-2 text-xs"
                    >
                      <Facebook className="w-3 h-3 text-blue-600" />
                      Facebook
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare('instagram')}
                      className="flex items-center gap-2 text-xs"
                    >
                      <Instagram className="w-3 h-3 text-pink-600" />
                      Instagram
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare('copy')}
                      className="flex items-center gap-2 text-xs"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Generate Another Button */}
                {isComplete && (
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="w-full"
                    size="lg"
                  >
                    Generate Another
                  </Button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Close Button (only show if not complete) */}
        {!isComplete && (
          <div className="flex justify-center pt-4">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isGenerating}
              className={cn(
                "transition-all duration-200",
                isGenerating && "opacity-50 cursor-not-allowed"
              )}
            >
              {isGenerating ? 'Generating...' : 'Close'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}