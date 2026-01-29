import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
    Shield,
    AlertTriangle,
    Trash2,
    Loader2,
    Mail,
    User,
    Plus,
    Users,
    Search,
    Key,
    Info,
    CheckCircle2,
    XCircle,
    UserPlus,
    ShieldCheck,
    AlertCircle,
    FileSearch,
    BookOpen,
    Upload,
    ExternalLink
} from "lucide-react";
import { safeDate, safeFormat, safeArray, safeString } from '@/utils/safe-rendering';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Monitor {
    id: string;
    nome: string;
    email: string;
    created_at: string;
}

interface PaisAluno {
    id: string;
    aluno_id: string;
    matricula: string;
    data_nascimento_text: string;
    nome_responsavel: string | null;
    ultimo_acesso: string | null;
    consentimento_visualizacao: boolean;
    aluno?: {
        nome: string;
        turma?: {
            nome: string;
        };
    };
}

interface AlunoSemAcesso {
    id: string;
    nome: string;
    matricula: string;
    data_nascimento: string;
    turma?: {
        nome: string;
    };
}

interface Manual {
    id: string;
    nome: string;
    url: string;
    uploaded_at: string;
}

export default function Monitores() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'monitores';

    // State for Monitores
    const [monitores, setMonitores] = useState<Monitor[]>([]);
    const [loadingMonitores, setLoadingMonitores] = useState(true);
    const [deletingMonitorId, setDeletingMonitorId] = useState<string | null>(null);
    const [monitorModalOpen, setMonitorModalOpen] = useState(false);
    const [monitorToDelete, setMonitorToDelete] = useState<Monitor | null>(null);
    const [deleteMonitorConfirmOpen, setDeleteMonitorConfirmOpen] = useState(false);

    // Form state for new monitor
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [creatingMonitor, setCreatingMonitor] = useState(false);

    // State for Acesso Pais
    const [accessData, setAccessData] = useState<PaisAluno[]>([]);
    const [alunosSemAcesso, setAlunosSemAcesso] = useState<AlunoSemAcesso[]>([]);
    const [loadingAccess, setLoadingAccess] = useState(true);
    const [accessSearch, setAccessSearch] = useState('');
    const [generatingAccessId, setGeneratingAccessId] = useState<string | null>(null);

    // State for Manual
    const [manuais, setManuais] = useState<Manual[]>([]);
    const [loadingManuais, setLoadingManuais] = useState(true);
    const [uploadingManual, setUploadingManual] = useState(false);
    const [manualFile, setManualFile] = useState<File | null>(null);
    const [manualName, setManualName] = useState('');
    const [manualModalOpen, setManualModalOpen] = useState(false);
    const [deletingManualId, setDeletingManualId] = useState<string | null>(null);
    const [showArchivedManuais, setShowArchivedManuais] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchMonitores();
        fetchAccessData();
        fetchManuais();
    }, [showArchivedManuais]);

    const handleTabChange = (value: string) => {
        setSearchParams({ tab: value });
    };

    // --- MONITORES LOGIC ---
    const fetchMonitores = async () => {
        setLoadingMonitores(true);
        try {
            const { data: rolesData, error: rolesError } = await supabase
                .from('user_roles')
                .select('user_id')
                .eq('role', 'monitor');

            if (rolesError) throw rolesError;

            if (rolesData && rolesData.length > 0) {
                const userIds = rolesData.map(r => r.user_id);
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('id', userIds);

                if (profilesError) throw profilesError;
                setMonitores(profiles as Monitor[]);
            } else {
                setMonitores([]);
            }
        } catch (error: any) {
            toast.error('Erro ao carregar monitores: ' + error.message);
        } finally {
            setLoadingMonitores(false);
        }
    };

    const handleCreateMonitor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName || !username || !password) return;

        setCreatingMonitor(true);
        try {
            // Sanitização obrigatória: remove qualquer domínio já digitado para evitar duplicação no backend
            const sanitizedUsername = username.trim().split('@')[0];

            const { data, error: invokeError } = await supabase.functions.invoke('create-monitor', {
                body: {
                    username: sanitizedUsername,
                    password,
                    full_name: fullName.trim()
                }
            });

            // Ajuste conforme solicitado: Verifica explicitamente se existe erro no JSON retornado
            if (data?.error) {
                toast.error('Erro ao criar monitor: ' + data.error);
                return;
            }

            // Se o invoke retornou erro de status mas o body não contém 'error',
            // ignoramos o erro de status para evitar o "erro falso" relatado.
            // Só exibimos erro de invoke se não houver dados (erro de rede real).
            if (invokeError && !data) {
                toast.error('Erro de conexão ao servidor: ' + invokeError.message);
                return;
            }

            toast.success('Monitor criado com sucesso!');
            setMonitorModalOpen(false);
            resetMonitorForm();
            fetchMonitores();
        } catch (error: any) {
            // Fallback para erros inesperados de código
            console.error('Erro inesperado no frontend:', error);
            toast.error('Ocorreu um erro ao processar o cadastro.');
        } finally {
            setCreatingMonitor(false);
        }
    };

    const resetMonitorForm = () => {
        setFullName('');
        setUsername('');
        setPassword('');
    };

    const handleDeleteClick = (monitor: Monitor) => {
        setMonitorToDelete(monitor);
        setDeleteMonitorConfirmOpen(true);
    };

    const confirmDeleteMonitor = async () => {
        if (!monitorToDelete) return;

        setDeletingMonitorId(monitorToDelete.id);
        try {
            const { error } = await supabase
                .from('user_roles')
                .delete()
                .eq('user_id', monitorToDelete.id)
                .eq('role', 'monitor');

            if (error) throw error;

            toast.success('Permissões de monitor removidas.');
            setDeleteMonitorConfirmOpen(false);
            fetchMonitores();
        } catch (error: any) {
            toast.error('Erro ao remover monitor: ' + error.message);
        } finally {
            setDeletingMonitorId(null);
        }
    };

    // --- ACESSO PAIS LOGIC ---
    const fetchAccessData = async () => {
        setLoadingAccess(true);
        try {
            const { data: access, error: accessError } = await supabase
                .from('pais_alunos')
                .select(`
                    *,
                    aluno:alunos (
                        nome,
                        turma:turmas (nome)
                    )
                `);

            if (accessError) throw accessError;
            setAccessData(access as PaisAluno[]);

            const { data: students, error: studentError } = await supabase
                .from('alunos')
                .select('id, nome, matricula, data_nascimento, turma:turmas(nome)')
                .eq('arquivado', false);

            if (studentError) throw studentError;

            const existingIds = new Set(access.map(a => a.aluno_id));
            const missing = (students as any[]).filter(s => !existingIds.has(s.id));
            setAlunosSemAcesso(missing);
        } catch (error: any) {
            toast.error('Erro ao carregar dados de acesso: ' + error.message);
        } finally {
            setLoadingAccess(false);
        }
    };

    const toggleAccessConsent = async (id: string, current: boolean) => {
        try {
            const { error } = await supabase
                .from('pais_alunos')
                .update({ consentimento_visualizacao: !current })
                .eq('id', id);

            if (error) throw error;
            toast.success('Consentimento atualizado!');
            fetchAccessData();
        } catch (error: any) {
            toast.error('Erro ao atualizar consentimento');
        }
    };

    const deleteAccess = async (id: string) => {
        try {
            const { error } = await supabase
                .from('pais_alunos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Acesso removido com sucesso!');
            fetchAccessData();
        } catch (error: any) {
            toast.error('Erro ao remover acesso');
        }
    };

    const generateAccess = async (aluno: AlunoSemAcesso) => {
        setGeneratingAccessId(aluno.id);
        try {
            const dateParts = aluno.data_nascimento.split('-');
            const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

            const { error } = await supabase
                .from('pais_alunos')
                .insert({
                    aluno_id: aluno.id,
                    matricula: aluno.matricula,
                    data_nascimento_text: formattedDate,
                    nome_responsavel: `Responsável de ${aluno.nome.split(' ')[0]}`,
                    consentimento_visualizacao: true
                });

            if (error) throw error;
            toast.success(`Acesso gerado para ${aluno.nome}`);
            fetchAccessData();
        } catch (error: any) {
            toast.error('Erro ao gerar acesso: ' + error.message);
        } finally {
            setGeneratingAccessId(null);
        }
    };

    // --- MANUAIS LOGIC ---
    const fetchManuais = async () => {
        setLoadingManuais(true);
        try {
            let { data, error } = await (supabase
                .from('manuais') as any)
                .select('*')
                .eq('arquivado', showArchivedManuais)
                .order('uploaded_at', { ascending: false });

            // Fallback se a coluna arquivado não existir
            if (error && (error.message.includes('column "arquivado" does not exist') || error.code === '42703')) {
                console.warn('Coluna "arquivado" não encontrada em manuais. Buscando todos.');
                const { data: allData, error: allError } = await supabase
                    .from('manuais')
                    .select('*')
                    .order('uploaded_at', { ascending: false });

                if (allError) throw allError;
                data = allData;
            } else if (error) {
                throw error;
            }

            setManuais(data || []);
        } catch (error: any) {
            toast.error('Erro ao carregar manuais: ' + error.message);
        } finally {
            setLoadingManuais(false);
        }
    };

    const handleArchiveManual = async (id: string, currentlyArchived: boolean) => {
        const action = currentlyArchived ? 'desarquivar' : 'arquivar';
        if (!confirm(`Deseja realmente ${action} este documento?`)) return;

        try {
            const { error } = await (supabase
                .from('manuais') as any)
                .update({ arquivado: !currentlyArchived })
                .eq('id', id);

            if (error) throw error;
            toast.success(`Documento ${action}ado com sucesso!`);
            fetchManuais();
        } catch (error: any) {
            toast.error(`Erro ao ${action}ar: ` + error.message);
        }
    };

    const handleUploadManual = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualFile || !manualName) return;

        setUploadingManual(true);
        try {
            const fileExt = manualFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('manuais')
                .upload(fileName, manualFile);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('manuais')
                .getPublicUrl(fileName);

            const { error: dbError } = await supabase
                .from('manuais')
                .insert({
                    nome: manualName,
                    url: urlData.publicUrl
                });

            if (dbError) throw dbError;

            toast.success('Manual enviado com sucesso!');
            setManualModalOpen(false);
            resetManualForm();
            fetchManuais();
        } catch (error: any) {
            toast.error('Erro ao enviar manual: ' + error.message);
        } finally {
            setUploadingManual(false);
        }
    };

    const resetManualForm = () => {
        setManualFile(null);
        setManualName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDeleteManual = async (id: string, url: string, nome: string) => {
        if (!confirm(`Deseja realmente excluir permanentemente o documento "${nome}"?`)) return;

        setDeletingManualId(id);
        try {
            const fileName = url.split('/').pop();
            if (fileName) {
                await supabase.storage.from('manuais').remove([fileName]);
            }

            const { error } = await supabase
                .from('manuais')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Manual removido.');
            fetchManuais();
        } catch (error: any) {
            toast.error('Erro ao remover manual: ' + error.message);
        } finally {
            setDeletingManualId(null);
        }
    };

    const filteredAccess = safeArray(accessData).filter(item =>
        safeString(item.aluno?.nome).toLowerCase().includes(accessSearch.toLowerCase()) ||
        safeString(item.matricula).includes(accessSearch)
    );

    const filteredMissingAccess = safeArray(alunosSemAcesso).filter(item =>
        safeString(item.nome).toLowerCase().includes(accessSearch.toLowerCase()) ||
        safeString(item.matricula).includes(accessSearch)
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-navy flex items-center gap-2">
                        <Shield className="h-8 w-8 text-accent" />
                        Administração
                    </h1>
                    <p className="text-muted-foreground mt-1">Gestão de monitores, acessos de familiares e documentos oficiais</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="bg-navy/5 p-1 mb-6 w-full justify-start overflow-x-auto">
                    <TabsTrigger value="monitores" className="data-[state=active]:bg-navy data-[state=active]:text-white">
                        <ShieldCheck className="h-4 w-4 mr-2" /> Monitores
                    </TabsTrigger>
                    <TabsTrigger value="pais" className="data-[state=active]:bg-navy data-[state=active]:text-white">
                        <Users className="h-4 w-4 mr-2" /> Acesso Pais
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="data-[state=active]:bg-navy data-[state=active]:text-white">
                        <FileSearch className="h-4 w-4 mr-2" /> Gerenciar Manual
                    </TabsTrigger>
                </TabsList>

                {/* --- TAB: MONITORES --- */}
                <TabsContent value="monitores" className="space-y-6 mt-0">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-navy flex items-center gap-2">
                            <Users className="h-5 w-5 text-accent" />
                            Monitores Cadastrados
                        </h2>

                        <Dialog open={monitorModalOpen} onOpenChange={setMonitorModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="btn-gold shadow-gold/20">
                                    <Plus className="h-4 w-4 mr-2" /> Novo Monitor
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-serif text-navy">Cadastrar Novo Monitor</DialogTitle>
                                    <DialogDescription>
                                        O monitor terá acesso ao painel administrativo para gerenciar alunos e turmas.
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
                                                className="pl-10 rounded-xl"
                                                placeholder="Ex: João da Silva"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="username">Usuário (login)</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="username"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="pl-10 rounded-xl"
                                                placeholder="Ex: joao.silva"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">Senha Temporária</Label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-10 rounded-xl"
                                                placeholder="Mínimo 6 caracteres"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    </div>

                                    <DialogFooter className="pt-4">
                                        <Button type="button" variant="ghost" onClick={() => setMonitorModalOpen(false)} className="rounded-xl">
                                            Cancelar
                                        </Button>
                                        <Button type="submit" className="btn-military rounded-xl h-12 flex-1" disabled={creatingMonitor}>
                                            {creatingMonitor ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando...</> : 'Criar Monitor'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="card-military p-0 overflow-hidden border-navy/10 shadow-xl">
                        {loadingMonitores ? (
                            <div className="flex justify-center items-center py-20">
                                <Loader2 className="h-10 w-10 animate-spin text-accent" />
                            </div>
                        ) : monitores.length === 0 ? (
                            <div className="text-center py-20 px-4">
                                <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
                                    <Shield className="h-12 w-12 text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-serif font-bold text-navy">Nenhum monitor encontrado</h3>
                                <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2">
                                    Clique no botão "Novo Monitor" para conceder acesso administrativo a um novo usuário.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-navy/5 hover:bg-navy/5 border-b border-navy/10">
                                            <TableHead className="py-5 px-6 text-navy font-bold text-sm uppercase tracking-wider">Monitor</TableHead>
                                            <TableHead className="py-5 px-6 text-navy font-bold text-sm uppercase tracking-wider">Credenciais</TableHead>
                                            <TableHead className="py-5 px-6 text-navy font-bold text-sm uppercase tracking-wider text-center">Status</TableHead>
                                            <TableHead className="py-5 px-6 text-navy font-bold text-sm uppercase tracking-wider text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <AnimatePresence mode="popLayout">
                                            {safeArray(monitores).map((monitor, index) => (
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
                                                                {safeString(monitor?.nome).substring(0, 2)}
                                                            </div>
                                                            <div>
                                                                <div className="text-lg font-bold text-navy">{safeString(monitor?.nome)}</div>
                                                                <div className="text-sm text-muted-foreground">Membro desde {safeDate(monitor?.created_at)?.toLocaleDateString() || '-'}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5 px-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-navy/80 font-medium">Usuário: {safeString(monitor?.email).split('@')[0]}</span>
                                                            <span className="text-[10px] text-muted-foreground">ID: {safeString(monitor?.id).substring(0, 8)}...</span>
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
                                                            disabled={deletingMonitorId === monitor.id}
                                                        >
                                                            {deletingMonitorId === monitor.id ? (
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
                        )}
                    </div>

                    <div className="bg-amber-500/5 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="p-3 bg-amber-100 rounded-xl">
                            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-amber-900 text-lg">Nota de Segurança e Conformidade</h4>
                            <p className="text-amber-800/80 leading-relaxed text-sm">
                                A remoção de um monitor nesta tela apenas retira suas permissões administrativas.
                                O usuário continuará existindo no sistema para fins de auditoria, mas perderá acesso aos módulos restritos.
                            </p>
                        </div>
                    </div>
                </TabsContent>

                {/* --- TAB: ACESSO PAIS --- */}
                <TabsContent value="pais" className="space-y-6 mt-0">
                    <div className="bg-blue-50 p-6 rounded-2xl flex gap-4 text-blue-800 border border-blue-100 shadow-sm">
                        <div className="p-3 bg-blue-100 rounded-xl h-fit">
                            <Info size={24} className="text-blue-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-1">Informações do Portal da Família</h4>
                            <p className="text-sm opacity-90 leading-relaxed">
                                O acesso ao portal é realizado com o <strong>Número da Matrícula</strong> e a <strong>Data de Nascimento</strong> do aluno (formato DD/MM/YYYY).
                                Use esta tela para gerar novos acessos ou suspender visualizações.
                            </p>
                        </div>
                    </div>

                    <div className="card-military p-4 border-navy/10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por aluno ou matrícula..."
                                value={accessSearch}
                                onChange={e => setAccessSearch(e.target.value)}
                                className="pl-11 text-navy border-navy/10 h-12 rounded-xl"
                            />
                        </div>
                    </div>

                    <Tabs defaultValue="ativos_pais" className="w-full">
                        <TabsList className="bg-transparent border-b border-navy/10 w-full justify-start rounded-none h-auto p-0 mb-4">
                            <TabsTrigger
                                value="ativos_pais"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-navy data-[state=active]:bg-transparent data-[state=active]:text-navy font-bold px-6 py-3"
                            >
                                Acessos Ativos ({accessData.length})
                            </TabsTrigger>
                            <TabsTrigger
                                value="sem_acesso"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-navy data-[state=active]:bg-transparent data-[state=active]:text-navy font-bold px-6 py-3"
                            >
                                Sem Configuração ({alunosSemAcesso.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="ativos_pais" className="mt-0">
                            {loadingAccess ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="h-10 w-10 animate-spin text-accent" />
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    <AnimatePresence mode='popLayout'>
                                        {filteredAccess.map((item, index) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                className="card-military p-5 grid md:grid-cols-4 items-center gap-4 hover:shadow-lg transition-all group border-l-4 border-l-navy"
                                            >
                                                <div className="col-span-1">
                                                    <h4 className="font-bold text-navy group-hover:text-accent transition-colors">{item.aluno?.nome}</h4>
                                                    <p className="text-xs text-muted-foreground font-bold tracking-tight">
                                                        TURMA: {item.aluno?.turma?.nome || 'N/A'}
                                                    </p>
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Credenciais</span>
                                                    <div className="flex items-center gap-2 text-sm font-mono bg-navy/5 p-2 rounded-lg border border-navy/5 w-fit">
                                                        <Key size={14} className="text-accent" />
                                                        <span className="font-bold text-navy">{item.matricula}</span>
                                                        <span className="text-navy/20">|</span>
                                                        <span className="text-navy/70">{item.data_nascimento_text}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1 text-sm">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Último Acesso</span>
                                                    <span className="text-navy/80">
                                                        {item.ultimo_acesso ? new Date(item.ultimo_acesso).toLocaleString('pt-BR') : 'Nunca acessou'}
                                                    </span>
                                                </div>

                                                <div className="flex justify-end gap-3">
                                                    <Button
                                                        variant={item.consentimento_visualizacao ? "outline" : "default"}
                                                        size="sm"
                                                        className={item.consentimento_visualizacao
                                                            ? "border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 rounded-xl"
                                                            : "bg-red-500 text-white hover:bg-red-600 rounded-xl"}
                                                        onClick={() => toggleAccessConsent(item.id, item.consentimento_visualizacao)}
                                                    >
                                                        {item.consentimento_visualizacao ? (
                                                            <><CheckCircle2 size={16} className="mr-2" /> Ativo</>
                                                        ) : (
                                                            <><XCircle size={16} className="mr-2" /> Bloqueado</>
                                                        )}
                                                    </Button>

                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-xl h-9 w-9">
                                                                <Trash2 size={18} />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="rounded-2xl">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle className="text-navy font-serif">Remover Acesso?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Isso invalidará as credenciais de acesso para a família de <strong>{item.aluno?.nome}</strong>.
                                                                    O registro será movido para a aba "Sem Configuração".
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => deleteAccess(item.id)} className="bg-red-500 hover:bg-red-600 rounded-xl">
                                                                    Remover Registro
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {filteredAccess.length === 0 && (
                                        <div className="text-center py-20 bg-muted/5 rounded-2xl border-2 border-dashed border-border">
                                            <Users size={48} className="mx-auto text-muted-foreground opacity-20 mb-4" />
                                            <p className="text-muted-foreground italic font-serif">Nenhum acesso ativo encontrado.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="sem_acesso" className="mt-0">
                            <div className="grid gap-4">
                                <AnimatePresence mode='popLayout'>
                                    {filteredMissingAccess.map((aluno, index) => (
                                        <motion.div
                                            key={aluno.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="card-military p-5 flex items-center justify-between border-l-4 border-l-amber-400 hover:shadow-md transition-shadow"
                                        >
                                            <div>
                                                <h4 className="font-bold text-navy text-lg">{aluno.nome}</h4>
                                                <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                                    <span className="bg-muted px-2 py-0.5 rounded">MATRÍCULA: {aluno.matricula}</span>
                                                    <span className="bg-muted px-2 py-0.5 rounded">TURMA: {aluno.turma?.nome || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <Button
                                                className="btn-military rounded-xl px-6"
                                                onClick={() => generateAccess(aluno)}
                                                disabled={generatingAccessId === aluno.id}
                                            >
                                                {generatingAccessId === aluno.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <><UserPlus size={18} className="mr-2" /> Habilitar Portal</>
                                                )}
                                            </Button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {filteredMissingAccess.length === 0 && (
                                    <div className="text-center py-20 bg-muted/5 rounded-2xl border-2 border-dashed border-border">
                                        <ShieldCheck size={48} className="mx-auto text-green-500 opacity-20 mb-4" />
                                        <p className="text-muted-foreground italic font-serif">Todos os alunos ativos possuem acesso configurado.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                {/* --- TAB: GERENCIAR MANUAL --- */}
                <TabsContent value="manual" className="space-y-6 mt-0">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-navy text-white rounded-xl shadow-lg">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-navy">Manuais do Aluno</h2>
                            <p className="text-sm text-muted-foreground">Repositório de documentos oficiais e regulamentos</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-muted p-1 rounded-lg">
                            <Button
                                variant={!showArchivedManuais ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setShowArchivedManuais(false)}
                                className="h-8"
                            >
                                Ativos
                            </Button>
                            <Button
                                variant={showArchivedManuais ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setShowArchivedManuais(true)}
                                className="h-8"
                            >
                                Arquivados
                            </Button>
                        </div>

                        <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="btn-gold">
                                    <Upload className="h-4 w-4 mr-2" /> Novo Documento
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md rounded-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-serif text-navy">Upload de Manual</DialogTitle>
                                    <DialogDescription>
                                        O arquivo PDF ficará disponível para visualização e download pelos alunos e pais.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleUploadManual} className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <Label>Nome do Documento</Label>
                                        <Input
                                            placeholder="Ex: Regulamento Disciplinar 2026"
                                            value={manualName}
                                            onChange={e => setManualName(e.target.value)}
                                            className="rounded-xl"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Arquivo PDF</Label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-navy/10 rounded-2xl p-8 text-center hover:border-accent cursor-pointer transition-colors bg-muted/30"
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="application/pdf"
                                                onChange={(e) => setManualFile(e.target.files?.[0] || null)}
                                            />
                                            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                                            <p className="text-sm font-medium text-navy">
                                                {manualFile ? manualFile.name : 'Clique para selecionar o PDF'}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-1">Apenas arquivos .pdf são aceitos</p>
                                        </div>
                                    </div>
                                    <DialogFooter className="pt-4">
                                        <Button type="button" variant="ghost" onClick={() => setManualModalOpen(false)} className="rounded-xl">
                                            Cancelar
                                        </Button>
                                        <Button type="submit" className="btn-military flex-1 rounded-xl h-12" disabled={uploadingManual || !manualFile}>
                                            {uploadingManual ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</> : 'Iniciar Upload'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loadingManuais ? (
                            <div className="col-span-full flex justify-center py-20">
                                <Loader2 className="h-10 w-10 animate-spin text-accent" />
                            </div>
                        ) : manuais.length === 0 ? (
                            <div className="col-span-full text-center py-20 card-military">
                                <FileSearch className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                                <p className="text-muted-foreground italic font-serif">Nenhum manual cadastrado ainda.</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {manuais.map((manual, index) => (
                                    <motion.div
                                        key={manual.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="card-military p-0 overflow-hidden group hover:shadow-xl transition-all border-navy/5"
                                    >
                                        <div className="bg-navy/5 p-6 flex flex-col items-center justify-center border-b border-navy/5 relative overflow-hidden">
                                            <div className="bg-white p-4 rounded-xl shadow-sm z-10">
                                                <FileSearch className="h-10 w-10 text-navy" />
                                            </div>
                                            <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-navy">
                                                <Shield size={120} />
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="font-bold text-navy line-clamp-2 h-10 mb-2 leading-tight">{manual.nome}</h3>
                                            <p className="text-[10px] text-muted-foreground mb-4 uppercase font-bold tracking-widest flex items-center gap-1">
                                                <CheckCircle2 size={12} className="text-emerald-500" />
                                                Publicado em {new Date(manual.uploaded_at).toLocaleDateString('pt-BR')}
                                            </p>

                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" className="flex-1 rounded-lg border-navy/10 hover:bg-navy/5" asChild>
                                                    <a href={manual.url} target="_blank" rel="noreferrer">
                                                        <ExternalLink className="h-3 w-3 mr-1.5" /> Ver
                                                    </a>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="rounded-lg text-muted-foreground hover:text-accent hover:bg-navy/5"
                                                    onClick={() => handleArchiveManual(manual.id, showArchivedManuais)}
                                                    title={showArchivedManuais ? "Desarquivar" : "Arquivar"}
                                                >
                                                    <Shield size={14} className={showArchivedManuais ? "rotate-180" : ""} />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="rounded-lg text-red-500 hover:bg-red-50"
                                                    onClick={() => handleDeleteManual(manual.id, manual.url, manual.nome)}
                                                    disabled={deletingManualId === manual.id}
                                                    title="Excluir"
                                                >
                                                    {deletingManualId === manual.id ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-3 w-3" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Global Delete Confirmation for Monitors */}
            <Dialog open={deleteMonitorConfirmOpen} onOpenChange={setDeleteMonitorConfirmOpen}>
                <DialogContent className="max-w-md rounded-2xl border-red-100">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif text-red-600 flex items-center gap-2">
                            <AlertTriangle className="h-6 w-6" />
                            Confirmar Remoção
                        </DialogTitle>
                        <DialogDescription className="text-base pt-2">
                            Tem certeza que deseja remover as permissões de monitor de <strong>{monitorToDelete?.nome}</strong>?
                            <br /><br />
                            Esta ação impedirá o acesso administrativo imediatamente.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex gap-3">
                        <Button variant="ghost" onClick={() => setDeleteMonitorConfirmOpen(false)} className="rounded-xl flex-1">
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteMonitor} className="rounded-xl flex-1 h-12">
                            Confirmar Exclusão
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
