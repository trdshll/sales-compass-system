
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  LineChart,
  Settings,
  LogOut,
  Home,
  ShoppingCart,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DashboardSidebar = () => {
  const { logout, isAdmin } = useAuth();
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Sales', href: '/sales', icon: ShoppingCart },
    { name: 'Analytics', href: '/analytics', icon: LineChart },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Only show admin link if user is an admin
  if (isAdmin) {
    navigation.push({ name: 'Admin', href: '/admin', icon: Shield });
  }
  
  return (
    <div className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 shadow-sm">
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b dark:border-gray-700">
        <Link to="/dashboard" className="flex items-center">
          <span className="text-xl font-semibold dark:text-white">Sales Compass</span>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center px-4 py-2.5 text-sm font-medium rounded-md',
                isActive
                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              <item.icon className={cn('h-5 w-5 mr-3', isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500')} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      {/* Footer with logout */}
      <div className="p-4 border-t dark:border-gray-700">
        <button
          onClick={logout}
          className="flex w-full items-center px-4 py-2.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <LogOut className="h-5 w-5 mr-3 text-gray-400 dark:text-gray-500" />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default DashboardSidebar;
