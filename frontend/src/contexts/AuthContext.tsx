import { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface AuthState {
  isLoggedIn: boolean;
  userName: string | null;
  token: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<string | null>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  async function login(email: string, password: string): Promise<string | null> {
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) return authError.message;

    const { data: profile } = await supabase
      .from('profiles')
      .select('gas_token, first_name, last_name, role')
      .single();

    setUserName(data.user.email ?? null);
    setToken(profile?.gas_token ?? null);
    setFirstName(profile?.first_name ?? null);
    setLastName(profile?.last_name ?? null);
    setRole(profile?.role ?? null);
    setIsLoggedIn(true);
    return null;
  }

  function signOut() {
    supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserName(null);
    setToken(null);
    setFirstName(null);
    setLastName(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, userName, token, firstName, lastName, role, login, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
