
import { ReactNode } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
