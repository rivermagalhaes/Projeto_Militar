import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface MfaProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function MfaProtectedRoute({ children, requireAdmin = false }: MfaProtectedRouteProps) {
  const { user, loading, isAdmin, needsMfaVerification } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hero-gradient">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gold mx-auto mb-4" />
          <p className="text-secondary-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se o usuário tem MFA habilitado mas não verificou nesta sessão
  if (needsMfaVerification) {
    return <Navigate to="/mfa-verify" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
