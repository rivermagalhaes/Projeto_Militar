import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { DateInput } from '@/components/DateInput';
import { format } from 'date-fns';
import { Search, Plus, Users, Loader2, Archive, RotateCcw, Trash2, Camera, User, IdCard } from 'lucide-react';
import { GradeBadge } from '@/components/GradeDisplay';

interface Aluno {
  id: string;
  nome: string;
  data_nascimento: string;
  matricula: string | null;
  cpf: string | null;
  ano_entrada: number;
  turma_id: string | null;
  turno: 'matutino' | 'vespertino';
  nota_disciplinar: number;
  arquivado: boolean;
  foto_url: string | null;
  consentimento_lgpd: boolean;
  consentimento_imagem: boolean;
  turma?: {
    nome: string;
  };
}

interface Turma {
  id: string;
  nome: string;
  ano_letivo?: number;
}

export default function Alunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunosArquivados, setAlunosArquivados] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchNome, setSearchNome] = useState('');
  const [filterTurma, setFilterTurma] = useState<string>('all');
  const [filterAno, setFilterAno] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [formNome, setFormNome] = useState('');
  const [formMatricula, setFormMatricula] = useState('');
  const [formDataNascimento, setFormDataNascimento] = useState<Date>();
  const [formAnoEntrada, setFormAnoEntrada] = useState(new Date().getFullYear().toString());
  const [formTurmaId, setFormTurmaId] = useState('');
  const [formTurno, setFormTurno] = useState<'matutino' | 'vespertino'>('matutino');
  const [formNotaInicial, setFormNotaInicial] = useState('8.00');
  const [formFotoFile, setFormFotoFile] = useState<File | null>(null);
  const [formFotoPreview, setFormFotoPreview] = useState<string | null>(null);
  const [formConsentimentoLgpd, setFormConsentimentoLgpd] = useState(false);
  const [formConsentimentoImagem, setFormConsentimentoImagem] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAlunos();
    fetchTurmas();
  }, []);

  const fetchAlunos = async () => {
    const [ativos, arquivados] = await Promise.all([
      supabase.from('alunos').select('*, turma:turmas(nome)').eq('arquivado', false).order('nome'),
      supabase.from('alunos').select('*, turma:turmas(nome)').eq('arquivado', true).order('nome')
    ]);

    if (ativos.data) setAlunos(ativos.data as Aluno[]);
    if (arquivados.data) setAlunosArquivados(arquivados.data as Aluno[]);
    setLoading(false);
  };

  const fetchTurmas = async () => {
    const { data } = await supabase.from('turmas').select('id, nome, ano_letivo').order('nome');
    if (data) setTurmas(data);
  };

  const validateNome = (nome: string): boolean => {
    const regex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
    return regex.test(nome) && nome.trim().length > 0;
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        toast({ title: 'Apenas JPG ou PNG são permitidos', variant: 'destructive' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Imagem muito grande (máx. 5MB)', variant: 'destructive' });
        return;
      }
      setFormFotoFile(file);
      setFormFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleAddAluno = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateNome(formNome)) {
      toast({
        title: 'Erro de validação',
        description: 'Nome deve conter apenas letras, acentos, espaços, hífens e apóstrofos.',
        variant: 'destructive',
      });
      return;
    }

    if (!formMatricula.trim()) {
      toast({
        title: 'Erro de validação',
        description: 'Matrícula é obrigatória.',
        variant: 'destructive',
      });
      return;
    }

    // Validate matricula is only digits
    if (!/^\d+$/.test(formMatricula.trim())) {
      toast({
        title: 'Matrícula inválida',
        description: 'Matrícula deve conter apenas números.',
        variant: 'destructive',
      });
      return;
    }

    if (!formDataNascimento) {
      toast({
        title: 'Erro de validação',
        description: 'Data de nascimento é obrigatória.',
        variant: 'destructive',
      });
      return;
    }

    if (formDataNascimento > new Date()) {
      toast({
        title: 'Erro de validação',
        description: 'Data de nascimento não pode ser no futuro.',
        variant: 'destructive',
      });
      return;
    }

    if (!formConsentimentoLgpd) {
      toast({
        title: 'Consentimento LGPD necessário',
        description: 'É necessário aceitar os termos de consentimento.',
        variant: 'destructive',
      });
      return;
    }

    // Validate nota - allow any valid number
    const notaNum = parseFloat(formNotaInicial);
    if (isNaN(notaNum)) {
      toast({
        title: 'Erro de validação',
        description: 'Nota deve ser um número válido.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      let fotoUrl: string | null = null;

      // Upload photo if exists and has consent
      if (formFotoFile && formConsentimentoImagem) {
        const fileName = `${formMatricula}-${Date.now()}.${formFotoFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('fotos_alunos')
          .upload(fileName, formFotoFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('fotos_alunos')
          .getPublicUrl(fileName);

        fotoUrl = urlData.publicUrl;
      }

      // Format date correctly without timezone issues - use local date parts
      const year = formDataNascimento.getFullYear();
      const month = String(formDataNascimento.getMonth() + 1).padStart(2, '0');
      const day = String(formDataNascimento.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      console.log('[Alunos] Saving birth date:', {
        input: formDataNascimento.toISOString(),
        formatted: formattedDate,
        day, month, year
      });

      const { error } = await supabase
        .from('alunos')
        .insert({
          nome: formNome.trim(),
          matricula: formMatricula.trim(),
          data_nascimento: formattedDate,
          ano_entrada: parseInt(formAnoEntrada),
          turma_id: formTurmaId || null,
          turno: formTurno,
          nota_disciplinar: notaNum,
          foto_url: fotoUrl,
          consentimento_lgpd: formConsentimentoLgpd,
          consentimento_imagem: formConsentimentoImagem,
        });

      if (error) {
        if (error.code === '23505') {
          if (error.message.includes('matricula')) {
            toast({ title: 'Erro', description: 'Matrícula já cadastrada no sistema.', variant: 'destructive' });
          } else {
            toast({ title: 'Erro', description: 'Registro duplicado no sistema.', variant: 'destructive' });
          }
        } else {
          throw error;
        }
      } else {
        // Log LGPD audit
        await supabase.from('auditoria_lgpd').insert({
          acao: 'CADASTRO_ALUNO',
          tabela_afetada: 'alunos',
          dados_novos: { matricula: formMatricula, consentimento_lgpd: true, consentimento_imagem: formConsentimentoImagem }
        });

        toast({ title: 'Sucesso!', description: 'Aluno cadastrado com sucesso.' });
        setModalOpen(false);
        resetForm();
        fetchAlunos();
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Não foi possível adicionar o aluno.', variant: 'destructive' });
    }

    setSaving(false);
  };

  const handleReativar = async (alunoId: string) => {
    await supabase.from('alunos').update({ arquivado: false }).eq('id', alunoId);
    toast({ title: 'Aluno reativado!' });
    fetchAlunos();
  };

  const handleExcluirPermanente = async (alunoId: string) => {
    try {
      // Trust ON DELETE CASCADE - child records are automatically deleted
      const { error } = await supabase.from('alunos').delete().eq('id', alunoId);

      if (error) throw error;

      // Audit is now handled by database trigger automatically
      toast({ title: 'Aluno excluído permanentemente!' });
      fetchAlunos();
    } catch (error: any) {
      console.error('Erro ao excluir aluno:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormNome('');
    setFormMatricula('');
    setFormDataNascimento(undefined);
    setFormAnoEntrada(new Date().getFullYear().toString());
    setFormTurmaId('');
    setFormTurno('matutino');
    setFormNotaInicial('8.00');
    setFormFotoFile(null);
    setFormFotoPreview(null);
    setFormConsentimentoLgpd(false);
    setFormConsentimentoImagem(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredAlunos = alunos.filter((aluno) => {
    const matchNome = aluno.nome.toLowerCase().includes(searchNome.toLowerCase()) ||
      aluno.matricula?.toLowerCase().includes(searchNome.toLowerCase());
    const matchTurma = filterTurma === 'all' || aluno.turma_id === filterTurma;
    const matchAno = filterAno === 'all' || aluno.ano_entrada.toString() === filterAno;
    return matchNome && matchTurma && matchAno;
  });

  const anosEntrada = [...new Set(alunos.map((a) => a.ano_entrada))].sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Alunos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os alunos do  Diaconízio Bezerra da Silva</p>
        </div>

        <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="btn-military">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">Novo Aluno</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddAluno} className="space-y-4 mt-4">
              {/* Foto Upload */}
              <div className="flex flex-col items-center gap-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-24 h-24 rounded-full border-2 border-dashed border-border hover:border-accent cursor-pointer overflow-hidden bg-muted/50 transition-all group"
                >
                  {formFotoPreview ? (
                    <img src={formFotoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Camera className="h-6 w-6 text-muted-foreground group-hover:text-accent" />
                      <span className="text-[10px] text-muted-foreground mt-1">Foto</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleFotoChange}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">Clique para adicionar foto</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula * (apenas números)</Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="matricula"
                    value={formMatricula}
                    onChange={(e) => {
                      // Only allow digits
                      const value = e.target.value.replace(/\D/g, '');
                      setFormMatricula(value);
                    }}
                    onKeyPress={(e) => {
                      // Block non-numeric keys
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Ex: 12345"
                    className="pl-10"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Somente números são permitidos</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Nome do aluno"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Data de Nascimento *</Label>
                <DateInput
                  value={formDataNascimento}
                  onChange={setFormDataNascimento}
                  disabled={(date) => date > new Date()}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="anoEntrada">Ano de Entrada</Label>
                  <Input
                    id="anoEntrada"
                    type="number"
                    value={formAnoEntrada}
                    onChange={(e) => setFormAnoEntrada(e.target.value)}
                    min="2000"
                    max="2030"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Turno</Label>
                  <Select value={formTurno} onValueChange={(v: 'matutino' | 'vespertino') => setFormTurno(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="matutino">Matutino</SelectItem>
                      <SelectItem value="vespertino">Vespertino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Turma</Label>
                  <Select value={formTurmaId} onValueChange={setFormTurmaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {turmas.map((turma) => (
                        <SelectItem key={turma.id} value={turma.id}>
                          {turma.nome} - {turma.ano_letivo || new Date().getFullYear()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notaInicial">Nota Inicial</Label>
                  <Input
                    id="notaInicial"
                    type="number"
                    step="0.01"
                    value={formNotaInicial}
                    onChange={(e) => setFormNotaInicial(e.target.value)}
                  />
                </div>
              </div>

              {/* LGPD Consents */}
              <div className="border-t border-border pt-4 space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <IdCard className="h-4 w-4 text-accent" />
                  Consentimentos LGPD
                </h4>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="consentimentoLgpd"
                    checked={formConsentimentoLgpd}
                    onCheckedChange={(checked) => setFormConsentimentoLgpd(checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="consentimentoLgpd" className="text-sm font-medium cursor-pointer">
                      Consentimento de dados pessoais *
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Autorizo o tratamento de dados pessoais conforme a{' '}
                      <a href="/politica-privacidade" target="_blank" className="text-accent hover:underline">
                        Política de Privacidade
                      </a>
                      {' '}(Lei nº 13.709/2018 - LGPD).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="consentimentoImagem"
                    checked={formConsentimentoImagem}
                    onCheckedChange={(checked) => setFormConsentimentoImagem(checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="consentimentoImagem" className="text-sm font-medium cursor-pointer">
                      Consentimento de uso de imagem
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Autorizo o uso da foto do aluno no sistema de monitoramento.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 btn-military" disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="ativos" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="ativos" className="min-w-fit">
            <Users className="h-4 w-4 mr-2" />
            Ativos ({alunos.length})
          </TabsTrigger>
          <TabsTrigger value="arquivados" className="min-w-fit">
            <Archive className="h-4 w-4 mr-2" />
            Arquivados ({alunosArquivados.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ativos" className="space-y-4 mt-4">
          {/* Filtros */}
          <div className="card-military p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou matrícula..."
                    value={searchNome}
                    onChange={(e) => setSearchNome(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={filterTurma} onValueChange={setFilterTurma}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por turma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as turmas</SelectItem>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>{turma.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterAno} onValueChange={setFilterAno}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  {anosEntrada.map((ano) => (
                    <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de Alunos Ativos */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAlunos.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum aluno encontrado</h3>
              <p className="text-muted-foreground">
                {alunos.length === 0 ? 'Comece adicionando alunos ao sistema.' : 'Tente ajustar os filtros de busca.'}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredAlunos.map((aluno, index) => (
                  <motion.div
                    key={aluno.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/alunos/${aluno.id}`)}
                    className="card-military p-4 cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="relative w-12 h-12 rounded-full overflow-hidden bg-muted border-2 border-border group-hover:border-accent transition-all shrink-0"
                      >
                        {aluno.foto_url && aluno.consentimento_imagem ? (
                          <img src={aluno.foto_url} alt={aluno.nome} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                        )}
                      </motion.div>

                      <div className="flex-1 min-w-0">
                        {/* Matrícula Badge */}
                        {aluno.matricula && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full mb-1">
                            <IdCard className="h-3 w-3" />
                            {aluno.matricula}
                          </span>
                        )}
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {aluno.nome}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {aluno.turma?.nome || 'Sem turma'} • {aluno.turno}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <GradeBadge nota={aluno.nota_disciplinar} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="arquivados" className="mt-4">
          {alunosArquivados.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum aluno arquivado</h3>
              <p className="text-muted-foreground">Alunos arquivados aparecerão aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alunosArquivados.map((aluno, index) => (
                <motion.div
                  key={aluno.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card-military p-4 opacity-75"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {aluno.matricula && (
                        <span className="text-xs text-muted-foreground">Mat: {aluno.matricula}</span>
                      )}
                      <h3 className="font-semibold">{aluno.nome}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {aluno.turma?.nome || 'Sem turma'} • {aluno.turno}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-muted-foreground">
                        {Number(aluno.nota_disciplinar).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => handleReativar(aluno.id)}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reativar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Todos os dados do aluno serão removidos.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleExcluirPermanente(aluno.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
