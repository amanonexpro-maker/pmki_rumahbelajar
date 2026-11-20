import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemePreference } from '../../theme/ThemeProvider.tsx';

interface ThemePickerProps {
  className?: string;
}

const options: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Terang' },
  { value: 'dark', label: 'Gelap' },
  { value: 'system', label: 'Sistem' },
];

export const ThemePicker: React.FC<ThemePickerProps> = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'system' ? Monitor : Sun;

  return (
    <label className={`inline-flex items-center gap-2 ${className}`}>
      <ThemeIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span className="sr-only">Tema tampilan</span>
      <select
        aria-label="Tema tampilan"
        value={theme}
        onChange={(event) => {
          const value = event.target.value;
          if (value === 'light' || value === 'dark' || value === 'system') {
            setTheme(value);
          }
        }}
        className="min-w-24 rounded-sm border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors focus-ring cursor-pointer"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};
