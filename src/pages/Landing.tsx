import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, UserRound, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import brasao from '@/assets/brasao-cmto.png';

export default function Landing() {
    const navigate = useNavigate();

    const roles = [
        {
            id: 'monitor',
            title: 'Monitores / Admin',
            description: 'Acesso restrito ao corpo docente e administrativo para gestão escolar.',
            icon: Shield,
            path: '/login',
            color: 'bg-olive',
            hoverColor: 'hover:bg-olive-light'
        },
        {
            id: 'pais',
            title: 'Portal dos Pais',
            description: 'Acompanhamento do desempenho, frequência e comportamento do aluno.',
            icon: Users,
            path: '/pais',
            color: 'bg-navy',
            hoverColor: 'hover:bg-navy-light'
        },
        {
            id: 'alunos',
            title: 'Portal do Aluno',
            description: 'Consulta de notas, avisos e material didático.',
            icon: UserRound,
            path: '/pais', // Shared with portal pais for now as it uses the same logic
            color: 'bg-accent',
            hoverColor: 'hover:bg-accent/80'
        }
    ];

    return (
        <div className="min-h-screen bg-hero-gradient flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <img src={brasao} alt="Brasão CMTO" className="h-32 w-auto mx-auto mb-6 drop-shadow-2xl animate-float" />
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-gold mb-2 text-glow-gold">CMTO</h1>
                <p className="text-secondary-foreground/80 text-lg max-w-2xl mx-auto">
                    Colégio Militar do Tocantins - Diaconízio Bezerra da Silva
                    <br />Sistema de Gestão Escolar Militar
                    <br />Paraíso do Tocantins-TO
                </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 w-full max-max-6xl">
                {roles.map((role, index) => (
                    <motion.div
                        key={role.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => navigate(role.path)}
                        className="card-military p-8 bg-card/95 backdrop-blur-md border-b-4 border-b-accent shadow-xl hover:shadow-2xl transition-all cursor-pointer group flex flex-col h-full"
                    >
                        <div className="flex-1">
                            <div className="mb-6 flex justify-center">
                                <div className="p-4 rounded-2xl bg-navy/5 text-navy group-hover:bg-accent group-hover:text-white transition-all transform group-hover:rotate-6">
                                    <role.icon size={40} />
                                </div>
                            </div>

                            <h3 className="text-xl font-serif font-bold text-navy mb-3 text-center">
                                {role.title}
                            </h3>
                            <p className="text-secondary-foreground/60 text-sm text-center mb-8 leading-relaxed">
                                {role.description}
                            </p>
                        </div>

                        <Button
                            className="w-full bg-navy group-hover:bg-accent text-white font-bold py-6 transition-colors"
                            onClick={(e) => { e.stopPropagation(); navigate(role.path); }}
                        >
                            Acessar Portal
                            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </motion.div>
                ))}
            </div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-12 text-sm text-secondary-foreground/60"
            >
                © 2026 CMTO | by Cândigo, Magalhães & Araújo-Todos os direitos reservados
            </motion.p>
        </div>
    );
}
