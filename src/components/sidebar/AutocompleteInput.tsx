import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
}

export const AutocompleteInput = ({
  value,
  onChange,
  suggestions,
  placeholder,
  className
}: AutocompleteInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length >= 2) {
      const matches = suggestions.filter(s =>
        s.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10);
      setFiltered(matches);
      setIsOpen(matches.length > 0);
    } else {
      setFiltered([]);
      setIsOpen(false);
    }
  }, [value, suggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: string) => {
    onChange(item);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn("bg-secondary/50", className)}
        onFocus={() => value.length >= 2 && filtered.length > 0 && setIsOpen(true)}
      />
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg">
          <ScrollArea className="max-h-48">
            {filtered.map((item, idx) => (
              <div
                key={idx}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => handleSelect(item)}
              >
                {item}
              </div>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
