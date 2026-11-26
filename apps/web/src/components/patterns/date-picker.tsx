"use client";

import * as React from "react";
import {
  Button,
  Icon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { ICON_MAP } from "@/config/icons";
import { cn } from "@/lib/cn";
import { formatToIndonesianStandard } from "@/utils/date-formatter";

export interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  name?: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
  containerClassName?: string;
  placeholder?: string;
}

const MONTH_OPTIONS = [
  { value: "0", label: "Januari" },
  { value: "1", label: "Februari" },
  { value: "2", label: "Maret" },
  { value: "3", label: "April" },
  { value: "4", label: "Mei" },
  { value: "5", label: "Juni" },
  { value: "6", label: "Juli" },
  { value: "7", label: "Agustus" },
  { value: "8", label: "September" },
  { value: "9", label: "Oktober" },
  { value: "10", label: "November" },
  { value: "11", label: "Desember" },
] as const;

const WEEKDAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as const;

function parseYmd(
  ymd: string | undefined
): { year: number; month: number; day: number } | null {
  if (!ymd) return null;
  const match = ymd.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function toYmd(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function getTodayYmd(): string {
  const now = new Date();
  return toYmd(now.getFullYear(), now.getMonth(), now.getDate());
}

function isDateDisabled(ymd: string, min?: string, max?: string): boolean {
  if (min && ymd < min) return true;
  if (max && ymd > max) return true;
  return false;
}

function buildCalendarCells(viewYear: number, viewMonth: number) {
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const leadingEmpty = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: Array<{ day: number | null; ymd: string | null }> = [];
  for (let i = 0; i < leadingEmpty; i += 1) {
    cells.push({ day: null, ymd: null });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, ymd: toYmd(viewYear, viewMonth, day) });
  }
  return cells;
}

interface DatePickerCalendarProps {
  value: string;
  todayYmd: string;
  viewYear: number;
  viewMonth: number;
  min?: string;
  max?: string;
  required?: boolean;
  onViewYearChange: (year: number) => void;
  onViewMonthChange: (month: number) => void;
  onSelectDate: (ymd: string) => void;
}

function DatePickerCalendar({
  value,
  todayYmd,
  viewYear,
  viewMonth,
  min,
  max,
  required,
  onViewYearChange,
  onViewMonthChange,
  onSelectDate,
}: DatePickerCalendarProps) {
  const parsedToday = parseYmd(todayYmd)!;
  const minYear = parseYmd(min)?.year ?? 1990;
  const maxYear = parseYmd(max)?.year ?? parsedToday.year + 5;
  const effectiveMinYear = Math.min(minYear, viewYear);
  const effectiveMaxYear = Math.max(maxYear, viewYear);

  const yearOptions = React.useMemo(() => {
    const years: number[] = [];
    for (let y = effectiveMaxYear; y >= effectiveMinYear; y -= 1) {
      years.push(y);
    }
    return years;
  }, [effectiveMinYear, effectiveMaxYear]);

  const cells = React.useMemo(
    () => buildCalendarCells(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      onViewMonthChange(11);
      onViewYearChange(Math.max(effectiveMinYear, viewYear - 1));
    } else {
      onViewMonthChange(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      onViewMonthChange(0);
      onViewYearChange(Math.min(effectiveMaxYear, viewYear + 1));
    } else {
      onViewMonthChange(viewMonth + 1);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-1.5 mb-3">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={handlePrevMonth}
          aria-label="Bulan sebelumnya"
          className="h-9 w-9 shrink-0"
        >
          <Icon icon={ICON_MAP.chevronLeft} size="sm" aria-hidden="true" />
        </Button>

        <div className="flex flex-1 items-center gap-1.5 min-w-0">
          <Select
            value={String(viewMonth)}
            onValueChange={(m) => onViewMonthChange(Number(m))}
          >
            <SelectTrigger
              aria-label="Bulan"
              className="h-9 min-h-9 flex-1 px-2 text-xs font-medium"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-h-60">
              {MONTH_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(viewYear)}
            onValueChange={(y) => onViewYearChange(Number(y))}
          >
            <SelectTrigger
              aria-label="Tahun"
              className="h-9 min-h-9 w-20 shrink-0 px-2 text-xs font-medium"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-h-60">
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={handleNextMonth}
          aria-label="Bulan berikutnya"
          className="h-9 w-9 shrink-0"
        >
          <Icon icon={ICON_MAP.chevronRight} size="sm" aria-hidden="true" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((dayName) => (
          <div
            key={dayName}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {dayName}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, index) => {
          if (!cell.day || !cell.ymd) {
            return <div key={`empty-${index}`} className="h-9" />;
          }

          const isSelected = cell.ymd === value;
          const isToday = cell.ymd === todayYmd;
          const isDayDisabled = isDateDisabled(cell.ymd, min, max);

          return (
            <button
              key={cell.ymd}
              type="button"
              disabled={isDayDisabled}
              onClick={() => onSelectDate(cell.ymd!)}
              aria-label={formatToIndonesianStandard(cell.ymd, cell.ymd)}
              aria-pressed={isSelected}
              className={cn(
                "h-9 w-full rounded-control text-xs font-medium transition-colors focus-ring",
                isSelected
                  ? "bg-primary text-primary-foreground font-semibold"
                  : isToday
                    ? "border border-primary/40 text-primary font-semibold hover:bg-muted"
                    : "text-foreground hover:bg-muted",
                isDayDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-2 border-t border-border flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isDateDisabled(todayYmd, min, max)}
          onClick={() => onSelectDate(todayYmd)}
          className="h-8 px-2 text-xs"
        >
          Hari ini
        </Button>
        {!required && value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSelectDate("")}
            className="h-8 px-2 text-xs text-muted-foreground"
          >
            Bersihkan
          </Button>
        )}
      </div>
    </>
  );
}

/**
 * DatePicker (PMKI Design System Popover Calendar).
 * Unified custom calendar across mobile and desktop with fast month/year selection.
 */
export function DatePicker({
  id: providedId,
  value,
  onChange,
  name,
  label,
  hint,
  error,
  required,
  disabled,
  min,
  max,
  className,
  containerClassName,
  placeholder = "Pilih tanggal",
}: DatePickerProps) {
  const generatedId = React.useId();
  const baseId = providedId || generatedId;
  const hintId = `${baseId}-hint`;
  const errorId = `${baseId}-error`;

  const describedById = error ? errorId : hint ? hintId : undefined;
  const displayValue = value ? formatToIndonesianStandard(value, "") : "";
  const todayYmd = getTodayYmd();

  const [open, setOpen] = React.useState(false);
  const initialTarget = parseYmd(value) ?? parseYmd(todayYmd)!;
  const [viewYear, setViewYear] = React.useState<number>(initialTarget.year);
  const [viewMonth, setViewMonth] = React.useState<number>(initialTarget.month);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      const target = parseYmd(value) ?? parseYmd(getTodayYmd())!;
      setViewYear(target.year);
      setViewMonth(target.month);
    }
    setOpen(nextOpen);
  };

  const handleSelectDate = (ymd: string) => {
    onChange(ymd);
    setOpen(false);
  };

  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label && (
        <label htmlFor={baseId} className="type-label block text-foreground mb-1">
          {label}
          {required && (
            <span aria-hidden="true" className="text-danger ml-0.5">
              *
            </span>
          )}
        </label>
      )}

      {name && <input type="hidden" name={name} value={value} />}

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            id={baseId}
            type="button"
            role="combobox"
            aria-controls={`${baseId}-calendar`}
            disabled={disabled}
            aria-expanded={open}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={describedById}
            className={cn(
              "flex w-full min-h-11 sm:min-h-10 items-center justify-between gap-2 rounded-control border border-border bg-surface px-3 py-2 text-left text-sm text-foreground transition-colors focus-ring disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-danger",
              className
            )}
          >
            <span className={cn("truncate", !displayValue && "text-muted-foreground")}>
              {displayValue || placeholder}
            </span>
            <Icon
              icon={ICON_MAP.calendar}
              size="sm"
              aria-hidden="true"
              className="shrink-0 text-muted-foreground"
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          id={`${baseId}-calendar`}
          align="start"
          className="w-[min(20rem,calc(100vw-2rem))] p-3"
        >
          <DatePickerCalendar
            value={value}
            todayYmd={todayYmd}
            viewYear={viewYear}
            viewMonth={viewMonth}
            min={min}
            max={max}
            required={required}
            onViewYearChange={setViewYear}
            onViewMonthChange={setViewMonth}
            onSelectDate={handleSelectDate}
          />
        </PopoverContent>
      </Popover>

      {hint && !error && (
        <p id={hintId} className="type-caption text-secondary-foreground">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="type-caption text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
