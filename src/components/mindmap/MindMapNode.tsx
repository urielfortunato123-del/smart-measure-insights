import { useState } from 'react';
import { MindMapNode as MindMapNodeType } from '@/types/mindmap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  FileText,
  AlertTriangle,
  Calculator,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MindMapNodeProps {
  node: MindMapNodeType;
  level: number;
  onUpdate: (id: string, updates: Partial<MindMapNodeType>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}

const typeConfig = {
  main: {
    icon: Sparkles,
    color: 'bg-primary text-primary-foreground',
    borderColor: 'border-primary',
    label: 'Principal'
  },
  methodology: {
    icon: BookOpen,
    color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-500/50',
    label: 'Metodologia'
  },
  tpu: {
    icon: FileText,
    color: 'bg-green-500/20 text-green-700 dark:text-green-300',
    borderColor: 'border-green-500/50',
    label: 'TPU/SINAPI'
  },
  attention: {
    icon: AlertTriangle,
    color: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
    borderColor: 'border-amber-500/50',
    label: 'Atenção'
  },
  calculation: {
    icon: Calculator,
    color: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-500/50',
    label: 'Cálculo'
  },
  custom: {
    icon: Sparkles,
    color: 'bg-muted text-card-foreground',
    borderColor: 'border-border',
    label: 'Personalizado'
  }
};

export const MindMapNodeComponent = ({ 
  node, 
  level, 
  onUpdate, 
  onDelete, 
  onAddChild 
}: MindMapNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const [editDescription, setEditDescription] = useState(node.description || '');
  const [isExpanded, setIsExpanded] = useState(node.expanded !== false);

  const config = typeConfig[node.type] || typeConfig.custom;
  const Icon = config.icon;
  const hasChildren = node.children && node.children.length > 0;

  const handleSave = () => {
    onUpdate(node.id, { 
      title: editTitle, 
      description: editDescription 
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(node.title);
    setEditDescription(node.description || '');
    setIsEditing(false);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    onUpdate(node.id, { expanded: !isExpanded });
  };

  return (
    <div className={cn("relative", level > 0 && "ml-6 pl-4 border-l-2 border-border")}>
      {/* Connection line */}
      {level > 0 && (
        <div className="absolute left-0 top-4 w-4 h-px bg-border" />
      )}

      <div className={cn(
        "group rounded-lg border p-3 mb-2 transition-all",
        config.borderColor,
        isEditing ? "ring-2 ring-primary" : "hover:shadow-md"
      )}>
        <div className="flex items-start gap-2">
          {/* Expand/Collapse button */}
          {hasChildren && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 shrink-0 mt-0.5"
              onClick={toggleExpand}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Type icon */}
          <div className={cn(
            "shrink-0 rounded-lg p-2",
            config.color
          )}>
            <Icon className="h-4 w-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Título"
                  className="font-medium"
                />
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Descrição (opcional)"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave}>
                    <Check className="h-3 w-3 mr-1" />
                    Salvar
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleCancel}>
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm text-card-foreground">{node.title}</h4>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full",
                    config.color
                  )}>
                    {config.label}
                  </span>
                </div>
                {node.description && (
                  <p className="text-xs text-card-foreground/70 mt-1">
                    {node.description}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          {!isEditing && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onAddChild(node.id)}
              >
                <Plus className="h-3 w-3" />
              </Button>
              {level > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => onDelete(node.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {node.children!.map((child) => (
            <MindMapNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
};
