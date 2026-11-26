import type { AttendanceStatus } from "@/lib/status";

export interface AttendanceRecordItemDTO {
  id?: string;
  studentId: string;
  studentFullName: string;
  studentNickname: string;
  registrationNumber: string;
  educationLevelLabel: string;
  status: AttendanceStatus;
  note: string | null;
  recordedOfflineAt: string | null;
  syncedAt: string | null;
}

export interface AttendanceSessionDetailDTO {
  sessionId: string | null;
  organizationId: string;
  serviceUnitId: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  sessionDate: string;
  notes: string | null;
  needsManualReview: boolean;
  roster: AttendanceRecordItemDTO[];
  summary: {
    total: number;
    recorded: number;
    presentCount: number;
    permittedCount: number;
    sickCount: number;
    absentCount: number;
  };
}

export interface AttendanceSessionHistoryItemDTO {
  id: string;
  classId: string;
  className: string;
  sessionDate: string;
  notes: string | null;
  needsManualReview: boolean;
  totalRecorded: number;
  presentCount: number;
  permittedCount: number;
  sickCount: number;
  absentCount: number;
  updatedAt: string;
}

export interface RecordAttendanceSessionResultDTO {
  sessionId: string;
  classId: string;
  sessionDate: string;
  recordedCount: number;
  conflictNeedsManualReview: boolean;
}

export interface QuickAttendanceRosterItemDTO {
  studentId: string;
  studentFullName: string;
  studentNickname: string;
  registrationNumber: string;
  educationLevelLabel: string;
  classId: string;
  className: string;
  recordedStatus: AttendanceStatus | null;
  note: string | null;
  hasExistingRecord: boolean;
}

export interface QuickAttendanceWorkspaceViewDTO {
  sessionDate: string;
  items: QuickAttendanceRosterItemDTO[];
}

export interface RecordQuickAttendanceResultDTO {
  sessionDate: string;
  recordedCount: number;
  classCount: number;
  conflictNeedsManualReview: boolean;
}

