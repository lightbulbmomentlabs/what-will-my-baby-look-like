'use client';

import { useState, useEffect } from 'react';
import { useAuth, SignInButton } from '@clerk/nextjs';
import { ImageUploadZone } from './image-upload-zone';
import { ImageCropModal } from './image-crop-modal';
import { BabyGenerationModal } from './baby-generation-modal';
import { BuyCreditsModal } from '@/components/credits/buy-credits-modal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Sparkles, Baby, ArrowRight, AlertTriangle, Loader2, LogIn, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UploadedImage } from '@/types';
import { AGE_OPTIONS, GENDER_OPTIONS, SIMILARITY_CONFIG } from '@/lib/constants';
import { useBabyGeneration } from '@/hooks/use-baby-generation';
import { useUserCredits } from '@/hooks/use-user-credits';
import { usePhotoStateStore } from '@/hooks/use-photo-state-store';

type PhotoUploadSectionProps = Record<string, never>;

export function PhotoUploadSection(_props: PhotoUploadSectionProps = {}) {
  const [youImage, setYouImage] = useState<UploadedImage | undefined>();
  const [partnerImage, setPartnerImage] = useState<UploadedImage | undefined>();
  const [cropModalImage, setCropModalImage] = useState<UploadedImage | undefined>();
  const [isAutoCrop, setIsAutoCrop] = useState<boolean>(false);
  const [similarity, setSimilarity] = useState<number[]>([SIMILARITY_CONFIG.default]);
  const [selectedAge, setSelectedAge] = useState<string>('2');
  const [selectedGender, setSelectedGender] = useState<string>('random');
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  
  // Authentication and credits hook
  const { isSignedIn, isLoaded } = useAuth();
  const { isLoading: creditsLoading, isAuthenticated, credits, refetchCredits } = useUserCredits();
  
  // Photo state persistence hook
  const { saveState, tryRestore } = usePhotoStateStore();
  
  // Baby generation hook
  const {
    isGenerating,
    progress,
    stage,
    error,
    result,
    retryCount,
    generateBaby,
    resetGeneration,
  } = useBabyGeneration(refetchCredits);
  
  const bothImagesUploaded = youImage && partnerImage;
  const bothImagesCropped = youImage?.croppedFile && partnerImage?.croppedFile;

  // Auto-restore state when user becomes authenticated
  useEffect(() => {
    const restoredState = tryRestore();
    if (restoredState) {
      console.log('Restoring photo state after authentication');
      if (restoredState.youImage) {
        setYouImage(restoredState.youImage);
      }
      if (restoredState.partnerImage) {
        setPartnerImage(restoredState.partnerImage);
      }
      setSimilarity([restoredState.similarity]);
      setSelectedAge(restoredState.selectedAge);
      setSelectedGender(restoredState.selectedGender);
    }
  }, [isLoaded, isSignedIn, tryRestore]);

  // Auto-save state whenever images or settings change (only for non-authenticated users)
  useEffect(() => {
    if (!isSignedIn && (youImage || partnerImage)) {
      const currentState = {
        youImage,
        partnerImage,
        similarity: similarity[0],
        selectedAge,
        selectedGender,
      };
      saveState(currentState);
    }
  }, [youImage, partnerImage, similarity, selectedAge, selectedGender, isSignedIn, saveState]);

  // Auto-scroll to controls when both images are uploaded
  useEffect(() => {
    if (bothImagesUploaded) {
      const controlsElement = document.getElementById('customization-controls');
      if (controlsElement) {
        controlsElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [bothImagesUploaded]);

  const handleYouImageUpload = (image: UploadedImage) => {
    setYouImage(image);
  };

  const handlePartnerImageUpload = (image: UploadedImage) => {
    setPartnerImage(image);
  };

  const handleYouImageRemove = () => {
    if (youImage?.preview) {
      URL.revokeObjectURL(youImage.preview);
    }
    if (youImage?.croppedPreview) {
      URL.revokeObjectURL(youImage.croppedPreview);
    }
    setYouImage(undefined);
  };

  const handlePartnerImageRemove = () => {
    if (partnerImage?.preview) {
      URL.revokeObjectURL(partnerImage.preview);
    }
    if (partnerImage?.croppedPreview) {
      URL.revokeObjectURL(partnerImage.croppedPreview);
    }
    setPartnerImage(undefined);
  };

  const handleYouNameChange = (name: string) => {
    if (youImage) {
      setYouImage({ ...youImage, name });
    }
  };

  const handlePartnerNameChange = (name: string) => {
    if (partnerImage) {
      setPartnerImage({ ...partnerImage, name });
    }
  };

  const handleCropRequest = (image: UploadedImage, isAutoTrigger = false) => {
    setCropModalImage(image);
    setIsAutoCrop(isAutoTrigger);
  };

  const handleCropComplete = (croppedImage: UploadedImage) => {
    if (croppedImage.label === 'you') {
      setYouImage(croppedImage);
    } else {
      setPartnerImage(croppedImage);
    }
    setCropModalImage(undefined);
    setIsAutoCrop(false);
  };

  const handleCropCancel = () => {
    if (isAutoCrop && cropModalImage) {
      // Auto-crop mode: remove the image entirely
      if (cropModalImage.label === 'you') {
        setYouImage(undefined);
      } else {
        setPartnerImage(undefined);
      }
    }
    // For both modes: close the modal
    setCropModalImage(undefined);
    setIsAutoCrop(false);
  };

  // Handle successful credit purchase
  const handleCreditsPurchased = () => {
    setShowCreditsModal(false);
    refetchCredits(); // Refresh credits count
  };

  // Determine button state and action
  const getButtonConfig = () => {
    if (!bothImagesCropped) {
      return {
        disabled: true,
        text: bothImagesUploaded ? 'Please crop both photos to continue' : 'Upload photos to start',
        icon: Baby,
        action: () => {},
      };
    }

    if (creditsLoading) {
      return {
        disabled: true,
        text: 'Generate Baby Prediction',
        icon: Loader2,
        action: () => {},
        loading: true,
      };
    }

    if (!isLoaded || !isSignedIn) {
      return {
        disabled: false,
        text: 'Sign In/Up to Generate',
        icon: LogIn,
        action: 'sign-in',
      };
    }

    if (credits === 0) {
      return {
        disabled: false,
        text: 'Buy Credits to Generate',
        icon: CreditCard,
        action: 'buy-credits',
      };
    }

    return {
      disabled: false,
      text: 'Generate Baby Prediction',
      icon: Baby,
      action: 'generate',
    };
  };

  const handleButtonClick = () => {
    const config = getButtonConfig();
    
    switch (config.action) {
      case 'sign-in':
        // Handled by SignInButton wrapper
        break;
      case 'buy-credits':
        setShowCreditsModal(true);
        break;
      case 'generate':
        if (youImage && partnerImage) {
          generateBaby({
            youImage,
            partnerImage,
            similarity: similarity[0],
            age: parseInt(selectedAge),
            gender: selectedGender as 'male' | 'female' | 'random',
            yourName: youImage.name,
            partnerName: partnerImage.name,
          });
        }
        break;
    }
  };

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Step 1: Upload Photos</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Upload Your Photos
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Upload clear photos of both parents for the best AI prediction results. 
              Make sure faces are clearly visible and well-lit.
            </p>
          </div>

          {/* Upload Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            <ImageUploadZone
              label="you"
              uploadedImage={youImage}
              onImageUpload={handleYouImageUpload}
              onImageRemove={handleYouImageRemove}
              onNameChange={handleYouNameChange}
              onCropRequest={handleCropRequest}
            />

            <ImageUploadZone
              label="partner"
              uploadedImage={partnerImage}
              onImageUpload={handlePartnerImageUpload}
              onImageRemove={handlePartnerImageRemove}
              onNameChange={handlePartnerNameChange}
              onCropRequest={handleCropRequest}
            />
          </div>

          {/* Customization Controls */}
          <div 
            id="customization-controls"
            className={cn(
              "transition-all duration-500",
              bothImagesUploaded 
                ? "opacity-100 transform translate-y-0" 
                : "opacity-40 transform translate-y-4 pointer-events-none"
            )}
          >
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-primary/20">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-secondary/80 rounded-full px-4 py-2 mb-4">
                    <Baby className="w-4 h-4 text-secondary-foreground" />
                    <span className="text-sm font-medium text-secondary-foreground">
                      Step 2: Customize Your Baby
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                    Personalize Your Prediction
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Adjust the similarity and age to get the perfect baby prediction
                  </p>
                </div>

                <div className="space-y-8 mb-8">
                  {/* Similarity Slider */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Baby Similarity
                      </label>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {similarity[0]}%
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <Slider
                        value={similarity}
                        onValueChange={setSimilarity}
                        max={100}
                        step={1}
                        className="w-full"
                        disabled={!bothImagesUploaded}
                      />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>More like {youImage?.name || 'You'}</span>
                        <span>Equal Mix</span>
                        <span>More like {partnerImage?.name || 'Partner'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Age and Gender Selection */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Age Selection */}
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Baby Age
                      </label>
                      <Select
                        value={selectedAge}
                        onValueChange={setSelectedAge}
                        disabled={!bothImagesUploaded}
                      >
                        <SelectTrigger className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                          <SelectValue placeholder="Select age" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-900">
                          {AGE_OPTIONS.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value.toString()}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Gender Selection */}
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Baby Gender
                      </label>
                      <Select
                        value={selectedGender}
                        onValueChange={setSelectedGender}
                        disabled={!bothImagesUploaded}
                      >
                        <SelectTrigger className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-900">
                          {GENDER_OPTIONS.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="text-center">
                  {(() => {
                    const config = getButtonConfig();
                    const ButtonIcon = config.icon;
                    
                    // Wrap in SignInButton for sign-in action
                    if (config.action === 'sign-in') {
                      return (
                        <SignInButton mode="modal">
                          <Button
                            size="lg"
                            disabled={config.disabled}
                            className={cn(
                              "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
                              "text-white font-semibold px-8 py-3 rounded-xl",
                              "shadow-lg hover:shadow-xl transition-all duration-300",
                              "transform hover:scale-105 disabled:hover:scale-100",
                              "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                          >
                            <ButtonIcon className={cn("w-5 h-5 mr-2", config.loading && "animate-spin")} />
                            {config.text}
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </Button>
                        </SignInButton>
                      );
                    }

                    // Regular button for other actions
                    return (
                      <Button
                        size="lg"
                        onClick={handleButtonClick}
                        disabled={config.disabled}
                        className={cn(
                          "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
                          "text-white font-semibold px-8 py-3 rounded-xl",
                          "shadow-lg hover:shadow-xl transition-all duration-300",
                          "transform hover:scale-105 disabled:hover:scale-100",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      >
                        <ButtonIcon className={cn("w-5 h-5 mr-2", config.loading && "animate-spin")} />
                        {config.text}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    );
                  })()}
                  
                  {/* Status Messages */}
                  {bothImagesUploaded && !bothImagesCropped && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                      Please crop both photos to continue
                    </p>
                  )}
                  
                  {!bothImagesUploaded && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                      Upload both photos to start generating
                    </p>
                  )}

                  {/* Credits Info */}
                  {isSignedIn && credits !== null && bothImagesCropped && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                      You have {credits} credit{credits !== 1 ? 's' : ''} remaining
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      {cropModalImage && (
        <ImageCropModal
          image={cropModalImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          isAutoCrop={isAutoCrop}
        />
      )}

      {/* Buy Credits Modal */}
      <BuyCreditsModal
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        currentCredits={credits || 0}
        onCreditsPurchased={handleCreditsPurchased}
      />

      {/* Baby Generation Modal */}
      <BabyGenerationModal
        isOpen={isGenerating || !!result || !!error}
        isGenerating={isGenerating}
        progress={progress}
        stage={stage}
        error={error}
        result={result}
        retryCount={retryCount}
        onClose={() => resetGeneration()}
        onRetry={handleButtonClick}
        onReset={resetGeneration}
        parentNames={{
          you: youImage?.name || 'You',
          partner: partnerImage?.name || 'Your Partner',
        }}
      />
    </section>
  );
}