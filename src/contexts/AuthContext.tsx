import { createContext, useContext, ReactNode } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';

interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  isGuest: boolean;
  setGuest: (val: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const signOut = async () => {
    await clerkSignOut();
  };

  const setGuest = (val: boolean) => {
    // Guest mode is deprecated in favor of Clerk for now
    console.log('Guest mode requested:', val);
  };

  return (
    <AuthContext.Provider value={{ 
      user: clerkUser as any, 
      session: clerkUser ? {} : null, 
      loading: !isLoaded, 
      isGuest: false, 
      setGuest, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
