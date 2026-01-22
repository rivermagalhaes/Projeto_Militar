import { motion } from 'framer-motion';
import { getDisciplineGrade, formatNota, getNotaProgress, getProgressGradient } from '@/lib/gradeUtils';
import { cn } from '@/lib/utils';
import { Medal, Star, Award, TrendingUp, AlertTriangle, Shield, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GradeDisplayProps {
  nota: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showProgress?: boolean;
  showBadge?: boolean;
  showMessage?: boolean;
  className?: string;
}

// Partículas douradas para Excepcional
function GoldenParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-[#D4AF37]"
          initial={{
            x: '50%',
            y: '50%',
            opacity: 0,
            scale: 0
          }}
          animate={{
            x: `${50 + (Math.random() - 0.5) * 100}%`,
            y: `${50 + (Math.random() - 0.5) * 100}%`,
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
            repeatDelay: 1
          }}
        />
      ))}
    </div>
  );
}

// Animated icon based on grade - MUITO mais impactante
function GradeIcon({ nota, size = 'md' }: { nota: number; size?: string }) {
  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };
  
  const iconClass = iconSizes[size as keyof typeof iconSizes] || iconSizes.md;
  
  // EXCEPCIONAL: Medalha dourada girando lentamente + glow pulsante intenso
  if (nota >= 10) {
    return (
      <motion.div
        className="relative"
        animate={{ 
          rotate: [0, 5, -5, 0],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.div
          className="absolute inset-0 rounded-full bg-[#D4AF37]/30 blur-xl"
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="text-[#D4AF37] drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]"
        >
          <Medal className={iconClass} />
        </motion.div>
        <motion.div
          className="absolute -top-1 -right-1"
          animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Sparkles className="h-4 w-4 text-[#D4AF37]" />
        </motion.div>
      </motion.div>
    );
  } 
  // ÓTIMO: Medalha com glow
  else if (nota >= 9) {
    return (
      <motion.div
        className="relative"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.div
          className="absolute inset-0 rounded-full bg-accent/20 blur-lg"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="text-accent drop-shadow-[0_0_10px_rgba(218,192,88,0.6)]">
          <Award className={iconClass} />
        </div>
      </motion.div>
    );
  } 
  // BOM: Escudo verde-oliva com bounce leve
  else if (nota >= 8) {
    return (
      <motion.div
        animate={{ y: [-3, 3, -3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="text-primary"
      >
        <Shield className={iconClass} />
      </motion.div>
    );
  } 
  // REGULAR: Alerta girando devagar
  else if (nota >= 6) {
    return (
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="text-secondary"
      >
        <AlertTriangle className={iconClass} />
      </motion.div>
    );
  } 
  // INSUFICIENTE: Sirene piscando vermelho + shake
  else {
    return (
      <motion.div
        animate={{ 
          x: [-4, 4, -4, 4, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{ 
          duration: 0.6, 
          repeat: Infinity, 
          repeatDelay: 1.5 
        }}
        className="relative"
      >
        <motion.div
          className="absolute inset-0 rounded-full bg-destructive/30 blur-lg"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="text-destructive"
        >
          <AlertTriangle className={iconClass} />
        </motion.div>
      </motion.div>
    );
  }
}

export function GradeDisplay({ 
  nota, 
  size = 'md', 
  showProgress = false,
  showBadge = true,
  showMessage = false,
  className 
}: GradeDisplayProps) {
  const grade = getDisciplineGrade(nota);
  const progress = getNotaProgress(nota);
  const gradientClass = getProgressGradient(nota);
  
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-3xl',
    lg: 'text-5xl',
    xl: 'text-7xl'
  };

  const badgeSizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-4 py-1.5',
    xl: 'text-base px-5 py-2'
  };

  const messageSizeClasses = {
    sm: 'text-[10px]',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  return (
    <div className={cn('flex flex-col items-center gap-3 relative', className)}>
      {/* Partículas para Excepcional */}
      {nota >= 10 && (size === 'lg' || size === 'xl') && <GoldenParticles />}
      
      {/* Icon animado */}
      {(size === 'lg' || size === 'xl' || size === 'md') && (
        <div className="mb-1">
          <GradeIcon nota={nota} size={size} />
        </div>
      )}
      
      {/* Nota numérica com efeitos */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className={cn(
          'font-bold font-mono relative',
          sizeClasses[size],
          grade.textClass,
          nota >= 10 && 'drop-shadow-[0_0_20px_rgba(212,175,55,0.7)]',
          nota >= 9 && nota < 10 && 'drop-shadow-[0_0_12px_rgba(218,192,88,0.5)]',
          nota < 6 && 'drop-shadow-[0_0_10px_rgba(139,0,0,0.4)]'
        )}
      >
        {/* Glow background for high grades */}
        {nota >= 10 && (
          <motion.span
            className="absolute inset-0 bg-[#D4AF37]/10 rounded-lg blur-xl -z-10"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        
        {formatNota(nota)}
        
        {/* Sparkle para Excepcional */}
        {nota >= 10 && (
          <>
            <motion.span
              className="absolute -top-2 -right-3 text-lg"
              animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8], rotate: [0, 20, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ✨
            </motion.span>
            <motion.span
              className="absolute -bottom-1 -left-2 text-sm"
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              ⭐
            </motion.span>
          </>
        )}
      </motion.div>
      
      {/* Badge com grau - mais vibrante */}
      {showBadge && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full font-semibold border',
            badgeSizeClasses[size],
            grade.badgeClass,
            nota >= 10 && 'shadow-[0_0_20px_rgba(212,175,55,0.5)] border-[#D4AF37]/50',
            nota >= 9 && nota < 10 && 'shadow-[0_0_15px_rgba(218,192,88,0.4)] border-accent/40',
            nota >= 8 && nota < 9 && 'border-primary/40',
            nota >= 6 && nota < 8 && 'border-secondary/40',
            nota < 6 && 'shadow-[0_0_10px_rgba(139,0,0,0.3)] border-destructive/40'
          )}
        >
          <span className="text-base">{grade.icon}</span>
          <span>{grade.label}</span>
        </motion.span>
      )}
      
      {/* Mensagem motivacional vibrante */}
      {showMessage && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={cn(
            'font-semibold text-center mt-2 px-4',
            messageSizeClasses[size],
            nota >= 10 && 'text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]',
            nota >= 9 && nota < 10 && 'text-accent',
            nota >= 8 && nota < 9 && 'text-primary',
            nota >= 6 && nota < 8 && 'text-secondary',
            nota < 6 && 'text-destructive animate-pulse'
          )}
        >
          {grade.message}
        </motion.p>
      )}
      
      {/* Progress bar melhorada com gradiente dinâmico */}
      {showProgress && (
        <div className="w-full mt-4">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5 px-1">
            <span className="text-destructive font-medium">-5</span>
            <span>0</span>
            <span className="text-secondary">6</span>
            <span className="text-primary">8</span>
            <span className="text-accent">10</span>
            <span className="text-[#D4AF37] font-medium">15</span>
          </div>
          <div className="progress-military h-5 relative overflow-hidden">
            {/* Marcadores de referência */}
            <div className="absolute inset-0 flex">
              <div className="w-[25%] border-r border-white/10" /> {/* -5 to 0 */}
              <div className="w-[30%] border-r border-white/10" /> {/* 0 to 6 */}
              <div className="w-[10%] border-r border-white/10" /> {/* 6 to 8 */}
              <div className="w-[10%] border-r border-white/10" /> {/* 8 to 10 */}
              <div className="w-[25%]" /> {/* 10 to 15 */}
            </div>
            
            {/* Barra de progresso com overshoot */}
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${progress}%` }} 
              transition={{ 
                duration: 1.2, 
                ease: nota >= 10 ? [0.34, 1.56, 0.64, 1] : 'easeOut' // overshoot para >10
              }}
              className={cn(
                'h-full rounded-full relative overflow-hidden',
                `bg-gradient-to-r ${gradientClass}`
              )}
            >
              {/* Efeito de brilho deslizante para notas altas */}
              {nota >= 8 && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                />
              )}
              
              {/* Glow extra para notas muito altas */}
              {nota >= 10 && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 via-white/30 to-[#D4AF37]/20"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.div>
            
            {/* Indicador de posição */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, left: `${Math.min(progress, 98)}%` }}
              transition={{ duration: 1.2, delay: 0.5 }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-background"
              style={{ backgroundColor: grade.color }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Compact inline version for tables with tooltip - mais interativo
export function GradeBadge({ nota, className }: { nota: number; className?: string }) {
  const grade = getDisciplineGrade(nota);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.08 }}
            className={cn('flex items-center gap-2 cursor-pointer group', className)}
          >
            <span className={cn(
              'font-bold font-mono transition-all',
              grade.textClass,
              nota >= 10 && 'drop-shadow-[0_0_6px_rgba(212,175,55,0.5)]'
            )}>
              {formatNota(nota)}
            </span>
            <motion.span 
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all',
                grade.badgeClass,
                nota >= 10 && 'shadow-[0_0_10px_rgba(212,175,55,0.4)]'
              )}
              whileHover={{ scale: 1.05 }}
            >
              <span className="group-hover:animate-bounce">{grade.icon}</span>
              <span>{grade.label}</span>
            </motion.span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-card border-accent max-w-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{grade.icon}</span>
            <p className="font-semibold text-sm" style={{ color: grade.color }}>{grade.label}</p>
          </div>
          <p className="text-xs">{grade.message}</p>
          {nota < 10 && (
            <p className="text-[10px] text-accent mt-1.5 border-t border-border pt-1.5">
              💡 Dica: Alcance Excepcional com elogios!
            </p>
          )}
          {nota >= 10 && (
            <p className="text-[10px] text-[#D4AF37] mt-1.5 border-t border-border pt-1.5">
              🏆 Você é referência para a turma!
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}