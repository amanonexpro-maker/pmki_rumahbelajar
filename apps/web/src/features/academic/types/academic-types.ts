export interface AcademicYearDTO {
  id: string;
  serviceUnitId: string;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface ClassSummaryDTO {
  id: string;
  organizationId: string;
  serviceUnitId: string;
  academicYearId: string;
  programId: string | null;
  name: string;
  category: string;
  capacity: number;
  enrolledCount: number;
  remainingSeats: number;
  isFull: boolean;
  roomName: string | null;
  mainTeacherName: string | null;
  active: boolean;
}

export interface ScheduleDetailDTO {
  id: string;
  classId: string;
  className: string;
  subjectName: string;
  teacherName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location: string | null;
}

export interface ClassLearningContextDTO {
  classInfo: ClassSummaryDTO;
  schedules: ScheduleDetailDTO[];
}

export interface EnrollStudentResultDTO {
  enrollmentId: string;
  classId: string;
  className: string;
  academicYearId: string;
  remainingSeats: number;
}

