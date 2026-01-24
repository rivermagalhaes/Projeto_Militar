import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MfaProtectedRoute } from "@/components/MfaProtectedRoute";
import { Layout } from "@/components/Layout";


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

            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/alunos" element={<Alunos />} />
                <Route path="/alunos/:id" element={<AlunoDetalhe />} />
                <Route path="/aniversariantes" element={<Aniversariantes />} />
                <Route path="/agenda" element={<Agenda />} />
              </Routes>
            </Layout>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;