import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  type User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { clearGuestDemoSeeded } from '../data/demoWorkflow';

const GUEST_ID_KEY = 'workflow_designer_guest_id';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isGuest: boolean;
  guestId: string | null;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function generateGuestId(): string {
  return `guest-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function getOrCreateGuestId(): string {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = generateGuestId();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      // If user signs in, exit guest mode
      if (user) {
        setIsGuest(false);
        setGuestId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      // Exit guest mode on successful sign in
      setIsGuest(false);
      setGuestId(null);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Google sign-in error:', err);
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      if (user) {
        await firebaseSignOut(auth);
      }
      // If exiting guest mode, clear the guest ID and demo seeded flag
      if (isGuest) {
        localStorage.removeItem(GUEST_ID_KEY);
        clearGuestDemoSeeded();
      }
      // Exit guest mode
      setIsGuest(false);
      setGuestId(null);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      console.error('Sign-out error:', err);
    }
  };

  const continueAsGuest = () => {
    const id = getOrCreateGuestId();
    setGuestId(id);
    setIsGuest(true);
    setError(null);
  };

  const isAuthenticated = !!user || isGuest;

  const value: AuthContextType = {
    user,
    loading,
    error,
    isGuest,
    guestId,
    isAuthenticated,
    signInWithGoogle,
    signOut,
    continueAsGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
