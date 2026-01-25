import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import brasao from '@/assets/brasao-cmto.png';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await signIn(email, password);
            if (error) {
                toast.error('Erro ao entrar. Verifique suas credenciais.');
            } else {
                toast.success('Login realizado com sucesso!');
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error('Ocorreu um erro inesperado.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <motion.img
                        src={brasao}
                        alt="Brasão CMTO"
                        className="h-24 w-auto mx-auto mb-4 drop-shadow-xl"
                        whileHover={{ rotate: 5 }}
                    />
                    <h1 className="text-3xl font-serif font-bold text-gold">Acesso Restrito</h1>
                    <p className="text-secondary-foreground/60">Monitores e Administrativo</p>
                </div>

                <div className="card-military p-8 bg-card/95 backdrop-blur-md border-t-0 border-b-4 border-b-olive shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-navy flex items-center gap-2">
                                <Mail size={16} /> E-mail
                            </label>
                            <Input
                                type="email"
                                placeholder="exemplo@cmto.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-muted/50 border-olive/20 focus:border-olive focus:ring-olive"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-navy flex items-center gap-2">
                                <Lock size={16} /> Senha
                            </label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-muted/50 border-olive/20 focus:border-olive focus:ring-olive"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-olive hover:bg-olive-dark text-white font-bold py-6 group relative overflow-hidden"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Entrar no Sistema <Shield size={18} />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-olive/10">
                        <div className="bg-olive/5 rounded-lg p-4 border border-olive/10">
                            <h3 className="text-xs font-bold text-navy uppercase mb-2 flex items-center gap-2">
                                <Shield size={14} className="text-gold" /> Dica de Acesso ao Sistema
                            </h3>
                            <p className="text-xs text-secondary-foreground/70 leading-relaxed">
                                Para fins de teste e demonstração, você pode utilizar:
                                <br />
                                <span className="font-bold text-navy">E-mail:</span> qualquer-um@cmto.com
                                <br />
                                <span className="font-bold text-navy">Senha:</span> 123456
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="w-full mt-6 text-muted-foreground hover:text-navy"
                    >
                        <ArrowLeft className="mr-2" size={16} /> Voltar para o Início
                    </Button>
                </div>

                <p className="text-center mt-8 text-xs text-secondary-foreground/40 uppercase tracking-widest font-bold">
                    SISTEMA PROTEGIDO POR CRIPTOGRAFIA DE GRAU MILITAR
                </p>
            </motion.div>
        </div>
    );
}
