import type { AdminPermissionRecordDTO } from "../types/administration-types";

export const PRIMARY_OPERATIONAL_ROLE_CODES = new Set([
  "TEACHER",
  "VOLUNTEER",
  "UNIT_COORDINATOR",
  "PROGRAM_COORDINATOR",
  "EDITOR",
]);

export const PERMISSION_MODULE_LABELS: Record<string, string> = {
  student: "Peserta Didik",
  guardian: "Data Wali",
  attendance: "Kehadiran",
  development: "Perkembangan Peserta",
  academic: "Kelas, Jadwal & Pengajar",
  "academic-year": "Kelas, Jadwal & Pengajar",
  class: "Kelas, Jadwal & Pengajar",
  schedule: "Kelas, Jadwal & Pengajar",
  teacher: "Kelas, Jadwal & Pengajar",
  organization: "Organisasi & Unit Layanan",
  "service-unit": "Organisasi & Unit Layanan",
  unit: "Organisasi & Unit Layanan",
  consent: "Persetujuan",
  media: "Dokumentasi",
  publication: "Publikasi",
  report: "Laporan & Tata Kelola",
  audit: "Jejak Audit",
  user: "Administrasi",
  role: "Administrasi",
  permission: "Administrasi",
  administration: "Administrasi",
  system: "Sistem",
};

export function getPermissionModuleLabel(moduleKey: string): string {
  const normalized = moduleKey.trim().toLowerCase();
  if (PERMISSION_MODULE_LABELS[normalized]) {
    return PERMISSION_MODULE_LABELS[normalized];
  }
  const prefix = normalized.split(".")[0] ?? normalized;
  return PERMISSION_MODULE_LABELS[prefix] ?? moduleKey;
}

export function groupPermissionsByModuleLabel(
  permissions: AdminPermissionRecordDTO[]
): Array<[string, AdminPermissionRecordDTO[]]> {
  const map = new Map<string, AdminPermissionRecordDTO[]>();
  for (const perm of permissions) {
    const label = getPermissionModuleLabel(perm.module);
    const list = map.get(label) ?? [];
    list.push(perm);
    map.set(label, list);
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

