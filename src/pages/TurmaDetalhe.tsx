import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Users, ArrowLeft, Loader2, User, Search, Award, AlertTriangle, ShieldCheck, FileText, Calendar, MoveHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { GradeBadge } from '@/components/GradeDisplay';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { DateInput } from '@/components/DateInput';
import { ELOGIO_VALORES, calculateAccumulationTerms } from '@/utils/gradeCalculation';

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
    const [turmas, setTurmas] = useState<Turma[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const navigate = useNavigate();

    // Form states for bulk actions (mirrored from AlunoDetalhe)
    const [anotacaoTipo, setAnotacaoTipo] = useState<string>('');
    const [anotacaoDesc, setAnotacaoDesc] = useState('');
    const [elogioTipo, setElogioTipo] = useState<string>('');
    const [elogioDesc, setElogioDesc] = useState('');
    const [faltaDataInicio, setFaltaDataInicio] = useState<Date | undefined>();
    const [faltaDataFim, setFaltaDataFim] = useState<Date | undefined>();
    const [faltaMotivo, setFaltaMotivo] = useState('');
    const [faltaDetalhes, setFaltaDetalhes] = useState('');
    const [novaTurmaId, setNovaTurmaId] = useState('');

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [{ data: turmaData }, { data: alunosData }, { data: allTurmas }] = await Promise.all([
                supabase.from('turmas').select('*').eq('id', id).single(),
                supabase.from('alunos').select('*').eq('turma_id', id).order('nome'),
                supabase.from('turmas').select('*').order('ano_letivo', { ascending: false })
            ]);

            if (turmaData) setTurma(turmaData);
            if (alunosData) setAlunos(alunosData as Aluno[]);
            if (allTurmas) setTurmas(allTurmas as Turma[]);
        } catch (error) {
            console.error('Erro ao carregar dados da turma:', error);
            setAlunos([]);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkAnotacao = async () => {
        if (!anotacaoTipo || !anotacaoDesc.trim()) {
            toast({ title: 'Preencha todos os campos', variant: 'destructive' });
            return;
        }
        if (!confirm(`Deseja aplicar esta anotação a todos os ${alunos.length} alunos?`)) return;

        setIsBulkProcessing(true);
        try {
            const anoLetivo = turma?.ano_letivo || new Date().getFullYear();

            for (const aluno of alunos) {
                let deltaTotal = 0;

                // 1. Inserir anotação
                await supabase.from('anotacoes').insert({
                    aluno_id: aluno.id,
                    tipo: anotacaoTipo as any,
                    descricao: anotacaoDesc,
                    lancado_por: user?.id,
                    ano_letivo: anoLetivo
                });

                // 2. Acúmulos (Busca individual para lógica exata)
                const { data: anotacoes } = await supabase.from('anotacoes').select('tipo').eq('aluno_id', aluno.id);

                // Use new helper function
                const currentAnotacoes = anotacoes || [];
                // Note: The helper assumes the new annotation is NOT in the list yet if we were passing in the list *before* insertion.
                // But here we just inserted it. 
                // However, our helper `calculateAccumulationTerms` logic:
                // "const newLeves = newAnotacaoTipo === 'leve' ? leves + 1 : leves;"
                // It ADDS the new type to the count.
                // So if we pass the list INCLUDING the new annotation, we would double count.
                // We should pass the list *excluding* the one we just added, OR adjust the helper.
                // 
                // Let's look at the helper again:
                // "const newLeves = newAnotacaoTipo === 'leve' ? leves + 1 : leves;"
                // It definitely expects `currentAnotacoes` to be the state BEFORE the new one.
                // But here we query AFTER insertion.
                // So we should filter out one instance of the new type from the count or simply pass the list WITHOUT the new one.
                // Since we query *after*, the list `anotacoes` has the new one.
                // Let's filter it out for the helper to work as designed, or just pass the list and slightly modify usage?
                // Actually, simpler: The helper logic allows testing "what if I add X".
                // If we already added X, we can just say "calculate accumulation based on these".
                // But the helper adds +1.
                // 
                // Let's rely on the fact that we can just pass the counts? No, the helper takes the array.
                // Let's just fetch the annotations ignoring the one we just created? Hard to distinguish.
                // BETTER STRATEGY: Fetch annotations *before* finding the new one? No, race conditions.
                // 
                // Let's just manually adjust the list passed to the helper.
                // If we just inserted 'leve', remove one 'leve' from the list we pass to the helper.

                const SafeAnotacoesForHelper = [...currentAnotacoes];
                const indexToRemove = SafeAnotacoesForHelper.findIndex(a => a.tipo === anotacaoTipo);
                if (indexToRemove >= 0) {
                    SafeAnotacoesForHelper.splice(indexToRemove, 1);
                }

                const newTerms = calculateAccumulationTerms(anotacaoTipo, SafeAnotacoesForHelper);

                for (const term of newTerms) {
                    await supabase.from('termos').insert({
                        aluno_id: aluno.id,
                        tipo: term.tipo as any,
                        valor_desconto: term.valor_desconto,
                        motivo: term.motivo + ' (coletiva)'
                    });
                    deltaTotal -= Number(term.valor_desconto);
                }

                // 3. Atualizar nota
                if (deltaTotal !== 0) {
                    const currentGrade = Number(aluno.nota_disciplinar) || 0;
                    await supabase.from('alunos').update({ nota_disciplinar: currentGrade + deltaTotal }).eq('id', aluno.id);
                }
            }

            toast({ title: 'Anotações registradas em lote!' });
            setAnotacaoTipo('');
            setAnotacaoDesc('');
            fetchData();
        } catch (error: any) {
            toast({ title: 'Erro no lançamento em lote', description: error.message, variant: 'destructive' });
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const handleBulkElogio = async () => {
        if (!elogioTipo) {
            toast({ title: 'Selecione o tipo', variant: 'destructive' });
            return;
        }
        if (!confirm(`Deseja aplicar este elogio a todos os ${alunos.length} alunos?`)) return;

        setIsBulkProcessing(true);
        try {
            const anoLetivo = turma?.ano_letivo || new Date().getFullYear();
            const delta = ELOGIO_VALORES[elogioTipo] || 0;

            for (const aluno of alunos) {
                await supabase.from('elogios').insert({
                    aluno_id: aluno.id,
                    tipo: elogioTipo as any,
                    descricao: elogioDesc || 'Elogio coletivo para a turma',
                    lancado_por: user?.id,
                    ano_letivo: anoLetivo
                });

                const currentGrade = Number(aluno.nota_disciplinar) || 0;
                await supabase.from('alunos').update({ nota_disciplinar: currentGrade + delta }).eq('id', aluno.id);
            }

            toast({ title: 'Elogios registrados em lote!' });
            setElogioTipo('');
            setElogioDesc('');
            fetchData();
        } catch (error: any) {
            toast({ title: 'Erro no lançamento em lote', description: error.message, variant: 'destructive' });
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const handleBulkFalta = async () => {
        if (!faltaDataInicio || !faltaDataFim || !faltaMotivo) {
            toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
            return;
        }
        if (!confirm(`Deseja registrar falta para todos os ${alunos.length} alunos?`)) return;

        setIsBulkProcessing(true);
        try {
            const anoLetivo = turma?.ano_letivo || new Date().getFullYear();

            for (const aluno of alunos) {
                await supabase.from('faltas').insert({
                    aluno_id: aluno.id,
                    data_inicio: format(faltaDataInicio, 'yyyy-MM-dd'),
                    data_fim: format(faltaDataFim, 'yyyy-MM-dd'),
                    motivo: faltaMotivo,
                    detalhes: faltaDetalhes || 'Falta coletiva registrada pela turma',
                    lancado_por: user?.id,
                    ano_letivo: anoLetivo
                });
            }

            toast({ title: 'Faltas registradas em lote!' });
            setFaltaDataInicio(undefined);
            setFaltaDataFim(undefined);
            setFaltaMotivo('');
            setFaltaDetalhes('');
            fetchData();
        } catch (error: any) {
            toast({ title: 'Erro no lançamento em lote', description: error.message, variant: 'destructive' });
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const handleBulkTransfer = async () => {
        if (!novaTurmaId) {
            toast({ title: 'Selecione a turma de destino', variant: 'destructive' });
            return;
        }
        if (novaTurmaId === id) {
            toast({ title: 'A turma de destino deve ser diferente da atual', variant: 'destructive' });
            return;
        }
        if (!confirm(`Deseja transferir todos os ${alunos.length} alunos para a nova turma?`)) return;

        setIsBulkProcessing(true);
        try {
            const { error } = await supabase
                .from('alunos')
                .update({ turma_id: novaTurmaId })
                .eq('turma_id', id);

            if (error) throw error;

            toast({ title: 'Transferência concluída!', description: `${alunos.length} alunos movidos.` });
            navigate('/turmas');
        } catch (error: any) {
            toast({ title: 'Erro na transferência', description: error.message, variant: 'destructive' });
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

                    <Tabs defaultValue="anotacoes" className="w-full">
                        <TabsList className="grid grid-cols-4 bg-muted/50 mb-4 h-9">
                            <TabsTrigger value="anotacoes" className="text-[10px] uppercase font-bold">Anotações</TabsTrigger>
                            <TabsTrigger value="elogios" className="text-[10px] uppercase font-bold">Elogios</TabsTrigger>
                            <TabsTrigger value="faltas" className="text-[10px] uppercase font-bold">Faltas</TabsTrigger>
                            <TabsTrigger value="transfer" className="text-[10px] uppercase font-bold">Mudar</TabsTrigger>
                        </TabsList>

                        <TabsContent value="anotacoes" className="space-y-3 mt-0">
                            <Select value={anotacaoTipo} onValueChange={setAnotacaoTipo}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="Tipo da anotação" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="leve">Leve (acumula)</SelectItem>
                                    <SelectItem value="media">Média (acumula)</SelectItem>
                                    <SelectItem value="grave">Grave (-0.50)</SelectItem>
                                    <SelectItem value="gravissima">Gravíssima (-1.00)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Textarea
                                placeholder="Descrição da anotação coletiva..."
                                value={anotacaoDesc}
                                onChange={e => setAnotacaoDesc(e.target.value)}
                                className="min-h-[60px] text-sm"
                            />
                            <Button className="w-full btn-military h-9" size="sm" onClick={handleBulkAnotacao} disabled={isBulkProcessing || alunos.length === 0}>
                                {isBulkProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                                Aplicar a Todos
                            </Button>
                        </TabsContent>

                        <TabsContent value="elogios" className="space-y-3 mt-0">
                            <Select value={elogioTipo} onValueChange={setElogioTipo}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="Tipo do elogio" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="coletivo">🎉 Coletivo (+0.20)</SelectItem>
                                    <SelectItem value="individual">⭐ Individual (+0.40)</SelectItem>
                                    <SelectItem value="mencao_honrosa">🏆 Menção Honrosa (+0.60)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Textarea
                                placeholder="Descrição do elogio coletivo..."
                                value={elogioDesc}
                                onChange={e => setElogioDesc(e.target.value)}
                                className="min-h-[60px] text-sm"
                            />
                            <Button className="w-full btn-gold h-9" size="sm" onClick={handleBulkElogio} disabled={isBulkProcessing || alunos.length === 0}>
                                {isBulkProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4 mr-2" />}
                                Elogiar Todos
                            </Button>
                        </TabsContent>

                        <TabsContent value="faltas" className="space-y-2 mt-0">
                            <div className="grid grid-cols-2 gap-2">
                                <DateInput label="Início" date={faltaDataInicio} setDate={setFaltaDataInicio} />
                                <DateInput label="Fim" date={faltaDataFim} setDate={setFaltaDataFim} />
                            </div>
                            <Input placeholder="Motivo da falta coletiva" value={faltaMotivo} onChange={e => setFaltaMotivo(e.target.value)} className="h-9 text-sm" />
                            <Button className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white" size="sm" onClick={handleBulkFalta} disabled={isBulkProcessing || alunos.length === 0}>
                                {isBulkProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
                                Registrar Faltas
                            </Button>
                        </TabsContent>

                        <TabsContent value="transfer" className="space-y-3 mt-0">
                            <Label className="text-[10px] text-muted-foreground uppercase">Nova Turma de Destino</Label>
                            <Select value={novaTurmaId} onValueChange={setNovaTurmaId}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="Selecione a turma..." /></SelectTrigger>
                                <SelectContent>
                                    {turmas.filter(t => t.id !== id).map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.nome} - {t.ano_letivo}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button className="w-full h-9 bg-orange-600 hover:bg-orange-700 text-white" size="sm" onClick={handleBulkTransfer} disabled={isBulkProcessing || alunos.length === 0}>
                                {isBulkProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoveHorizontal className="h-4 w-4 mr-2" />}
                                Transferir Alunos
                            </Button>
                        </TabsContent>
                    </Tabs>
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
