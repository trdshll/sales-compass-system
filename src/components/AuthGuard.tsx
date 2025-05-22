
import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

const AuthGuard = ({ 
  children, 
  requireAuth = true,
  requireAdmin = false
}: AuthGuardProps) => {
  const { isAuthenticated, user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (requireAdmin && isAuthenticated && user) {
        try {
          setCheckingAdmin(true);
          // Use the is_admin function with proper error handling
          const { data, error } = await supabase.rpc('is_admin', {
            user_id: user.id
          });
          
          if (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to verify admin privileges."
            });
            navigate('/dashboard');
            return;
          }
          
          console.log('Admin status check result:', data);
          setIsAdmin(!!data);
          
          if (!data) {
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: "You don't have permission to access this page."
            });
            navigate('/dashboard');
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          navigate('/dashboard');
        } finally {
          setCheckingAdmin(false);
        }
      }
    };

    if (!loading) {
      if (requireAuth && !isAuthenticated) {
        // User is not authenticated but the route requires authentication
        navigate('/login', { state: { from: location.pathname } });
      } else if (!requireAuth && isAuthenticated) {
        // User is authenticated but the route is for non-authenticated users only (like login page)
        navigate('/dashboard');
      } else if (requireAdmin) {
        // Check admin status for routes that require admin privileges
        checkAdminStatus();
      }
    }
  }, [isAuthenticated, loading, navigate, location, requireAuth, requireAdmin, user, toast]);

  // Show loading spinner while checking authentication or admin status
  if (loading || (requireAdmin && isAuthenticated && checkingAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If requireAdmin is true, only render children if user is admin
  if (requireAdmin && !isAdmin) {
    return null; // Don't render anything while redirecting
  }

  // In all other cases, render the children
  return <>{children}</>;
};

export default AuthGuard;
