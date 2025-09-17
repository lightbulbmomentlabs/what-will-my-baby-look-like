/**
 * Clerk Sign-In Page
 * Handles user authentication with Clerk
 */

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            variables: {
              colorPrimary: '#3B82F6',
            },
          }}
          routing="path"
          path="/sign-in"
          afterSignInUrl="/"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
}