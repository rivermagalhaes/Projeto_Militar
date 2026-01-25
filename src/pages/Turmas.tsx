import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Search, Loader2, MoreVertical, Users, Calendar, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Turma {
    id: string;
    nome: string;
    ano_letivo: number;
    created_at: string;
    _count?: {
        alunos: number;
    };
}

export default function Turmas() {
    const [turmas, setTurmas] = useState<Turma[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [nome, setNome] = useState('');
    const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear().toString());
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchTurmas();
    }, []);

    const fetchTurmas = async () => {
        setLoading(true);
        try {
            // Get turmas and counts of alunos manually since Supabase client might not support easy counts in one go without RPC or complicated joins
            const { data: turmasData, error: turmasError } = await supabase
                .from('turmas')
                .select('*')
                .order('nome');

            if (turmasError) throw turmasError;

            const { data: countsData, error: countsError } = await supabase
                .rpc('get_turma_student_counts'); // I might need to create this or query manually

            // If RPC fails, just fall back to manual counts or no counts
            let finalTurmas = turmasData as Turma[];

            const { data: alunosData } = await supabase.from('alunos').select('turma_id');
            const counts: Record<string, number> = {};
            alunosData?.forEach(a => {
                if (a.turma_id) counts[a.turma_id] = (counts[a.turma_id] || 0) + 1;
            });

            finalTurmas = finalTurmas.map(t => ({
                ...t,
                _count: { alunos: counts[t.id] || 0 }
            }));

            setTurmas(finalTurmas);
        } catch (error: any) {
            toast({ title: 'Erro ao carregar turmas', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddTurma = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { error } = await supabase
                .from('turmas')
                .insert({ nome, ano_letivo: parseInt(anoLetivo) });

            if (error) throw error;

            toast({ title: 'Sucesso!', description: 'Turma criada com sucesso.' });
            setModalOpen(false);
            setNome('');
            fetchTurmas();
        } catch (error: any) {
            toast({ title: 'Erro ao criar turma', description: error.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const filteredTurmas = turmas.filter(t =>
        t.nome.toLowerCase().includes(search.toLowerCase()) ||
        t.ano_letivo.toString().includes(search)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-navy flex items-center gap-2">
                        <BookOpen className="h-8 w-8 text-accent" />
                        Turmas
                    </h1>
                    <p className="text-muted-foreground mt-1">Gestão de turmas e enturmação de alunos</p>
                </div>

                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="btn-military">
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Turma
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Nova Turma</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddTurma} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome da Turma</Label>
                                <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: 62.01" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ano">Ano Letivo</Label>
                                <Input id="ano" type="number" value={anoLetivo} onChange={e => setAnoLetivo(e.target.value)} required />
                            </div>
                            <Button type="submit" className="w-full btn-military" disabled={saving}>
                                {saving ? 'Salvando...' : 'Criar Turma'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="card-military p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar turmas..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredTurmas.length === 0 ? (
                <div className="text-center py-12 card-military bg-muted/20">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                    <p className="text-muted-foreground italic">Nenhuma turma encontrada.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredTurmas.map((turma, index) => (
                            <motion.div
                                key={turma.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => navigate(`/turmas/${turma.id}`)}
                                className="group relative cursor-pointer"
                            >
                                <div className="card-military p-6 bg-card hover:border-accent transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 rounded-lg bg-navy/5 text-navy group-hover:bg-accent group-hover:text-white transition-colors">
                                            <GraduationCap className="h-6 w-6" />
                                        </div>
                                        <span className="text-xs font-bold px-2 py-1 bg-muted rounded text-muted-foreground">
                                            {turma.ano_letivo}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-navy mb-2 group-hover:text-accent transition-colors">
                                        Turma {turma.nome}
                                    </h3>

                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            <span>{turma._count?.alunos || 0} Alunos</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>Ativa</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
