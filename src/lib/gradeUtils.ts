// CMTO V Disciplinary Grade System
// Graus da nota disciplinar conforme regulamento

export interface GradeInfo {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  animation: string;
  textClass: string;
  badgeClass: string;
  message: string;
  glowClass: string;
}

export function getDisciplineGrade(nota: number): GradeInfo {
  if (nota >= 10.00) {
    return {
      label: 'Excepcional',
      color: '#D4AF37', // Dourado
      bgColor: 'bg-[hsl(72,55%,22%)]/10',
      icon: '🏆',
      animation: 'animate-pulse-glow',
      textClass: 'text-[#D4AF37]',
      badgeClass: 'bg-gradient-to-r from-[#D4AF37] to-[#C49B30] text-[#1a1a1a]',
      message: 'Excelência reconhecida! Continue liderando!',
      glowClass: 'glow-gold-intense'
    };
  } else if (nota >= 9.00) {
    return {
      label: 'Ótimo',
      color: '#DAC058', // Dourado claro
      bgColor: 'bg-accent/10',
      icon: '🥇',
      animation: 'animate-fade-in',
      textClass: 'text-accent',
      badgeClass: 'bg-accent/20 text-accent',
      message: 'Excelente conduta! Você é referência!',
      glowClass: 'glow-gold'
    };
  } else if (nota >= 8.00) {
    return {
      label: 'Bom',
      color: '#4B5320', // Verde-oliva
      bgColor: 'bg-primary/10',
      icon: '🛡️',
      animation: 'animate-bounce-subtle',
      textClass: 'text-primary',
      badgeClass: 'bg-primary/20 text-primary',
      message: 'Ótimo trabalho! Mantenha a disciplina.',
      glowClass: 'glow-olive'
    };
  } else if (nota >= 6.00) {
    return {
      label: 'Regular',
      color: '#003366', // Azul escuro
      bgColor: 'bg-secondary/10',
      icon: '⚠️',
      animation: '',
      textClass: 'text-secondary',
      badgeClass: 'bg-secondary/20 text-secondary',
      message: 'Atenção: melhore sua conduta para avançar.',
      glowClass: ''
    };
  } else {
    return {
      label: 'Insuficiente',
      color: '#8B0000', // Vermelho escuro
      bgColor: 'bg-destructive/10',
      icon: '🚨',
      animation: 'animate-shake',
      textClass: 'text-destructive',
      badgeClass: 'bg-destructive/20 text-destructive',
      message: 'Urgente: corrija o comportamento para evitar sanções.',
      glowClass: 'glow-danger'
    };
  }
}

// Helper to format nota with 2 decimal places
export function formatNota(nota: number): string {
  return Number(nota).toFixed(2);
}

// Calculate progress percentage for bar (dynamic scale based on nota)
export function getNotaProgress(nota: number): number {
  // Use -5 as min and dynamic max (at least 15, or nota + 5 if higher)
  const min = -5;
  const max = Math.max(15, nota + 5);
  const clamped = Math.max(min, Math.min(max, nota));
  return ((clamped - min) / (max - min)) * 100;
}

// Get gradient color based on nota for progress bar
export function getProgressGradient(nota: number): string {
  if (nota >= 10) return 'from-[#D4AF37] via-[#C49B30] to-[#B8860B]';
  if (nota >= 9) return 'from-[#DAC058] to-[#C49B30]';
  if (nota >= 8) return 'from-[#4B5320] to-[#6B7340]';
  if (nota >= 6) return 'from-[#003366] to-[#004488]';
  return 'from-[#8B0000] to-[#A00000]';
}
