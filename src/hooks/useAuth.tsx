import { useMemo } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';

type AppUser = {
  id: string;
};

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  getToken: (options?: { template?: string }) => Promise<string | null>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthContextType {
  const { userId, isLoaded, getToken, signOut } = useClerkAuth();

  const user = useMemo<AppUser | null>(() => {
    if (!userId) return null;
    return { id: userId };
  }, [userId]);

  return {
    user,
    loading: !isLoaded,
    getToken,
    signOut,
  };
}
