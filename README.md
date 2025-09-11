# What Will My Baby Look Like?

An AI-powered baby prediction application that generates realistic baby photos from parent images using advanced machine learning and genetic inheritance patterns.

## Features

- **AI Baby Generation**: Upload parent photos to generate realistic baby predictions
- **User Authentication**: Secure authentication powered by Clerk
- **Credit System**: Pay-per-use model with Stripe payment integration
- **Personal Gallery**: View and manage your generated baby predictions
- **Auto-Delete System**: Automatic cleanup of images after 30 days
- **Mobile Responsive**: Optimized for all devices
- **Dark/Light Mode**: Theme switching support

## Tech Stack

- **Frontend**: Next.js 15.5.2 with TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Clerk
- **Payments**: Stripe
- **AI**: Replicate (Baby face generation models)
- **UI Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn package manager
- Supabase account and project
- Clerk account and application
- Stripe account (for payments)
- Replicate account (for AI models)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/what-will-my-baby-look-like.git
cd what-will-my-baby-look-like
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in all the required environment variables in `.env.local`:

- **Supabase**: Database URL, anonymous key, and service role key
- **Clerk**: Publishable key, secret key, and webhook secret
- **Stripe**: Secret key, publishable key, and webhook secret
- **Replicate**: API token for AI model access

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Database Setup

The application requires specific database tables and storage buckets:

1. **Tables**: `generated_images`, `user_credits`, `analytics_events`
2. **Storage**: `generated-images` bucket
3. **RLS Policies**: Row Level Security for user data protection

Refer to the Supabase documentation for setting up the required schema.

## Deployment

### Digital Ocean App Platform

1. Create a new app in Digital Ocean App Platform
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set run command: `npm run start`
5. Configure environment variables
6. Deploy!

### Environment Variables for Production

Ensure all environment variables are set in your deployment environment:
- Convert all test/development keys to production versions
- Update `NEXT_PUBLIC_APP_URL` to your production domain
- Set up production webhooks for Clerk and Stripe

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.

© 2025 Lightbulb Moment Labs, Inc. All rights reserved.
# Trigger rebuild
