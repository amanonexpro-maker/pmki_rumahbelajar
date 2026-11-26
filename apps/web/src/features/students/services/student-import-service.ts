import ExcelJS from "exceljs";
import { getActiveAcademicYear } from "@/features/academic";
import { recordDomainAuditEvent } from "@/features/audit";
import { recordInitialRegistrationConsent } from "@/features/consent";
import { getDefaultPilotServiceUnit } from "@/features/organization";
import { getHumanErrorMessage } from "@/lib/messages";
import type { SessionUser } from "@/server/auth/session";
import { fail, ok, type ActionResult } from "@/server/contracts/result";
import { authorizeImportStudents } from "../permissions/student-policy";
import {
  countTotalStudentsByUnit,
  insertStudentWithGuardian,
} from "../repositories/student-repository";
import {
  EDUCATION_LEVEL_LABELS,
  GUARDIAN_RELATIONSHIP_LABELS,
  type EducationLevelCode,
  type GuardianRelationshipCode,
} from "../types/student-types";
import {
  EDUCATION_LEVEL_VALUES,
  GUARDIAN_RELATIONSHIP_VALUES,
  importStudentRowSchema,
  type ImportStudentRowInput,
} from "../validators/student-validator";

export interface StudentImportPreviewRow {
  rowNumber: number;
  valid: boolean;
  fullName: string;
  nickname: string;
  educationLevelLabel: string;
  district: string;
  guardianFullName: string;
  photoVideoConsent: "GRANTED" | "DENIED" | "-";
  errors: string[];
  data?: ImportStudentRowInput;
}

export interface StudentImportPreviewResult {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  rows: StudentImportPreviewRow[];
}

const TEMPLATE_COLUMNS = [
  { header: "Nama Lengkap *", key: "fullName", width: 28 },
  { header: "Nama Panggilan *", key: "nickname", width: 18 },
  { header: "Jenis Kelamin (L/P) *", key: "gender", width: 20 },
  { header: "Tanggal Lahir (YYYY-MM-DD) *", key: "birthDate", width: 26 },
  { header: "Jenjang Pendidikan *", key: "educationLevel", width: 22 },
  { header: "Asal Sekolah", key: "schoolName", width: 24 },
  { header: "Wilayah (Kalirejo/Lawang/Lainnya) *", key: "district", width: 32 },
  { header: "Alamat Lengkap", key: "address", width: 32 },
  { header: "Anak Asuh RAAL (YA/TIDAK) *", key: "isRaalResident", width: 26 },
  { header: "Nama Orang Tua / Wali *", key: "guardianFullName", width: 26 },
  {
    header: "Hubungan Wali (AYAH/IBU/WALI/PENGASUH_RAAL/LAINNYA) *",
    key: "guardianRelationship",
    width: 44,
  },
  { header: "No. WhatsApp Wali *", key: "guardianPhone", width: 22 },
  { header: "Pekerjaan Wali", key: "guardianOccupation", width: 22 },
  { header: "Persetujuan Data (YA) *", key: "personalDataConsent", width: 24 },
  {
    header: "Persetujuan Foto & Video (IZINKAN/TOLAK) *",
    key: "photoVideoConsent",
    width: 36,
  },
] as const;

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text.trim();
    if ("result" in value && value.result !== undefined) {
      return String(value.result).trim();
    }
    return "";
  }
  return String(value).trim();
}

function normalizeDateString(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const d = dmy[1].padStart(2, "0");
    const m = dmy[2].padStart(2, "0");
    return `${dmy[3]}-${m}-${d}`;
  }
  return trimmed;
}

function normalizeGender(raw: string): string {
  const upper = raw.trim().toUpperCase();
  if (upper === "L" || upper === "LAKI-LAKI" || upper === "LAKI LAKI") return "L";
  if (upper === "P" || upper === "PEREMPUAN") return "P";
  return upper;
}

function normalizeEducationLevel(raw: string): string {
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase().replace(/\s+/g, "_");
  if ((EDUCATION_LEVEL_VALUES as readonly string[]).includes(upper)) return upper;

  for (const [code, label] of Object.entries(EDUCATION_LEVEL_LABELS)) {
    if (label.toLowerCase() === trimmed.toLowerCase()) {
      return code;
    }
  }
  return upper;
}

function normalizeGuardianRelationship(raw: string): string {
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase().replace(/\s+/g, "_");
  if ((GUARDIAN_RELATIONSHIP_VALUES as readonly string[]).includes(upper)) {
    return upper;
  }
  for (const [code, label] of Object.entries(GUARDIAN_RELATIONSHIP_LABELS)) {
    if (label.toLowerCase() === trimmed.toLowerCase()) {
      return code;
    }
  }
  return upper;
}

function normalizeDistrict(raw: string): string {
  const lower = raw.trim().toLowerCase();
  if (lower === "kalirejo" || lower === "kelurahan kalirejo") return "Kalirejo";
  if (lower === "lawang" || lower === "kecamatan lawang") return "Lawang";
  if (lower === "lainnya") return "Lainnya";
  return raw.trim();
}

function normalizeBooleanYesNo(raw: string): boolean {
  const upper = raw.trim().toUpperCase();
  return upper === "YA" || upper === "YES" || upper === "TRUE" || upper === "1";
}

function normalizePersonalDataConsent(raw: string): boolean {
  const upper = raw.trim().toUpperCase();
  return upper === "YA" || upper === "SETUJU" || upper === "GRANTED" || upper === "TRUE";
}

function normalizePhotoVideoConsent(raw: string): string {
  const upper = raw.trim().toUpperCase();
  if (upper === "IZINKAN" || upper === "GRANTED" || upper === "YA" || upper === "SETUJU") {
    return "GRANTED";
  }
  if (upper === "TOLAK" || upper === "DENIED" || upper === "TIDAK") {
    return "DENIED";
  }
  return upper;
}

/**
 * Generates an official PMKI .xlsx import template with guide sheet.
 */
export async function generateStudentImportTemplateWorkbook(): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Rumah Belajar Griya Asih";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Data Peserta Didik");
  sheet.columns = TEMPLATE_COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.height = 24;

  sheet.addRow({
    fullName: "Contoh: Nadia Putri Lestari",
    nickname: "Nadia",
    gender: "P",
    birthDate: "2016-05-14",
    educationLevel: "SD_4",
    schoolName: "SDN Kalirejo 1",
    district: "Kalirejo",
    address: "Jl. Mawar No. 12, Kalirejo",
    isRaalResident: "TIDAK",
    guardianFullName: "Ibu Rina Lestari",
    guardianRelationship: "IBU",
    guardianPhone: "081234567890",
    guardianOccupation: "Penjahit",
    personalDataConsent: "YA",
    photoVideoConsent: "IZINKAN",
  });

  const guide = workbook.addWorksheet("Panduan Pengisian");
  guide.columns = [
    { header: "Kolom", key: "col", width: 36 },
    { header: "Aturan & Nilai yang Diterima", key: "rule", width: 68 },
  ];
  guide.getRow(1).font = { bold: true };
  guide.addRows([
    {
      col: "Status Awal Pendaftaran",
      rule: "Seluruh data hasil impor otomatis berstatus Pendaftaran masuk (SUBMITTED) agar tetap melalui proses verifikasi.",
    },
    {
      col: "Jenis Kelamin",
      rule: "Isi L (Laki-laki) atau P (Perempuan).",
    },
    {
      col: "Tanggal Lahir",
      rule: "Format YYYY-MM-DD (contoh: 2016-05-14) atau DD/MM/YYYY.",
    },
    {
      col: "Jenjang Pendidikan",
      rule: `Gunakan salah satu kode: ${EDUCATION_LEVEL_VALUES.join(", ")}`,
    },
    {
      col: "Wilayah",
      rule: "Kalirejo, Lawang, atau Lainnya.",
    },
    {
      col: "Anak Asuh RAAL",
      rule: "Isi YA atau TIDAK.",
    },
    {
      col: "Hubungan Wali",
      rule: `Gunakan salah satu kode: ${GUARDIAN_RELATIONSHIP_VALUES.join(", ")}`,
    },
    {
      col: "Persetujuan Data",
      rule: "Wajib diisi YA (menandakan persetujuan pemrosesan data dari orang tua/wali).",
    },
    {
      col: "Persetujuan Foto & Video",
      rule: "Isi IZINKAN atau TOLAK secara eksplisit (terpisah dari persetujuan data).",
    },
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

/**
 * Parses and validates an uploaded .xlsx buffer without mutating the database.
 */
export async function parseAndValidateStudentImportXlsx(
  user: SessionUser | null | undefined,
  fileBytes: Uint8Array
): Promise<ActionResult<StudentImportPreviewResult>> {
  const pilotUnit = await getDefaultPilotServiceUnit();
  if (!pilotUnit) {
    return fail("RESOURCE_NOT_FOUND", "Unit layanan Rumah Belajar belum terkonfigurasi.");
  }

  const authz = authorizeImportStudents(user, pilotUnit.serviceUnitId);
  if (!authz.success) return authz;

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(Buffer.from(fileBytes) as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  } catch {
    return fail(
      "VALIDATION_FAILED",
      "Berkas Excel tidak dapat dibaca. Pastikan format berkas adalah .xlsx yang valid."
    );
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return fail("VALIDATION_FAILED", "Berkas Excel tidak memiliki lembar kerja (sheet).");
  }

  const rows: StudentImportPreviewRow[] = [];
  const maxRows = 200;

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    if (rows.length >= maxRows) return;

    const rawValues = Array.from({ length: 15 }, (_, idx) =>
      cellToString(row.getCell(idx + 1).value)
    );
    if (rawValues.every((v) => v === "")) return;

    const candidate = {
      fullName: rawValues[0],
      nickname: rawValues[1],
      gender: normalizeGender(rawValues[2]),
      birthDate: normalizeDateString(rawValues[3]),
      educationLevel: normalizeEducationLevel(rawValues[4]),
      schoolName: rawValues[5] || undefined,
      district: normalizeDistrict(rawValues[6]),
      address: rawValues[7] || undefined,
      isRaalResident: normalizeBooleanYesNo(rawValues[8]),
      guardianFullName: rawValues[9],
      guardianRelationship: normalizeGuardianRelationship(rawValues[10]),
      guardianPhone: rawValues[11],
      guardianOccupation: rawValues[12] || undefined,
      personalDataConsent: normalizePersonalDataConsent(rawValues[13]),
      photoVideoConsent: normalizePhotoVideoConsent(rawValues[14]),
    };

    const parsed = importStudentRowSchema.safeParse(candidate);
    if (parsed.success) {
      const edCode = parsed.data.educationLevel as EducationLevelCode;
      rows.push({
        rowNumber,
        valid: true,
        fullName: parsed.data.fullName,
        nickname: parsed.data.nickname,
        educationLevelLabel: EDUCATION_LEVEL_LABELS[edCode] ?? edCode,
        district: parsed.data.district,
        guardianFullName: parsed.data.guardianFullName,
        photoVideoConsent: parsed.data.photoVideoConsent,
        errors: [],
        data: parsed.data,
      });
    } else {
      const errorMessages = Array.from(
        new Set(parsed.error.issues.map((issue) => issue.message))
      );
      rows.push({
        rowNumber,
        valid: false,
        fullName: rawValues[0] || `(Baris ${rowNumber})`,
        nickname: rawValues[1] || "-",
        educationLevelLabel: rawValues[4] || "-",
        district: rawValues[6] || "-",
        guardianFullName: rawValues[9] || "-",
        photoVideoConsent: "-",
        errors: errorMessages,
      });
    }
  });

  if (rows.length === 0) {
    return fail(
      "VALIDATION_FAILED",
      "Tidak ada baris data peserta didik ditemukan pada berkas Excel."
    );
  }

  const validCount = rows.filter((r) => r.valid).length;
  return ok({
    totalRows: rows.length,
    validCount,
    invalidCount: rows.length - validCount,
    rows,
  });
}

/**
 * Commits valid rows from an .xlsx upload into PostgreSQL with initial status SUBMITTED.
 */
export async function commitStudentImportXlsx(
  user: SessionUser | null | undefined,
  fileBytes: Uint8Array
): Promise<
  ActionResult<{
    importedCount: number;
    skippedCount: number;
    importedStudents: Array<{
      studentId: string;
      registrationNumber: string;
      fullName: string;
    }>;
  }>
> {
  const previewResult = await parseAndValidateStudentImportXlsx(user, fileBytes);
  if (!previewResult.success) return previewResult;

  const validRows = previewResult.data.rows.filter(
    (r): r is StudentImportPreviewRow & { data: ImportStudentRowInput } =>
      r.valid && Boolean(r.data)
  );

  if (validRows.length === 0) {
    return fail(
      "VALIDATION_FAILED",
      "Tidak ada baris valid yang dapat disimpan. Perbaiki data pada berkas Excel terlebih dahulu."
    );
  }

  const pilotUnit = await getDefaultPilotServiceUnit();
  if (!pilotUnit) {
    return fail("RESOURCE_NOT_FOUND", getHumanErrorMessage("RESOURCE_NOT_FOUND"));
  }

  const activeYear = await getActiveAcademicYear(pilotUnit.serviceUnitId);
  if (!activeYear) {
    return fail(
      "RESOURCE_NOT_FOUND",
      "Tahun ajaran aktif belum tersedia untuk unit layanan ini."
    );
  }

  const baseCount = await countTotalStudentsByUnit(pilotUnit.serviceUnitId);
  const yearPrefix = activeYear.name.slice(0, 4) || "2026";
  const importedStudents: Array<{
    studentId: string;
    registrationNumber: string;
    fullName: string;
  }> = [];

  for (let i = 0; i < validRows.length; i += 1) {
    const row = validRows[i].data;
    const seq = String(baseCount + i + 1).padStart(3, "0");
    const suffix = String((Date.now() + i) % 1000).padStart(3, "0");
    const registrationNumber = `RB-${yearPrefix}-${seq}${suffix}`;
    const resolvedAddress =
      row.address?.trim() || `Kelurahan ${row.district}, Lawang`;

    const { student, guardian } = await insertStudentWithGuardian({
      organizationId: pilotUnit.organizationId,
      serviceUnitId: pilotUnit.serviceUnitId,
      academicYearId: activeYear.id,
      registrationNumber,
      fullName: row.fullName,
      nickname: row.nickname,
      birthDate: row.birthDate,
      gender: row.gender,
      educationLevel: row.educationLevel as EducationLevelCode,
      schoolName: row.schoolName || null,
      address: resolvedAddress,
      district: row.district,
      isRaalResident: row.isRaalResident,
      guardianFullName: row.guardianFullName,
      guardianRelationship: row.guardianRelationship as GuardianRelationshipCode,
      guardianPhone: row.guardianPhone,
      guardianOccupation: row.guardianOccupation || null,
      actorId: user?.id ?? null,
    });

    await recordInitialRegistrationConsent({
      organizationId: pilotUnit.organizationId,
      serviceUnitId: pilotUnit.serviceUnitId,
      studentId: student.id,
      guardianId: guardian.id,
      personalDataConsent: "GRANTED",
      photoVideoConsent: row.photoVideoConsent,
      notes: "Impor data peserta didik (.xlsx)",
      actorId: user?.id ?? null,
    });

    await recordDomainAuditEvent({
      name: "StudentRegistered",
      organizationId: pilotUnit.organizationId,
      serviceUnitId: pilotUnit.serviceUnitId,
      actorId: user?.id ?? null,
      entityType: "student",
      entityId: student.id,
      description: `Pendaftaran peserta didik ${student.fullName} (${student.registrationNumber}) melalui impor Excel.`,
      metadata: {
        source: "xlsx_import",
        registrationNumber: student.registrationNumber,
        educationLevel: student.educationLevel,
        registrationStatus: student.registrationStatus,
        photoVideoConsent: row.photoVideoConsent,
      },
    });

    importedStudents.push({
      studentId: student.id,
      registrationNumber: student.registrationNumber,
      fullName: student.fullName,
    });
  }

  return ok({
    importedCount: importedStudents.length,
    skippedCount: previewResult.data.invalidCount,
    importedStudents,
  });
}
