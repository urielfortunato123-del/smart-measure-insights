import { Clock, Lock, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DemoTimerProps {
  formattedTime: string;
  timeRemaining: number;
  usesRemaining: number;
  maxWeeklyUses: number;
}

export const DemoTimer = ({ formattedTime, timeRemaining, usesRemaining, maxWeeklyUses }: DemoTimerProps) => {
  const isLow = timeRemaining < 60000; // Less than 1 minute

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 flex flex-col items-end gap-2"
    )}>
      {/* Main timer */}
      <div className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-md transition-all duration-300",
        isLow 
          ? "bg-destructive/90 text-destructive-foreground animate-pulse" 
          : "bg-amber-500/90 text-amber-950"
      )}>
        <Clock className="h-4 w-4" />
        <span className="font-mono font-bold text-sm">
          {formattedTime}
        </span>
        <Badge variant="outline" className={cn(
          "text-xs border-current",
          isLow ? "text-destructive-foreground" : "text-amber-950"
        )}>
          <Lock className="h-3 w-3 mr-1" />
          DEGUSTAÇÃO
        </Badge>
      </div>

      {/* Uses remaining indicator */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md shadow-md border border-border">
        <Gift className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium text-foreground">
          {usesRemaining} de {maxWeeklyUses} usos restantes esta semana
        </span>
      </div>
    </div>
  );
};

