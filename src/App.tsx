import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import TodayDashboard from "./pages/TodayDashboard";
import LogFood from "./pages/LogFood";
import ConfirmEntry from "./pages/ConfirmEntry";
import FoodLibrary from "./pages/FoodLibrary";
import FoodEditor from "./pages/FoodEditor";
import SettingsPage from "./pages/SettingsPage";
import MealTemplatesPage from "./pages/MealTemplatesPage";
import HistoryPage from "./pages/HistoryPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/" element={<ProtectedRoute><TodayDashboard /></ProtectedRoute>} />
      <Route path="/log" element={<ProtectedRoute><LogFood /></ProtectedRoute>} />
      <Route path="/confirm" element={<ProtectedRoute><ConfirmEntry /></ProtectedRoute>} />
      <Route path="/foods" element={<ProtectedRoute><FoodLibrary /></ProtectedRoute>} />
      <Route path="/foods/new" element={<ProtectedRoute><FoodEditor /></ProtectedRoute>} />
      <Route path="/foods/edit/:id" element={<ProtectedRoute><FoodEditor /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/settings/templates" element={<ProtectedRoute><MealTemplatesPage /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
