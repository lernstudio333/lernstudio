import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  isLoggedIn: boolean;
  isInitializing: boolean;
  userName: string | null;
  token: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  login: (email: string, password: string) => Promise<string | null>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('gas_token, first_name, last_name, role')
    .eq('id', userId)
    .single();
  console.log('[AuthContext] fetchProfile result:', { data, error });
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  // Effect 1: restore session on mount + subscribe to auth changes.
  // IMPORTANT: no Supabase API calls inside onAuthStateChange — it deadlocks the client.
  useEffect(() => {
    console.log('[AuthContext] calling getSession()...');
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        console.log('[AuthContext] getSession() result:', { email: session?.user?.email, error });
        setUser(session?.user ?? null);
        if (!session?.user) {
          // No session — show login form immediately, no profile fetch needed
          setIsInitializing(false);
        }
        // If session exists, keep isInitializing=true until profile fetch completes (see Effect 2)
      })
      .catch(() => setIsInitializing(false)); // Safety: always unblock on error

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;
      console.log('[AuthContext] auth event:', event, session?.user?.email ?? null);
      // Only update user — no Supabase API calls here
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Effect 2: fetch profile whenever user changes (outside of Supabase callback).
  useEffect(() => {
    if (!user) {
      setIsLoggedIn(false);
      setUserName(null);
      setToken(null);
      setFirstName(null);
      setLastName(null);
      setRole(null);
      return;
    }
    console.log('[AuthContext] user changed, fetching profile for', user.id);
    fetchProfile(user.id).then(profile => {
      setIsLoggedIn(true);
      setUserName(user.email ?? null);
      setToken(profile?.gas_token ?? null);
      setFirstName(profile?.first_name ?? null);
      setLastName(profile?.last_name ?? null);
      setRole(profile?.role ?? null);
      console.log('[AuthContext] profile applied, isLoggedIn = true');
      setIsInitializing(false); // Session was found — now safe to reveal UI
    });
  }, [user]);

  async function login(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    // State flows through: signInWithPassword → onAuthStateChange → setUser → fetchProfile effect
    return null;
  }

  function signOut() {
    supabase.auth.signOut();
    // State cleared by: onAuthStateChange SIGNED_OUT → setUser(null) → profile effect clears state
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, isInitializing, userName, token, firstName, lastName, role, login, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
