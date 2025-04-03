
import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
}

const AuthGuard = ({ children, requireAuth = true }: AuthGuardProps) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !isAuthenticated) {
        // User is not authenticated but the route requires authentication
        navigate('/login', { state: { from: location.pathname } });
      } else if (!requireAuth && isAuthenticated) {
        // User is authenticated but the route is for non-authenticated users only (like login page)
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, loading, navigate, location, requireAuth]);

  // Show nothing while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If requireAuth is true and user is not authenticated, or
  // if requireAuth is false and user is authenticated,
  // the useEffect above will handle the redirect, so we don't need to return anything here.
  
  // In all other cases, render the children
  return <>{children}</>;
};

export default AuthGuard;
