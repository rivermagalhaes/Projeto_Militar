import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Users, ArrowLeft, Loader2, User, Search, Award, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { GradeBadge } from '@/components/GradeDisplay';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ELOGIO_VALORES } from '@/utils/gradeCalculation';

interface Aluno {
    id: string;
    nome: string;
    matricula: string | null;
    nota_disciplinar: number;
    foto_url: string | null;
    consentimento_imagem: boolean;
}

interface Turma {
    id: string;
    nome: string;
    ano_letivo: number;
}

export default function TurmaDetalhe() {
    const { id } = useParams();
    const { user } = useAuth();
    const { toast } = useToast();
    const [turma, setTurma] = useState<Turma | null>(null);
    const [alunos, setAlunos] = useState<Aluno[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [bulkActionType, setBulkActionType] = useState<string>('');
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [{ data: turmaData }, { data: alunosData }] = await Promise.all([
                supabase.from('turmas').select('*').eq('id', id).single(),
                supabase.from('alunos').select('*').eq('turma_id', id).order('nome')
            ]);

            if (turmaData) setTurma(turmaData);
            if (alunosData) setAlunos(alunosData as Aluno[]);
            else setAlunos([]); // Fallback to empty array
        } catch (error) {
            console.error('Erro ao carregar dados da turma:', error);
            setAlunos([]); // Safety fallback
        } finally {
            setLoading(false);
        }
    };

    const handleBulkAction = async () => {
        if (!bulkActionType) {
            toast({ title: 'Selecione uma ação', variant: 'destructive' });
            return;
        }

        if (!confirm(`Deseja aplicar esta ação a todos os ${alunos.length} alunos?`)) return;

        setIsBulkProcessing(true);
        try {
            const anoLetivo = turma?.ano_letivo || new Date().getFullYear();
            const delta = ELOGIO_VALORES[bulkActionType] || 0;

            if (delta === 0) throw new Error('Ação inválida');

            // Itera por cada aluno para garantir histórico individual
            const promises = alunos.map(async (aluno) => {
                // 1. Inserir elogio
                const { error: elogioError } = await supabase.from('elogios').insert({
                    aluno_id: aluno.id,
                    tipo: bulkActionType as any,
                    descricao: 'Lançamento coletivo para a turma',
                    lancado_por: user?.id,
                    ano_letivo: anoLetivo
                });

                if (elogioError) throw elogioError;

                // 2. Atualizar nota (incremental)
                const notaAtual = Number(aluno.nota_disciplinar) || 0;
                const novaNota = notaAtual + delta;
                const { error: updateError } = await supabase
                    .from('alunos')
                    .update({ nota_disciplinar: novaNota })
                    .eq('id', aluno.id);

                if (updateError) throw updateError;
            });

            await Promise.all(promises);

            toast({ title: 'Ação aplicada com sucesso!', description: `${alunos.length} alunos atualizados.` });
            fetchData(); // Recarregar para mostrar novas notas
            setBulkActionType('');
        } catch (error: any) {
            console.error('Erro na ação em lote:', error);
            toast({ title: 'Erro ao aplicar ação coletiva', description: error.message, variant: 'destructive' });
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const filteredAlunos = (alunos || []).filter(a =>
        (a.nome || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.matricula || '').includes(search)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!turma) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500 font-bold">Turma não encontrada.</p>
                <Button onClick={() => navigate('/turmas')} variant="ghost" className="mt-4">
                    <ArrowLeft className="mr-2" /> Voltar
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-8 w-8 text-accent" />
                        <h1 className="text-3xl font-bold text-navy">Turma {turma.nome}</h1>
                    </div>
                    <p className="text-muted-foreground ml-10">Ano Letivo {turma.ano_letivo} • {alunos.length} Alunos</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/turmas')} className="text-navy">
                    <ArrowLeft className="mr-2" size={16} /> Voltar
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-military p-4">
                    <Label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Cerca Rápida</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar aluno nesta turma..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <div className="card-military p-4 border-accent/20 bg-accent/5">
                    <Label className="text-xs font-bold text-accent uppercase mb-2 block">Lançamento em Lote (Toda a Turma)</Label>
                    <div className="flex gap-2">
                        <Select value={bulkActionType} onValueChange={setBulkActionType}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Selecione a ação coletiva..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="coletivo">🎉 Elogio Coletivo (+0.20)</SelectItem>
                                <SelectItem value="individual">⭐ Elogio Individual (+0.50)</SelectItem>
                                <SelectItem value="mencao_honrosa">🏆 Menção Honrosa (+1.00)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            className="btn-gold"
                            size="sm"
                            onClick={handleBulkAction}
                            disabled={isBulkProcessing || alunos.length === 0}
                        >
                            {isBulkProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ShieldCheck className="h-4 w-4 mr-2" />
                            )}
                            Aplicar
                        </Button>
                    </div>
                </div>
            </div>

            {filteredAlunos.length === 0 ? (
                <div className="text-center py-12 bg-muted/10 rounded-lg border-2 border-dashed border-border text-muted-foreground italic">
                    Nenhum aluno encontrado nesta turma.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {filteredAlunos.map((aluno, index) => (
                            <motion.div
                                key={aluno.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.03 }}
                                onClick={() => navigate(`/alunos/${aluno.id}`)}
                                className="card-military p-4 cursor-pointer group hover:bg-navy/5 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border group-hover:border-accent">
                                        {aluno.foto_url && aluno.consentimento_imagem ? (
                                            <img src={aluno.foto_url} alt={aluno.nome} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="h-6 w-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-navy truncate group-hover:text-gold transition-colors">{aluno.nome}</h4>
                                        <p className="text-xs text-muted-foreground">Matrícula: {aluno.matricula || '---'}</p>
                                    </div>
                                    <GradeBadge nota={aluno.nota_disciplinar} />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
