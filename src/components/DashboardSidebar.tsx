
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, ChevronLeft, Home, LogOut, PieChart, Settings, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Sales', href: '/sales', icon: BarChart3 },
  { name: 'Sales Analytics', href: '/analytics', icon: PieChart },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const DashboardSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  return (
    <div className="h-screen w-64 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-lg">
      <div className="p-6 flex items-center justify-between bg-sidebar-accent rounded-br-lg">
        <h1 className="text-xl font-bold text-sidebar-foreground flex items-center gap-2">
          <span className="bg-primary rounded-full p-1 flex items-center justify-center">
            <BarChart3 size={18} className="text-primary-foreground" />
          </span>
          Sales Compass
        </h1>
        <Link to="/" className="text-sidebar-foreground hover:text-sidebar-foreground/80 transition-colors">
          <ChevronLeft size={20} />
        </Link>
      </div>
      
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 px-3 py-3 rounded-md bg-sidebar-accent/50 backdrop-blur-sm">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white">
            <User size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-sidebar-foreground/70 truncate">{user?.email || 'email@example.com'}</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:translate-x-1"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}

        {/* Admin link - always visible for this user as requested */}
        <Link
          to="/admin"
          className={cn(
            "flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all",
            location.pathname === '/admin'
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
              : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:translate-x-1"
          )}
        >
          <Shield className="mr-3 h-5 w-5" />
          Admin
        </Link>
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
};

export default DashboardSidebar;
