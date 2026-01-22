import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MfaReminderProps {
  isAdmin: boolean;
}

export function MfaReminder({ isAdmin }: MfaReminderProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      // Check if reminder was dismissed today
      const lastDismissed = localStorage.getItem('mfa_reminder_dismissed');
      const today = new Date().toDateString();
      
      if (lastDismissed !== today) {
        // Show after 2 seconds
        const timer = setTimeout(() => setShow(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isAdmin]);

  const dismiss = () => {
    localStorage.setItem('mfa_reminder_dismissed', new Date().toDateString());
    setShow(false);
  };

  if (!isAdmin) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 rounded-lg p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 rounded-full">
                <Lock className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Segurança Recomendada
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Como administrador, recomendamos ativar a autenticação de dois fatores (MFA) para maior segurança da sua conta.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={dismiss}>
                    Lembrar depois
                  </Button>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={dismiss} className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
