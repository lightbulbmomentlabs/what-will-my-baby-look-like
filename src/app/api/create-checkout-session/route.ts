import { NextRequest, NextResponse } from 'next/server';
import { getCreditPackage } from '@/lib/credit-constants';
import { getUserByClerkId } from '@/lib/credits';
import { getStripeClient } from '@/lib/stripe-client';
import { authenticateApiRequest, createAuthErrorResponse } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    // Authenticate the request using robust multi-method approach
    const authResult = await authenticateApiRequest(req);

    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(createAuthErrorResponse(authResult), { status: 401 });
    }

    const { userId } = authResult;

    const { packageId } = await req.json();

    if (!packageId || typeof packageId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Package ID is required',
      }, { status: 400 });
    }

    // Get the credit package details
    const creditPackage = getCreditPackage(packageId);
    if (!creditPackage) {
      return NextResponse.json({
        success: false,
        error: 'Invalid package ID',
      }, { status: 400 });
    }

    // Get user info
    const userResult = await getUserByClerkId(userId);
    if (!userResult.success || !userResult.user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    // Create Stripe checkout session
    const session = await getStripeClient().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: creditPackage.name,
              description: `${creditPackage.credits} credits for baby generation`,
              images: [`http://localhost:3003/images/logo.png`],
            },
            unit_amount: creditPackage.price, // Price in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:3003/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3003/?canceled=true`,
      metadata: {
        userId,
        packageId,
        credits: creditPackage.credits.toString(),
      },
      customer_email: userResult.user.email,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 });
  }
}