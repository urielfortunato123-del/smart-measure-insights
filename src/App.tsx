import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { ScreenProtectionOverlay, ScreenProtectionStyles, useScreenProtection } from "@/components/protection/ScreenProtection";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Comparar from "./pages/Comparar";
import Analise from "./pages/Analise";
import MapaMental from "./pages/MapaMental";
import Precos from "./pages/Precos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedApp = () => {
  useScreenProtection();
  
  return (
    <div className="protected-content">
      <ScreenProtectionStyles />
      <ScreenProtectionOverlay />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/comparar" element={<Comparar />} />
          <Route path="/analise" element={<Analise />} />
          <Route path="/mapa-mental" element={<MapaMental />} />
          <Route path="/precos" element={<Precos />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LayoutProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ProtectedApp />
        </TooltipProvider>
      </LayoutProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
