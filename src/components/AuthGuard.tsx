
import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  adminOnly?: boolean;
}

const AuthGuard = ({ children, requireAuth = true, adminOnly = false }: AuthGuardProps) => {
  const { isAuthenticated, loading, isAdmin, checkAdminStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // If we need admin privileges, check admin status
    if (requireAuth && adminOnly) {
      checkAdminStatus();
    }
  }, [adminOnly, checkAdminStatus, requireAuth]);

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !isAuthenticated) {
        // User is not authenticated but the route requires authentication
        navigate('/login', { state: { from: location.pathname } });
      } else if (requireAuth && adminOnly && !isAdmin) {
        // User is authenticated but not an admin, and the route requires admin privileges
        toast({
          variant: "destructive",
          title: "Access denied",
          description: "You don't have permission to access this page."
        });
        
        navigate('/dashboard', { 
          state: { 
            accessDenied: true, 
            message: "You don't have permission to access this page." 
          } 
        });
      } else if (!requireAuth && isAuthenticated) {
        // User is authenticated but the route is for non-authenticated users only (like login page)
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, isAdmin, loading, navigate, location, requireAuth, adminOnly, toast]);

  // Show nothing while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // In all other cases, render the children
  return <>{children}</>;
};

export default AuthGuard;
