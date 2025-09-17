'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { HeroSection } from '@/components/features/hero-section';
import { PhotoUploadSection } from '@/components/features/photo-upload-section';
import { PurchaseSuccessNotification } from '@/components/notifications/purchase-success-notification';
import { trackPageView, validateSupabaseConfig } from '@/lib/supabase';
import { useUserCredits } from '@/hooks/use-user-credits';
import { getCreditPackage } from '@/lib/credit-constants';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Component that handles search params (needs Suspense)
function PurchaseSuccessHandler({ 
  onPurchaseInfo, 
  onShowNotification 
}: { 
  onPurchaseInfo: (info: { creditsAdded: number; totalCredits: number; } | null) => void;
  onShowNotification: (show: boolean) => void;
}) {
  const searchParams = useSearchParams();
  const { credits, refetchCredits } = useUserCredits();

  // Handle purchase success
  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');

    if (success === 'true' && sessionId && credits !== null) {
      // Extract package info from URL or fetch from Stripe
      const handlePurchaseSuccess = async () => {
        try {
          // Try to get session details from Stripe
          const response = await fetch('/api/stripe/get-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });

          if (response.ok) {
            const sessionData = await response.json();
            const packageId = sessionData.metadata?.packageId;
            
            if (packageId) {
              const creditPackage = getCreditPackage(packageId);
              if (creditPackage) {
                onPurchaseInfo({
                  creditsAdded: creditPackage.credits,
                  totalCredits: credits,
                });
                onShowNotification(true);
                
                // Refresh credits to ensure we have the latest count
                await refetchCredits();
              }
            }
          }
        } catch (error) {
          console.error('Error handling purchase success:', error);
          // Fallback: show generic success notification
          onPurchaseInfo({
            creditsAdded: 0,
            totalCredits: credits,
          });
          onShowNotification(true);
        }

        // Clean up URL parameters
        const url = new URL(window.location.href);
        url.searchParams.delete('success');
        url.searchParams.delete('session_id');
        window.history.replaceState({}, '', url.toString());
      };

      handlePurchaseSuccess();
    }
  }, [searchParams, credits, refetchCredits, onPurchaseInfo, onShowNotification]);

  return null;
}

export default function Home() {
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [purchaseInfo, setPurchaseInfo] = useState<{
    creditsAdded: number;
    totalCredits: number;
  } | null>(null);

  // Track page view for analytics and validate config
  useEffect(() => {
    // Validate Supabase configuration on app load
    validateSupabaseConfig();
    trackPageView('home');
  }, []);

  const handleStartGenerating = () => {
    setShowSuccessNotification(false);
    // Scroll to upload section
    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <Header />
      <main>
        <HeroSection />
        
        {/* Main photo upload interface */}
        <section id="upload-section">
          <PhotoUploadSection />
        </section>

        {/* SEO Content Sections */}
        <section className="py-16 bg-gradient-to-b from-background to-muted/50">
          <div className="container mx-auto px-4 max-w-5xl">
            {/* How It Works */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                How Our AI Baby Generator Works
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Upload photos to see your future baby in seconds using advanced artificial intelligence and genetic prediction technology.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📸</span>
                </div>
                <h3 className="font-semibold mb-2">1. Upload Photos</h3>
                <p className="text-sm text-muted-foreground">
                  Simply upload clear photos of both parents. Our AI baby generator works with any photo quality.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🧠</span>
                </div>
                <h3 className="font-semibold mb-2">2. AI Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Our machine learning baby prediction technology analyzes facial features, genetics, and inheritance patterns.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👶</span>
                </div>
                <h3 className="font-semibold mb-2">3. Instant Results</h3>
                <p className="text-sm text-muted-foreground">
                  See what your baby will look like instantly with our AI baby generator.
                </p>
              </div>
            </div>

            {/* Features Section */}
            <div className="bg-card rounded-2xl p-8 mb-16 border">
              <h2 className="text-2xl font-bold text-center mb-8">
                Why Choose Our AI Baby Generator?
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Easy to Use</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate baby predictions with a simple, intuitive interface. Try your first generation today.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Scientifically Accurate</h3>
                    <p className="text-sm text-muted-foreground">
                      Our genetics-based baby generator uses real inheritance patterns for realistic predictions.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Instant Baby Prediction</h3>
                    <p className="text-sm text-muted-foreground">
                      See your future baby appearance in seconds with our advanced AI baby generator technology.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Privacy Protected</h3>
                    <p className="text-sm text-muted-foreground">
                      Your photos are processed securely and never stored permanently on our servers.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-center mb-8">
                Frequently Asked Questions About Baby Face Generators
              </h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="accuracy">
                  <AccordionTrigger className="text-left">
                    How accurate are AI baby generators?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Our AI baby generator uses advanced machine learning algorithms that analyze genetic inheritance patterns, facial structure similarities, and statistical trait distribution. While no baby prediction app can be 100% accurate due to the complexity of genetics, our scientifically-based approach provides realistic predictions that often capture key family resemblances and likely genetic combinations.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="photos">
                  <AccordionTrigger className="text-left">
                    What photos work best for baby prediction?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    For the most accurate baby face generator results, use clear, front-facing photos with good lighting. Both parents should be looking directly at the camera with neutral expressions. Avoid photos with sunglasses, heavy makeup, or shadows covering the face. Our AI baby generator works with most photo qualities, but clearer images produce better predictions of what your baby will look like.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="cost">
                  <AccordionTrigger className="text-left">
                    How much does it cost to use?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    You can try your first baby prediction to see how our AI baby generator works. After that, additional generations require credits which you can purchase affordably. No subscription required - just pay for what you use when you want to create more predictions.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="same-sex">
                  <AccordionTrigger className="text-left">
                    Can same-sex couples use this baby predictor?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Absolutely! Our AI baby generator works for all types of couples and family planning scenarios. Simply upload photos of the two people whose genetic traits you&apos;d like to combine. Our baby face generator creates predictions based on the facial features and genetic markers present in the uploaded photos, regardless of the relationship between the individuals.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="gender">
                  <AccordionTrigger className="text-left">
                    How does the baby gender prediction work?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Our baby generator can create predictions for both male and female babies, or you can choose &quot;random&quot; for a surprise. The AI analyzes how genetic traits typically express differently in boys versus girls, considering factors like facial structure development patterns and inherited characteristics that may vary by gender.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* About Section */}
            <div className="bg-muted/50 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                The Science Behind Baby Face Prediction
              </h2>
              <p className="text-muted-foreground max-w-3xl mx-auto mb-6">
                Our AI baby generator combines cutting-edge artificial intelligence with established genetic principles to predict baby appearance from parents&apos; photos. Using neural networks trained on genetic inheritance patterns, facial feature analysis, and statistical trait distribution, we create realistic predictions of what your baby will look like.
              </p>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                While genetics is complex and no baby predictor can guarantee exact results, our scientifically-informed approach provides entertaining and often surprisingly accurate glimpses into your family&apos;s future. Try our AI baby generator today to see what your baby will look like!
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Purchase Success Handler with Suspense */}
      <Suspense fallback={null}>
        <PurchaseSuccessHandler 
          onPurchaseInfo={setPurchaseInfo}
          onShowNotification={setShowSuccessNotification}
        />
      </Suspense>

      {/* Purchase Success Notification */}
      {showSuccessNotification && purchaseInfo && (
        <PurchaseSuccessNotification
          isVisible={showSuccessNotification}
          creditsAdded={purchaseInfo.creditsAdded}
          totalCredits={purchaseInfo.totalCredits}
          onClose={() => setShowSuccessNotification(false)}
          onStartGenerating={handleStartGenerating}
        />
      )}
      
      <Footer />
    </>
  );
}
