import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Users, ArrowLeft, Loader2, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { GradeBadge } from '@/components/GradeDisplay';

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
    const [turma, setTurma] = useState<Turma | null>(null);
    const [alunos, setAlunos] = useState<Aluno[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
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
                supabase.from('alunos').select('*').eq('turma_id', id).eq('arquivado', false).order('nome')
            ]);

            if (turmaData) setTurma(turmaData);
            if (alunosData) setAlunos(alunosData as Aluno[]);
        } catch (error) {
            console.error('Erro ao carregar dados da turma:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAlunos = alunos.filter(a =>
        a.nome.toLowerCase().includes(search.toLowerCase()) ||
        a.matricula?.includes(search)
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

            <div className="card-military p-4">
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
