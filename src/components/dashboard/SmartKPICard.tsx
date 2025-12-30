import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  aiInsight?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  comparison?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
  clickable?: boolean;
}

export const SmartKPICard = ({ 
  title, 
  value, 
  subtitle, 
  aiInsight,
  icon: Icon, 
  trend,
  comparison,
  variant = 'default',
  onClick,
  clickable = true
}: SmartKPICardProps) => {
  const variantStyles = {
    default: 'border-border hover:border-muted-foreground/30',
    primary: 'border-primary/30 bg-primary/5 hover:border-primary/50',
    success: 'border-success/30 bg-success/5 hover:border-success/50',
    warning: 'border-warning/30 bg-warning/5 hover:border-warning/50',
    danger: 'border-destructive/30 bg-destructive/5 hover:border-destructive/50'
  };

  const iconStyles = {
    default: 'text-muted-foreground bg-secondary/50',
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    danger: 'text-destructive bg-destructive/10'
  };

  const trendStyles = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive'
  };

  const TrendIcon = trend?.isPositive ? TrendingUp : trend?.value === 0 ? Minus : TrendingDown;

  return (
    <Card 
      className={cn(
        variantStyles[variant],
        'transition-all duration-300 hover:shadow-lg hover:shadow-primary/5',
        clickable && 'cursor-pointer group'
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {title}
              </p>
              {clickable && (
                <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
            
            <p className="text-2xl font-bold text-foreground tracking-tight">
              {value}
            </p>
            
            {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
            
            {/* Trend indicator */}
            {trend && (
              <div className={cn(
                'flex items-center gap-1.5 text-xs font-medium',
                trend.isPositive ? 'text-success' : trend.value === 0 ? 'text-muted-foreground' : 'text-destructive'
              )}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span>{trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%</span>
                {trend.label && (
                  <span className="text-muted-foreground font-normal">{trend.label}</span>
                )}
              </div>
            )}
            
            {/* AI Insight */}
            {aiInsight && (
              <p className={cn(
                'text-xs mt-2 leading-relaxed',
                trendStyles[variant]
              )}>
                {aiInsight}
              </p>
            )}
            
            {/* Comparison */}
            {comparison && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <span className={cn(
                  'font-medium',
                  comparison.value >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {comparison.value >= 0 ? '↑' : '↓'} {Math.abs(comparison.value).toFixed(1)}%
                </span>
                <span>{comparison.label}</span>
              </div>
            )}
          </div>
          
          <div className={cn('p-2.5 rounded-lg', iconStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
