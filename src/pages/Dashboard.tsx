import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, BookOpen, Cake, Shield, AlertTriangle, Plus, Calendar, ImagePlus, Loader2, X, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import brasao from '@/assets/brasao-cmto.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateInput } from '@/components/DateInput';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BackupExport } from '@/components/BackupExport';
import { MfaReminder } from '@/components/MfaReminder';

interface Stats {
  totalAlunos: number;
  totalTurmas: number;
  aniversariantesSemana: number;
}

interface Informativo {
  id: string;
  titulo: string;
  descricao: string | null;
  data_evento: string;
  imagem_url: string | null;
  created_at: string;
}

export default function Dashboard() {
  const { isAdmin, isMonitor, user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalAlunos: 0,
    totalTurmas: 0,
    aniversariantesSemana: 0,
  });
  const [informativos, setInformativos] = useState<Informativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataEvento, setDataEvento] = useState<Date>();
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);

  // Filter
  const [filterAno, setFilterAno] = useState<string>('all');
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Admins and monitors can see full dashboard
    if (isAdmin || isMonitor) {
      fetchStats();
      fetchInformativos();
    } else {
      setLoading(false);
      setLoadingInfo(false);
      const shownLgpd = sessionStorage.getItem('lgpd_notice_shown');
      if (!shownLgpd) {
        toast.info('Acesso a dados sensíveis restrito apenas a usuários autorizados (LGPD compliance)', {
          duration: 5000,
          icon: <Shield className="h-5 w-5" />,
        });
        sessionStorage.setItem('lgpd_notice_shown', 'true');
      }
    }
  }, [isAdmin, isMonitor]);

  const fetchStats = async () => {
    try {
      const { data: alunosData, count: alunosCount } = await supabase
        .from('alunos')
        .select('data_nascimento, nota_disciplinar', { count: 'exact' })
        .eq('arquivado', false);

      const { count: turmasCount } = await supabase
        .from('turmas')
        .select('*', { count: 'exact', head: true });

      const hoje = new Date();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay());
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);

      const aniversariantes = alunosData?.filter((aluno) => {
        const nascimento = new Date(aluno.data_nascimento);
        const aniversarioEsteAno = new Date(
          hoje.getFullYear(),
          nascimento.getMonth(),
          nascimento.getDate()
        );
        return aniversarioEsteAno >= inicioSemana && aniversarioEsteAno <= fimSemana;
      }).length || 0;

      setStats({
        totalAlunos: alunosCount || 0,
        totalTurmas: turmasCount || 0,
        aniversariantesSemana: aniversariantes,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInformativos = async () => {
    setLoadingInfo(true);
    try {
      const { data } = await supabase
        .from('informativos')
        .select('*')
        .order('data_evento', { ascending: false });

      if (data) {
        setInformativos(data);
        const anos = [...new Set(data.map(i => new Date(i.data_evento).getFullYear()))].sort((a, b) => b - a);
        setAnosDisponiveis(anos);
      }
    } catch (error) {
      console.error('Error fetching informativos:', error);
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        toast.error('Apenas JPG ou PNG são permitidos');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Imagem muito grande (máx. 5MB)');
        return;
      }
      setImagemFile(file);
      setImagemPreview(URL.createObjectURL(file));
    }
  };

  const handleAddInformativo = async () => {
    if (!titulo || !dataEvento) {
      toast.error('Preencha título e data');
      return;
    }
    if (!imagemFile) {
      toast.error('Selecione uma imagem');
      return;
    }

    setSaving(true);
    try {
      const fileName = `${Date.now()}-${imagemFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('eventos_colegio')
        .upload(fileName, imagemFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('eventos_colegio')
        .getPublicUrl(fileName);

      await supabase.from('informativos').insert({
        titulo,
        descricao: descricao || null,
        data_evento: format(dataEvento, 'yyyy-MM-dd'),
        imagem_url: urlData.publicUrl,
        created_by: user?.id
      });

      toast.success('Informativo adicionado!');
      setModalOpen(false);
      resetForm();
      fetchInformativos();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTitulo('');
    setDescricao('');
    setDataEvento(undefined);
    setImagemFile(null);
    setImagemPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openImageModal = (url: string) => {
    setSelectedImage(url);
    setImageModalOpen(true);
  };

  const filteredInformativos = informativos.filter(i => {
    if (filterAno === 'all') return true;
    return new Date(i.data_evento).getFullYear().toString() === filterAno;
  });

  const statsCards = [
    { title: 'Total de Alunos', value: stats.totalAlunos, icon: Users, color: 'text-primary' },
    { title: 'Turmas Ativas', value: stats.totalTurmas, icon: BookOpen, color: 'text-secondary' },
    { title: 'Aniversariantes da Semana', value: stats.aniversariantesSemana, icon: Cake, color: 'text-accent' },
  ];

  // Conteúdo para usuários sem role (nem admin nem monitor)
  if (!isAdmin && !isMonitor) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-6">
          <motion.img
            src={brasao}
            alt="Brasão CMTO"
            className="h-20 w-auto hidden md:block"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          />
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-serif font-bold text-foreground"
            >
              Início
            </motion.h1>
            <p className="text-muted-foreground mt-1">Sistema de Monitores - CMTO Diaconízio Bezerra da Silva</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-military p-8"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-amber-500/20">
              <Shield className="h-8 w-8 text-amber-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-serif font-bold mb-2">Acesso Restrito - LGPD Compliance</h2>
              <p className="text-muted-foreground mb-4">
                Olá, {user?.email}! Como monitor, você tem acesso limitado para proteção de dados pessoais de menores (Lei nº 13.709/2018 - LGPD).
              </p>
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Recursos disponíveis:
                </h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Visualização da Agenda</li>
                  <li>Acesso ao Manual do Sistema</li>
                  <li>Consulta a aniversariantes</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <MfaReminder isAdmin={isAdmin} />
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 md:gap-6">
            <motion.img
              src={brasao}
              alt="Brasão CMTO"
              className="h-16 w-auto hidden md:block"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            />
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl md:text-3xl font-serif font-bold text-foreground"
              >
                Início
              </motion.h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">Sistema de Monitores - CMTO</p>
            </div>
          </div>
          <BackupExport isAdmin={isAdmin} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="stats-card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <motion.p
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
                      className="text-4xl font-bold mt-2"
                    >
                      {loading ? '-' : stat.value}
                    </motion.p>
                  </div>
                  <div className={`p-4 rounded-full bg-muted ${stat.color}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Informativos com Evidências */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <ImagePlus className="h-6 w-6 text-accent" />
              <div>
                <h2 className="text-xl font-serif font-bold">Informativos com Evidências</h2>
                <p className="text-sm text-muted-foreground">Galeria de eventos e atividades do colégio</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Select value={filterAno} onValueChange={setFilterAno}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {anosDisponiveis.map(ano => (
                    <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isAdmin && (
                <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) resetForm(); }}>
                  <DialogTrigger asChild>
                    <Button className="btn-gold">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Evento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="font-serif">Novo Informativo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Título *</Label>
                        <Input placeholder="Título do evento" value={titulo} onChange={e => setTitulo(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea placeholder="Descrição breve" value={descricao} onChange={e => setDescricao(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Data *</Label>
                        <DateInput value={dataEvento} onChange={setDataEvento} />
                      </div>
                      <div className="space-y-2">
                        <Label>Imagem *</Label>
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/jpg"
                          onChange={handleImageChange}
                        />
                        {imagemPreview && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative mt-2">
                            <img src={imagemPreview} alt="Preview" className="w-full max-h-40 object-cover rounded-lg" />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                              onClick={() => { setImagemFile(null); setImagemPreview(null); }}
                            >
                              <X className="h-4 w-4 text-white" />
                            </Button>
                          </motion.div>
                        )}
                      </div>
                      <Button onClick={handleAddInformativo} className="w-full btn-military" disabled={saving}>
                        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Salvar'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Gallery Grid */}
          {loadingInfo ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredInformativos.length === 0 ? (
            <div className="text-center py-12 card-military">
              <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhum informativo cadastrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredInformativos.map((info, index) => (
                  <motion.div
                    key={info.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="card-military overflow-hidden group cursor-pointer"
                    onClick={() => info.imagem_url && openImageModal(info.imagem_url)}
                  >
                    {info.imagem_url && (
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={info.imagem_url}
                          alt={info.titulo}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                          <ZoomIn className="h-6 w-6 text-white" />
                        </div>
                        <div className="absolute inset-0 ring-0 group-hover:ring-2 ring-accent transition-all rounded-t-lg" />
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(info.data_evento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </div>
                      <h3 className="font-semibold text-sm truncate group-hover:text-accent transition-colors">
                        {info.titulo}
                      </h3>
                      {info.descricao && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{info.descricao}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-4xl p-2">
          {selectedImage && (
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={selectedImage}
              alt="Evento"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
