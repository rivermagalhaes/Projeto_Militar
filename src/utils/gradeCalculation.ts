
// Definições de valores (centralizadas para garantir consistência)
export const ELOGIO_VALORES: Record<string, number> = {
    coletivo: 0.20,
    individual: 0.40,
    mencao_honrosa: 0.60
};

export interface ElogioItem {
    tipo: string;
}

export interface TermoItem {
    valor_desconto: number | string;
}

/**
 * Função PURA de cálculo de nota.
 * Regras:
 * 1. Nota Base Inicial = 8.0
 * 2. Soma todos os elogios (bônus)
 * 3. Subtrai todos os termos (punições)
 * 4. O resultado final NUNCA pode ser menor que 8.0 (Piso)
 * 5. Não há limite máximo (Teto)
 * 
 * @param elogios Lista de elogios do aluno
 * @param termos Lista de termos do aluno
 * @returns Nota final calculada (number)
 */
export const calculateGrade = (elogios: ElogioItem[] | null, termos: TermoItem[] | null): number => {
    let nota = 8.0;

    // Converter inputs para arrays seguros
    const safeElogios = Array.isArray(elogios) ? elogios : [];
    const safeTermos = Array.isArray(termos) ? termos : [];

    // Aplicar Bônus (Elogios)
    safeElogios.forEach(e => {
        const valor = ELOGIO_VALORES[e.tipo] || 0;
        nota += Number(valor);
    });

    // Aplicar Punições (Termos)
    safeTermos.forEach(t => {
        const desconto = Number(t.valor_desconto);
        if (!isNaN(desconto)) {
            nota -= desconto;
        }
    });

    // Regra de Piso: Nota mínima é 8.0
    // Se o cálculo der 6.0, retorna 8.0
    // Se der 10.0, retorna 10.0
    return Math.max(8.0, nota);
};
