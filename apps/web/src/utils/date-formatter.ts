/**
 * Robust Zero-Dependency Indonesian Date Formatter (`UI-UX §15`, `03 §7`).
 * Formats any Date object, ISO date string ("2026-10-24" or "2026-10-24T00:00:00.000Z"),
 * or timestamp into standard Indonesian: "D MMMM YYYY" (e.g. "24 Oktober 2026").
 * Preserves already-formatted Indonesian date strings.
 */

const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export function formatToIndonesianStandard(
  dateInput: Date | string | null | undefined,
  fallback = "Terbaru"
): string {
  if (!dateInput) return fallback;

  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    if (!trimmed) return fallback;

    // 1. If it already contains an Indonesian month name, preserve as-is
    for (const month of INDONESIAN_MONTHS) {
      if (trimmed.includes(month)) {
        return trimmed;
      }
    }

    // 2. Direct regex parse for "YYYY-MM-DD" to avoid timezone offset shifts
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const monthIdx = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      if (monthIdx >= 0 && monthIdx < 12 && day >= 1 && day <= 31) {
        return `${day} ${INDONESIAN_MONTHS[monthIdx]} ${year}`;
      }
    }

    // 3. Fallback for standalone 4-digit year like "2026"
    if (/^\d{4}$/.test(trimmed)) {
      return trimmed;
    }
  }

  // 4. Parse as Date object
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) {
    return typeof dateInput === "string" ? dateInput : fallback;
  }

  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return `${d.getDate()} ${INDONESIAN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
}
