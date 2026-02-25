import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Cloud, Monitor, Zap, Sparkles } from "lucide-react";

export type OCRMode = 'auto' | 'local' | 'cloud' | 'mistral';

interface OCRModeSelectorProps {
  value: OCRMode;
  onChange: (mode: OCRMode) => void;
  disabled?: boolean;
}

export const OCRModeSelector = ({ value, onChange, disabled }: OCRModeSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Modo OCR</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as OCRMode)}
        disabled={disabled}
        className="grid grid-cols-4 gap-2"
      >
        <div className="relative">
          <RadioGroupItem
            value="auto"
            id="ocr-auto"
            className="peer sr-only"
          />
          <Label
            htmlFor="ocr-auto"
            className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
          >
            <Zap className="mb-1 h-4 w-4" />
            <span className="text-xs font-medium">Auto</span>
            <span className="text-[10px] text-muted-foreground">Híbrido</span>
          </Label>
        </div>

        <div className="relative">
          <RadioGroupItem
            value="mistral"
            id="ocr-mistral"
            className="peer sr-only"
          />
          <Label
            htmlFor="ocr-mistral"
            className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
          >
            <Sparkles className="mb-1 h-4 w-4" />
            <span className="text-xs font-medium">Mistral</span>
            <span className="text-[10px] text-muted-foreground">Markdown</span>
          </Label>
        </div>

        <div className="relative">
          <RadioGroupItem
            value="local"
            id="ocr-local"
            className="peer sr-only"
          />
          <Label
            htmlFor="ocr-local"
            className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
          >
            <Monitor className="mb-1 h-4 w-4" />
            <span className="text-xs font-medium">Local</span>
            <span className="text-[10px] text-muted-foreground">Gratuito</span>
          </Label>
        </div>

        <div className="relative">
          <RadioGroupItem
            value="cloud"
            id="ocr-cloud"
            className="peer sr-only"
          />
          <Label
            htmlFor="ocr-cloud"
            className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
          >
            <Cloud className="mb-1 h-4 w-4" />
            <span className="text-xs font-medium">Cloud</span>
            <span className="text-[10px] text-muted-foreground">OCR.space</span>
          </Label>
        </div>
      </RadioGroup>
      
      <p className="text-xs text-muted-foreground">
        {value === 'auto' && 'Tenta Mistral primeiro, depois local e cloud como fallback'}
        {value === 'mistral' && 'Mistral Vision - OCR com saída em Markdown estruturado'}
        {value === 'local' && 'Tesseract.js - processa no navegador, sem limites'}
        {value === 'cloud' && 'OCR.space API - mais preciso, 25k/mês grátis'}
      </p>
    </div>
  );
};
