import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TodayDashboard from "./pages/TodayDashboard";
import LogFood from "./pages/LogFood";
import ConfirmEntry from "./pages/ConfirmEntry";
import FoodLibrary from "./pages/FoodLibrary";
import FoodEditor from "./pages/FoodEditor";
import SettingsPage from "./pages/SettingsPage";
import HistoryPage from "./pages/HistoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TodayDashboard />} />
          <Route path="/log" element={<LogFood />} />
          <Route path="/confirm" element={<ConfirmEntry />} />
          <Route path="/foods" element={<FoodLibrary />} />
          <Route path="/foods/new" element={<FoodEditor />} />
          <Route path="/foods/edit/:id" element={<FoodEditor />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
