import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { useLayout, GridItem } from '@/contexts/LayoutContext';
import { cn } from '@/lib/utils';
import { GripVertical, Move } from 'lucide-react';

interface DashboardPanel {
  id: string;
  title: string;
  component: React.ReactNode;
}

interface CustomizableGridProps {
  panels: DashboardPanel[];
  className?: string;
}

export const CustomizableGrid: React.FC<CustomizableGridProps> = ({ panels, className }) => {
  const { layout, setGridLayout, isEditMode } = useLayout();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const cols = 12;
  const rowHeight = 80;
  const gap = 12;
  const colWidth = (containerWidth - gap * (cols + 1)) / cols;

  // Calculate position and size for each panel
  const getPanelStyle = useCallback((item: GridItem) => {
    const left = gap + item.x * (colWidth + gap);
    const top = gap + item.y * (rowHeight + gap);
    const width = item.w * colWidth + (item.w - 1) * gap;
    const height = item.h * rowHeight + (item.h - 1) * gap;
    
    return {
      position: 'absolute' as const,
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  }, [colWidth, rowHeight, gap]);

  // Calculate total grid height
  const gridHeight = useMemo(() => {
    if (layout.gridLayout.length === 0) return 400;
    const maxY = Math.max(...layout.gridLayout.map(item => item.y + item.h));
    return maxY * (rowHeight + gap) + gap;
  }, [layout.gridLayout, rowHeight, gap]);

  // Get panels matching layout items
  const visiblePanels = useMemo(() => {
    return layout.gridLayout.map(item => {
      const panel = panels.find(p => p.id === item.i);
      return panel ? { ...panel, layoutItem: item } : null;
    }).filter(Boolean) as Array<DashboardPanel & { layoutItem: GridItem }>;
  }, [panels, layout.gridLayout]);

  if (containerWidth === 0) {
    return <div ref={containerRef} className={cn('w-full min-h-[400px]', className)} />;
  }

  return (
    <div 
      ref={containerRef}
      className={cn('w-full relative', className)}
      style={{ height: `${gridHeight}px` }}
    >
      {visiblePanels.map(({ id, title, component, layoutItem }) => (
        <div
          key={id}
          className={cn(
            'bg-card rounded-lg border border-border overflow-hidden transition-shadow',
            isEditMode && 'ring-2 ring-primary/20 shadow-lg'
          )}
          style={getPanelStyle(layoutItem)}
        >
          {isEditMode && (
            <div className="absolute top-0 left-0 right-0 h-7 bg-primary/10 flex items-center justify-between px-2 z-10 border-b border-border">
              <span className="text-xs font-medium text-primary truncate">{title}</span>
              <Move className="h-4 w-4 text-primary cursor-move" />
            </div>
          )}
          <div className={cn('h-full w-full overflow-auto', isEditMode && 'pt-7')}>
            {component}
          </div>
        </div>
      ))}
      
      {isEditMode && (
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border) / 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border) / 0.3) 1px, transparent 1px)
              `,
              backgroundSize: `${colWidth + gap}px ${rowHeight + gap}px`,
              backgroundPosition: `${gap / 2}px ${gap / 2}px`,
            }}
          />
        </div>
      )}
    </div>
  );
};
