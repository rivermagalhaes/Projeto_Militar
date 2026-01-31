import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Fingerprint, Calendar, Loader2, ArrowLeft, Info, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import brasao from '@/assets/brasao-cmto.png';

export default function PortalPais() {
    const [matricula, setMatricula] = useState('');
    const [nascimento, setNascimento] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Fix: Use 'includes' to handle trailing slashes or query params robustly
    const isStudentPortal = location.pathname.includes('/aluno');

    const handleAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isStudentPortal) {
                // STUDENT ACCESS: Direct query (Does NOT update ultimo_acesso)

                // 1. Get Aluno - SANITIZED INPUTS
                const cleanMatricula = matricula.trim();
                const cleanNascimento = nascimento; // Input type="date" ensures YYYY-MM-DD

                const { data: aluno, error: alunoError } = await supabase
                    .from('alunos')
                    .select('*, turma:turmas(*)')
                    .eq('matricula', cleanMatricula) // Compare exact trimmed string
                    .eq('data_nascimento', cleanNascimento)
                    .maybeSingle();

                if (alunoError) throw alunoError;

                if (!aluno) {
                    toast.error('Matrícula ou data de nascimento inválida.');
                    setIsLoading(false);
                    return;
                }

                if (aluno.arquivado) {
                    toast.error('Aluno arquivado. Entre em contato com a secretaria.');
                    setIsLoading(false);
                    return;
                }

                // 2. Get Faltas
                const { data: faltas } = await supabase
                    .from('faltas')
                    .select('*')
                    .eq('aluno_id', aluno.id);

                // 3. Get Anotacoes
                const { data: anotacoes } = await supabase
                    .from('anotacoes')
                    .select('*')
                    .eq('aluno_id', aluno.id)
                    .order('created_at', { ascending: false })
                    .limit(10);

                // 4. Get Agenda (Global + Recent)
                const today = new Date().toISOString().split('T')[0];
                const { data: agenda } = await supabase
                    .from('agenda')
                    .select('*')
                    .gte('data_evento', today)
                    .order('data_evento', { ascending: true })
                    .limit(5);

                setDashboardData({
                    aluno,
                    turma: aluno.turma,
                    faltas: faltas || [],
                    anotacoes: anotacoes || [],
                    agenda: agenda || []
                });
                toast.success('Acesso concedido (Modo Aluno)!');

            } else {
                // PARENT ACCESS: RPC Call (UPDATES ultimo_acesso)

                // Formatar data de YYYY-MM-DD para DD/MM/YYYY expected by RPC
                const dateParts = nascimento.split('-');
                const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

                const { data, error } = await supabase.rpc('portal_pais_get_dashboard', {
                    p_matricula: matricula,
                    p_nascimento: formattedDate
                });

                if (error || !data || data.error) {
                    toast.error(error?.message || data?.error || 'Matrícula ou data de nascimento inválida.');
                } else {
                    toast.success('Acesso concedido!');
                    setDashboardData(data);
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Matrícula ou data de nascimento incorreta.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        setDashboardData(null);
        setMatricula('');
        setNascimento('');
    };

    if (dashboardData) {
        return (
            // Mobile: Full width, simple bg. Desktop: Padded, centered.
            <div className="min-h-screen bg-background w-full md:p-8">
                {/* Mobile: px-4 padding, w-full. Desktop: Container, centered. */}
                <div className="w-full px-4 md:container md:mx-auto md:max-w-4xl md:px-0 py-4 md:py-0">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-4">
                        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                            <img src={brasao} alt="Brasão CMTO" className="h-12 w-auto md:h-16" />
                            <div className="flex-1 md:flex-none">
                                <h1 className="text-lg md:text-2xl font-bold text-navy leading-tight">
                                    {isStudentPortal ? 'Portal do Aluno' : 'Portal da Família'}
                                </h1>
                                <p className="text-xs md:text-base text-muted-foreground truncate">
                                    {dashboardData.aluno?.nome}
                                </p>
                                <p className="text-[10px] md:text-sm text-muted-foreground">
                                    Turma: {dashboardData.aluno?.turma?.nome || 'N/A'}
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={handleLogout} className="text-red-500 hover:text-red-600 border-red-200 w-full md:w-auto text-xs md:text-sm h-8 md:h-10">
                            <LogOut size={16} className="mr-2" /> Sair
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {/* Stats Cards Dashboard */}
                        <div className="stats-card">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Nota Disciplinar</h3>
                            <div className="text-2xl md:text-3xl font-bold text-olive">
                                {dashboardData.aluno?.nota_disciplinar?.toFixed(2) || '0.00'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Média atual do aluno</p>
                        </div>
                        <div className="stats-card">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Total de Faltas</h3>
                            <div className="text-2xl md:text-3xl font-bold text-red-600">
                                {dashboardData.faltas?.length || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Dias de ausência registrados</p>
                        </div>
                        <div className="stats-card">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Ano Letivo</h3>
                            <div className="text-2xl md:text-3xl font-bold text-navy">
                                {new Date().getFullYear()}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Corrente</p>
                        </div>
                    </div>

                    <div className="mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                        <div className="card-military p-4 md:p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-navy">
                                <Info size={20} className="text-accent" /> Últimas Anotações
                            </h2>
                            <div className="space-y-4">
                                {dashboardData.anotacoes?.length > 0 ? (
                                    dashboardData.anotacoes.map((anot: any, i: number) => (
                                        <div key={i} className="p-3 bg-muted/50 rounded-md border-l-2 border-olive min-w-0">
                                            <div className="flex justify-between text-sm mb-1 gap-2">
                                                <span className="font-bold uppercase text-[10px] shrink-0">{anot.tipo}</span>
                                                <span className="text-muted-foreground text-[10px] whitespace-nowrap">{new Date(anot.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs md:text-sm break-words">{anot.descricao}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">Nenhuma anotação registrada.</p>
                                )}
                            </div>
                        </div>

                        <div className="card-military p-4 md:p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-navy">
                                <Calendar size={20} className="text-accent" /> Próximos Eventos
                            </h2>
                            <div className="space-y-4">
                                {dashboardData.agenda?.length > 0 ? (
                                    dashboardData.agenda.map((item: any, i: number) => (
                                        <div key={i} className="flex items-start gap-4 p-3 bg-muted/50 rounded-md">
                                            <div className="text-center bg-navy text-white px-3 py-2 rounded-lg min-w-[60px] shrink-0">
                                                <p className="text-2xl font-bold">{format(new Date(item.data_evento + 'T12:00:00'), 'dd')}</p>
                                                <p className="text-xs uppercase">{format(new Date(item.data_evento + 'T12:00:00'), 'MMM', { locale: ptBR })}</p>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-[13px] md:text-sm text-navy break-words">{item.titulo}</div>
                                                {item.descricao && <p className="text-[11px] md:text-xs text-muted-foreground mt-1 break-words">{item.descricao}</p>}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">Nenhum evento na agenda.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-navy flex items-center justify-center p-4">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <img src={brasao} alt="Brasão CMTO" className="h-24 w-auto mx-auto mb-4 drop-shadow-2xl" />
                    <h1 className="text-3xl font-serif font-bold text-white">
                        {isStudentPortal ? 'Portal do Aluno' : 'Portal da Família'}
                    </h1>
                    <p className="text-blue-200">Acompanhamento Escolar CMTO</p>
                </div>

                <div className="bg-white rounded-xl shadow-2xl p-5 md:p-8 border-t-8 border-accent overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-2 opacity-5">
                        <Users size={80} />
                    </div>

                    <form onSubmit={handleAccess} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-navy flex items-center gap-2">
                                <Fingerprint size={16} className="text-accent" /> Número da Matrícula
                            </label>
                            <Input
                                placeholder="Ex: 20240001"
                                value={matricula}
                                onChange={(e) => setMatricula(e.target.value)}
                                required
                                className="border-navy/10 h-12 text-lg"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-navy flex items-center gap-2">
                                <Calendar size={16} className="text-accent" /> Data de Nascimento do Aluno
                            </label>
                            <Input
                                type="date"
                                value={nascimento}
                                onChange={(e) => setNascimento(e.target.value)}
                                required
                                className="border-navy/10 h-12 text-lg"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-navy hover:bg-navy-light text-white font-bold h-14 text-lg shadow-lg group"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Acessar Painel <Users size={18} />
                                </span>
                            )}
                        </Button>
                    </form>

                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="w-full mt-6 text-muted-foreground hover:text-navy"
                    >
                        <ArrowLeft className="mr-2" size={16} /> Voltar
                    </Button>

                    <div className="mt-8 bg-blue-50 p-4 rounded-lg flex gap-3 text-xs text-blue-800 leading-relaxed border border-blue-100">
                        <Info size={24} className="shrink-0 text-blue-500" />
                        <p>
                            Prezados pais e alunos, utilizem a matrícula oficial e a data de nascimento registrada no ato da matrícula para acessar o portal. Em caso de dúvidas, procure a secretaria.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
