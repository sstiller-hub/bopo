import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/useAuth";
import TodayDashboard from "./pages/TodayDashboard";
import LogFood from "./pages/LogFood";
import LogWeight from "./pages/LogWeight";
import ConfirmEntry from "./pages/ConfirmEntry";
import FoodLibrary from "./pages/FoodLibrary";
import FoodEditor from "./pages/FoodEditor";
import SettingsPage from "./pages/SettingsPage";
import MealTemplatesPage from "./pages/MealTemplatesPage";
import HistoryPage from "./pages/HistoryPage";
import NotFound from "./pages/NotFound";
import { setSupabaseAccessTokenGetter } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (!loading && !user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function SupabaseTokenBridge() {
  const { getToken, loading, user } = useAuth();

  React.useEffect(() => {
    if (loading || !user) {
      setSupabaseAccessTokenGetter(null);
      return;
    }

    setSupabaseAccessTokenGetter(async () => {
      return await getToken({ template: "supabase" });
    });

    return () => setSupabaseAccessTokenGetter(null);
  }, [getToken, loading, user]);

  return null;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  
  return (
    <Routes>
      <Route path="/auth" element={<Navigate to="/sign-in" replace />} />
      <Route path="/sign-in/*" element={user ? <Navigate to="/" replace /> : <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />} />
      <Route path="/sign-up/*" element={user ? <Navigate to="/" replace /> : <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />} />
      <Route path="/" element={<ProtectedRoute><TodayDashboard /></ProtectedRoute>} />
      <Route path="/log" element={<ProtectedRoute><LogFood /></ProtectedRoute>} />
      <Route path="/log-weight" element={<ProtectedRoute><LogWeight /></ProtectedRoute>} />
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
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <SupabaseTokenBridge />
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
