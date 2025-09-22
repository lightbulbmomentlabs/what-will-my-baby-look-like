'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { trackPageView } from '@/lib/supabase';

export default function SignUpSuccessPage() {
  useEffect(() => {
    trackPageView('sign-up-success');
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-[80vh] flex items-center justify-center py-16">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Welcome to the Family! 🎉
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Your account has been created successfully. You're all set to start discovering what your future baby will look like using our advanced AI technology.
            </p>
          </div>

          <div className="bg-card rounded-2xl p-8 mb-8 border">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary mr-2" />
              <h2 className="text-xl font-semibold">Ready to Start?</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Upload photos of both parents and let our AI create realistic predictions of your future baby in seconds.
            </p>
            <Link href="/">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Your First Baby
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center justify-center">
              <span className="text-green-600 mr-2">✓</span>
              Instant Results
            </div>
            <div className="flex items-center justify-center">
              <span className="text-green-600 mr-2">✓</span>
              Privacy Protected
            </div>
            <div className="flex items-center justify-center">
              <span className="text-green-600 mr-2">✓</span>
              Scientifically Based
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}