import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { ScreenProtectionOverlay, ScreenProtectionStyles, useScreenProtection } from "@/components/protection/ScreenProtection";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const Comparar = lazy(() => import("./pages/Comparar"));
const Analise = lazy(() => import("./pages/Analise"));
const MapaMental = lazy(() => import("./pages/MapaMental"));
const Precos = lazy(() => import("./pages/Precos"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="space-y-4 w-full max-w-md px-4">
      <Skeleton className="h-8 w-3/4 mx-auto" />
      <Skeleton className="h-4 w-1/2 mx-auto" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  </div>
);

const ProtectedApp = () => {
  useScreenProtection();
  
  return (
    <div className="protected-content">
      <ScreenProtectionStyles />
      <ScreenProtectionOverlay />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
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