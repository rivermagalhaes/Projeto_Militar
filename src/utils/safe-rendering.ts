import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Safely parses a date string or object.
 * Returns null if the input is invalid or null/undefined.
 */
export const safeDate = (date: string | Date | null | undefined): Date | null => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d;
};

/**
 * Safely formats a date using date-fns.
 * Returns a fallback string if the date is invalid.
 */
export const safeFormat = (
    date: string | Date | null | undefined,
    formatStr: string,
    fallback: string = '-'
): string => {
    const d = safeDate(date);
    if (!d) return fallback;
    try {
        return format(d, formatStr, { locale: ptBR });
    } catch (error) {
        console.warn(`Error formatting date: ${date}`, error);
        return fallback;
    }
};

/**
 * Ensures a value is an array. Returns empty array if null/undefined.
 */
export const safeArray = <T>(arr: T[] | null | undefined): T[] => {
    if (Array.isArray(arr)) return arr;
    return [];
};

/**
 * Safely accesses a string property, returning a default if missing.
 */
export const safeString = (str: string | null | undefined, fallback: string = ''): string => {
    return str || fallback;
};

/**
 * Safely accesses a nested object property.
 * Example: safeNested(aluno, 'turma.nome')
 */
export const safeNested = (obj: any, path: string, fallback: any = null): any => {
    if (!obj) return fallback;

    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
        if (current === null || current === undefined) return fallback;
        current = current[key];
    }

    return current === undefined ? fallback : current;
};
