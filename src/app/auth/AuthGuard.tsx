import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import {
  useAuth as useClerkAuth,
  useUser as useClerkUser,
  RedirectToSignIn,
} from '@clerk/clerk-react';
import { logoutBackend, shellApi } from '@/lib/core-client';
import { LoadingState } from '../components/Feedback';

export { useClerkAuth as useAuth, useClerkUser as useUser };

interface CoreState {
  hasCoreConnection: boolean;
  loading: boolean;
  refreshCoreConnection: () => Promise<void>;
}

const CoreContext = createContext<CoreState>({
  hasCoreConnection: false,
  loading: true,
  refreshCoreConnection: async () => {},
});

export function useCoreConnection() {
  return useContext(CoreContext);
}

export function CoreConnectionProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { user } = useClerkUser();
  const [hasCoreConnection, setHasCoreConnection] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkCoreConnection = async () => {
    if (!isSignedIn || !user) {
      setHasCoreConnection(false);
      setLoading(false);
      void logoutBackend();
      return;
    }

    try {
      // Sync Clerk user with backend and retrieve core connection state
      const result = await shellApi<{ hasCoreConnection?: boolean }>('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          name: user.fullName || user.username || null,
          email: user.primaryEmailAddress?.emailAddress || null,
          avatarUrl: user.imageUrl || null,
        }),
      });
      setHasCoreConnection(Boolean(result?.hasCoreConnection));
    } catch {
      // If Core isn't connected yet, allow access to workspace
      setHasCoreConnection(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && user?.id) {
        void checkCoreConnection();
      } else {
        setHasCoreConnection(false);
        setLoading(false);
        void logoutBackend();
      }
    }
  }, [isLoaded, isSignedIn, user?.id]);

  return (
    <CoreContext.Provider
      value={{
        hasCoreConnection,
        loading,
        refreshCoreConnection: checkCoreConnection,
      }}
    >
      {children}
    </CoreContext.Provider>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useClerkAuth();

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-bg-light">
        <LoadingState label="Verifying session…" />
      </main>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return <>{children}</>;
}

export function RequireCore({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { hasCoreConnection, loading } = useCoreConnection();

  if (!isLoaded || loading) {
    return (
      <main className="min-h-screen bg-bg-light">
        <LoadingState label="Verifying Core connection…" />
      </main>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (!hasCoreConnection) {
    return <Navigate to="/connect-core" replace />;
  }

  return <>{children}</>;
}

export function PublicOnly({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useClerkAuth();

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-bg-light">
        <LoadingState label="Loading…" />
      </main>
    );
  }

  if (isSignedIn) {
    return <Navigate to="/workspace" replace />;
  }

  return <>{children}</>;
}
