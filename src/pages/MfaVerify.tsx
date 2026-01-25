import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import brasao from '@/assets/brasao-cmto.png';

export default function MfaVerify() {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { refreshMfaStatus } = useAuth();
    const navigate = useNavigate();

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.mfa.challengeAndVerify({
                code,
                factorId: (await supabase.auth.mfa.listFactors()).data?.totp?.[0].id || ''
            });

            if (error) {
                toast.error('Código inválido ou expirado.');
            } else {
                await refreshMfaStatus();
                toast.success('Verificação concluída!');
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error('Erro na verificação MFA.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <img src={brasao} alt="Brasão CMTO" className="h-20 w-auto mx-auto mb-4" />
                    <h1 className="text-2xl font-serif font-bold text-gold">Verificação de Segurança</h1>
                    <p className="text-secondary-foreground/60">Insira o código do seu autenticador</p>
                </div>

                <div className="card-military p-8 bg-card/95 backdrop-blur-md border-b-4 border-b-accent shadow-2xl">
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="space-y-2 text-center">
                            <label className="text-sm font-medium text-navy block">Código de 6 dígitos</label>
                            <Input
                                type="text"
                                placeholder="000000"
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                required
                                className="text-center text-3xl tracking-[0.5em] font-bold h-16 border-navy/10 focus:border-accent"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-navy hover:bg-navy-light text-white font-bold py-6 group"
                            disabled={isLoading || code.length < 6}
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Verificar Identidade <ShieldCheck size={18} />
                                </span>
                            )}
                        </Button>
                    </form>

                    <Button
                        variant="ghost"
                        onClick={() => navigate('/login')}
                        className="w-full mt-6 text-muted-foreground hover:text-navy"
                    >
                        <ArrowLeft className="mr-2" size={16} /> Voltar ao Login
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
