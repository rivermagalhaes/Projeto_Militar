import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  BookOpen,
  Cake,
  Calendar,
  Shield,
  AlertTriangle,
  Loader2,
  ZoomIn,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import brasao from '@/assets/brasao-cmto.png';
import { MfaReminder } from '@/components/MfaReminder';
import { BackupExport } from '@/components/BackupExport';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface Stats {
  totalAlunos: number;
  totalTurmas: number;
  aniversariantesSemana: number;
}

interface Evento {
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
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAgenda, setLoadingAgenda] = useState(true);

  // Modal states
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Filter
  const [filterAno, setFilterAno] = useState<string>('all');
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    // Admins and monitors can see full dashboard stats
    if (isAdmin || isMonitor) {
      fetchStats();
    }

    // Everyone sees events (Agenda)
    fetchAgenda();

    // LGPD notice for limited access
    if (!isAdmin && !isMonitor) {
      const shownLgpd = sessionStorage.getItem('lgpd_notice_shown');
      if (!shownLgpd) {
        toast({
          title: 'LGPD Compliance',
          description: 'Acesso a dados sensíveis restrito apenas a usuários autorizados.',
        });
        sessionStorage.setItem('lgpd_notice_shown', 'true');
      }
    }
  }, [isAdmin, isMonitor]);

  const fetchStats = async () => {
    try {
      // Tentar buscar com o filtro de arquivado
      let query = supabase.from('alunos').select('data_nascimento', { count: 'exact' });

      let { data: alunosData, count: alunosCount, error: alunosError } = await (query as any).eq('arquivado', false);

      // Fallback se arquivado não existir
      if (alunosError && (alunosError.message.includes('column "arquivado" does not exist') || alunosError.code === '42703')) {
        const { data, count, error } = await supabase
          .from('alunos')
          .select('data_nascimento', { count: 'exact' });

        if (error) throw error;
        alunosData = data;
        alunosCount = count;
      } else if (alunosError) {
        throw alunosError;
      }

      const { count: turmasCount } = await supabase
        .from('turmas')
        .select('*', { count: 'exact', head: true });

      const hoje = new Date();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay());
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);

      const aniversariantes = (alunosData || []).filter((aluno) => {
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

  const fetchAgenda = async () => {
    setLoadingAgenda(true);
    try {
      const { data, error } = await supabase
        .from('agenda')
        .select('*')
        .order('data_evento', { ascending: false });

      if (error) throw error;

      if (data) {
        setEventos(data as Evento[]);
        const anos = [...new Set(data.map(e => new Date(e.data_evento).getFullYear()))].sort((a, b) => b - a);
        setAnosDisponiveis(anos);
      }
    } catch (error) {
      console.error('Error fetching agenda:', error);
    } finally {
      setLoadingAgenda(false);
    }
  };

  const openImageModal = (url: string) => {
    setSelectedImage(url);
    setImageModalOpen(true);
  };

  const filteredEventos = eventos.filter(e => {
    if (filterAno === 'all') return true;
    return new Date(e.data_evento).getFullYear().toString() === filterAno;
  });

  const statsCards = [
    { title: 'Total de Alunos', value: stats.totalAlunos, icon: Users, color: 'text-primary' },
    { title: 'Turmas Ativas', value: stats.totalTurmas, icon: BookOpen, color: 'text-secondary' },
    { title: 'Aniversariantes da Semana', value: stats.aniversariantesSemana, icon: Cake, color: 'text-accent' },
  ];

  const renderAgendaList = () => {
    if (loadingAgenda) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (filteredEventos.length === 0) {
      return (
        <div className="text-center py-12 card-military bg-muted/5">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
          <p className="text-muted-foreground italic">Nenhum evento encontrado na agenda.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredEventos.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="card-military p-4"
            >
              <div className="flex items-start gap-4">
                <div className="text-center bg-navy text-white px-3 py-2 rounded-lg min-w-[60px] shrink-0">
                  <p className="text-2xl font-bold">{format(new Date(e.data_evento + 'T12:00:00'), 'dd')}</p>
                  <p className="text-xs uppercase">{format(new Date(e.data_evento + 'T12:00:00'), 'MMM', { locale: ptBR })}</p>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-navy truncate">{e.titulo}</h3>
                  {e.descricao && <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{e.descricao}</p>}
                </div>

                {e.imagem_url && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    onClick={() => openImageModal(e.imagem_url!)}
                    className="relative group cursor-pointer shrink-0"
                  >
                    <img src={e.imagem_url} alt="Evidência" className="w-16 h-16 object-cover rounded-lg border-2 border-border group-hover:border-accent transition-all shadow-md" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <ZoomIn className="h-4 w-4 text-white" />
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

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
            <p className="text-muted-foreground mt-1">Bem-vindo ao Sistema do CMTO Diaconízio Bezerra da Silva</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-accent" />
            <div>
              <h2 className="text-xl font-serif font-bold">Agenda do Colégio</h2>
              <p className="text-sm text-muted-foreground">Fique por dentro dos próximos eventos e atividades</p>
            </div>
          </div>
          {renderAgendaList()}
        </div>
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

        {/* Agenda Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-accent" />
              <div>
                <h2 className="text-xl font-serif font-bold">Agenda do Colégio</h2>
                <p className="text-sm text-muted-foreground">Próximos eventos e avisos importantes</p>
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
            </div>
          </div>

          {/* Agenda List Implementation */}
          {renderAgendaList()}
        </motion.div>
      </div>

      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
          {selectedImage && (
            <div className="relative aspect-auto max-h-[90vh] flex items-center justify-center">
              <img src={selectedImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full"
                onClick={() => setImageModalOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
