import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLayout, SidebarPosition, PresetName } from '@/contexts/LayoutContext';
import { 
  Layout, 
  PanelLeft, 
  PanelRight, 
  PanelTop, 
  PanelBottom, 
  EyeOff,
  Save,
  RotateCcw,
  Edit3,
  Check,
  Columns,
  Rows
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export const LayoutControls: React.FC = () => {
  const { 
    layout, 
    currentPreset, 
    setSidebarPosition, 
    applyPreset, 
    saveAsCustom, 
    resetToDefault,
    isEditMode,
    setIsEditMode
  } = useLayout();
  const { toast } = useToast();

  const sidebarPositions: { value: SidebarPosition; label: string; icon: React.ReactNode }[] = [
    { value: 'left', label: 'Esquerda', icon: <PanelLeft className="h-4 w-4" /> },
    { value: 'right', label: 'Direita', icon: <PanelRight className="h-4 w-4" /> },
    { value: 'top', label: 'Topo', icon: <PanelTop className="h-4 w-4" /> },
    { value: 'bottom', label: 'Inferior', icon: <PanelBottom className="h-4 w-4" /> },
    { value: 'hidden', label: 'Ocultar', icon: <EyeOff className="h-4 w-4" /> },
  ];

  const presets: { value: PresetName; label: string; icon: React.ReactNode }[] = [
    { value: 'classic', label: 'Clássico', icon: <Columns className="h-4 w-4" /> },
    { value: 'compact', label: 'Compacto', icon: <Rows className="h-4 w-4" /> },
  ];

  const handleSaveLayout = () => {
    saveAsCustom();
    toast({
      title: 'Layout salvo!',
      description: 'Seu layout personalizado foi salvo com sucesso.',
    });
  };

  const handleResetLayout = () => {
    resetToDefault();
    toast({
      title: 'Layout restaurado',
      description: 'O layout foi restaurado para o padrão clássico.',
    });
  };

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      toast({
        title: 'Modo de edição ativado',
        description: 'Arraste e redimensione os painéis para personalizar o layout.',
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Edit Mode Toggle */}
      <Button
        variant={isEditMode ? 'default' : 'outline'}
        size="sm"
        onClick={handleToggleEditMode}
        className="gap-2"
      >
        {isEditMode ? (
          <>
            <Check className="h-4 w-4" />
            <span className="hidden sm:inline">Concluir</span>
          </>
        ) : (
          <>
            <Edit3 className="h-4 w-4" />
            <span className="hidden sm:inline">Editar Layout</span>
          </>
        )}
      </Button>

      {/* Sidebar Position */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Layout className="h-4 w-4" />
            <span className="hidden sm:inline">Painel</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="end">
          <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
            Posição do painel
          </div>
          {sidebarPositions.map((pos) => (
            <Button
              key={pos.value}
              variant="ghost"
              size="sm"
              className={cn(
                'w-full justify-start gap-2',
                layout.sidebarPosition === pos.value && 'bg-primary/10 text-primary'
              )}
              onClick={() => setSidebarPosition(pos.value)}
            >
              {pos.icon}
              {pos.label}
              {layout.sidebarPosition === pos.value && (
                <Check className="h-3 w-3 ml-auto" />
              )}
            </Button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Presets */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Columns className="h-4 w-4" />
            <span className="hidden sm:inline">Presets</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Layouts predefinidos</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {presets.map((preset) => (
            <DropdownMenuItem
              key={preset.value}
              onClick={() => applyPreset(preset.value)}
              className="gap-2"
            >
              {preset.icon}
              {preset.label}
              {currentPreset === preset.value && (
                <Check className="h-3 w-3 ml-auto" />
              )}
            </DropdownMenuItem>
          ))}
          {currentPreset === 'custom' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="gap-2 text-muted-foreground">
                <Layout className="h-4 w-4" />
                Personalizado (atual)
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save/Reset */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSaveLayout}
        title="Salvar layout"
      >
        <Save className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleResetLayout}
        title="Restaurar padrão"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
};
