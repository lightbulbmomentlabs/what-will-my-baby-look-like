'use client';

import { Baby, Images, Menu, User, LogOut, Sparkles } from 'lucide-react';
import { useAuth, useUser, SignInButton, SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useUserCredits } from '@/hooks/use-user-credits';
import { BuyCreditsModal } from '@/components/credits/buy-credits-modal';
import { ThemeToggle } from '@/components/ui/theme-toggle';

function getDisplayName(user: unknown): string {
  const userObj = user as { 
    firstName?: string; 
    emailAddresses?: { emailAddress: string }[] 
  };
  
  if (userObj?.firstName) {
    return userObj.firstName;
  }
  if (userObj?.emailAddresses?.[0]?.emailAddress) {
    const email = userObj.emailAddresses[0].emailAddress;
    const username = email.split('@')[0];
    return username.length > 15 ? username.substring(0, 15) + '...' : username;
  }
  return 'User';
}

export function Header() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { credits, isLoading: creditsLoading, refetchCredits } = useUserCredits();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [creditsUpdated, setCreditsUpdated] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const prevCredits = useRef(credits);

  // Animation when credits increase
  useEffect(() => {
    if (prevCredits.current !== null && credits !== null && credits > prevCredits.current) {
      setCreditsUpdated(true);
      const timer = setTimeout(() => setCreditsUpdated(false), 2000);
      return () => clearTimeout(timer);
    }
    prevCredits.current = credits;
  }, [credits]);

  // Handle successful credit purchase
  const handleCreditsPurchased = () => {
    setShowCreditsModal(false);
    refetchCredits(); // Refresh credits count
  };

  const displayName = user ? getDisplayName(user) : 'User';

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <Baby className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-foreground">
                  What Will My Baby Look Like
                </h1>
                <p className="text-xs text-muted-foreground -mt-1">
                  AI-powered predictions
                </p>
              </div>
            </Link>
          </div>

          {/* Authentication */}
          <div className="flex items-center gap-4">
            {!isLoaded ? (
              <div className="h-10 w-20 bg-muted rounded animate-pulse" />
            ) : !isSignedIn ? (
              <SignInButton mode="modal">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                  Sign In
                </Button>
              </SignInButton>
            ) : (
              <>
                {/* Desktop Menu */}
                <div className="hidden sm:flex items-center gap-4">
                  {/* Theme Toggle */}
                  <ThemeToggle />
                  
                  {/* Credits Display Button */}
                  <button 
                    onClick={() => setShowCreditsModal(true)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-500 hover:shadow-md hover:scale-105 cursor-pointer ${
                      creditsUpdated 
                        ? 'bg-green-100 dark:bg-green-900/30 scale-110 shadow-lg' 
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <span className="text-sm font-medium text-muted-foreground">
                      Credits:
                    </span>
                    <span className={`text-sm font-bold transition-colors duration-500 ${
                      creditsUpdated 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-primary'
                    }`}>
                      {creditsLoading ? '...' : (credits ?? '--')}
                    </span>
                    {creditsUpdated && (
                      <Sparkles className="w-3 h-3 text-green-500 animate-pulse" />
                    )}
                  </button>

                  {/* User Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 px-3 py-2 h-auto"
                      >
                        <User className="w-4 h-4" />
                        <span className="font-medium">{displayName}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-900">
                      <DropdownMenuItem asChild>
                        <Link href="/gallery" className="flex items-center gap-2 cursor-pointer">
                          <Images className="w-4 h-4" />
                          My Gallery
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <SignOutButton>
                          <div className="flex items-center gap-2 cursor-pointer w-full">
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </div>
                        </SignOutButton>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Mobile Menu */}
                <div className="sm:hidden flex items-center gap-3">
                  {/* Theme Toggle */}
                  <ThemeToggle />
                  
                  {/* Mobile Credits Display */}
                  <button 
                    onClick={() => setShowCreditsModal(true)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all duration-500 hover:shadow-md hover:scale-105 cursor-pointer ${
                      creditsUpdated 
                        ? 'bg-green-100 dark:bg-green-900/30 scale-110 shadow-lg' 
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      Credits:
                    </span>
                    <span className={`text-xs font-bold transition-colors duration-500 ${
                      creditsUpdated 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-primary'
                    }`}>
                      {creditsLoading ? '...' : (credits ?? '--')}
                    </span>
                    {creditsUpdated && (
                      <Sparkles className="w-3 h-3 text-green-500 animate-pulse" />
                    )}
                  </button>

                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="w-5 h-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-80">
                      <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                          <User className="w-5 h-5" />
                          {displayName}
                        </SheetTitle>
                      </SheetHeader>
                      
                      <div className="mt-6 space-y-4">
                        {/* Credits Display Button */}
                        <button
                          onClick={() => setShowCreditsModal(true)}
                          className={`flex items-center justify-between p-3 rounded-lg transition-all duration-500 hover:shadow-md hover:scale-105 cursor-pointer w-full ${
                            creditsUpdated 
                              ? 'bg-green-100 dark:bg-green-900/30 scale-105 shadow-lg' 
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          <span className="font-medium">Credits</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold transition-colors duration-500 ${
                              creditsUpdated 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-primary'
                            }`}>
                              {creditsLoading ? '...' : (credits ?? '--')}
                            </span>
                            {creditsUpdated && (
                              <Sparkles className="w-3 h-3 text-green-500 animate-pulse" />
                            )}
                          </div>
                        </button>

                        {/* Menu Items */}
                        <div className="space-y-2">
                          <Link
                            href="/gallery"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Images className="w-5 h-5" />
                            <span className="font-medium">My Gallery</span>
                          </Link>
                          
                          <SignOutButton>
                            <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors w-full text-left">
                              <LogOut className="w-5 h-5" />
                              <span className="font-medium">Sign Out</span>
                            </button>
                          </SignOutButton>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Buy Credits Modal */}
      {isSignedIn && (
        <BuyCreditsModal
          isOpen={showCreditsModal}
          onClose={() => setShowCreditsModal(false)}
          currentCredits={credits || 0}
          onCreditsPurchased={handleCreditsPurchased}
        />
      )}
    </header>
  );
}