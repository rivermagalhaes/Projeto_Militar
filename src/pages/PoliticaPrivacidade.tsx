import { Shield, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function PoliticaPrivacidade() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="container mx-auto max-w-3xl">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <Shield className="h-8 w-8 text-olive" />
                        <h1 className="text-3xl font-bold text-navy">Política de Privacidade</h1>
                    </div>
                    <Button variant="ghost" onClick={() => navigate(-1)} className="text-navy">
                        <ArrowLeft className="mr-2" size={16} /> Voltar
                    </Button>
                </div>

                <div className="card-military p-8 bg-card shadow-lg space-y-6 text-navy">
                    <div className="flex items-center gap-2 text-olive font-bold uppercase tracking-wider text-xs">
                        <FileText size={14} /> Lei Geral de Proteção de Dados (LGPD)
                    </div>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold">1. Introdução</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            O Colégio Militar do Tocantins (CMTO-V) está comprometido com a transparência e a segurança dos dados pessoais de seus alunos, pais, responsáveis e colaboradores, em conformidade com a Lei nº 13.709/2018 (LGPD).
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold">2. Coleta de Dados</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Coletamos dados estritamente necessários para a gestão escolar, incluindo informações cadastrais, frequência, desempenho acadêmico e registros disciplinares.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-bold">3. Finalidade</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            O tratamento dos dados visa garantir o acompanhamento pedagógico e disciplinar, a segurança interna e o cumprimento de obrigações legais perante os órgãos de ensino.
                        </p>
                    </section>

                    <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-accent text-sm italic">
                        Esta política pode ser atualizada periodicamente para refletir mudanças legislativas ou melhorias nos processos de segurança da instituição.
                    </div>
                </div>
            </div>
        </div>
    );
}
