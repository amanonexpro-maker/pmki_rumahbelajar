/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// 1. ROLES & PERMISSIONS
// ==========================================
export type Role =
  | 'PLATFORM_ADMIN'
  | 'ORG_ADMIN'
  | 'UNIT_COORDINATOR'
  | 'PROGRAM_COORDINATOR'
  | 'TEACHER'
  | 'VOLUNTEER'
  | 'EDITOR'
  | 'REVIEWER'
  | 'APPROVER'
  | 'AUDITOR'
  | 'STAKEHOLDER';

export type Permission =
  | 'org.read'
  | 'org.write'
  | 'unit.read'
  | 'unit.write'
  | 'program.read'
  | 'program.write'
  | 'student.read'
  | 'student.write'
  | 'student.verify'
  | 'guardian.read'
  | 'guardian.write'
  | 'attendance.read'
  | 'attendance.record'
  | 'development.read'
  | 'development.write'
  | 'consent.read'
  | 'consent.write'
  | 'media.read'
  | 'media.write'
  | 'media.review'
  | 'publication.read'
  | 'publication.write'
  | 'publication.publish'
  | 'report.read'
  | 'report.write'
  | 'report.review'
  | 'report.approve'
  | 'user.read'
  | 'user.write'
  | 'audit.read';

// ==========================================
// 2. DATA CLASSIFICATION
// ==========================================
export type DataClassification = 'PUBLIC' | 'STAKEHOLDER' | 'INTERNAL' | 'CONFIDENTIAL';

// ==========================================
// 3. ORGANIZATION & IDENTITY
// ==========================================
export interface Organization {
  id: string;
  name: string;
  code: string;
  level: 'SINODAL' | 'MUPEL' | 'JEMAAT';
  parentId?: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
}

export interface ServiceUnit {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  type: 'RUMAH_BELAJAR' | 'PANTI_ASUHAN' | 'PELAYANAN_LANSIA' | 'KESEHATAN' | 'UMUM';
  headline: string;
  slogan: string;
  location: string;
  subDistricts: string[]; // e.g. Kalirejo, Lawang
  contactPersons: {
    name: string;
    phone: string;
    role: string;
  }[];
  active: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
  serviceUnitId?: string;
  active: boolean;
  avatarUrl?: string;
  lastLoginAt?: string;
}

// ==========================================
// 4. BENEFICIARY & GUARDIAN (STUDENTS)
// ==========================================
export type RegistrationStatus =
  | 'SUBMITTED'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'CLASS_PLACEMENT'
  | 'ACTIVE'
  | 'WAITLIST'
  | 'REJECTED'
  | 'CANCELLED';

export type GuardianRelation = 'AYAH' | 'IBU' | 'WALI' | 'PENGASUH_RAAL' | 'LAINNYA';

export interface Guardian {
  id: string;
  fullName: string;
  relationship: GuardianRelation;
  phone: string;
  occupation: string;
  address: string;
}

export interface Student {
  id: string;
  registrationNumber: string;
  fullName: string;
  nickname: string;
  gender: 'L' | 'P';
  dateOfBirth: string;
  placeOfBirth: string;
  address: string;
  kelurahan: 'Kalirejo' | 'Lawang' | 'Lainnya';
  gradeLevel: 'TK' | 'SD_1' | 'SD_2' | 'SD_3' | 'SD_4' | 'SD_5' | 'SD_6' | 'SMP_7' | 'SMP_8';
  assignedClassId?: string;
  isRaalResident: boolean; // Anak asuh di RAAL
  status: RegistrationStatus;
  guardian: Guardian;
  notes?: string;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

// ==========================================
// 5. EDUCATION & RUMAH BELAJAR
// ==========================================
export interface AcademicYear {
  id: string;
  name: string; // e.g. 2026/2027
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export interface ClassRoom {
  id: string;
  name: string; // TK A, SD Kelas 1, Kelas Khusus Membaca, etc.
  category: 'TK' | 'SD' | 'SMP' | 'KHUSUS';
  capacity: number;
  enrolledCount: number;
  roomName: string;
  mainTeacherId: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string; // Matematika, Bahasa Inggris, Pendidikan Karakter, Membaca
  description: string;
  targetFocus: string;
}

export interface Teacher {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  originSchool: string; // e.g. Sekolah Katholik Lawang / Guru SDN Lawang
  subjects: string[];
  isCoordinator?: boolean;
}

export interface ClassSchedule {
  id: string;
  dayOfWeek: string; // Sabtu
  timeStart: string; // 15:00
  timeEnd: string; // 17:15
  classId: string;
  subjectId: string;
  teacherId: string;
  location: string;
}

// ==========================================
// 6. ATTENDANCE
// ==========================================
export type AttendanceStatus = 'PRESENT' | 'SICK' | 'PERMITTED' | 'ABSENT';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  className: string;
  date: string;
  recordedBy: string;
  recordedByName: string;
  summary: {
    present: number;
    sick: number;
    permitted: number;
    absent: number;
    total: number;
  };
  records: AttendanceRecord[];
  notes?: string;
  createdAt: string;
}

// ==========================================
// 7. STUDENT DEVELOPMENT & ASSESSMENT
// ==========================================
export interface StudentDevelopmentNote {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  category: 'AKADEMIK' | 'KARAKTER' | 'MEMBACA' | 'KEDISIPLINAN' | 'SOSIAL';
  teacherId: string;
  teacherName: string;
  observation: string;
  progressNotes: string;
  followUp: string;
  classification: DataClassification;
  createdAt: string;
}

// ==========================================
// 8. MEDIA CONSENT & ASSETS
// ==========================================
export type ConsentStatus = 'GRANTED' | 'DENIED' | 'REVOKED';

export interface ConsentRecord {
  id: string;
  studentId: string;
  studentName: string;
  guardianName: string;
  personalDataConsent: ConsentStatus;
  photoVideoPublicConsent: ConsentStatus;
  effectiveDate: string;
  notes?: string;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  title: string;
  description: string;
  url: string;
  category: 'KEGIATAN_BELAJAR' | 'PENGURUS' | 'DOKUMENTASI_ACARA' | 'SARANA';
  capturedDate: string;
  privacyReviewed: boolean;
  isEligibleForPublic: boolean;
  reviewedBy?: string;
}

// ==========================================
// 9. PUBLICATIONS & CONTENT
// ==========================================
export type PublicationStatus = 'DRAFT' | 'PRIVACY_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

export interface PublicationPost {
  id: string;
  title: string;
  slug: string;
  category: 'BERITA' | 'AGENDA' | 'PENGUMUMAN' | 'ARTIKEL';
  summary: string;
  content: string;
  coverImage?: string;
  status: PublicationStatus;
  authorId: string;
  authorName: string;
  publishedAt?: string;
  scheduledFor?: string;
  eventDate?: string;
  eventLocation?: string;
}

// ==========================================
// 10. REPORTS & APPROVAL WORKFLOW
// ==========================================
export type ApprovalStatus =
  | 'DRAFT'
  | 'PROGRAM_REVIEW'
  | 'UNIT_VALIDATION'
  | 'ORGANIZATION_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

export interface ApprovalStepLog {
  step: string;
  actorId: string;
  actorName: string;
  action: 'SUBMITTED' | 'REVIEWED' | 'VALIDATED' | 'APPROVED' | 'REJECTED';
  comment: string;
  timestamp: string;
}

export interface ServiceReport {
  id: string;
  title: string;
  period: string; // e.g. "Triwulan I 2026"
  reportType: 'ACTIVITY' | 'ATTENDANCE_RECAP' | 'STUDENT_DEVELOPMENT' | 'STAKEHOLDER';
  summary: string;
  totalBeneficiaries: number;
  totalSessions: number;
  averageAttendancePct: number;
  createdBy: string;
  createdByName: string;
  status: ApprovalStatus;
  workflowLogs: ApprovalStepLog[];
  classification: DataClassification;
  isPublicSummaryGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 11. AUDIT LOG
// ==========================================
export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
}
