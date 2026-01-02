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
      "fixed bottom-4 left-4 z-40 flex flex-col items-start gap-2 pointer-events-none"
    )}>
      {/* Main timer */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm transition-all duration-300 pointer-events-auto opacity-60 hover:opacity-100",
        isLow 
          ? "bg-destructive/50 text-destructive-foreground animate-pulse" 
          : "bg-muted/50 text-muted-foreground"
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
      <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted/30 backdrop-blur-sm pointer-events-auto opacity-60 hover:opacity-100">
        <Gift className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {usesRemaining}/{maxWeeklyUses} usos
        </span>
      </div>
    </div>
  );
};

