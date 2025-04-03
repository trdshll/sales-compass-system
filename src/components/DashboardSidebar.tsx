
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Home, ListOrdered, LogOut, PieChart, Settings, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Sales', href: '/sales', icon: BarChart3 },
  { name: 'Sales Analytics', href: '/analytics', icon: PieChart },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Products', href: '/products', icon: ListOrdered },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const DashboardSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  return (
    <div className="h-screen w-64 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-6">
        <h1 className="text-xl font-bold text-sidebar-foreground">
          Sales Compass
        </h1>
      </div>
      
      <div className="px-4 py-2">
        <div className="flex items-center gap-3 px-2 py-3 rounded-md bg-sidebar-accent">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white">
            <User size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/70 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-md",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center text-sidebar-foreground"
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
