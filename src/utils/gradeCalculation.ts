
// Definições de valores (centralizadas para garantir consistência)
export const ELOGIO_VALORES: Record<string, number> = {
    coletivo: 0.20,
    individual: 0.40,
    mencao_honrosa: 0.60
};

export const ANOTACAO_VALORES: Record<string, number> = {
    leve: 0.00, // Leves só pontuam ao acumular
    media: 0.00, // Médias só pontuam ao acumular
    grave: 0.50,
    gravissima: 1.00
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

/**
 * Calcula se uma nova anotação gera termos por acúmulo.
 * Retorna uma lista de termos a serem inseridos.
 */
export const calculateAccumulationTerms = (
    newAnotacaoTipo: string,
    currentAnotacoes: { tipo: string }[]
): { tipo: string; valor_desconto: number; motivo: string }[] => {
    const newTerms = [];
    const leves = currentAnotacoes.filter(a => a.tipo === 'leve').length;
    const medias = currentAnotacoes.filter(a => a.tipo === 'media').length;

    // Adicionamos a nova anotação virtualmente aos contadores para checar o acúmulo
    // Note: This logic assumes the new annotation IS NOT YET in the list
    const newLeves = newAnotacaoTipo === 'leve' ? leves + 1 : leves;
    const newMedias = newAnotacaoTipo === 'media' ? medias + 1 : medias;

    // Direct penalties
    if (newAnotacaoTipo === 'grave') {
        newTerms.push({
            tipo: 'grave',
            valor_desconto: ANOTACAO_VALORES.grave,
            motivo: 'Anotação grave'
        });
    } else if (newAnotacaoTipo === 'gravissima') {
        newTerms.push({
            tipo: 'gravissimo',
            valor_desconto: ANOTACAO_VALORES.gravissima,
            motivo: 'Anotação gravíssima'
        });
    }

    // Accumulation rules
    // 5 Leves = 1 Leve (-0.20)
    if (newLeves > 0 && newLeves % 5 === 0 && newAnotacaoTipo === 'leve') {
        newTerms.push({
            tipo: 'leve',
            valor_desconto: 0.20,
            motivo: '5 anotações leves acumuladas'
        });
    }

    // 3 Médias = 1 Média (-0.30)
    if (newMedias > 0 && newMedias % 3 === 0 && newAnotacaoTipo === 'media') {
        newTerms.push({
            tipo: 'medio',
            valor_desconto: 0.30,
            motivo: '3 anotações médias acumuladas'
        });
    }

    // 3 Leves + 1 Média = 1 Média (-0.30)
    // Needs careful checking: Only trigger if this specific combination is just completed.
    // This is complex because order matters or simply count.
    // Simplifying assumption: check if total counts hitting a multiple relative to the last trigger.
    // But duplicate triggers are risky.
    // The previous logic was: if (leves >= 3 && medias >= 1 && (leves + medias) % 4 === 0)
    // We will stick to the previous implementation's logic for consistency.
    if ((newLeves >= 3 && newMedias >= 1) && (newLeves + newMedias) % 4 === 0) {
        newTerms.push({
            tipo: 'medio',
            valor_desconto: 0.30,
            motivo: '3 leves + 1 média acumuladas'
        });
    }

    return newTerms;
};
