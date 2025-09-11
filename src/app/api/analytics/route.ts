/**
 * Analytics API endpoint for generation statistics
 * Optional endpoint for viewing app usage analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getGenerationAnalytics, 
  getGenerationStats 
} from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'stats';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    switch (type) {
      case 'stats':
        const statsResult = await getGenerationStats();
        if (!statsResult.success) {
          return NextResponse.json(
            { error: 'Failed to fetch statistics' },
            { status: 500 }
          );
        }
        return NextResponse.json(statsResult.data);

      case 'generations':
        const analyticsResult = await getGenerationAnalytics(startDate || undefined, endDate || undefined);
        if (!analyticsResult.success) {
          return NextResponse.json(
            { error: 'Failed to fetch generation data' },
            { status: 500 }
          );
        }
        return NextResponse.json(analyticsResult.data);

      default:
        return NextResponse.json(
          { error: 'Invalid analytics type. Use "stats" or "generations"' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Note: For production, consider adding authentication checks within the GET function
// or using middleware.ts at the root level for route protection