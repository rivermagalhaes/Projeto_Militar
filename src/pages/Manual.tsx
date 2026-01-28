import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FileSearch, Download, ExternalLink, Loader2, BookOpen, ShieldCheck, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Manual {
    nome: string;
    url: string;
}

export default function Manual() {
    const [manual, setManual] = useState<Manual | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchManual();
    }, []);

    const fetchManual = async () => {
        try {
            const { data } = await (supabase
                .from('manuais') as any)
                .select('*')
                .order('uploaded_at', { ascending: false })
                .limit(1)
                .single();

            if (data) setManual(data);
        } catch (error) {
            console.error('Error fetching manual:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <FileSearch className="h-8 w-8 text-accent" />
                    <h1 className="text-3xl font-bold text-navy">Manual do Aluno</h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" className="border-navy/10 text-navy hover:bg-navy/5">
                        <Link to="/monitores?tab=manual">
                            <Settings className="mr-2 h-4 w-4" /> Gerenciar Manual
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="card-military overflow-hidden">
                <div className="bg-navy p-8 text-white relative">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-serif font-bold mb-2">Regulamento Disciplinar CMTO</h2>
                        <p className="text-blue-200 text-sm max-w-md">
                            Guia completo sobre deveres, direitos, uniformes e normas de conduta do Colégio Militar do Tocantins.
                        </p>
                    </div>
                    <BookOpen size={120} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/5" />
                </div>

                <div className="p-8 bg-white">
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="animate-spin text-navy" />
                        </div>
                    ) : manual ? (
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-muted/30 rounded-xl border border-dashed border-navy/10">
                                <div className="p-4 bg-navy text-white rounded-lg shadow-lg">
                                    <FileSearch size={32} />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="font-bold text-lg text-navy">{manual.nome}</h3>
                                    <p className="text-xs text-muted-foreground">Documento oficial atualizado para o ano letivo corrente.</p>
                                </div>
                                <div className="flex gap-3">
                                    <Button asChild className="btn-military">
                                        <a href={manual.url} target="_blank" rel="noreferrer">
                                            <ExternalLink className="mr-2 h-4 w-4" /> Visualizar
                                        </a>
                                    </Button>
                                    <Button asChild variant="outline">
                                        <a href={manual.url} download>
                                            <Download className="mr-2 h-4 w-4" /> Baixar PDF
                                        </a>
                                    </Button>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-bold text-navy flex items-center gap-2">
                                        <ShieldCheck size={18} className="text-accent" /> Tópicos Principais
                                    </h4>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex gap-2">• Hierarquia e Disciplina Militas</li>
                                        <li className="flex gap-2">• Padrões de Uniforme e Apresentação</li>
                                        <li className="flex gap-2">• Sistema de Pontuação e Notas</li>
                                        <li className="flex gap-2">• Regime de Frequência e Atrasos</li>
                                    </ul>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex gap-3 text-sm text-amber-900">
                                    <div className="p-2 h-fit bg-amber-100 rounded text-amber-600 font-bold text-xs">NOTA</div>
                                    <p>A leitura deste manual é obrigatória para todos os alunos e seus respectivos responsáveis no ato da matrícula.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground italic">Nenhum manual cadastrado no sistema.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
