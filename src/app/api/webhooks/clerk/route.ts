/**
 * Clerk webhook handler for user lifecycle events
 * Handles new user creation and awards initial free credits
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/credits';

// Lazy initialization to avoid build-time errors when env vars aren't available
function getWebhookSecret() {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to your environment variables');
  }
  return WEBHOOK_SECRET;
}

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(getWebhookSecret());

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new NextResponse('Error occurred', {
      status: 400,
    });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with and ID of ${id} and type of ${eventType}`);
  console.log('Webhook body:', body);

  // Handle the webhook
  try {
    if (eventType === 'user.created') {
      // New user signed up, create account with free credits
      const { id: clerkUserId, email_addresses, first_name, last_name } = evt.data;
      
      const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id);
      const emailAddress = primaryEmail?.email_address || email_addresses[0]?.email_address;
      
      if (!emailAddress) {
        console.error('No email address found for user:', clerkUserId);
        return new NextResponse('Error: No email address found', { status: 400 });
      }

      console.log(`Creating new user: ${clerkUserId} with email: ${emailAddress}`);
      
      const result = await getOrCreateUser(clerkUserId, {
        email: emailAddress,
        firstName: first_name || undefined,
        lastName: last_name || undefined,
      });

      if (result.success) {
        console.log(`✅ Successfully created user account for ${clerkUserId} with 1 free credit`);
      } else {
        console.error(`❌ Failed to create user account for ${clerkUserId}:`, result.error);
        return new NextResponse('Error creating user account', { status: 500 });
      }
    }
    
    if (eventType === 'user.updated') {
      // User updated their profile, sync the data
      const { id: clerkUserId, email_addresses, first_name, last_name } = evt.data;
      
      const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id);
      const emailAddress = primaryEmail?.email_address || email_addresses[0]?.email_address;
      
      if (emailAddress) {
        // Try to get or create user (this will update existing user if needed)
        await getOrCreateUser(clerkUserId, {
          email: emailAddress,
          firstName: first_name || undefined,
          lastName: last_name || undefined,
        });
        
        console.log(`✅ Successfully updated user profile for ${clerkUserId}`);
      }
    }

    return new NextResponse('Success', { status: 200 });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Error processing webhook', { status: 500 });
  }
}