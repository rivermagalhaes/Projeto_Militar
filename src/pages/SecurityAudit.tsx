import { ShieldCheck, History, AlertTriangle } from 'lucide-react';

export default function SecurityAudit() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-accent" />
                <h1 className="text-3xl font-bold text-navy">Auditoria de Segurança</h1>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="stats-card">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase">Integridade do Sistema</h3>
                        <ShieldCheck className="text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-navy">Operacional</div>
                    <p className="text-xs text-muted-foreground mt-2 text-green-600 font-medium">Todos os módulos estão conformes</p>
                </div>

                <div className="stats-card">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase">Alertas Recentes</h3>
                        <AlertTriangle className="text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold text-navy">0</div>
                    <p className="text-xs text-muted-foreground mt-2">Nenhuma atividade suspeita detectada</p>
                </div>
            </div>

            <div className="card-military p-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-navy">
                    <History size={20} className="text-accent" /> Log de Auditoria LGPD
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                            <tr>
                                <th className="px-4 py-3">Data/Hora</th>
                                <th className="px-4 py-3">Usuário</th>
                                <th className="px-4 py-3">Ação</th>
                                <th className="px-4 py-3">Módulo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            <tr className="hover:bg-muted/10 transition-colors">
                                <td className="px-4 py-3">24/01/2026 20:30</td>
                                <td className="px-4 py-3">Sistema</td>
                                <td className="px-4 py-3">Verificação de Rotina</td>
                                <td className="px-4 py-3">Base de Dados</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 text-center text-muted-foreground italic text-sm">
                    Relatórios detalhados de auditoria em conformidade com a ISO/IEC 27001.
                </div>
            </div>
        </div>
    );
}
