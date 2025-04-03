
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in on initial load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signup = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      
      // Simulate API request with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save the user to localStorage (this is just for demo purposes)
      // In a real app, this would involve a backend API call
      const newUser = { 
        id: Date.now().toString(), 
        name, 
        email 
      };
      
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      
      toast({
        title: "Account created successfully",
        description: "You can now log in with your credentials.",
      });
      
      navigate('/login');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating account",
        description: "There was a problem creating your account.",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Simulate API request with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll just check localStorage
      // In a real app, this would be a backend API call
      const storedUser = localStorage.getItem('user');
      
      if (storedUser) {
        const user = JSON.parse(storedUser);
        
        // In this simplified demo, we're only checking the email
        // In a real app, you'd verify the password hash on the server
        if (user.email === email) {
          setUser(user);
          localStorage.setItem('user', JSON.stringify(user));
          
          toast({
            title: "Login successful",
            description: `Welcome back, ${user.name}!`,
          });
          
          navigate('/dashboard');
          return;
        }
      }
      
      throw new Error('Invalid credentials');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Invalid email or password. Please try again.",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    navigate('/login');
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
