
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signup: (name: string, email: string, password: string, role?: string) => Promise<void>;
  login: (email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        if (session?.user) {
          const { id, email } = session.user;
          const name = session.user.user_metadata?.name || email?.split('@')[0] || 'User';
          
          setUser({
            id,
            email: email || '',
            name,
          });
        } else {
          setUser(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session);
      setSession(session);
      if (session?.user) {
        const { id, email } = session.user;
        const name = session.user.user_metadata?.name || email?.split('@')[0] || 'User';
        
        setUser({
          id,
          email: email || '',
          name,
        });
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signup = async (name: string, email: string, password: string, role: string = 'user') => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role }
        }
      });
      
      if (error) throw error;
      
      // If role is admin, add to user_roles table with explicit insert permission
      if (role === 'admin' && data.user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: data.user.id, 
            role: 'admin' 
          });
        
        if (roleError) {
          console.error('Error setting admin role:', roleError);
          // Even if role setting fails, allow signup to continue
          // This prevents blocking the signup flow
        }
      }
      
      toast({
        title: "Account created successfully",
        description: "You can now log in with your credentials.",
      });
      
      navigate('/login');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating account",
        description: error.message || "There was a problem creating your account.",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, role: string = 'user') => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // If user selected admin role, check if they're actually an admin
      if (role === 'admin') {
        const { data: isAdminData, error: adminCheckError } = await supabase.rpc('is_admin', {
          user_id: data.user.id
        });
        
        if (adminCheckError) {
          console.error('Admin check error:', adminCheckError);
          throw new Error('Error checking admin privileges. Please try again.');
        }
        
        console.log('Is admin check result:', isAdminData);
        
        if (!isAdminData) {
          // Force logout if user tries to login as admin but doesn't have admin privileges
          await supabase.auth.signOut();
          throw new Error('You do not have admin privileges.');
        }
      }
      
      toast({
        title: "Login successful",
        description: `Welcome back${data.user?.user_metadata?.name ? ', ' + data.user.user_metadata.name : ''}!`,
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid email or password. Please try again.",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      
      navigate('/login');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message || "There was a problem signing out.",
      });
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
