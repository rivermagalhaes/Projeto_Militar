import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DateInputProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
}

export function DateInput({ value, onChange, placeholder = 'DD/MM/AAAA', disabled, className }: DateInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);

  // Format date to DD/MM/YYYY without timezone issues
  const formatDateBR = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Parse DD/MM/YYYY string to Date object (local time, noon to avoid timezone issues)
  const parseDateBR = (str: string): Date | null => {
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    // Validate date parts
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) return null;
    
    // Create date at noon to avoid timezone issues
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);
    
    // Verify the date is valid (e.g., Feb 30 would shift to March)
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
      return null;
    }
    
    return date;
  };

  useEffect(() => {
    if (value) {
      setInputValue(formatDateBR(value));
    } else {
      setInputValue('');
    }
  }, [value]);

  const formatWithMask = (input: string): string => {
    const numbers = input.replace(/\D/g, '');
    let formatted = '';
    
    for (let i = 0; i < numbers.length && i < 8; i++) {
      if (i === 2 || i === 4) formatted += '/';
      formatted += numbers[i];
    }
    
    return formatted;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWithMask(e.target.value);
    setInputValue(formatted);

    if (formatted.length === 10) {
      const parsedDate = parseDateBR(formatted);
      if (parsedDate) {
        if (!disabled || !disabled(parsedDate)) {
          console.log('[DateInput] Parsed date:', formatted, '→', parsedDate.toISOString());
          onChange(parsedDate);
        }
      }
    } else if (formatted.length === 0) {
      onChange(undefined);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      // Ensure we create date at noon to avoid timezone issues
      const correctedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
      console.log('[DateInput] Calendar selected:', formatDateBR(correctedDate));
      onChange(correctedDate);
    } else {
      onChange(undefined);
    }
    setOpen(false);
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <Input
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="flex-1"
        maxLength={10}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" type="button">
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleCalendarSelect}
            disabled={disabled}
            initialFocus
            locale={ptBR}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
