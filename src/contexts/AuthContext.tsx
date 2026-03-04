import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isPlatformAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isPlatformAdmin: false,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminChecked, setAdminChecked] = useState(false);

  // Auth listener — keep synchronous, no async work
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session?.user) {
          setIsPlatformAdmin(false);
          setAdminChecked(true);
        } else {
          setAdminChecked(false); // will be resolved by the effect below
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        setIsPlatformAdmin(false);
        setAdminChecked(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Separate effect: check platform admin role once user is known
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase.rpc("has_role", { _user_id: user.id, _role: "platform_admin" as any })
      .then(({ data }) => {
        if (!cancelled) {
          setIsPlatformAdmin(!!data);
          setAdminChecked(true);
        }
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Only mark fully loaded once auth + admin check are both done
  useEffect(() => {
    if (adminChecked) setLoading(false);
  }, [adminChecked]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, isPlatformAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
