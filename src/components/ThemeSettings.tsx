import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeColor, ThemeFont } from '@/src/types';
import { cn } from '@/lib/utils';
import { Check, Palette, Type } from 'lucide-react';

interface ThemeSettingsProps {
  currentColor: ThemeColor;
  currentFont: ThemeFont;
  onColorChange: (color: ThemeColor) => void;
  onFontChange: (font: ThemeFont) => void;
}

const colors: { name: ThemeColor; class: string; label: string }[] = [
  { name: 'zinc', class: 'bg-zinc-900', label: 'Zinc' },
  { name: 'slate', class: 'bg-slate-700', label: 'Slate' },
  { name: 'stone', class: 'bg-stone-600', label: 'Stone' },
  { name: 'orange', class: 'bg-orange-500', label: 'Orange' },
  { name: 'blue', class: 'bg-blue-500', label: 'Blue' },
  { name: 'rose', class: 'bg-rose-500', label: 'Rose' },
  { name: 'green', class: 'bg-green-500', label: 'Green' },
];

const fonts: { name: ThemeFont; label: string; preview: string }[] = [
  { name: 'sans', label: 'Modern Sans', preview: 'Inter' },
  { name: 'display', label: 'Stylish Display', preview: 'Outfit' },
  { name: 'serif', label: 'Classic Serif', preview: 'Baskerville' },
  { name: 'mono', label: 'Technical Mono', preview: 'JetBrains' },
];

export function ThemeSettings({ currentColor, currentFont, onColorChange, onFontChange }: ThemeSettingsProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Palette className="h-4 w-4 text-zinc-400" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Color Scheme</h3>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
          {colors.map((color) => (
            <button
              key={color.name}
              onClick={() => onColorChange(color.name)}
              className={cn(
                "group relative h-10 w-full rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center",
                color.class,
                currentColor === color.name ? "ring-2 ring-offset-2 ring-zinc-900" : "ring-1 ring-zinc-200"
              )}
              title={color.label}
            >
              {currentColor === color.name && <Check className="h-4 w-4 text-white" />}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Type className="h-4 w-4 text-zinc-400" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Typography</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fonts.map((font) => (
            <button
              key={font.name}
              onClick={() => onFontChange(font.name)}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left",
                currentFont === font.name 
                  ? "border-zinc-900 bg-zinc-900 text-white" 
                  : "border-zinc-100 bg-white text-zinc-600 hover:border-zinc-200"
              )}
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">{font.label}</span>
                <span className={cn("text-lg", `font-theme-${font.name}`)}>{font.preview}</span>
              </div>
              {currentFont === font.name && <Check className="h-5 w-5" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
