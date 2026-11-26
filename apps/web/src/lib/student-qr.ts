/**
 * Pure QR payload helpers for PMKI Student ID Cards.
 * STRICT PRIVACY (05 §13-14): Never encode guardian phone, address, or birth date.
 * Only encodes non-sensitive registration number (`PMKI:<registrationNumber>`).
 */
export const STUDENT_QR_PREFIX = "PMKI:";

export function buildStudentQrPayload(registrationNumber: string): string {
  return `${STUDENT_QR_PREFIX}${registrationNumber.trim().toUpperCase()}`;
}

export function parseStudentQrPayload(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.toUpperCase().startsWith(STUDENT_QR_PREFIX)) {
    const code = trimmed.slice(STUDENT_QR_PREFIX.length).trim().toUpperCase();
    return code.length > 0 ? code : null;
  }
  if (/^RB-\d{4}-/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return null;
}

