
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
 * Fornece apenas o delta (soma/subtração) dos itens de histórico.
 */
export const calculateGradeDelta = (elogios: ElogioItem[] | null, termos: TermoItem[] | null): number => {
    let delta = 0;

    const safeElogios = Array.isArray(elogios) ? elogios : [];
    const safeTermos = Array.isArray(termos) ? termos : [];

    safeElogios.forEach(e => {
        delta += ELOGIO_VALORES[e.tipo] || 0;
    });

    safeTermos.forEach(t => {
        const desconto = Number(t.valor_desconto);
        if (!isNaN(desconto)) {
            delta -= desconto;
        }
    });

    return delta;
};

/**
 * Função de cálculo de nota.
 * RESPEITA O VALOR BASE INFORMADO.
 * 
 * @param baseNota A nota inicial/atual do aluno
 * @param elogios Lista de elogios
 * @param termos Lista de termos
 * @returns Nota final calculada
 */
export const calculateGrade = (baseNota: number, elogios: ElogioItem[] | null, termos: TermoItem[] | null): number => {
    const delta = calculateGradeDelta(elogios, termos);
    return baseNota + delta;
};
