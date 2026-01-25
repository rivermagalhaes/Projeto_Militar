import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Shield, LogOut, Bell, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function Settings() {
    const { user, isAdmin, isMonitor, signOut } = useAuth();

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-accent" />
                <h1 className="text-3xl font-bold text-navy">Configurações</h1>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="card-military p-6 md:col-span-1 flex flex-col items-center text-center"
                >
                    <div className="w-24 h-24 rounded-full bg-navy/10 flex items-center justify-center mb-4 border-2 border-accent">
                        <User size={48} className="text-navy" />
                    </div>
                    <h2 className="font-bold text-xl text-navy">{user?.email?.split('@')[0]}</h2>
                    <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1 justify-center">
                        <Mail size={12} /> {user?.email}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {isAdmin && <span className="badge-gold">Administrador</span>}
                        {isMonitor && <span className="badge-military">Monitor</span>}
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => signOut()}
                        className="mt-8 w-full text-red-500 hover:text-red-600 border-red-200"
                    >
                        <LogOut size={16} className="mr-2" /> Encerrar Sessão
                    </Button>
                </motion.div>

                {/* Settings Sections */}
                <div className="md:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card-military p-6"
                    >
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-navy">
                            <Lock size={18} className="text-accent" /> Segurança
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2">
                                <div>
                                    <p className="font-medium">Alterar Senha</p>
                                    <p className="text-xs text-muted-foreground">Atualize sua senha de acesso periodicamente.</p>
                                </div>
                                <Button variant="outline" size="sm">Configurar</Button>
                            </div>
                            <div className="flex justify-between items-center py-2 border-t border-border">
                                <div>
                                    <p className="font-medium">Autenticação de Dois Fatores</p>
                                    <p className="text-xs text-muted-foreground">Adicione uma camada extra de segurança.</p>
                                </div>
                                <Button variant="outline" size="sm">Ativar</Button>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card-military p-6"
                    >
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-navy">
                            <Bell size={18} className="text-accent" /> Notificações
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2">
                                <div>
                                    <p className="font-medium">Alertas por E-mail</p>
                                    <p className="text-xs text-muted-foreground">Receba avisos de novos registros disciplinares.</p>
                                </div>
                                <div className="h-6 w-10 bg-accent rounded-full relative">
                                    <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
