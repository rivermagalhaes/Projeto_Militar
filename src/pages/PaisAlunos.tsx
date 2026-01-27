import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, Loader2, Key, Info, CheckCircle2, XCircle, UserPlus, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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

export default function PaisAlunos() {
    const [accessData, setAccessData] = useState<PaisAluno[]>([]);
    const [alunosSemAcesso, setAlunosSemAcesso] = useState<AlunoSemAcesso[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [generatingId, setGeneratingId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch existing accesses
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

            // 2. Fetch all active students to find those without access
            const { data: students, error: studentError } = await supabase
                .from('alunos')
                .select('id, nome, matricula, data_nascimento, turma:turmas(nome)')
                .eq('arquivado', false);

            if (studentError) throw studentError;

            // Filter students who don't have a record in accessData
            const existingIds = new Set(access.map(a => a.aluno_id));
            const missing = (students as any[]).filter(s => !existingIds.has(s.id));
            setAlunosSemAcesso(missing);

        } catch (error: any) {
            toast.error('Erro ao carregar dados: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleConsent = async (id: string, current: boolean) => {
        try {
            const { error } = await supabase
                .from('pais_alunos')
                .update({ consentimento_visualizacao: !current })
                .eq('id', id);

            if (error) throw error;
            toast.success('Consentimento atualizado!');
            fetchData();
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
            fetchData();
        } catch (error: any) {
            toast.error('Erro ao remover acesso');
        }
    };

    const generateAccess = async (aluno: AlunoSemAcesso) => {
        setGeneratingId(aluno.id);
        try {
            // Format date from YYYY-MM-DD to DD/MM/YYYY
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
            fetchData();
        } catch (error: any) {
            toast.error('Erro ao gerar acesso: ' + error.message);
        } finally {
            setGeneratingId(null);
        }
    };

    const filteredAccess = accessData.filter(item =>
        item.aluno?.nome?.toLowerCase().includes(search.toLowerCase()) ||
        item.matricula.includes(search)
    );

    const filteredMissing = alunosSemAcesso.filter(item =>
        item.nome.toLowerCase().includes(search.toLowerCase()) ||
        item.matricula.includes(search)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-navy flex items-center gap-2">
                        <Users className="h-8 w-8 text-accent" />
                        Gestão de Acesso - Família
                    </h1>
                    <p className="text-muted-foreground mt-1">Controle as credenciais do Portal da Família (Matrícula + Nascimento)</p>
                </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-sm text-blue-800 border border-blue-100 shadow-sm">
                <Info size={20} className="shrink-0 text-blue-500" />
                <p>
                    O acesso ao portal é restrito a responsáveis com credenciais ativas.
                    O login é realizado com o <strong>Número da Matrícula</strong> e a <strong>Data de Nascimento</strong> do aluno.
                </p>
            </div>

            <div className="card-military p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome do aluno ou matrícula..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 text-navy border-navy/10 h-11"
                    />
                </div>
            </div>

            <Tabs defaultValue="ativos" className="w-full">
                <TabsList className="bg-navy/5 p-1 mb-4">
                    <TabsTrigger value="ativos" className="data-[state=active]:bg-navy data-[state=active]:text-white">
                        <ShieldCheck className="h-4 w-4 mr-2" /> Acessos Ativos ({accessData.length})
                    </TabsTrigger>
                    <TabsTrigger value="missing" className="data-[state=active]:bg-navy data-[state=active]:text-white">
                        <AlertCircle className="h-4 w-4 mr-2" /> Sem Acesso ({alunosSemAcesso.length})
                    </TabsTrigger>
                </TabsList>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-10 w-10 animate-spin text-accent" />
                    </div>
                ) : (
                    <>
                        <TabsContent value="ativos" className="mt-0">
                            <div className="grid gap-4">
                                <AnimatePresence mode='popLayout'>
                                    {filteredAccess.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="card-military p-4 grid md:grid-cols-4 items-center gap-4 hover:shadow-md transition-all group border-l-4 border-l-navy"
                                        >
                                            <div className="col-span-1">
                                                <h4 className="font-bold text-navy group-hover:text-accent transition-colors">{item.aluno?.nome}</h4>
                                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">
                                                    Turma: {item.aluno?.turma?.nome || 'N/A'}
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Credenciais</span>
                                                <div className="flex items-center gap-2 text-sm font-mono bg-muted/50 p-1.5 rounded border border-border w-fit">
                                                    <Key size={14} className="text-accent" />
                                                    <span className="font-bold">{item.matricula}</span>
                                                    <span className="text-muted-foreground">|</span>
                                                    <span>{item.data_nascimento_text}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Último Acesso</span>
                                                <span className="text-sm">
                                                    {item.ultimo_acesso ? new Date(item.ultimo_acesso).toLocaleString('pt-BR') : 'Nunca acessou'}
                                                </span>
                                            </div>

                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant={item.consentimento_visualizacao ? "outline" : "default"}
                                                    size="sm"
                                                    className={item.consentimento_visualizacao
                                                        ? "border-green-200 text-green-700 bg-green-50/50 hover:bg-green-100"
                                                        : "bg-red-500 text-white hover:bg-red-600"}
                                                    onClick={() => toggleConsent(item.id, item.consentimento_visualizacao)}
                                                >
                                                    {item.consentimento_visualizacao ? (
                                                        <><CheckCircle2 size={16} className="mr-2" /> Ativo</>
                                                    ) : (
                                                        <><XCircle size={16} className="mr-2" /> Bloqueado</>
                                                    )}
                                                </Button>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500 hover:bg-red-50">
                                                            <Trash2 size={18} />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Remover Acesso?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Iso invalidará as credenciais de acesso para a família de {item.aluno?.nome}.
                                                                Você poderá gerar novamente depois, se necessário.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => deleteAccess(item.id)} className="bg-red-500 hover:bg-red-600">
                                                                Remover
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {filteredAccess.length === 0 && (
                                    <div className="text-center py-20 bg-muted/5 rounded-xl border-2 border-dashed border-border">
                                        <Users size={48} className="mx-auto text-muted-foreground opacity-20 mb-4" />
                                        <p className="text-muted-foreground italic font-serif">Nenhum acesso ativo encontrado.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="missing" className="mt-0">
                            <div className="grid gap-4">
                                <AnimatePresence mode='popLayout'>
                                    {filteredMissing.map((aluno, index) => (
                                        <motion.div
                                            key={aluno.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="card-military p-4 flex items-center justify-between border-l-4 border-l-amber-400"
                                        >
                                            <div>
                                                <h4 className="font-bold text-navy">{aluno.nome}</h4>
                                                <p className="text-xs text-muted-foreground">
                                                    Matrícula: {aluno.matricula} | Turma: {aluno.turma?.nome || 'N/A'}
                                                </p>
                                            </div>
                                            <Button
                                                className="btn-military bg-navy hover:bg-navy-light h-10"
                                                onClick={() => generateAccess(aluno)}
                                                disabled={generatingId === aluno.id}
                                            >
                                                {generatingId === aluno.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <><UserPlus size={16} className="mr-2" /> Gerar Acesso</>
                                                )}
                                            </Button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {filteredMissing.length === 0 && (
                                    <div className="text-center py-20 bg-muted/5 rounded-xl border-2 border-dashed border-border">
                                        <ShieldCheck size={48} className="mx-auto text-green-500 opacity-20 mb-4" />
                                        <p className="text-muted-foreground italic font-serif">Todos os alunos ativos possuem acesso configurado.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    );
}
