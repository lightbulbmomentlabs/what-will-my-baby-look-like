import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors when env vars aren't available
let _stripe: Stripe | null = null;

export const getStripeClient = (() => {
  if (_stripe) {
    return _stripe;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error(
      'Missing STRIPE_SECRET_KEY environment variable. Please check your .env.local file.',
    );
  }

  _stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-08-27.basil',
  });

  return _stripe;
});