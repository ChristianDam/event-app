import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

// Predefined color palette
const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Green
  "#f59e0b", // Yellow
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#84cc16", // Lime
  "#ec4899", // Pink
  "#6b7280", // Gray
  "#0ea5e9", // Sky
  "#dc2626", // Rose
];

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

export function ColorPicker({ value = "#3b82f6", onChange, disabled }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setCustomColor(color);
    setOpen(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      onChange(color);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="w-24 h-10 p-1 border-2"
        >
          <div
            className="w-full h-full rounded flex items-center justify-center text-xs font-medium"
            style={{ backgroundColor: value }}
          >
            <span
              className="mix-blend-difference text-white"
              style={{ filter: "invert(1) grayscale(1) contrast(9)" }}
            >
              Color
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-3">Preset Colors</h4>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                    value === color ? "ring-2 ring-offset-2 ring-gray-400" : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                />
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Custom Color</h4>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={customColor}
                onChange={handleCustomColorChange}
                placeholder="#3b82f6"
                className="font-mono text-sm"
              />
              <div
                className="w-8 h-8 rounded border border-gray-300"
                style={{ backgroundColor: customColor }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Enter a hex color code (e.g., #3b82f6)
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}