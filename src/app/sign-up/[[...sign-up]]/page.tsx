/**
 * Clerk Sign-Up Page
 * Handles user registration with Clerk
 */

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <SignUp
          appearance={{
            variables: {
              colorPrimary: '#3B82F6',
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}