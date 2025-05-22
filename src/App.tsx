
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SalesPage from "./pages/SalesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";

// Create a new QueryClient instance outside of the component
// This ensures it's not recreated on each render
const queryClient = new QueryClient();

const App = () => (
  // BrowserRouter must be the outermost wrapper
  <BrowserRouter>
    {/* QueryClientProvider goes inside BrowserRouter */}
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <Routes>
            <Route 
              path="/" 
              element={
                <AuthGuard requireAuth={false}>
                  <Index />
                </AuthGuard>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <AuthGuard requireAuth={false}>
                  <SignupPage />
                </AuthGuard>
              } 
            />
            <Route 
              path="/login" 
              element={
                <AuthGuard requireAuth={false}>
                  <LoginPage />
                </AuthGuard>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <AuthGuard>
                  <DashboardPage />
                </AuthGuard>
              } 
            />
            <Route 
              path="/sales" 
              element={
                <AuthGuard>
                  <SalesPage />
                </AuthGuard>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <AuthGuard>
                  <AnalyticsPage />
                </AuthGuard>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <AuthGuard>
                  <SettingsPage />
                </AuthGuard>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <AuthGuard requireAuth={true} requireAdmin={true}>
                  <AdminPage />
                </AuthGuard>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
