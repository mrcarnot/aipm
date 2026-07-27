import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = still checking, null = signed out, object = signed in
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signInWithEmail(email) {
    return supabase.auth.signInWithOtp({ email });
  }

  async function signOut() {
    return supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
