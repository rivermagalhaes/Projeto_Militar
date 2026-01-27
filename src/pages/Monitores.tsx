import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Shield, Plus, Loader2, Trash2, Mail, User, AlertTriangle, Search, RefreshCw, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Monitor {
    id: string;
    email: string;
    nome: string;
    created_at: string;
}

export default function Monitores() {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const [monitores, setMonitores] = useState<Monitor[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [monitorToDelete, setMonitorToDelete] = useState<Monitor | null>(null);

    // Form state
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Access control
    useEffect(() => {
        if (!isAdmin) {
            navigate('/dashboard');
            toast.error('Acesso não autorizado.');
        }
    }, [isAdmin, navigate]);

    useEffect(() => {
        if (isAdmin) {
            fetchMonitores();
        }
    }, [isAdmin]);

    const fetchMonitores = async () => {
        try {
            setLoading(true);
            const { data: rolesData, error: rolesError } = await supabase
                .from('user_roles')
                .select('user_id')
                .eq('role', 'monitor');

            if (rolesError) throw rolesError;

            const userIds = rolesData.map((r) => r.user_id);

            if (userIds.length > 0) {
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('id', userIds)
                    .order('nome');

                if (profilesError) throw profilesError;
                setMonitores(profilesData || []);
            } else {
                setMonitores([]);
            }
        } catch (error: any) {
            console.error('Erro ao buscar monitores:', error);
            toast.error('Erro ao carregar lista de monitores.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMonitor = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setCreating(true);

        try {
            const { data, error } = await supabase.functions.invoke('create-monitor', {
                body: {
                    username: username.trim().toLowerCase(),
                    full_name: fullName.trim(),
                    password: password,
                },
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            toast.success('Monitor criado com sucesso!');
            setModalOpen(false);
            resetForm();
            fetchMonitores();
        } catch (error: any) {
            console.error('Erro ao criar monitor:', error);
            toast.error(error.message || 'Erro ao criar monitor.');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteClick = (monitor: Monitor) => {
        setMonitorToDelete(monitor);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!monitorToDelete) return;

        try {
            setDeletingId(monitorToDelete.id);
            setDeleteConfirmOpen(false);

            const { error: roleError } = await supabase
                .from('user_roles')
                .delete()
                .eq('user_id', monitorToDelete.id)
                .eq('role', 'monitor');

            if (roleError) throw roleError;

            toast.success(`Permissão de monitor removida para ${monitorToDelete.nome}.`);
            fetchMonitores();
        } catch (error: any) {
            console.error('Erro ao remover monitor:', error);
            toast.error('Erro ao remover permissão.');
        } finally {
            setDeletingId(null);
            setMonitorToDelete(null);
        }
    };

    const resetForm = () => {
        setFullName('');
        setUsername('');
        setPassword('');
    };

    const filteredMonitores = monitores.filter(m =>
        m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isAdmin) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl md:text-4xl font-serif font-bold text-navy flex items-center gap-2 md:gap-3">
                        <div className="p-1.5 md:p-2 bg-navy/5 rounded-xl">
                            <Shield className="h-7 w-7 md:h-10 md:h-10 text-gold" />
                        </div>
                        Gestão de Monitores
                    </h1>
                    <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-lg">
                        Adicione e gerencie os acessos administrativos dos monitores.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchMonitores}
                        disabled={loading}
                        className="rounded-xl border-navy/20 hover:bg-navy/5"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button className="btn-military h-10 md:h-12 px-4 md:px-6 rounded-xl flex items-center gap-2 text-sm md:text-base">
                                <Plus className="h-4 w-4 md:h-5 md:h-5" />
                                <span className="whitespace-nowrap">Novo Monitor</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md rounded-2xl border-navy/10">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-serif text-navy flex items-center gap-2">
                                    <UserCheck className="h-6 w-6 text-gold" />
                                    Cadastrar Monitor
                                </DialogTitle>
                                <DialogDescription className="text-base">
                                    Preencha os dados abaixo para criar um novo usuário monitor.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleCreateMonitor} className="space-y-6 mt-6">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-sm font-semibold text-navy/70">Nome Completo</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="fullName"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="pl-12 h-12 rounded-xl border-navy/10 focus:ring-gold"
                                            placeholder="Ex: João da Silva"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-sm font-semibold text-navy/70">Usuário (login)</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="pl-12 h-12 rounded-xl border-navy/10 focus:ring-gold"
                                            placeholder="Ex: joao.silva"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 ml-1">
                                        <Shield className="h-3 w-3" />
                                        Email: <span className="font-mono font-bold text-navy">{username.toLowerCase() || 'usuario'}@cmto.interno</span>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-semibold text-navy/70">Senha Temporária</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 rounded-xl border-navy/10 focus:ring-gold"
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="rounded-xl">
                                        Cancelar
                                    </Button>
                                    <Button type="submit" className="btn-military h-12 px-8 rounded-xl" disabled={creating}>
                                        {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</> : 'Criar Monitor'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 bg-muted/30 p-2 rounded-2xl border border-navy/5">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                    <Input
                        placeholder="Buscar monitor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-11 md:pl-12 bg-transparent border-none h-10 md:h-12 text-sm md:text-lg focus-visible:ring-0"
                    />
                </div>
                <div className="px-4 py-1.5 sm:py-2 border-t sm:border-t-0 sm:border-l border-navy/10">
                    <span className="text-xs md:text-sm font-medium text-muted-foreground"> Total: {filteredMonitores.length}</span>
                </div>
            </div>

            <div className="card-military overflow-hidden rounded-2xl border border-navy/10">
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-24 gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-gold" />
                        <p className="text-navy/50 font-medium animate-pulse">Carregando monitores...</p>
                    </div>
                ) : filteredMonitores.length === 0 ? (
                    <div className="text-center py-24 px-4 bg-white/50">
                        <div className="h-20 w-20 bg-navy/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Shield className="h-10 w-10 text-navy/20" />
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-navy">Nenhum monitor encontrado</h3>
                        <p className="text-muted-foreground text-lg max-w-md mx-auto mt-2">
                            {searchTerm ? 'Nenhum resultado para sua busca.' : 'Comece adicionando o primeiro monitor clicando no botão acima.'}
                        </p>
                        {searchTerm && (
                            <Button variant="link" onClick={() => setSearchTerm('')} className="mt-4 text-gold">
                                Limpar busca
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="w-full">
                        {/* Mobile view: Cards list */}
                        <div className="md:hidden divide-y divide-navy/5">
                            <AnimatePresence mode="popLayout">
                                {filteredMonitores.map((monitor, index) => (
                                    <motion.div
                                        key={monitor.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="p-4 bg-white/50 space-y-3"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-navy to-navy-light flex items-center justify-center text-gold font-bold text-base uppercase shadow-md">
                                                    {monitor.nome.substring(0, 2)}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <div className="text-base font-bold text-navy truncate">{monitor.nome}</div>
                                                    <div className="text-xs text-muted-foreground truncate">{monitor.email}</div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 shrink-0 rounded-lg text-red-500 hover:bg-red-50"
                                                onClick={() => handleDeleteClick(monitor)}
                                                disabled={deletingId === monitor.id}
                                            >
                                                {deletingId === monitor.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                        <div className="flex items-center justify-between pt-1 border-t border-navy/5">
                                            <div className="text-[10px] text-muted-foreground uppercase font-bold">Membro desde {new Date(monitor.created_at).toLocaleDateString()}</div>
                                            <Badge className="h-5 text-[10px] bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/20 px-2 rounded-full font-semibold">
                                                Ativo
                                            </Badge>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Desktop view: Classic Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-navy/5 border-b border-navy/10 hover:bg-navy/5">
                                        <TableHead className="py-5 px-6 text-navy font-bold text-sm uppercase tracking-wider">Monitor</TableHead>
                                        <TableHead className="py-5 px-6 text-navy font-bold text-sm uppercase tracking-wider">Credenciais</TableHead>
                                        <TableHead className="py-5 px-6 text-navy font-bold text-sm uppercase tracking-wider text-center">Status</TableHead>
                                        <TableHead className="py-5 px-6 text-navy font-bold text-sm uppercase tracking-wider text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnimatePresence mode="popLayout">
                                        {filteredMonitores.map((monitor, index) => (
                                            <motion.tr
                                                key={monitor.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group hover:bg-navy/[0.02] transition-colors border-b border-navy/5 last:border-0"
                                            >
                                                <TableCell className="py-5 px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-navy to-navy-light flex items-center justify-center text-gold font-bold text-lg uppercase shadow-lg group-hover:scale-110 transition-transform">
                                                            {monitor.nome.substring(0, 2)}
                                                        </div>
                                                        <div>
                                                            <div className="text-lg font-bold text-navy">{monitor.nome}</div>
                                                            <div className="text-sm text-muted-foreground">Membro desde {new Date(monitor.created_at).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-navy/80 font-medium">{monitor.email}</span>
                                                        <span className="text-xs text-muted-foreground">ID: {monitor.id.substring(0, 8)}...</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5 px-6 text-center">
                                                    <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/20 px-3 py-1 rounded-full font-semibold">
                                                        Ativo
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-5 px-6 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 rounded-xl text-red-500 hover:text-white hover:bg-red-500 transition-all shadow-sm hover:shadow-red-500/20"
                                                        onClick={() => handleDeleteClick(monitor)}
                                                        disabled={deletingId === monitor.id}
                                                    >
                                                        {deletingId === monitor.id ? (
                                                            <Loader2 className="h-5 w-5 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-5 w-5" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-amber-500/5 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4 mt-8">
                <div className="p-3 bg-amber-100 rounded-xl">
                    <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-amber-900 text-lg">Nota de Segurança e Conformidade</h4>
                    <p className="text-amber-800/80 leading-relaxed">
                        A remoção de um monitor nesta tela apenas retira suas permissões administrativas.
                        O usuário continuará existindo no sistema, mas perderá acesso aos módulos restritos conforme as políticas de Row Level Security (RLS).
                    </p>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent className="max-w-md rounded-2xl border-red-100">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif text-red-600 flex items-center gap-2">
                            <AlertTriangle className="h-6 w-6" />
                            Confirmar Remoção
                        </DialogTitle>
                        <DialogDescription className="text-base pt-2">
                            Tem certeza que deseja remover as permissões de monitor de <strong>{monitorToDelete?.nome}</strong>?
                            <br /><br />
                            Esta ação não pode ser desfeita facilmente por aqui.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex gap-3">
                        <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)} className="rounded-xl flex-1">
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} className="rounded-xl flex-1 h-12">
                            Sim, Remover
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
