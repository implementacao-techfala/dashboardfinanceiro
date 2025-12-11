import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FilterProvider } from "./contexts/FilterContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import { DashboardLayout } from "./components/DashboardLayout";
import Overview from "./pages/Overview";
import Clients from "./pages/Clients";
import Sales from "./pages/Sales";
import Services from "./pages/Services";
import Marketing from "./pages/Marketing";
import Financial from "./pages/Financial";
import Cashflow from "./pages/Cashflow";
import HR from "./pages/HR";
import TVPresentation from "./pages/TVPresentation";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, page }: { children: React.ReactNode; page: string }) => {
  const { user, canAccess } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!canAccess(page)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 2100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/tv" element={
        <ProtectedRoute page="tv">
          <TVPresentation />
        </ProtectedRoute>
      } />
      <Route path="*" element={
        user ? (
          <DashboardLayout isInitialLoad={isInitialLoad}>
            <Routes>
              <Route path="/" element={<ProtectedRoute page="overview"><Overview /></ProtectedRoute>} />
              <Route path="/clients" element={<ProtectedRoute page="clients"><Clients /></ProtectedRoute>} />
              <Route path="/sales" element={<ProtectedRoute page="sales"><Sales /></ProtectedRoute>} />
              <Route path="/services" element={<ProtectedRoute page="services"><Services /></ProtectedRoute>} />
              <Route path="/marketing" element={<ProtectedRoute page="marketing"><Marketing /></ProtectedRoute>} />
              <Route path="/financial" element={<ProtectedRoute page="financial"><Financial /></ProtectedRoute>} />
              <Route path="/cashflow" element={<ProtectedRoute page="cashflow"><Cashflow /></ProtectedRoute>} />
              <Route path="/hr" element={<ProtectedRoute page="hr"><HR /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DashboardLayout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <DataProvider>
            <FilterProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </FilterProvider>
          </DataProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
