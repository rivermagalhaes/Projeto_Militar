import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { calculateGrade, ELOGIO_VALORES, calculateAccumulationTerms } from '@/utils/gradeCalculation';
import { Layout } from '@/components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Loader2, Trash2, Award, AlertTriangle, FileText, Calendar, Filter, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateInput } from '@/components/DateInput';
import { GradeDisplay } from '@/components/GradeDisplay';



const ANOTACAO_LABELS: Record<string, string> = {
  leve: 'Leve',
  media: 'Média',
  grave: 'Grave',
  gravissima: 'Gravíssima'
};

const ELOGIO_LABELS: Record<string, string> = {
  coletivo: 'Coletivo',
  individual: 'Individual',
  mencao_honrosa: 'Menção Honrosa'
};

const TERMO_LABELS: Record<string, string> = {
  leve: 'Leve',
  medio: 'Médio',
  grave: 'Grave',
  gravissimo: 'Gravíssimo'
};

interface HistoricoItem {
  id: string;
  category: 'anotacao' | 'elogio' | 'termo' | 'falta';
  tipo: string;
  label: string;
  descricao: string;
  peso: string;
  created_at: string;
  ano_letivo?: number;
  profile?: { nome: string };
}

export default function AlunoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [aluno, setAluno] = useState<any>(null);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Separated history states
  const [anotacoesHist, setAnotacoesHist] = useState<HistoricoItem[]>([]);
  const [termosHist, setTermosHist] = useState<HistoricoItem[]>([]);
  const [elogiosHist, setElogiosHist] = useState<HistoricoItem[]>([]);
  const [faltasHist, setFaltasHist] = useState<HistoricoItem[]>([]);

  // Year filter
  const [filterAno, setFilterAno] = useState<string>('all');
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);

  const [anotacaoTipo, setAnotacaoTipo] = useState<string>('');
  const [anotacaoDesc, setAnotacaoDesc] = useState('');
  const [elogioTipo, setElogioTipo] = useState<string>('');
  const [elogioDesc, setElogioDesc] = useState('');
  const [novaTurma, setNovaTurma] = useState('');

  // Faltas form state
  const [faltaDataInicio, setFaltaDataInicio] = useState<Date | undefined>();
  const [faltaDataFim, setFaltaDataFim] = useState<Date | undefined>();
  const [faltaMotivo, setFaltaMotivo] = useState('');
  const [faltaDetalhes, setFaltaDetalhes] = useState('');

  // Photo upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAluno();
    fetchTurmas();
    fetchAllHistorico();
  }, [id]);

  const handlePhotoUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast({ title: 'Apenas JPG ou PNG são permitidos', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Imagem muito grande (máx. 5MB)', variant: 'destructive' });
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileName = `${aluno?.matricula || 'foto'}-${Date.now()}.${file.name.split('.').pop()}`;

      const { error: uploadError } = await supabase.storage
        .from('fotos_alunos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('fotos_alunos')
        .getPublicUrl(fileName);

      const photoUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('alunos')
        .update({ foto_url: photoUrl })
        .eq('id', id);

      if (updateError) throw updateError;

      setAluno((prev: any) => ({ ...prev, foto_url: photoUrl }));
      toast({ title: 'Foto atualizada com sucesso!' });
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar foto', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchAluno = async () => {
    const { data } = await supabase.from('alunos').select('*, turma:turmas(nome, ano_letivo)').eq('id', id).single();
    if (data) setAluno(data);
    setLoading(false);
  };

  const fetchTurmas = async () => {
    const { data } = await supabase.from('turmas').select('*').order('ano_letivo', { ascending: false });
    if (data) setTurmas(data);
  };

  const fetchAllHistorico = async () => {
    const [anotacoes, elogios, termos, faltas, profiles] = await Promise.all([
      supabase.from('anotacoes').select('*').eq('aluno_id', id).order('created_at', { ascending: false }),
      supabase.from('elogios').select('*').eq('aluno_id', id).order('created_at', { ascending: false }),
      supabase.from('termos').select('*').eq('aluno_id', id).order('created_at', { ascending: false }),
      supabase.from('faltas').select('*').eq('aluno_id', id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, nome'),
    ]);

    // Create a lookup map for profiles
    const profilesMap = new Map<string, string>();
    profiles.data?.forEach(p => profilesMap.set(p.id, p.nome));

    // Collect all years
    const anos = new Set<number>();

    // Map anotações
    const anotacoesFormatted: HistoricoItem[] = (anotacoes.data || []).map(a => {
      const ano = a.ano_letivo || new Date(a.created_at).getFullYear();
      anos.add(ano);
      return {
        id: a.id,
        category: 'anotacao' as const,
        tipo: a.tipo,
        label: ANOTACAO_LABELS[a.tipo] || a.tipo,
        descricao: a.descricao,
        peso: a.tipo === 'grave' ? '-0.50' : a.tipo === 'gravissima' ? '-1.00' : '0.00',
        created_at: a.created_at || '',
        ano_letivo: ano,
        profile: a.lancado_por ? { nome: profilesMap.get(a.lancado_por) || '-' } : undefined
      };
    });

    // Map termos
    const termosFormatted: HistoricoItem[] = (termos.data || []).map(t => {
      const ano = new Date(t.created_at).getFullYear();
      anos.add(ano);
      return {
        id: t.id,
        category: 'termo' as const,
        tipo: t.tipo,
        label: `Termo ${TERMO_LABELS[t.tipo] || t.tipo}`,
        descricao: t.motivo || 'Aplicado automaticamente',
        peso: `-${Number(t.valor_desconto).toFixed(2)}`,
        created_at: t.created_at || '',
        ano_letivo: ano,
        profile: undefined
      };
    });

    // Map elogios
    const elogiosFormatted: HistoricoItem[] = (elogios.data || []).map(e => {
      const ano = e.ano_letivo || new Date(e.created_at).getFullYear();
      anos.add(ano);
      return {
        id: e.id,
        category: 'elogio' as const,
        tipo: e.tipo,
        label: ELOGIO_LABELS[e.tipo] || e.tipo,
        descricao: e.descricao || '',
        peso: `+${ELOGIO_VALORES[e.tipo]?.toFixed(2) || '0.00'}`,
        created_at: e.created_at || '',
        ano_letivo: ano,
        profile: e.lancado_por ? { nome: profilesMap.get(e.lancado_por) || '-' } : undefined
      };
    });

    // Map faltas
    const faltasFormatted: HistoricoItem[] = (faltas.data || []).map(f => {
      const ano = f.ano_letivo || new Date(f.created_at).getFullYear();
      anos.add(ano);
      return {
        id: f.id,
        category: 'falta' as const,
        tipo: 'falta',
        label: f.motivo,
        descricao: f.detalhes || `${format(new Date(f.data_inicio), 'dd/MM/yyyy')} a ${format(new Date(f.data_fim), 'dd/MM/yyyy')}`,
        peso: '0.00',
        created_at: f.created_at,
        ano_letivo: ano,
        profile: f.lancado_por ? { nome: profilesMap.get(f.lancado_por) || '-' } : undefined
      };
    });

    setAnotacoesHist(anotacoesFormatted);
    setTermosHist(termosFormatted);
    setElogiosHist(elogiosFormatted);
    setFaltasHist(faltasFormatted);
    setAnosDisponiveis([...anos].sort((a, b) => b - a));
  };



  /**
   * Atualiza a nota do aluno no banco de dados de forma incremental.
   * Respeita o valor ATUAL salvo no banco.
   * 
   * @param delta Valor a ser somado ou subtraído da nota atual
   */
  const atualizarNotaIncremental = async (delta: number) => {
    if (delta === 0) return;

    try {
      // 1. Busca nota atual diretamente do banco para garantir consistência
      const { data: currentData, error: fetchError } = await supabase
        .from('alunos')
        .select('nota_disciplinar')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const notaAtual = Number(currentData.nota_disciplinar) || 0;
      const novaNota = notaAtual + delta;

      // 2. Persiste o novo valor
      const { error: updateError } = await supabase
        .from('alunos')
        .update({ nota_disciplinar: novaNota })
        .eq('id', id);

      if (updateError) throw updateError;

      // 3. Sincroniza estado local
      setAluno((prev: any) => prev ? { ...prev, nota_disciplinar: novaNota } : null);

    } catch (error) {
      console.error('Erro ao atualizar nota incremental:', error);
      toast({
        title: 'Erro no cálculo da nota',
        description: 'Não foi possível atualizar o valor final. O registro foi salvo, mas a nota pode estar dessincronizada.',
        variant: 'destructive'
      });
    }
  };

  /**
   * Recálculo total de segurança (PODE ser usado se necessário, 
   * mas priorizamos o incremental).
   * ATENÇÃO: Se usarmos esta função, precisamos do valor inicial do aluno.
   * Como não temos campo de valor inicial separado, esta função assume o valor
   * que estava no momento da criação.
   */
  const recalcularNotaTotal = async () => {
    // Nota: Esta função só é 100% segura se tivermos um campo 'nota_inicial'.
    // Com a regra de "partir do valor salvo", o ideal é o incremental.
    // Manteremos apenas para debug se necessário, mas as ações usarão incremental.
    fetchAluno();
  };

  const getCurrentAnoLetivo = (): number => {
    return aluno?.turma?.ano_letivo || new Date().getFullYear();
  };

  const handleAnotacao = async () => {
    if (!anotacaoTipo || !anotacaoDesc.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    setSaving(true);

    const anoLetivo = getCurrentAnoLetivo();
    let deltaTotal = 0;

    // 1. Inserir anotação
    await supabase.from('anotacoes').insert({
      aluno_id: id as string,
      tipo: anotacaoTipo as 'leve' | 'media' | 'grave' | 'gravissima',
      descricao: anotacaoDesc,
      lancado_por: user?.id,
      ano_letivo: anoLetivo
    });

    // 2. Verificar acúmulos e aplicar termos (que geram desconto na nota)
    // 2. Verificar acúmulos e aplicar termos (que geram desconto na nota)
    const { data: anotacoes } = await supabase.from('anotacoes').select('tipo').eq('aluno_id', id as string);
    const currentAnotacoes = anotacoes || [];

    // NOTE: We just inserted the annotation, so it IS in the list returned by select.
    // However, our helper calculates accumulation assuming we represent the state BEFORE adding the new one + the new one type.
    // If we pass the list WITH the new one, it might double count or misinterpret.
    // "const newLeves = newAnotacaoTipo === 'leve' ? leves + 1 : leves;"
    // So we must remove ONE instance of the current type from the list to simulate "previous state".

    const SafeAnotacoesForHelper = [...currentAnotacoes];
    const indexToRemove = SafeAnotacoesForHelper.findIndex(a => a.tipo === anotacaoTipo);
    if (indexToRemove >= 0) {
      SafeAnotacoesForHelper.splice(indexToRemove, 1);
    }

    const newTerms = calculateAccumulationTerms(anotacaoTipo, SafeAnotacoesForHelper);

    for (const term of newTerms) {
      await supabase.from('termos').insert({
        aluno_id: id,
        tipo: term.tipo as any,
        valor_desconto: term.valor_desconto,
        motivo: term.motivo
      });
      deltaTotal -= Number(term.valor_desconto);
    }

    // 3. Atualizar nota se houver delta
    if (deltaTotal !== 0) {
      await atualizarNotaIncremental(deltaTotal);
    }

    fetchAllHistorico();
    setAnotacaoTipo('');
    setAnotacaoDesc('');
    setSaving(false);
    toast({ title: 'Anotação registrada!' });
  };

  const handleElogio = async () => {
    if (!elogioTipo) { toast({ title: 'Selecione o tipo', variant: 'destructive' }); return; }
    setSaving(true);

    const anoLetivo = getCurrentAnoLetivo();
    const delta = ELOGIO_VALORES[elogioTipo] || 0;

    await supabase.from('elogios').insert({
      aluno_id: id as string,
      tipo: elogioTipo as 'coletivo' | 'individual' | 'mencao_honrosa',
      descricao: elogioDesc,
      lancado_por: user?.id,
      ano_letivo: anoLetivo
    });

    await atualizarNotaIncremental(delta);
    fetchAllHistorico();
    setElogioTipo('');
    setElogioDesc('');
    setSaving(false);
    toast({ title: 'Elogio registrado!' });
  };

  const handleMudarTurma = async () => {
    if (!novaTurma) {
      toast({ title: 'Selecione uma turma', variant: 'destructive' });
      return;
    }
    if (novaTurma === aluno.turma_id) {
      toast({ title: 'Aluno já está nesta turma', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('alunos').update({ turma_id: novaTurma }).eq('id', id);
    if (error) {
      toast({ title: 'Erro ao mudar turma', variant: 'destructive' });
    } else {
      fetchAluno();
      toast({ title: 'Turma atualizada com sucesso!' });
      setNovaTurma('');
    }
  };

  const handleArquivar = async () => {
    await supabase.from('alunos').update({ arquivado: true }).eq('id', id);
    toast({ title: 'Aluno arquivado' });
    navigate('/alunos');
  };

  const handleDeleteHistorico = async (item: HistoricoItem) => {
    let error = null;
    let deltaReverso = 0;

    // Calcular o delta inverso para anular a operação
    if (item.category === 'elogio') {
      deltaReverso = -(ELOGIO_VALORES[item.tipo] || 0);
    } else if (item.category === 'termo') {
      // O 'peso' no frontend é exibido como "-0.50", então transformamos de volta
      deltaReverso = Math.abs(Number(item.peso));
    }

    if (item.category === 'anotacao') {
      const result = await supabase.from('anotacoes').delete().eq('id', item.id);
      error = result.error;
    } else if (item.category === 'elogio') {
      const result = await supabase.from('elogios').delete().eq('id', item.id);
      error = result.error;
    } else if (item.category === 'termo') {
      const result = await supabase.from('termos').delete().eq('id', item.id);
      error = result.error;
    } else if (item.category === 'falta') {
      const result = await supabase.from('faltas').delete().eq('id', item.id);
      error = result.error;
    }

    if (error) {
      toast({ title: 'Erro ao remover registro', variant: 'destructive' });
    } else {
      if (deltaReverso !== 0) {
        await atualizarNotaIncremental(deltaReverso);
      }
      fetchAllHistorico();
      toast({ title: 'Registro removido com sucesso!' });
    }
  };

  const handleFalta = async () => {
    if (!faltaDataInicio || !faltaDataFim || !faltaMotivo) {
      toast({ title: 'Preencha data início, data fim e motivo', variant: 'destructive' });
      return;
    }
    if (faltaDataFim < faltaDataInicio) {
      toast({ title: 'Data fim deve ser maior ou igual à data início', variant: 'destructive' });
      return;
    }
    setSaving(true);

    const anoLetivo = getCurrentAnoLetivo();

    const { error } = await supabase.from('faltas').insert({
      aluno_id: id,
      data_inicio: format(faltaDataInicio, 'yyyy-MM-dd'),
      data_fim: format(faltaDataFim, 'yyyy-MM-dd'),
      motivo: faltaMotivo,
      detalhes: faltaDetalhes || null,
      lancado_por: user?.id,
      ano_letivo: anoLetivo
    });

    if (error) {
      toast({ title: 'Erro ao registrar falta', variant: 'destructive' });
    } else {
      toast({ title: 'Falta registrada!' });
      setFaltaDataInicio(undefined);
      setFaltaDataFim(undefined);
      setFaltaMotivo('');
      setFaltaDetalhes('');
      fetchAllHistorico();
    }
    setSaving(false);
  };

  // Filter items by year
  const filterByYear = (items: HistoricoItem[]) => {
    if (filterAno === 'all') return items;
    return items.filter(item => item.ano_letivo?.toString() === filterAno);
  };

  // Render history table
  const renderHistoryTable = (items: HistoricoItem[], category: string) => {
    const filteredItems = filterByYear(items);

    if (filteredItems.length === 0) {
      return <p className="text-muted-foreground py-4">Nenhum registro {filterAno !== 'all' ? `em ${filterAno}` : ''}</p>;
    }

    return (
      <div className="space-y-4">
        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2">Data</th>
                <th className="text-left p-2">Ano</th>
                <th className="text-left p-2">Tipo</th>
                <th className="text-left p-2">Categoria</th>
                <th className="text-left p-2">Descrição</th>
                <th className="text-right p-2">Peso</th>
                <th className="text-left p-2">Lançado por</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredItems.map(item => (
                  <motion.tr
                    key={`${item.category}-${item.id}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="border-b border-muted hover:bg-muted/50"
                  >
                    <td className="p-2 whitespace-nowrap">
                      {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </td>
                    <td className="p-2 font-mono text-xs">
                      {item.ano_letivo}
                    </td>
                    <td className="p-2">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                        item.category === 'elogio' ? 'bg-primary/20 text-primary' :
                          item.category === 'termo' ? 'bg-destructive/20 text-destructive' :
                            item.category === 'falta' ? 'bg-blue-500/20 text-blue-600' :
                              'bg-orange-500/20 text-orange-600'
                      )}>
                        {item.category === 'elogio' ? <Award className="h-3 w-3" /> :
                          item.category === 'termo' ? <FileText className="h-3 w-3" /> :
                            item.category === 'falta' ? <Calendar className="h-3 w-3" /> :
                              <AlertTriangle className="h-3 w-3" />}
                        {item.category === 'elogio' ? 'Elogio' :
                          item.category === 'termo' ? 'Termo' :
                            item.category === 'falta' ? 'Falta' : 'Anotação'}
                      </span>
                    </td>
                    <td className="p-2">{item.label}</td>
                    <td className="p-2 max-w-xs truncate" title={item.descricao || '-'}>
                      {item.descricao || '-'}
                    </td>
                    <td className={cn(
                      'p-2 text-right font-mono',
                      item.peso.startsWith('+') ? 'text-primary' :
                        item.peso === '0.00' ? 'text-muted-foreground' : 'text-destructive'
                    )}>
                      {item.peso}
                    </td>
                    <td className="p-2 text-muted-foreground">
                      {item.profile?.nome || '-'}
                    </td>
                    <td className="p-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              A nota será recalculada após a exclusão.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Não</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteHistorico(item)}>Sim</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Mobile View - Cards */}
        <div className="md:hidden space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredItems.map(item => (
              <motion.div
                key={`card-${item.category}-${item.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border rounded-lg p-4 shadow-sm relative overflow-hidden"
              >
                {/* Top Row: Type and Weight */}
                <div className="flex justify-between items-start mb-3">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
                    item.category === 'elogio' ? 'bg-primary/20 text-primary' :
                      item.category === 'termo' ? 'bg-destructive/10 text-destructive' :
                        item.category === 'falta' ? 'bg-blue-500/10 text-blue-600' :
                          'bg-orange-500/10 text-orange-600'
                  )}>
                    {item.category === 'elogio' ? <Award className="h-3.5 w-3.5" /> :
                      item.category === 'termo' ? <FileText className="h-3.5 w-3.5" /> :
                        item.category === 'falta' ? <Calendar className="h-3.5 w-3.5" /> :
                          <AlertTriangle className="h-3.5 w-3.5" />}
                    {item.category === 'elogio' ? 'Elogio' :
                      item.category === 'termo' ? 'Termo' :
                        item.category === 'falta' ? 'Falta' : 'Anotação'}
                  </span>
                  <span className={cn(
                    'font-mono font-bold text-sm bg-muted/50 px-2 py-0.5 rounded',
                    item.peso.startsWith('+') ? 'text-primary' :
                      item.peso === '0.00' ? 'text-muted-foreground' : 'text-destructive'
                  )}>
                    {item.peso}
                  </span>
                </div>

                {/* Data and Label */}
                <div className="mb-3">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">
                    {format(new Date(item.created_at), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <h3 className="text-base font-bold text-foreground leading-tight">{item.label}</h3>
                </div>

                {/* Description */}
                {item.descricao && (
                  <div className="bg-muted/30 rounded p-3 mb-3 border-l-2 border-muted">
                    <p className="text-sm text-foreground/90 whitespace-normal break-words leading-relaxed italic">
                      "{item.descricao}"
                    </p>
                  </div>
                )}

                {/* Footer: Prof and Actions */}
                <div className="flex justify-between items-center pt-2 border-t border-border/50 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    Por: <span className="font-medium text-foreground">{item.profile?.nome || '-'}</span>
                  </span>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4 mr-1" /> Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          A nota será recalculada após a exclusão.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Não</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteHistorico(item)}>Sim</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Decorative side accent */}
                <div className={cn(
                  "absolute top-0 left-0 w-1 h-full",
                  item.category === 'elogio' ? 'bg-primary' :
                    item.category === 'termo' ? 'bg-destructive' :
                      item.category === 'falta' ? 'bg-blue-500' :
                        'bg-orange-500'
                )} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  if (loading) return <Layout><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div></Layout>;
  if (!aluno) return <Layout><p>Aluno não encontrado</p></Layout>;

  // Combine anotações e termos for the first tab
  const anotacoesETermos = [...anotacoesHist, ...termosHist].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Layout>
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/alunos')}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>

        <div className="card-military p-6">
          {/* Badge Matrícula no topo */}
          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
            {/* Avatar Foto */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative mx-auto md:mx-0 w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-accent bg-muted shrink-0 cursor-pointer group shadow-xl order-1 md:order-none"
            >
              {aluno.foto_url ? (
                <img
                  src={aluno.foto_url}
                  alt={aluno.nome}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                  <span className="text-2xl md:text-4xl font-serif font-bold text-primary">
                    {aluno.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
              )}
              {/* Glow overlay on hover */}
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-[#D4AF37]/30 to-transparent" />

              {/* Photo Update Button */}
              <div className="absolute bottom-0 right-0 z-20">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 rounded-full shadow-lg border-2 border-background hover:bg-accent hover:text-accent-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  disabled={uploadingPhoto}
                  title="Alterar foto"
                >
                  {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpdate}
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                />
              </div>
            </motion.div>

            <div className="flex-1 text-center md:text-left order-2 md:order-none space-y-2 md:space-y-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold leading-tight">{aluno.nome}</h1>
                <p className="text-muted-foreground text-sm md:text-base mt-1">
                  {aluno.turma?.nome ? `${aluno.turma.nome} - ${aluno.turma.ano_letivo}` : 'Sem turma'} • {aluno.turno} • Entrada: {aluno.ano_entrada}
                </p>
              </div>

              {/* Matrícula no mobile fica aqui, no desktop fica no topo direito */}
              {aluno.matricula && (
                <div className="flex justify-center md:justify-end md:absolute md:top-6 md:right-6">
                  <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-mono font-bold shadow-lg text-sm md:text-base">
                    <span className="text-sm md:text-lg">#</span>
                    Matrícula: {aluno.matricula}
                  </span>
                </div>
              )}

              <div className="pt-1">
                <p className="text-sm text-muted-foreground">Nascimento: {aluno.data_nascimento.split('-').reverse().join('/')}</p>
                {aluno.cpf && <p className="text-sm text-muted-foreground">CPF: {aluno.cpf}</p>}
              </div>
            </div>

            {/* Grade Display - Large centered card com animações e mensagem */}
            <div className="bg-muted/50 rounded-xl p-4 md:p-6 border border-border w-full md:min-w-[280px] order-3 md:order-none">
              <p className="text-sm md:text-sm text-muted-foreground mb-3 text-center font-medium">Nota Disciplinar</p>
              <GradeDisplay
                nota={Number(aluno.nota_disciplinar)}
                size="lg"
                showProgress
                showBadge
                showMessage
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Dialog>
              <DialogTrigger asChild><Button variant="outline">Mudar Turma</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Mudar Turma</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground mb-2">
                  Turma atual: {aluno.turma ? `${aluno.turma.ano_letivo} - ${aluno.turma.nome}` : 'Sem turma'}
                </p>
                <Select value={novaTurma} onValueChange={setNovaTurma}>
                  <SelectTrigger><SelectValue placeholder="Selecione a nova turma" /></SelectTrigger>
                  <SelectContent>
                    {turmas
                      .filter(t => t.id !== aluno.turma_id)
                      .map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nome} - {t.ano_letivo}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleMudarTurma} className="btn-military">Salvar</Button>
              </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive">Arquivar</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Arquivar aluno?</AlertDialogTitle>
                  <AlertDialogDescription>O aluno será removido da lista ativa.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleArquivar}>Confirmar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Lançar section */}
        <Tabs defaultValue="anotacoes" className="w-full">
          <TabsList className="flex flex-col h-auto md:grid md:grid-cols-3 md:h-10 bg-muted/30 p-1 md:bg-muted">
            <TabsTrigger value="anotacoes" className="w-full py-2 md:py-1.5 focus:z-10">Lançar Anotações</TabsTrigger>
            <TabsTrigger value="elogios" className="w-full py-2 md:py-1.5 focus:z-10">Lançar Elogios</TabsTrigger>
            <TabsTrigger value="faltas" className="w-full py-2 md:py-1.5 focus:z-10">Lançar Faltas</TabsTrigger>
          </TabsList>
          <TabsContent value="anotacoes" className="card-military p-4 mt-6">
            <div className="space-y-4">
              <Select value={anotacaoTipo} onValueChange={setAnotacaoTipo}>
                <SelectTrigger><SelectValue placeholder="Tipo da anotação" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="leve">Leve (acumula)</SelectItem>
                  <SelectItem value="media">Média (acumula)</SelectItem>
                  <SelectItem value="grave">Grave (-0.50)</SelectItem>
                  <SelectItem value="gravissima">Gravíssima (-1.00)</SelectItem>
                </SelectContent>
              </Select>
              <Textarea placeholder="Descrição..." value={anotacaoDesc} onChange={e => setAnotacaoDesc(e.target.value)} />
              <Button onClick={handleAnotacao} disabled={saving} className="btn-military">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar'}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="elogios" className="card-military p-4 mt-6">
            <div className="space-y-4">
              <Select value={elogioTipo} onValueChange={setElogioTipo}>
                <SelectTrigger><SelectValue placeholder="Tipo do elogio" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="coletivo">Coletivo (+0.20)</SelectItem>
                  <SelectItem value="individual">Individual (+0.40)</SelectItem>
                  <SelectItem value="mencao_honrosa">Menção Honrosa (+0.60)</SelectItem>
                </SelectContent>
              </Select>
              <Textarea placeholder="Descrição (opcional)" value={elogioDesc} onChange={e => setElogioDesc(e.target.value)} />
              <Button onClick={handleElogio} disabled={saving} className="btn-gold">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar'}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="faltas" className="card-military p-4 mt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Data Início</label>
                  <DateInput value={faltaDataInicio} onChange={setFaltaDataInicio} placeholder="DD/MM/AAAA" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Data Fim</label>
                  <DateInput value={faltaDataFim} onChange={setFaltaDataFim} placeholder="DD/MM/AAAA" />
                </div>
              </div>
              <Select value={faltaMotivo} onValueChange={setFaltaMotivo}>
                <SelectTrigger><SelectValue placeholder="Motivo da falta" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Justificada por documento interno">Justificada por documento interno</SelectItem>
                  <SelectItem value="Atestado médico">Atestado médico</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Detalhes adicionais (opcional)"
                value={faltaDetalhes}
                onChange={e => setFaltaDetalhes(e.target.value)}
              />
              <Button onClick={handleFalta} disabled={saving} className="btn-military">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrar Falta'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Histórico Separado em Abas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-military p-4 mt-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h3 className="font-serif font-bold text-lg">Histórico Completo</h3>

            {/* Filtro por ano */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterAno} onValueChange={setFilterAno}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filtrar ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  {anosDisponiveis.map(ano => (
                    <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="anotacoes-termos" className="w-full">
            <TabsList className="flex flex-col h-auto md:grid md:grid-cols-3 md:h-10 bg-muted/30 p-1 md:bg-muted">
              <TabsTrigger value="anotacoes-termos" className="flex items-center justify-center gap-2 py-2 md:py-1.5 focus:z-10">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Anotações e Termos ({filterByYear(anotacoesETermos).length})</span>
              </TabsTrigger>
              <TabsTrigger value="elogios" className="flex items-center justify-center gap-2 py-2 md:py-1.5 focus:z-10">
                <Award className="h-4 w-4 shrink-0" />
                <span>Elogios ({filterByYear(elogiosHist).length})</span>
              </TabsTrigger>
              <TabsTrigger value="faltas" className="flex items-center justify-center gap-2 py-2 md:py-1.5 focus:z-10">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>Faltas ({filterByYear(faltasHist).length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="anotacoes-termos" className="mt-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {renderHistoryTable(anotacoesETermos, 'anotacoes-termos')}
              </motion.div>
            </TabsContent>

            <TabsContent value="elogios" className="mt-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {renderHistoryTable(elogiosHist, 'elogios')}
              </motion.div>
            </TabsContent>

            <TabsContent value="faltas" className="mt-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {renderHistoryTable(faltasHist, 'faltas')}
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
}
