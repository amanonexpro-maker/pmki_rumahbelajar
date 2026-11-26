/**
 * Attendance Domain Public API (11 §12).
 */
export const DOMAIN_NAME = "attendance" as const;

export {
  getAttendanceSessionWorkspaceView,
  getQuickAttendanceRosterView,
  listAttendanceSessionHistory,
  recordAttendanceSession,
  recordQuickAttendanceBatch,
} from "./services/attendance-service";

export {
  recordAttendanceSessionAction,
  recordQuickAttendanceAction,
} from "./actions/attendance-actions";

export {
  authorizeReadAttendance,
  authorizeRecordAttendance,
  canReadAttendance,
  canRecordAttendance,
} from "./permissions/attendance-policy";

export {
  ATTENDANCE_STATUS_VALUES,
  attendanceEntrySchema,
  quickAttendanceEntrySchema,
  recordAttendanceSessionSchema,
  recordQuickAttendanceSchema,
  type RecordAttendanceSessionInput,
  type RecordQuickAttendanceInput,
} from "./validators/attendance-validator";

export type {
  AttendanceRecordItemDTO,
  AttendanceSessionDetailDTO,
  AttendanceSessionHistoryItemDTO,
  QuickAttendanceRosterItemDTO,
  QuickAttendanceWorkspaceViewDTO,
  RecordAttendanceSessionResultDTO,
  RecordQuickAttendanceResultDTO,
} from "./types/attendance-types";

export { AttendanceWorkspaceClient } from "./components/attendance-workspace-client";

