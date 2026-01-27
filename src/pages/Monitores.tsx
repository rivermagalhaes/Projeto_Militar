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
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Shield, Plus, Loader2, Trash2, Mail, User, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

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
            // Fetch users who have the 'monitor' role
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
                    username: username.trim(),
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

    const confirmDelete = async (id: string) => {
        // This is a "soft" delete from the UI perspective for now, 
        // real deletion of users usually requires admin API or another edge function 
        // if Delete User RLS is restricted. 
        // However, we can remove the role or delete from profiles if RLS allows.
        // Assuming for now we just want to remove access. 
        // Ideally, we should have a 'delete-user' function or similar.
        // For this strict implementation without new functions/tables, we'll try to delete from user_roles.

        try {
            setDeletingId(id);

            // Remove monitor role
            const { error: roleError } = await supabase
                .from('user_roles')
                .delete()
                .eq('user_id', id)
                .eq('role', 'monitor');

            if (roleError) throw roleError;

            toast.success('Permissão de monitor removida.');
            fetchMonitores();
        } catch (error: any) {
            console.error('Erro ao remover monitor:', error);
            toast.error('Erro ao remover permissão.');
        } finally {
            setDeletingId(null);
        }
    };

    const resetForm = () => {
        setFullName('');
        setUsername('');
        setPassword('');
    };

    if (!isAdmin) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-navy flex items-center gap-2">
                        <Shield className="h-8 w-8 text-gold" />
                        Gestão de Monitores
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie os acessos dos monitores do sistema.
                    </p>
                </div>

                <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="btn-military w-full sm:w-auto">
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Monitor
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-serif text-navy">Cadastrar Novo Monitor</DialogTitle>
                            <DialogDescription>
                                Crie um novo usuário com permissões de monitor.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateMonitor} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Nome Completo</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="fullName"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="pl-10"
                                        placeholder="Ex: João da Silva"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="username">Usuário (para login)</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="pl-10"
                                        placeholder="Ex: joao.silva"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    O email será gerado como: <strong>{username || 'usuario'}@cmto.interno</strong>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Senha Temporária</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="btn-military" disabled={creating}>
                                    {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando...</> : 'Criar Monitor'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="card-military p-0 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : monitores.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium text-navy">Nenhum monitor encontrado</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
                            Clique no botão "Novo Monitor" para conceder acesso a um novo usuário.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead className="w-[40%]">Nome</TableHead>
                                    <TableHead className="w-[30%]">Email / Usuário</TableHead>
                                    <TableHead className="w-[20%] text-center">Status</TableHead>
                                    <TableHead className="w-[10%] text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {monitores.map((monitor) => (
                                    <TableRow key={monitor.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-navy/10 flex items-center justify-center text-navy font-bold text-xs uppercase">
                                                    {monitor.nome.substring(0, 2)}
                                                </div>
                                                {monitor.nome}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {monitor.email}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/20">
                                                Ativo
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-400 hover:text-red-500 hover:bg-red-50"
                                                onClick={() => confirmDelete(monitor.id)}
                                                disabled={deletingId === monitor.id}
                                            >
                                                {deletingId === monitor.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                    <h4 className="font-semibold mb-1">Nota de Segurança</h4>
                    <p>
                        Monitores têm acesso restrito apenas aos dados necessários para suas funções.
                        Eles não podem visualizar dados sensíveis de outros monitores ou administradores.
                    </p>
                </div>
            </div>
        </div>
    );
}
