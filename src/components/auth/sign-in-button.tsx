'use client';

import { useAuth, useUser, SignInButton, SignOutButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { User, LogIn, LogOut, Loader2 } from 'lucide-react';
import { useUserCredits } from '@/hooks/use-user-credits';

interface SignInButtonProps {
  showCredits?: boolean;
  className?: string;
}

export function AuthButton({ showCredits = true, className = '' }: SignInButtonProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { credits, isLoading: creditsLoading } = useUserCredits();

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <Button variant="ghost" disabled className={className}>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white ${className}`}>
          <LogIn className="w-4 h-4 mr-2" />
          Sign In
        </Button>
      </SignInButton>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {showCredits && (
        <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Credits: 
          </span>
          <span className="text-sm font-bold text-primary">
            {creditsLoading ? '...' : (credits ?? '--')}
          </span>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2">
          <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {user?.firstName || user?.emailAddresses[0]?.emailAddress}
          </span>
        </div>
        
        <SignOutButton>
          <Button variant="outline" size="sm" className={className}>
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </SignOutButton>
      </div>
    </div>
  );
}

// Simple sign-in only button for use in other components
export function SimpleSignInButton({ className = '' }: { className?: string }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded || isSignedIn) {
    return null;
  }

  return (
    <SignInButton mode="modal">
      <Button className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white ${className}`}>
        <LogIn className="w-4 h-4 mr-2" />
        Sign In to Generate
      </Button>
    </SignInButton>
  );
}