import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Calendar,
  Cake,
  Shield,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  FileSearch,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import brasao from '@/assets/brasao-cmto.png';

const navItems = [
  { path: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { path: '/alunos', label: 'Alunos', icon: Users },
  { path: '/turmas', label: 'Turmas', icon: BookOpen },
  { path: '/relatorios', label: 'Relatórios', icon: FileText },
  { path: '/manual', label: 'Manual do Aluno', icon: FileSearch },
  { path: '/agenda', label: 'Agenda', icon: Calendar },
  { path: '/aniversariantes', label: 'Aniversariantes', icon: Cake },
  { path: '/settings', label: 'Configurações', icon: Settings },
];

// Items only visible to admins
const adminOnlyItems = [
  { path: '/monitores?tab=monitores', label: 'Administração', icon: Shield },
  { path: '/security-audit', label: 'Segurança', icon: ShieldCheck },
];

export function Navbar() {
  const { isAdmin, isMonitor, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Admins see all items including "Monitores"
  // Monitors just see nav items
  const allItems = isAdmin
    ? [...navItems, ...adminOnlyItems]
    : navItems;

  return (
    <nav className="navbar-military">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo with Tooltip */}
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0 group relative">
            <motion.img
              src={brasao}
              alt="Brasão CMTO"
              className="h-9 sm:h-11 w-auto"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
            <span className="hidden sm:block text-base font-serif font-bold text-[#D4AF37]">
              CMTO-V
            </span>
            {/* Tooltip */}
            <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-50">
              <div className="bg-card border border-accent shadow-lg rounded-md px-3 py-2 text-xs text-foreground whitespace-nowrap">
                <p className="font-semibold text-accent">CMTO-V Diaconízio Bezerra da Silva</p>
                <p className="text-muted-foreground">Paraíso do Tocantins - TO</p>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center gap-0.5">
            {allItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link key={item.path} to={item.path}>
                  <motion.div
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${isActive
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                      : 'text-gray-200 hover:bg-white/10 hover:text-[#D4AF37]'
                      }`}
                    whileHover={{ scale: 1.02, boxShadow: '0 0 10px rgba(212, 175, 55, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="ml-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs px-2.5 py-1.5 h-auto"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Sair
            </Button>
          </div>

          {/* Tablet Navigation (smaller screens) */}
          <div className="hidden lg:flex xl:hidden items-center gap-0.5">
            {allItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link key={item.path} to={item.path} title={item.label}>
                  <motion.div
                    className={`flex items-center justify-center p-2 rounded-md transition-all duration-200 ${isActive
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                      : 'text-gray-200 hover:bg-white/10 hover:text-[#D4AF37]'
                      }`}
                    whileHover={{ scale: 1.1, boxShadow: '0 0 10px rgba(212, 175, 55, 0.3)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="h-4 w-4" />
                  </motion.div>
                </Link>
              );
            })}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="ml-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="lg:hidden text-gray-200 hover:text-[#D4AF37] p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileTap={{ scale: 0.95 }}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden py-2 border-t border-white/10 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto px-1">
                {allItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div
                          className={`flex items-center gap-2 px-3 py-3 rounded-md text-sm font-medium transition-all ${isActive
                            ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                            : 'text-gray-200 hover:bg-white/10 hover:text-[#D4AF37]'
                            }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              <div className="px-1 py-1">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full px-3 py-4 mt-2 rounded-md text-sm font-bold text-red-500 hover:bg-red-500/10 border-t border-white/5 bg-red-500/5 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair do Sistema</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav >
  );
}