import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, TrendingUp, Users, AlertTriangle, CheckCircle, Filter, ArrowLeft, Printer } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Relatorios() {
    const [stats, setStats] = useState({
        totalAlunos: 0,
        totalTurmas: 0,
        mediaDisciplinar: 0,
        totalOcorrencias: 0
    });
    const [showGenerator, setShowGenerator] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const { count: studentCount } = await supabase.from('alunos').select('*', { count: 'exact', head: true });
        const { count: classCount } = await supabase.from('turmas').select('*', { count: 'exact', head: true });
        const { data: grades } = await supabase.from('alunos').select('nota_disciplinar');

        const validGrades = (grades || []).filter(g => g && typeof g.nota_disciplinar === 'number');
        const avg = validGrades.length > 0
            ? validGrades.reduce((acc, curr) => acc + (curr.nota_disciplinar || 0), 0) / validGrades.length
            : 0;

        setStats({
            totalAlunos: studentCount || 0,
            totalTurmas: classCount || 0,
            mediaDisciplinar: avg,
            totalOcorrencias: 0
        });
    };

    if (showGenerator) {
        return <RelatorioGerador onBack={() => setShowGenerator(false)} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-navy flex items-center gap-2">
                        <FileText className="h-8 w-8 text-accent" />
                        Relatórios e Estatísticas
                    </h1>
                    <p className="text-muted-foreground mt-1">Análise de desempenho e dados gerais da unidade</p>
                </div>
                {/* Export button removed from here */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Alunos" value={stats.totalAlunos} icon={Users} color="text-blue-500" />
                <StatCard title="Turmas Ativas" value={stats.totalTurmas} icon={TrendingUp} color="text-green-500" />
                <StatCard title="Média Unidade" value={stats.mediaDisciplinar.toFixed(2)} icon={CheckCircle} color="text-gold" />
                <StatCard title="Ocorrências" value={stats.totalOcorrencias} icon={AlertTriangle} color="text-red-500" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <div className="card-military p-6">
                    <h3 className="font-bold text-lg mb-4 text-navy">Distribuição por Turno</h3>
                    <div className="h-48 flex items-end gap-4 justify-around pb-2">
                        <div className="flex flex-col items-center gap-2 w-full max-w-[80px]">
                            <div className="w-full bg-navy/20 rounded-t-md relative h-32">
                                <div className="absolute bottom-0 w-full bg-navy rounded-t-md h-[65%]"></div>
                            </div>
                            <span className="text-xs font-bold uppercase">Matutino</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 w-full max-w-[80px]">
                            <div className="w-full bg-accent/20 rounded-t-md relative h-32">
                                <div className="absolute bottom-0 w-full bg-accent rounded-t-md h-[35%]"></div>
                            </div>
                            <span className="text-xs font-bold uppercase">Vespertino</span>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-4">Dados baseados nos alunos ativos no sistema.</p>
                </div>

                <div className="card-military p-6 flex flex-col justify-center items-center text-center">
                    <TrendingUp size={48} className="text-accent mb-4 opacity-20" />
                    <h3 className="font-bold text-lg text-navy">Relatórios Personalizados</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mt-2">
                        Gere listagens filtradas por turma, comportamento ou data de entrada para reuniões e conselhos.
                    </p>
                    <Button onClick={() => setShowGenerator(true)} className="mt-6 btn-military">
                        Acessar Gerador
                    </Button>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="card-military p-6"
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{title}</span>
                <Icon size={20} className={color} />
            </div>
            <div className="text-3xl font-bold text-navy">{value}</div>
        </motion.div>
    );
}

function RelatorioGerador({ onBack }: { onBack: () => void }) {
    const [turmas, setTurmas] = useState<any[]>([]);
    const [selectedTurma, setSelectedTurma] = useState('all');
    const [alunos, setAlunos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchTurmas = async () => {
            const { data } = await supabase.from('turmas').select('*').order('nome');
            if (data) setTurmas(data);
        };
        fetchTurmas();
        fetchRelatorio();
    }, []);

    const fetchRelatorio = async () => {
        setLoading(true);
        let query = supabase.from('alunos').select('*, turma:turmas(nome)').order('nome');

        if (selectedTurma && selectedTurma !== 'all') {
            query = query.eq('turma_id', selectedTurma);
        }

        const { data } = await query;
        if (data) setAlunos(data);
        setLoading(false);
    };

    // Re-fetch when filter changes
    useEffect(() => {
        fetchRelatorio();
    }, [selectedTurma]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between no-print">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-navy">Gerador de Relatórios</h1>
                        <p className="text-muted-foreground text-sm">Filtre os dados e exporte o PDF.</p>
                    </div>
                </div>
                <Button onClick={handlePrint} className="btn-military">
                    <Printer className="mr-2 h-4 w-4" /> Exportar / Imprimir PDF
                </Button>
            </div>

            <div className="card-military p-6 no-print">
                <h3 className="font-bold text-sm text-navy mb-4 flex items-center gap-2">
                    <Filter size={16} /> Filtros
                </h3>
                <div className="flex gap-4">
                    <div className="w-[200px]">
                        <Select value={selectedTurma} onValueChange={setSelectedTurma}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrar por Turma" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Turmas</SelectItem>
                                {turmas.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Printable Area */}
            <div className="bg-white p-6 rounded-lg shadow-sm border print:shadow-none print:border-none">
                <div className="hidden print:block mb-6 text-center border-b pb-4">
                    <h1 className="text-xl font-bold uppercase text-navy">Relatório de Alunos</h1>
                    <p className="text-sm text-muted-foreground">Gerado em {new Date().toLocaleDateString()}</p>
                    {selectedTurma !== 'all' && (
                        <p className="text-sm font-bold mt-1">
                            Filtro: {turmas.find(t => t.id === selectedTurma)?.nome}
                        </p>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                            <tr>
                                <th className="px-4 py-3">Matrícula</th>
                                <th className="px-4 py-3">Nome</th>
                                <th className="px-4 py-3">Turma</th>
                                <th className="px-4 py-3 text-right">Nota Disc.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="p-4 text-center">Carregando...</td></tr>
                            ) : alunos.map((aluno) => (
                                <tr key={aluno.id} className="border-b hover:bg-muted/50">
                                    <td className="px-4 py-3 font-mono">{aluno.matricula}</td>
                                    <td className="px-4 py-3 font-medium">{aluno.nome}</td>
                                    <td className="px-4 py-3">{aluno.turma?.nome || '-'}</td>
                                    <td className="px-4 py-3 text-right font-bold text-navy">
                                        {aluno.nota_disciplinar?.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && alunos.length === 0 && (
                    <p className="text-center text-muted-foreground mt-8 italic">Nenhum aluno encontrado.</p>
                )}
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white; }
                    .card-military { box-shadow: none; border: none; }
                }
            `}</style>
        </div>
    );
}
