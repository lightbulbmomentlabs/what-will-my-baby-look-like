import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { addCredits, createTransaction } from '@/lib/credits';
import { getStripeClient } from '@/lib/stripe-client';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    // Get raw body as ArrayBuffer, then convert to Buffer for Stripe
    const arrayBuffer = await req.arrayBuffer();
    const body = Buffer.from(arrayBuffer);
    const signature = (await headers()).get('stripe-signature');

    if (!signature) {
      return NextResponse.json({
        success: false,
        error: 'Missing stripe signature',
      }, { status: 400 });
    }

    // Verify webhook signature using raw body
    let event: Stripe.Event;
    try {
      event = getStripeClient().webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({
        success: false,
        error: 'Invalid signature',
      }, { status: 400 });
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const { userId, packageId, credits } = session.metadata!;
      const paymentIntentId = session.payment_intent as string;
      
      if (!userId || !packageId || !credits || !paymentIntentId) {
        console.error('Missing metadata in checkout session:', session.metadata);
        return NextResponse.json({
          success: false,
          error: 'Missing required metadata',
        }, { status: 400 });
      }

      const creditsToAdd = parseInt(credits);
      const amountPaid = session.amount_total || 0;

      try {
        // Create transaction record
        const transactionResult = await createTransaction({
          clerkUserId: userId,
          creditsPurchased: creditsToAdd,
          amountPaid,
          stripePaymentIntentId: paymentIntentId,
          stripeSessionId: session.id,
          packageType: packageId,
        });

        if (!transactionResult.success) {
          console.error('Failed to create transaction:', transactionResult.error);
          return NextResponse.json({
            success: false,
            error: 'Failed to create transaction record',
          }, { status: 500 });
        }

        // Add credits to user account
        const creditsResult = await addCredits(userId, creditsToAdd);

        if (!creditsResult.success) {
          console.error('Failed to add credits:', creditsResult.error);
          return NextResponse.json({
            success: false,
            error: 'Failed to add credits',
          }, { status: 500 });
        }

        console.log(`Successfully added ${creditsToAdd} credits to user ${userId}`);
        
        return NextResponse.json({
          success: true,
          message: 'Credits added successfully',
        });

      } catch (error) {
        console.error('Error processing payment:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to process payment',
        }, { status: 500 });
      }
    }

    // Handle other event types
    console.log(`Unhandled event type: ${event.type}`);
    return NextResponse.json({
      success: true,
      message: 'Event received but not processed',
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 });
  }
}