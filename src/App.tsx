import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";

// Custom pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import PortalPais from "./pages/PortalPais";
import Dashboard from "./pages/Dashboard";
import Alunos from "./pages/Alunos";
import AlunoDetalhe from "./pages/AlunoDetalhe";
import Aniversariantes from "./pages/Aniversariantes";
import Agenda from "./pages/Agenda";
import Turmas from "./pages/Turmas";
import TurmaDetalhe from "./pages/TurmaDetalhe";
import Monitores from "./pages/Monitores";
import Relatorios from "./pages/Relatorios";
import Manual from "./pages/Manual";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import Settings from "./pages/Settings";
import SecurityAudit from "./pages/SecurityAudit";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />

            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/pais" element={<PortalPais />} />
              <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />

              {/* Private Routes with Layout and Protection */}
              <Route element={
                <ProtectedRoute>
                  <Layout>
                    <Outlet />
                  </Layout>
                </ProtectedRoute>
              }>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/alunos" element={<Alunos />} />
                <Route path="/alunos/:id" element={<AlunoDetalhe />} />
                <Route path="/aniversariantes" element={<Aniversariantes />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/turmas" element={<Turmas />} />
                <Route path="/turmas/:id" element={<TurmaDetalhe />} />
                <Route path="/manual" element={<Manual />} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/settings" element={<Settings />} />

                {/* Admin Only */}
                <Route path="/monitores" element={<Monitores />} />
                <Route path="/security-audit" element={<ProtectedRoute requireAdmin><SecurityAudit /></ProtectedRoute>} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;