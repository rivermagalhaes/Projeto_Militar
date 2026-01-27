import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Shield, LogOut, Bell, Lock, Loader2, Key, CheckCircle2, ShieldAlert, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";

export default function Settings() {
    const { user, isAdmin, isMonitor, signOut, hasMfaEnabled, refreshMfaStatus } = useAuth();
    const [loading, setLoading] = useState(false);

    // Password State
    const [passwordModal, setPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // MFA State
    const [mfaModal, setMfaModal] = useState(false);
    const [mfaData, setMfaData] = useState<{ id: string; qr_code: string } | null>(null);
    const [mfaCode, setMfaCode] = useState('');
    const [mfaStep, setMfaStep] = useState<'info' | 'qr' | 'verify'>('info');

    // Notifications State
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    useEffect(() => {
        fetchPreferences();
    }, [user]);

    const fetchPreferences = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('profiles')
            .select('preferencias_notificacao')
            .eq('id', user.id)
            .single();

        if (data?.preferencias_notificacao) {
            setNotificationsEnabled((data.preferencias_notificacao as any).email);
        }
    };

    const handleUpdatePassword = async () => {
        if (newPassword !== confirmPassword) {
            toast.error('As senhas não coincidem!');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast.success('Senha atualizada com sucesso!');
            setPasswordModal(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error('Erro ao atualizar senha: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEnrollMfa = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
            if (error) throw error;
            setMfaData({ id: data.id, qr_code: data.totp.qr_code });
            setMfaStep('qr');
        } catch (error: any) {
            toast.error('Erro ao iniciar MFA: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyMfa = async () => {
        if (mfaCode.length !== 6) return;
        setLoading(true);
        try {
            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                factorId: mfaData!.id
            });
            if (challengeError) throw challengeError;

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId: mfaData!.id,
                challengeId: challengeData.id,
                code: mfaCode
            });
            if (verifyError) throw verifyError;

            toast.success('MFA configurado com sucesso!');
            await refreshMfaStatus();
            setMfaModal(false);
            setMfaStep('info');
        } catch (error: any) {
            toast.error('Código inválido: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUnenrollMfa = async () => {
        setLoading(true);
        try {
            const { data: factors } = await supabase.auth.mfa.listFactors();
            const factor = factors?.totp?.find(f => f.status === 'verified');
            if (factor) {
                const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
                if (error) throw error;
                toast.success('MFA desativado.');
                await refreshMfaStatus();
            }
        } catch (error: any) {
            toast.error('Erro ao desativar MFA: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleNotifications = async (val: boolean) => {
        setNotificationsEnabled(val);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ preferencias_notificacao: { email: val, dashboard: true } })
                .eq('id', user?.id);
            if (error) throw error;
        } catch (error) {
            toast.error('Erro ao salvar preferência');
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-0">
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
                        variant="ghost"
                        onClick={() => signOut()}
                        className="mt-8 w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                        <LogOut size={16} className="mr-2" /> Encerrar Sessão
                    </Button>
                </motion.div>

                {/* Settings Sections */}
                <div className="md:col-span-2 space-y-6">
                    {/* Security Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card-military p-6"
                    >
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-navy">
                            <Lock size={18} className="text-accent" /> Segurança da Conta
                        </h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center py-2">
                                <div>
                                    <p className="font-medium text-navy">Alterar Senha</p>
                                    <p className="text-xs text-muted-foreground">Atualize sua senha de acesso periodicamente.</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setPasswordModal(true)}>
                                    Configurar
                                </Button>
                            </div>

                            <div className="flex justify-between items-center py-2 border-t border-border pt-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-navy">Duplo Fator (MFA)</p>
                                        {hasMfaEnabled && (
                                            <span className="flex items-center text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                <CheckCircle2 size={10} className="mr-1" /> Ativo
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Adicione uma camada extra de segurança.</p>
                                </div>
                                <Button
                                    variant={hasMfaEnabled ? "ghost" : "outline"}
                                    size="sm"
                                    className={hasMfaEnabled ? "text-red-500 hover:bg-red-50" : ""}
                                    onClick={() => hasMfaEnabled ? handleUnenrollMfa() : setMfaModal(true)}
                                >
                                    {hasMfaEnabled ? "Desativar" : "Ativar"}
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Notifications Section */}
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
                                    <p className="font-medium text-navy">Alertas por E-mail</p>
                                    <p className="text-xs text-muted-foreground">Receba avisos de novos registros importantes.</p>
                                </div>
                                <Switch
                                    checked={notificationsEnabled}
                                    onCheckedChange={toggleNotifications}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Change Password Modal */}
            <Dialog open={passwordModal} onOpenChange={setPasswordModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-navy">
                            <Key className="text-accent" /> Alterar Senha
                        </DialogTitle>
                        <DialogDescription>
                            Sua nova senha deve ter pelo menos 6 caracteres.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nova Senha</Label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirmar Senha</Label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setPasswordModal(false)}>Cancelar</Button>
                        <Button onClick={handleUpdatePassword} disabled={loading}>
                            {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : "Atualizar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* MFA Modal */}
            <Dialog open={mfaModal} onOpenChange={setMfaModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-navy">
                            <ShieldAlert className="text-accent" /> Configurar MFA
                        </DialogTitle>
                    </DialogHeader>

                    {mfaStep === 'info' && (
                        <div className="space-y-4 py-4 text-center">
                            <div className="bg-accent/10 p-4 rounded-xl inline-block mx-auto mb-2">
                                <QrCode size={48} className="text-accent" />
                            </div>
                            <p className="text-sm text-navy">
                                Use o Google Authenticator ou similar para proteger sua conta.
                            </p>
                            <Button className="w-full" onClick={handleEnrollMfa}>
                                Começar Configuração
                            </Button>
                        </div>
                    )}

                    {mfaStep === 'qr' && mfaData && (
                        <div className="space-y-4 py-4 flex flex-col items-center">
                            <div
                                className="p-4 bg-white rounded-xl border-2 border-accent"
                                dangerouslySetInnerHTML={{ __html: mfaData.qr_code }}
                            />
                            <p className="text-xs text-center text-muted-foreground px-4">
                                Escaneie o código acima com seu aplicativo de autenticação.
                            </p>
                            <Button className="w-full" onClick={() => setMfaStep('verify')}>
                                Já escaneei, prosseguir
                            </Button>
                        </div>
                    )}

                    {mfaStep === 'verify' && (
                        <div className="space-y-6 py-4 flex flex-col items-center">
                            <p className="text-sm font-medium text-navy text-center">
                                Digite o código de 6 dígitos gerado no aplicativo:
                            </p>
                            <InputOTP
                                maxLength={6}
                                value={mfaCode}
                                onChange={setMfaCode}
                                onComplete={handleVerifyMfa}
                            >
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>
                            <div className="flex gap-2 w-full">
                                <Button variant="ghost" className="flex-1" onClick={() => setMfaStep('qr')}>Voltar</Button>
                                <Button className="flex-1" onClick={handleVerifyMfa} disabled={loading || mfaCode.length !== 6}>
                                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Verificar e Ativar"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
