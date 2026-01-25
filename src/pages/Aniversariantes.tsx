import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Cake } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Aniversariantes() {
  const [aniversariantes, setAniversariantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAniversariantes = async () => {
      const hoje = new Date();
      const inicio = startOfWeek(hoje, { weekStartsOn: 0 });
      const fim = endOfWeek(hoje, { weekStartsOn: 0 });

      const { data } = await supabase.from('alunos').select('*').eq('arquivado', false);

      const lista = data?.filter(a => {
        const nasc = new Date(a.data_nascimento);
        const aniv = new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate());
        return aniv >= inicio && aniv <= fim;
      }).sort((a, b) => {
        const dA = new Date(a.data_nascimento).getDate();
        const dB = new Date(b.data_nascimento).getDate();
        return dA - dB;
      }) || [];

      setAniversariantes(lista);
      setLoading(false);
    };
    fetchAniversariantes();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif font-bold">Aniversariantes da Semana</h1>
      {aniversariantes.length === 0 ? (
        <div className="card-military p-8 text-center">
          <Cake className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum aniversariante esta semana</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aniversariantes.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="card-military p-4 text-center">
              <Cake className="h-8 w-8 mx-auto text-gold mb-2" />
              <h3 className="font-semibold">{a.nome}</h3>
              <p className="text-gold font-bold">{format(new Date(a.data_nascimento), 'dd/MM', { locale: ptBR })}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
