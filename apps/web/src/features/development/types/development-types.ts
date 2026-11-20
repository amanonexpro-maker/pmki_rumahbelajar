export interface DevelopmentCategoryDTO {
  id: string;
  serviceUnitId: string;
  code: string;
  name: string;
  description: string | null;
}

export interface DevelopmentNoteRevisionDTO {
  id: string;
  noteId: string;
  version: number;
  observation: string;
  progress: string | null;
  followUp: string | null;
  confidential: boolean;
  actorId: string | null;
  createdAt: string;
}

export interface DevelopmentNoteDTO {
  id: string;
  organizationId: string;
  serviceUnitId: string;
  studentId: string;
  studentFullName: string;
  studentEducationLevelLabel: string;
  teacherId: string;
  teacherName: string;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  observation: string;
  progress: string | null;
  followUp: string | null;
  confidential: boolean;
  version: number;
  recordedOfflineAt: string | null;
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

