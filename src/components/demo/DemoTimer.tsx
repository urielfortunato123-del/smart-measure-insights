import { Clock, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DemoTimerProps {
  formattedTime: string;
  timeRemaining: number;
}

export const DemoTimer = ({ formattedTime, timeRemaining }: DemoTimerProps) => {
  const isLow = timeRemaining < 60000; // Less than 1 minute

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-md transition-all duration-300",
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
        DEMO
      </Badge>
    </div>
  );
};
