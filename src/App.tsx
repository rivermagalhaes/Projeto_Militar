import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MfaProtectedRoute } from "@/components/MfaProtectedRoute";
import { SupabaseTest } from "@/components/SupabaseTest";

// Existing pages
import Dashboard from "./pages/Dashboard";
import Alunos from "./pages/Alunos";
import AlunoDetalhe from "./pages/AlunoDetalhe";
import Aniversariantes from "./pages/Aniversariantes";
import Agenda from "./pages/Agenda";

// Missing pages removed to allow build

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <SupabaseTest />
            <Routes>
              {/* Redirect root to dashboard or just show Test component */}
              <Route path="/" element={<div className="p-4">Select a route</div>} />

              <Route path="/dashboard" element={<MfaProtectedRoute><Dashboard /></MfaProtectedRoute>} />
              <Route path="/alunos" element={<MfaProtectedRoute><Alunos /></MfaProtectedRoute>} />
              <Route path="/alunos/:id" element={<MfaProtectedRoute><AlunoDetalhe /></MfaProtectedRoute>} />
              <Route path="/aniversariantes" element={<MfaProtectedRoute><Aniversariantes /></MfaProtectedRoute>} />
              <Route path="/agenda" element={<MfaProtectedRoute><Agenda /></MfaProtectedRoute>} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;