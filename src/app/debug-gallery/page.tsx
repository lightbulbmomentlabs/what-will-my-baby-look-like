'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useAuthenticatedFetch } from '@/lib/api-client';
import { Header } from '@/components/layout/header';

interface DebugInfo {
  authLoaded: boolean;
  isSignedIn: boolean;
  userId?: string;
  userEmail?: string;
  fetchAuthState?: {
    hasUserId: boolean;
    headers: Record<string, string>;
  };
  apiResponse?: {
    status: number;
    success: boolean;
    data: any;
    error?: string;
  };
  authMethod?: string;
}

export default function DebugGalleryPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { fetchWithAuth } = useAuthenticatedFetch();
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    authLoaded: false,
    isSignedIn: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Update debug info when auth state changes
  useEffect(() => {
    setDebugInfo(prev => ({
      ...prev,
      authLoaded: isLoaded,
      isSignedIn: isSignedIn || false,
      userId: user?.id,
      userEmail: user?.emailAddresses?.[0]?.emailAddress,
    }));
  }, [isLoaded, isSignedIn, user]);

  const testApiCall = async () => {
    setIsLoading(true);
    console.log('🧪 Starting debug API test...');

    try {
      // Test the authenticated fetch headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (user?.id) {
        headers['x-clerk-user-id'] = user.id;
      }

      setDebugInfo(prev => ({
        ...prev,
        fetchAuthState: {
          hasUserId: !!user?.id,
          headers,
        }
      }));

      console.log('🔐 Making authenticated request with headers:', headers);

      const response = await fetchWithAuth('/api/gallery');
      const data = await response.json();

      console.log('📊 API Response:', {
        status: response.status,
        ok: response.ok,
        data
      });

      setDebugInfo(prev => ({
        ...prev,
        apiResponse: {
          status: response.status,
          success: response.ok,
          data,
          error: !response.ok ? data.error || 'Request failed' : undefined,
        }
      }));

    } catch (error) {
      console.error('❌ API test failed:', error);
      setDebugInfo(prev => ({
        ...prev,
        apiResponse: {
          status: 0,
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <>
        <Header />
        <main className="min-h-screen p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Gallery Debug - Loading Auth...</h1>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Gallery Debug Tool</h1>

          <div className="grid gap-6">
            {/* Authentication State */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">Authentication State</h2>
              <div className="space-y-2 font-mono text-sm">
                <div>Auth Loaded: <span className={debugInfo.authLoaded ? 'text-green-600' : 'text-red-600'}>{String(debugInfo.authLoaded)}</span></div>
                <div>Signed In: <span className={debugInfo.isSignedIn ? 'text-green-600' : 'text-red-600'}>{String(debugInfo.isSignedIn)}</span></div>
                <div>User ID: <span className="text-blue-600">{debugInfo.userId || 'None'}</span></div>
                <div>Email: <span className="text-blue-600">{debugInfo.userEmail || 'None'}</span></div>
              </div>
            </div>

            {/* API Test */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">API Test</h2>

              <button
                onClick={testApiCall}
                disabled={!debugInfo.isSignedIn || isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-4"
              >
                {isLoading ? 'Testing...' : 'Test Gallery API'}
              </button>

              {debugInfo.fetchAuthState && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Request Headers:</h3>
                  <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(debugInfo.fetchAuthState.headers, null, 2)}
                  </pre>
                </div>
              )}

              {debugInfo.apiResponse && (
                <div>
                  <h3 className="font-semibold mb-2">API Response:</h3>
                  <div className="space-y-2 mb-3">
                    <div>Status: <span className={debugInfo.apiResponse.status === 200 ? 'text-green-600' : 'text-red-600'}>{debugInfo.apiResponse.status}</span></div>
                    <div>Success: <span className={debugInfo.apiResponse.success ? 'text-green-600' : 'text-red-600'}>{String(debugInfo.apiResponse.success)}</span></div>
                    {debugInfo.apiResponse.error && (
                      <div>Error: <span className="text-red-600">{debugInfo.apiResponse.error}</span></div>
                    )}
                  </div>
                  <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(debugInfo.apiResponse.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h2 className="text-xl font-semibold mb-4">Debug Instructions</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>First, ensure you're signed in to the application</li>
                <li>Click "Test Gallery API" to make a direct API call</li>
                <li>Check the browser console (F12) for detailed logs</li>
                <li>Review the API response data to see if images are being returned</li>
                <li>Compare this with what you see in the actual gallery page</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}