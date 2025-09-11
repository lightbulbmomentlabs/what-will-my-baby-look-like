/**
 * Client-safe credit constants and types
 */

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: '5_credits',
    name: '5 Credits',
    credits: 5,
    price: 399, // in cents
    pricePerCredit: 80,
  },
  {
    id: '10_credits',
    name: '10 Credits',
    credits: 10,
    price: 499, // in cents
    pricePerCredit: 50,
    popular: true,
  },
  {
    id: '20_credits',
    name: '20 Credits',
    credits: 20,
    price: 599, // in cents
    pricePerCredit: 30,
  },
  {
    id: '100_credits',
    name: '100 Credits',
    credits: 100,
    price: 1999, // in cents
    pricePerCredit: 20,
  },
];

/**
 * Get credit package by ID
 */
export function getCreditPackage(packageId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
}