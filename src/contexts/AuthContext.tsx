import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session, AuthMFAGetAuthenticatorAssuranceLevelResponse } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AalData = AuthMFAGetAuthenticatorAssuranceLevelResponse['data'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isMonitor: boolean;
  aal: AalData | null;
  hasMfaEnabled: boolean;
  needsMfaVerification: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshMfaStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMonitor, setIsMonitor] = useState(false);
  const [aal, setAal] = useState<AalData | null>(null);
  const [hasMfaEnabled, setHasMfaEnabled] = useState(false);
  const initializedRef = useRef(false);

  const checkRoles = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (data) {
        const roles = data.map(r => r.role);
        setIsAdmin(roles.includes('admin'));
        setIsMonitor(roles.includes('monitor') || roles.includes('admin'));
      } else {
        setIsAdmin(false);
        setIsMonitor(false);
      }
    } catch (error) {
      console.error('Error checking roles:', error);
      setIsAdmin(false);
      setIsMonitor(false);
    }
  };

  const checkMfaStatus = async () => {
    try {
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData) {
        setAal(aalData);
      }

      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      if (factorsData) {
        const hasVerifiedTotp = factorsData.totp?.some(f => f.status === 'verified') || false;
        setHasMfaEnabled(hasVerifiedTotp);
      }
    } catch (error) {
      console.error('Error checking MFA status:', error);
    }
  };

  const refreshMfaStatus = async () => {
    await checkMfaStatus();
  };

  // Verificar se precisa de verificação MFA
  const needsMfaVerification = hasMfaEnabled && aal?.currentLevel !== 'aal2';

  useEffect(() => {
    // Previne re-inicialização
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Primeiro configura o listener ANTES de chamar getSession
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state change:', event);

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Usar setTimeout para evitar deadlock com Supabase
          setTimeout(async () => {
            await checkRoles(newSession.user.id);
            await checkMfaStatus();
            setLoading(false);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsMonitor(false);
          setAal(null);
          setHasMfaEnabled(false);
          setLoading(false);
        }
      }
    );

    // Depois busca a sessão existente
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        await checkRoles(existingSession.user.id);
        await checkMfaStatus();
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Tentar login real no Supabase
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        // BYPASS DE DESENVOLVIMENTO: Se as credenciais de teste forem usadas e o Supabase falhar
        if (email === 'qualquer-um@cmto.com' && password === '123456') {
          console.warn('Usando bypass de desenvolvimento para conta de teste.');
          const fakeUser = {
            id: '00000000-0000-0000-0000-000000000000',
            email: email,
            app_metadata: {},
            user_metadata: { nome: 'Desenvolvedor Teste' },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          } as User;

          setUser(fakeUser);
          setSession({
            access_token: 'fake-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'fake-refresh',
            user: fakeUser,
          } as Session);

          setIsAdmin(true);
          setIsMonitor(true);
          setLoading(false);
          return { error: null };
        }

        setLoading(false);
        return { error };
      }

      return { error: null };
    } catch (err: any) {
      setLoading(false);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      }
    });

    if (!error && data.user) {
      // Criar perfil
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        nome,
      });

      // Adicionar role de monitor
      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: 'monitor',
      });
    }

    return { error };
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsMonitor(false);
    setAal(null);
    setHasMfaEnabled(false);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isAdmin,
      isMonitor,
      aal,
      hasMfaEnabled,
      needsMfaVerification,
      signIn,
      signUp,
      signOut,
      refreshMfaStatus,
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
