import { Shield } from "lucide-react";

export default function Monitores() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-accent" />
                <h1 className="text-3xl font-bold text-navy">Monitores</h1>
            </div>
            <div className="card-military p-8 text-center">
                <p className="text-muted-foreground italic">Módulo de gestão de monitores em desenvolvimento.</p>
            </div>
        </div>
    );
}
