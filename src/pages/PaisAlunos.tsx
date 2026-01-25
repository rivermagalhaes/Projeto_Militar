import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, Loader2, Key, Info, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface PaisAluno {
    aluno_id: string;
    matricula: string;
    data_nascimento_text: string;
    ultimo_acesso: string | null;
    consentimento_visualizacao: boolean;
    aluno?: {
        nome: string;
        turma?: {
            nome: string;
        };
    };
}

export default function PaisAlunos() {
    const [data, setData] = useState<PaisAluno[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchPaisAlunos();
    }, []);

    const fetchPaisAlunos = async () => {
        setLoading(true);
        try {
            // Joining with alunos and turmas
            const { data: res, error } = await supabase
                .from('pais_alunos')
                .select(`
          *,
          aluno:alunos (
            nome,
            turma:turmas (nome)
          )
        `);

            if (error) throw error;
            setData(res as PaisAluno[]);
        } catch (error: any) {
            toast.error('Erro ao carregar dados de acesso: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleConsent = async (alunoId: string, current: boolean) => {
        try {
            const { error } = await supabase
                .from('pais_alunos')
                .update({ consentimento_visualizacao: !current })
                .eq('aluno_id', alunoId);

            if (error) throw error;
            toast.success('Consentimento atualizado!');
            fetchPaisAlunos();
        } catch (error: any) {
            toast.error('Erro ao atualizar consentimento');
        }
    };

    const filteredData = data.filter(item =>
        item.aluno?.nome?.toLowerCase().includes(search.toLowerCase()) ||
        item.matricula.includes(search)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-navy flex items-center gap-2">
                        <Users className="h-8 w-8 text-accent" />
                        Gestão de Acesso - Pais e Alunos
                    </h1>
                    <p className="text-muted-foreground mt-1">Visualize credenciais e controle o acesso ao portal da família</p>
                </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-sm text-blue-800 border border-blue-100">
                <Info size={20} className="shrink-0 text-blue-500" />
                <p>
                    Esta tela permite que os monitores auxiliem pais e alunos com suas credenciais de acesso.
                    O login no portal da família é realizado utilizando o <strong>Número da Matrícula</strong> e a <strong>Data de Nascimento</strong> formatada (Ex: 01/01/2010).
                </p>
            </div>

            <div className="card-military p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome do aluno ou matrícula..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 text-navy border-navy/10"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-10 w-10 animate-spin text-accent" />
                </div>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence>
                        {filteredData.map((item, index) => (
                            <motion.div
                                key={item.aluno_id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="card-military p-4 grid md:grid-cols-4 items-center gap-4 hover:shadow-md transition-shadow"
                            >
                                <div className="col-span-1 md:col-span-1">
                                    <h4 className="font-bold text-navy">{item.aluno?.nome}</h4>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">
                                        Turma: {item.aluno?.turma?.nome || 'N/A'}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Credenciais de Acesso</span>
                                    <div className="flex items-center gap-2 text-sm font-mono bg-muted/50 p-1.5 rounded border border-border w-fit">
                                        <Key size={14} className="text-accent" />
                                        <span>{item.matricula}</span>
                                        <span className="text-muted-foreground">|</span>
                                        <span>{item.data_nascimento_text}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Último Acesso</span>
                                    <span className="text-sm">
                                        {item.ultimo_acesso ? new Date(item.ultimo_acesso).toLocaleString() : 'Nunca acessou'}
                                    </span>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant={item.consentimento_visualizacao ? "outline" : "default"}
                                        size="sm"
                                        className={item.consentimento_visualizacao ? "border-green-200 text-green-700 bg-green-50/50" : "bg-red-500 text-white"}
                                        onClick={() => toggleConsent(item.aluno_id, item.consentimento_visualizacao)}
                                    >
                                        {item.consentimento_visualizacao ? (
                                            <><CheckCircle2 size={16} className="mr-2" /> Acesso Ativo</>
                                        ) : (
                                            <><XCircle size={16} className="mr-2" /> Acesso Bloqueado</>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredData.length === 0 && (
                        <div className="text-center py-20 bg-muted/5 rounded-xl border-2 border-dashed border-border">
                            <Users size={48} className="mx-auto text-muted-foreground opacity-20 mb-4" />
                            <p className="text-muted-foreground italic">Nenhum registro de acesso encontrado.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
