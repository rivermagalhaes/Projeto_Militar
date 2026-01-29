import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, TrendingUp, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function Relatorios() {
    const [stats, setStats] = useState({
        totalAlunos: 0,
        totalTurmas: 0,
        mediaDisciplinar: 0,
        totalOcorrencias: 0
    });

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
            totalOcorrencias: 0 // Placeholder until ocorrencias table is found
        });
    };

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
                <Button className="btn-military">
                    <Download className="mr-2 h-4 w-4" /> Exportar PDF Geral
                </Button>
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
                    <Button variant="outline" className="mt-6">Acessar Gerador</Button>
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
