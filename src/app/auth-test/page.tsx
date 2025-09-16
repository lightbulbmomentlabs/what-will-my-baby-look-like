/**
 * Authentication Test Page
 * Tests both client-side and server-side authentication
 */

'use client';

import { useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useAuthenticatedFetch } from '@/lib/api-client';

export default function AuthTestPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { fetchWithAuth } = useAuthenticatedFetch();
  const [serverTest, setServerTest] = useState<any>(null);
  const [userDebug, setUserDebug] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testServerAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/simple-auth-test');
      const data = await response.json();
      setServerTest(data);
    } catch (error) {
      setServerTest({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  const testUserDebug = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('/api/debug-user');
      const data = await response.json();
      setUserDebug(data);
    } catch (error) {
      setUserDebug({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
    setLoading(false);
  };

  if (!authLoaded || !userLoaded) {
    return <div className="p-8">Loading authentication status...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Authentication Test Page</h1>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Client-Side Status</h2>
        <div className="space-y-2">
          <p><strong>Signed In:</strong> {isSignedIn ? 'Yes' : 'No'}</p>
          <p><strong>User ID:</strong> {user?.id || 'None'}</p>
          <p><strong>Email:</strong> {user?.emailAddresses?.[0]?.emailAddress || 'None'}</p>
          <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
        </div>
      </div>

      <div className="space-x-4">
        <button
          onClick={testServerAuth}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Server Authentication
        </button>

        <button
          onClick={testUserDebug}
          disabled={loading || !isSignedIn}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test User Debug (With Headers)
        </button>
      </div>

      {serverTest && (
        <div className="bg-white border p-4 rounded">
          <h3 className="font-semibold mb-2">Server Authentication Test Results</h3>
          <pre className="text-sm overflow-auto">{JSON.stringify(serverTest, null, 2)}</pre>
        </div>
      )}

      {userDebug && (
        <div className="bg-white border p-4 rounded">
          <h3 className="font-semibold mb-2">User Debug Test Results</h3>
          <pre className="text-sm overflow-auto">{JSON.stringify(userDebug, null, 2)}</pre>
        </div>
      )}

      {loading && (
        <div className="text-center text-gray-600">Testing...</div>
      )}
    </div>
  );
}