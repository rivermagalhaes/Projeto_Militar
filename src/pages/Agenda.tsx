import { useEffect, useState, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DateInput } from '@/components/DateInput';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2, Loader2, Calendar, ImagePlus, X, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogDescription } from '@/components/ui/alert-dialog';

interface Evento {
  id: string;
  titulo: string;
  descricao: string | null;
  data_evento: string;
  imagem_url: string | null;
  created_at: string;
}

export default function Agenda() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState<Date>();
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  
  // Filter
  const [filterAno, setFilterAno] = useState<string>('all');
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => { fetchEventos(); }, []);

  const fetchEventos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('agenda')
      .select('*')
      .order('data_evento', { ascending: false });
    
    if (data) {
      setEventos(data as Evento[]);
      // Extract unique years
      const anos = [...new Set(data.map(e => new Date(e.data_evento).getFullYear()))].sort((a, b) => b - a);
      setAnosDisponiveis(anos);
    }
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        toast({ title: 'Apenas JPG ou PNG são permitidos', variant: 'destructive' });
        return;
      }
      // Validate size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Imagem muito grande (máx. 5MB)', variant: 'destructive' });
        return;
      }
      setImagemFile(file);
      setImagemPreview(URL.createObjectURL(file));
    }
  };

  const handleAdd = async () => {
    if (!titulo || !data) { 
      toast({ title: 'Preencha título e data', variant: 'destructive' }); 
      return; 
    }
    
    setSaving(true);
    let imagemUrl: string | null = null;

    try {
      // Upload image if exists
      if (imagemFile) {
        const fileName = `${Date.now()}-${imagemFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('evidencias_agenda')
          .upload(fileName, imagemFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('evidencias_agenda')
          .getPublicUrl(fileName);
        
        imagemUrl = urlData.publicUrl;
      }

      // Insert event
      await supabase.from('agenda').insert({ 
        titulo, 
        descricao: descricao || null, 
        data_evento: format(data, 'yyyy-MM-dd'), 
        user_id: user?.id,
        imagem_url: imagemUrl
      });

      toast({ title: 'Evento adicionado!' });
      setModalOpen(false);
      resetForm();
      fetchEventos();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTitulo('');
    setDescricao('');
    setData(undefined);
    setImagemFile(null);
    setImagemPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string) => {
    await supabase.from('agenda').delete().eq('id', id);
    toast({ title: 'Evento removido!' });
    fetchEventos();
  };

  const openImageModal = (url: string) => {
    setSelectedImage(url);
    setImageModalOpen(true);
  };

  // Filter events by year
  const filteredEventos = eventos.filter(e => {
    if (filterAno === 'all') return true;
    return new Date(e.data_evento).getFullYear().toString() === filterAno;
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold flex items-center gap-3">
              <Calendar className="h-8 w-8 text-accent" />
              Agenda
            </h1>
            <p className="text-muted-foreground mt-1">Eventos e informativos do CMTO-V Diaconízio Bezerra da Silva</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Filtro por ano */}
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

            <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="btn-military">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Evento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-serif">Novo Evento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Título *</Label>
                    <Input 
                      placeholder="Título do evento" 
                      value={titulo} 
                      onChange={e => setTitulo(e.target.value)} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea 
                      placeholder="Descrição do evento" 
                      value={descricao} 
                      onChange={e => setDescricao(e.target.value)} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Data do Evento *</Label>
                    <DateInput value={data} onChange={setData} placeholder="Selecione a data" />
                  </div>
                  
                  {/* Upload de Evidência/Imagem */}
                  <div className="space-y-2">
                    <Label>Evidência/Imagem (opcional)</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleImageChange}
                        className="flex-1"
                      />
                      {imagemPreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => { setImagemFile(null); setImagemPreview(null); }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">JPG ou PNG, máx. 5MB</p>
                    
                    {imagemPreview && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative mt-2"
                      >
                        <img 
                          src={imagemPreview} 
                          alt="Preview" 
                          className="w-full max-h-48 object-cover rounded-lg border border-border"
                        />
                      </motion.div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleAdd} 
                    className="w-full btn-military"
                    disabled={saving}
                  >
                    {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Salvar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Lista de Eventos */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredEventos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum evento encontrado</h3>
            <p className="text-muted-foreground">
              {eventos.length === 0 ? 'Comece adicionando eventos.' : 'Ajuste o filtro de ano.'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredEventos.map((e, i) => (
                <motion.div 
                  key={e.id} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }} 
                  className="card-military p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Data Badge */}
                      <div className="text-center bg-primary text-primary-foreground px-3 py-2 rounded-lg min-w-[60px] shrink-0">
                        <p className="text-2xl font-bold">{format(new Date(e.data_evento), 'dd')}</p>
                        <p className="text-xs uppercase">{format(new Date(e.data_evento), 'MMM', { locale: ptBR })}</p>
                        <p className="text-[10px] opacity-80">{format(new Date(e.data_evento), 'yyyy')}</p>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{e.titulo}</h3>
                        {e.descricao && (
                          <p className="text-muted-foreground text-sm mt-1">{e.descricao}</p>
                        )}
                      </div>
                      
                      {/* Thumbnail da Evidência */}
                      {e.imagem_url && (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          onClick={() => openImageModal(e.imagem_url!)}
                          className="relative group cursor-pointer shrink-0"
                        >
                          <img 
                            src={e.imagem_url} 
                            alt="Evidência"
                            className="w-20 h-20 object-cover rounded-lg border-2 border-border group-hover:border-accent transition-all shadow-md group-hover:shadow-lg group-hover:shadow-accent/20"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <ZoomIn className="h-6 w-6 text-white" />
                          </div>
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Delete button */}
                    {isAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(e.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal de Imagem Full */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-4xl p-2">
          {selectedImage && (
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={selectedImage}
              alt="Evidência"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
