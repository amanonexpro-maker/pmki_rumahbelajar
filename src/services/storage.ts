/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  Student,
  Guardian,
  AttendanceSession,
  StudentDevelopmentNote,
  ConsentRecord,
  MediaAsset,
  PublicationPost,
  ServiceReport,
  AuditLogEntry,
  ClassRoom,
  ClassSchedule,
  Teacher,
  Subject,
  AcademicYear,
  Organization,
  ServiceUnit,
  RegistrationStatus,
  ApprovalStatus,
  PublicationStatus,
  ConsentStatus,
} from '../types/index.ts';

import {
  initialOrganizations,
  initialServiceUnits,
  initialUsers,
  initialAcademicYears,
  initialSubjects,
  initialTeachers,
  initialClasses,
  initialSchedules,
  initialStudents,
  initialConsents,
  initialMediaAssets,
  initialAttendanceSessions,
  initialDevelopmentNotes,
  initialPublications,
  initialReports,
  initialAuditLogs,
} from '../db/seed-data.ts';

export interface StorageSnapshot {
  users: User[];
  currentUser: User;
  organizations: Organization[];
  serviceUnits: ServiceUnit[];
  academicYears: AcademicYear[];
  subjects: Subject[];
  teachers: Teacher[];
  classes: ClassRoom[];
  schedules: ClassSchedule[];
  students: Student[];
  consents: ConsentRecord[];
  mediaAssets: MediaAsset[];
  attendanceSessions: AttendanceSession[];
  developmentNotes: StudentDevelopmentNote[];
  publications: PublicationPost[];
  reports: ServiceReport[];
  auditLogs: AuditLogEntry[];
}

class StorageManager {
  private users: User[] = [];
  private currentUser: User = initialUsers[0];
  private organizations: Organization[] = [];
  private serviceUnits: ServiceUnit[] = [];
  private academicYears: AcademicYear[] = [];
  private subjects: Subject[] = [];
  private teachers: Teacher[] = [];
  private classes: ClassRoom[] = [];
  private schedules: ClassSchedule[] = [];
  private students: Student[] = [];
  private consents: ConsentRecord[] = [];
  private mediaAssets: MediaAsset[] = [];
  private attendanceSessions: AttendanceSession[] = [];
  private developmentNotes: StudentDevelopmentNote[] = [];
  private publications: PublicationPost[] = [];
  private reports: ServiceReport[] = [];
  private auditLogs: AuditLogEntry[] = [];
  private initialized = false;
  private persistenceQueue: Promise<void> = Promise.resolve();

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;

    // Load from localStorage if present
    if (typeof window !== 'undefined') {
      try {
        const savedStudents = localStorage.getItem('pmki_students');
        const savedConsents = localStorage.getItem('pmki_consents');
        const savedAttendance = localStorage.getItem('pmki_attendance');
        const savedNotes = localStorage.getItem('pmki_notes');
        const savedPubs = localStorage.getItem('pmki_publications');
        const savedReports = localStorage.getItem('pmki_reports');
        const savedAudits = localStorage.getItem('pmki_audits');
        const savedUser = localStorage.getItem('pmki_current_user');

        this.students = savedStudents ? JSON.parse(savedStudents) : [...initialStudents];
        this.consents = savedConsents ? JSON.parse(savedConsents) : [...initialConsents];
        this.attendanceSessions = savedAttendance ? JSON.parse(savedAttendance) : [...initialAttendanceSessions];
        this.developmentNotes = savedNotes ? JSON.parse(savedNotes) : [...initialDevelopmentNotes];
        this.publications = savedPubs ? JSON.parse(savedPubs) : [...initialPublications];
        this.reports = savedReports ? JSON.parse(savedReports) : [...initialReports];
        this.auditLogs = savedAudits ? JSON.parse(savedAudits) : [...initialAuditLogs];

        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          this.currentUser = parsedUser;
        } else {
          this.currentUser = initialUsers[1]; // default to Ms. Evi (Unit Coordinator) for rich operational view
        }
      } catch {
        this.loadInitialSeed();
      }
    } else {
      this.loadInitialSeed();
    }

    this.organizations = [...initialOrganizations];
    this.serviceUnits = [...initialServiceUnits];
    this.academicYears = [...initialAcademicYears];
    this.subjects = [...initialSubjects];
    this.teachers = [...initialTeachers];
    this.classes = [...initialClasses];
    this.schedules = [...initialSchedules];
    this.mediaAssets = [...initialMediaAssets];
    this.users = [...initialUsers];

    this.initialized = true;
  }

  private loadInitialSeed() {
    this.students = [...initialStudents];
    this.consents = [...initialConsents];
    this.attendanceSessions = [...initialAttendanceSessions];
    this.developmentNotes = [...initialDevelopmentNotes];
    this.publications = [...initialPublications];
    this.reports = [...initialReports];
    this.auditLogs = [...initialAuditLogs];
    this.currentUser = initialUsers[1];
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('pmki_students', JSON.stringify(this.students));
      localStorage.setItem('pmki_consents', JSON.stringify(this.consents));
      localStorage.setItem('pmki_attendance', JSON.stringify(this.attendanceSessions));
      localStorage.setItem('pmki_notes', JSON.stringify(this.developmentNotes));
      localStorage.setItem('pmki_publications', JSON.stringify(this.publications));
      localStorage.setItem('pmki_reports', JSON.stringify(this.reports));
      localStorage.setItem('pmki_audits', JSON.stringify(this.auditLogs));
      localStorage.setItem('pmki_current_user', JSON.stringify(this.currentUser));
    } catch (e) {
      console.warn('Storage persist failed', e);
    }

    if (!this.initialized) return;
    const snapshot = this.getSnapshot();
    this.persistenceQueue = this.persistenceQueue
      .catch(() => undefined)
      .then(async () => {
        const response = await fetch('/api/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(snapshot),
        });
        if (!response.ok) {
          throw new Error(`Database save failed (${response.status})`);
        }
        window.dispatchEvent(new CustomEvent('pmki:database-status', { detail: { connected: true } }));
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown database error';
        window.dispatchEvent(new CustomEvent('pmki:database-status', { detail: { connected: false, message } }));
      });
  }

  public getSnapshot(): StorageSnapshot {
    return {
      users: this.users,
      currentUser: this.currentUser,
      organizations: this.organizations,
      serviceUnits: this.serviceUnits,
      academicYears: this.academicYears,
      subjects: this.subjects,
      teachers: this.teachers,
      classes: this.classes,
      schedules: this.schedules,
      students: this.students,
      consents: this.consents,
      mediaAssets: this.mediaAssets,
      attendanceSessions: this.attendanceSessions,
      developmentNotes: this.developmentNotes,
      publications: this.publications,
      reports: this.reports,
      auditLogs: this.auditLogs,
    };
  }

  public replaceSnapshot(snapshot: StorageSnapshot) {
    this.users = snapshot.users;
    this.currentUser = snapshot.currentUser;
    this.organizations = snapshot.organizations;
    this.serviceUnits = snapshot.serviceUnits;
    this.academicYears = snapshot.academicYears;
    this.subjects = snapshot.subjects;
    this.teachers = snapshot.teachers;
    this.classes = snapshot.classes;
    this.schedules = snapshot.schedules;
    this.students = snapshot.students;
    this.consents = snapshot.consents;
    this.mediaAssets = snapshot.mediaAssets;
    this.attendanceSessions = snapshot.attendanceSessions;
    this.developmentNotes = snapshot.developmentNotes;
    this.publications = snapshot.publications;
    this.reports = snapshot.reports;
    this.auditLogs = snapshot.auditLogs;
    this.initialized = true;
  }

  public async connectDatabase() {
    const response = await fetch('/api/state');
    if (!response.ok) throw new Error(`Could not load database state (${response.status})`);
    const result = await response.json() as { state: StorageSnapshot | null };

    if (result.state) {
      this.replaceSnapshot(result.state);
    } else {
      const snapshot = this.getSnapshot();
      const saveResponse = await fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
      });
      if (!saveResponse.ok) throw new Error(`Could not initialize database state (${saveResponse.status})`);
      this.initialized = true;
    }

    window.dispatchEvent(new CustomEvent('pmki:database-status', { detail: { connected: true } }));
  }

  // AUDIT LOGGING HELPER
  public logAudit(action: string, entityType: string, entityId: string, description: string) {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actorId: this.currentUser.id,
      actorName: this.currentUser.name,
      actorRole: this.currentUser.role,
      action,
      entityType,
      entityId,
      description,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1 (Internal Client)',
    };
    this.auditLogs.unshift(entry);
    this.persist();
  }

  // USER & AUTH METHODS
  public getUsers(): User[] {
    return this.users;
  }

  public getCurrentUser(): User {
    return this.currentUser;
  }

  public setCurrentUser(user: User) {
    this.currentUser = user;
    this.logAudit('USER_ROLE_SWITCH', 'USER', user.id, `Beralih peran menjadi: ${user.name} (${user.role})`);
    this.persist();
  }

  public switchUserById(userId: string) {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      this.setCurrentUser(user);
    }
  }

  public toggleUserActive(userId: string): { success: boolean; message: string; active?: boolean } {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return { success: false, message: 'Akun pengguna tidak ditemukan dalam sistem.' };

    if (user.id === 'user-admin' && user.active) {
      return {
        success: false,
        message: 'Akun Administrator PMKI utama tidak dapat dinonaktifkan demi perlindungan akses sistem.',
      };
    }

    user.active = !user.active;
    this.logAudit(
      'USER_STATUS_TOGGLED',
      'USER',
      userId,
      `Status akun ${user.name} diubah menjadi: ${user.active ? 'AKTIF' : 'NONAKTIF'}`
    );
    this.persist();
    return {
      success: true,
      message: `Status akun ${user.name} berhasil diubah menjadi ${user.active ? 'Aktif' : 'Nonaktif'}.`,
      active: user.active,
    };
  }

  // ORGANIZATIONS & SERVICE UNITS
  public getOrganizations(): Organization[] {
    return this.organizations;
  }

  public getServiceUnits(): ServiceUnit[] {
    return this.serviceUnits;
  }

  // ACADEMIC & EDUCATION
  public getAcademicYears(): AcademicYear[] {
    return this.academicYears;
  }

  public getSubjects(): Subject[] {
    return this.subjects;
  }

  public getTeachers(): Teacher[] {
    return this.teachers;
  }

  public getClasses(): ClassRoom[] {
    return this.classes;
  }

  public getSchedules(): ClassSchedule[] {
    return this.schedules;
  }

  // BENEFICIARIES & REGISTRATION
  public getStudents(): Student[] {
    return this.students;
  }

  public getStudentById(id: string): Student | undefined {
    return this.students.find((s) => s.id === id);
  }

  public submitPublicRegistration(data: {
    fullName: string;
    nickname: string;
    gender: 'L' | 'P';
    dateOfBirth: string;
    placeOfBirth: string;
    address: string;
    kelurahan: 'Kalirejo' | 'Lawang' | 'Lainnya';
    gradeLevel: Student['gradeLevel'];
    isRaalResident: boolean;
    guardian: Omit<Guardian, 'id'>;
    notes?: string;
    personalDataConsent: boolean;
    photoVideoPublicConsent: boolean;
  }): Student {
    const newId = `std-${Date.now()}`;
    const regNum = `REG-${new Date().getFullYear()}-${String(this.students.length + 1).padStart(3, '0')}`;

    const guardian: Guardian = {
      ...data.guardian,
      id: `g-${Date.now()}`,
    };

    const newStudent: Student = {
      id: newId,
      registrationNumber: regNum,
      fullName: data.fullName,
      nickname: data.nickname,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      placeOfBirth: data.placeOfBirth,
      address: data.address,
      kelurahan: data.kelurahan,
      gradeLevel: data.gradeLevel,
      isRaalResident: data.isRaalResident,
      status: 'SUBMITTED',
      guardian,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };

    this.students.unshift(newStudent);

    // Save consent record
    const newConsent: ConsentRecord = {
      id: `cst-${Date.now()}`,
      studentId: newId,
      studentName: data.fullName,
      guardianName: guardian.fullName,
      personalDataConsent: data.personalDataConsent ? 'GRANTED' : 'DENIED',
      photoVideoPublicConsent: data.photoVideoPublicConsent ? 'GRANTED' : 'DENIED',
      effectiveDate: new Date().toISOString().split('T')[0],
      notes: 'Persetujuan pendaftaran melalui portal publik.',
      updatedAt: new Date().toISOString(),
    };
    this.consents.unshift(newConsent);

    this.logAudit(
      'PUBLIC_REGISTRATION_SUBMITTED',
      'STUDENT',
      newId,
      `Pendaftaran baru diterima: ${data.fullName} (${regNum}) - Status: SUBMITTED`
    );

    this.persist();
    return newStudent;
  }

  public updateStudentStatus(
    studentId: string,
    newStatus: RegistrationStatus,
    assignedClassId?: string,
    notes?: string
  ) {
    const student = this.students.find((s) => s.id === studentId);
    if (!student) return;

    const oldStatus = student.status;
    student.status = newStatus;
    if (assignedClassId) {
      student.assignedClassId = assignedClassId;
    }
    if (notes) {
      student.notes = notes;
    }

    if (newStatus === 'VERIFIED' || newStatus === 'ACTIVE') {
      student.verifiedAt = new Date().toISOString();
      student.verifiedBy = this.currentUser.name;
    }

    this.logAudit(
      'STUDENT_STATUS_UPDATE',
      'STUDENT',
      studentId,
      `Status siswa ${student.fullName} diperbarui dari ${oldStatus} menjadi ${newStatus}`
    );

    this.persist();
  }

  public updateStudentProfile(
    studentId: string,
    updates: {
      fullName: string;
      nickname: string;
      gender: 'L' | 'P';
      dateOfBirth: string;
      placeOfBirth: string;
      address: string;
      kelurahan: 'Kalirejo' | 'Lawang' | 'Lainnya';
      gradeLevel: Student['gradeLevel'];
      isRaalResident: boolean;
      notes?: string;
      guardian?: {
        fullName: string;
        relationship: Guardian['relationship'];
        phone: string;
        occupation: string;
        address: string;
      };
    }
  ): Student | undefined {
    const student = this.students.find((s) => s.id === studentId);
    if (!student) return undefined;

    student.fullName = updates.fullName;
    student.nickname = updates.nickname;
    student.gender = updates.gender;
    student.dateOfBirth = updates.dateOfBirth;
    student.placeOfBirth = updates.placeOfBirth;
    student.address = updates.address;
    student.kelurahan = updates.kelurahan;
    student.gradeLevel = updates.gradeLevel;
    student.isRaalResident = updates.isRaalResident;
    student.notes = updates.notes;

    if (updates.guardian) {
      student.guardian = {
        ...student.guardian,
        ...updates.guardian,
      };
    }

    // Keep linked consent student/guardian name in sync if present
    const consent = this.consents.find((c) => c.studentId === studentId);
    if (consent) {
      consent.studentName = updates.fullName;
      if (updates.guardian) {
        consent.guardianName = updates.guardian.fullName;
      }
    }

    this.logAudit(
      'STUDENT_PROFILE_UPDATED',
      'STUDENT',
      studentId,
      `Data profil peserta didik ${student.fullName} (${student.registrationNumber}) diperbarui`
    );

    this.persist();
    return student;
  }

  // ATTENDANCE SESSIONS
  public getAttendanceSessions(): AttendanceSession[] {
    return this.attendanceSessions;
  }

  public recordAttendanceSession(sessionData: {
    classId: string;
    className: string;
    date: string;
    records: { studentId: string; studentName: string; status: 'PRESENT' | 'SICK' | 'PERMITTED' | 'ABSENT'; note?: string }[];
    notes?: string;
  }): AttendanceSession {
    const present = sessionData.records.filter((r) => r.status === 'PRESENT').length;
    const sick = sessionData.records.filter((r) => r.status === 'SICK').length;
    const permitted = sessionData.records.filter((r) => r.status === 'PERMITTED').length;
    const absent = sessionData.records.filter((r) => r.status === 'ABSENT').length;

    const newSession: AttendanceSession = {
      id: `att-sess-${Date.now()}`,
      classId: sessionData.classId,
      className: sessionData.className,
      date: sessionData.date,
      recordedBy: this.currentUser.id,
      recordedByName: this.currentUser.name,
      summary: {
        present,
        sick,
        permitted,
        absent,
        total: sessionData.records.length,
      },
      records: sessionData.records.map((r, i) => ({
        id: `ar-${Date.now()}-${i}`,
        ...r,
      })),
      notes: sessionData.notes,
      createdAt: new Date().toISOString(),
    };

    this.attendanceSessions.unshift(newSession);
    this.logAudit(
      'ATTENDANCE_RECORDED',
      'ATTENDANCE_SESSION',
      newSession.id,
      `Presensi dicatat untuk kelas ${sessionData.className} tanggal ${sessionData.date} (${present}/${sessionData.records.length} hadir)`
    );

    this.persist();
    return newSession;
  }

  // STUDENT DEVELOPMENT NOTES
  public getDevelopmentNotes(): StudentDevelopmentNote[] {
    return this.developmentNotes;
  }

  public addDevelopmentNote(data: {
    studentId: string;
    studentName: string;
    date: string;
    category: StudentDevelopmentNote['category'];
    observation: string;
    progressNotes: string;
    followUp: string;
  }): StudentDevelopmentNote {
    const newNote: StudentDevelopmentNote = {
      id: `dev-${Date.now()}`,
      studentId: data.studentId,
      studentName: data.studentName,
      date: data.date,
      category: data.category,
      teacherId: this.currentUser.id,
      teacherName: this.currentUser.name,
      observation: data.observation,
      progressNotes: data.progressNotes,
      followUp: data.followUp,
      classification: 'CONFIDENTIAL',
      createdAt: new Date().toISOString(),
    };

    this.developmentNotes.unshift(newNote);
    this.logAudit(
      'DEVELOPMENT_NOTE_CREATED',
      'STUDENT_DEVELOPMENT',
      newNote.id,
      `Catatan perkembangan dibuat untuk siswa ${data.studentName} [${data.category}]`
    );

    this.persist();
    return newNote;
  }

  // CONSENTS
  public getConsents(): ConsentRecord[] {
    return this.consents;
  }

  public updateConsent(
    consentId: string,
    personalDataConsent: ConsentStatus,
    photoVideoPublicConsent: ConsentStatus,
    notes?: string
  ) {
    const consent = this.consents.find((c) => c.id === consentId);
    if (!consent) return;

    consent.personalDataConsent = personalDataConsent;
    consent.photoVideoPublicConsent = photoVideoPublicConsent;
    if (notes) consent.notes = notes;
    consent.updatedAt = new Date().toISOString();

    this.logAudit(
      'CONSENT_UPDATED',
      'CONSENT',
      consentId,
      `Persetujuan media siswa ${consent.studentName} diperbarui: Media [${photoVideoPublicConsent}]`
    );

    this.persist();
  }

  // MEDIA ASSETS
  public getMediaAssets(): MediaAsset[] {
    return this.mediaAssets;
  }

  public updateMediaPrivacy(mediaId: string, isEligible: boolean) {
    const media = this.mediaAssets.find((m) => m.id === mediaId);
    if (!media) return;

    media.privacyReviewed = true;
    media.isEligibleForPublic = isEligible;
    media.reviewedBy = this.currentUser.name;

    this.logAudit(
      'MEDIA_PRIVACY_REVIEW',
      'MEDIA_ASSET',
      mediaId,
      `Review privasi foto "${media.title}": Layak Publik = ${isEligible}`
    );

    this.persist();
  }

  // PUBLICATIONS (NEWS & AGENDA)
  public getPublications(): PublicationPost[] {
    return this.publications;
  }

  public createPublication(data: {
    title: string;
    category: PublicationPost['category'];
    summary: string;
    content: string;
    coverImage?: string;
    eventDate?: string;
    eventLocation?: string;
  }): PublicationPost {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const newPost: PublicationPost = {
      id: `pub-${Date.now()}`,
      title: data.title,
      slug,
      category: data.category,
      summary: data.summary,
      content: data.content,
      coverImage: data.coverImage || '/images/gallery/griya_asih_4.jpg',
      status: 'DRAFT',
      authorId: this.currentUser.id,
      authorName: this.currentUser.name,
      eventDate: data.eventDate,
      eventLocation: data.eventLocation,
    };

    this.publications.unshift(newPost);
    this.logAudit('PUBLICATION_CREATED', 'PUBLICATION', newPost.id, `Konten baru dibuat: "${data.title}" (Status: DRAFT)`);
    this.persist();
    return newPost;
  }

  public updatePublicationStatus(postId: string, status: PublicationStatus) {
    const post = this.publications.find((p) => p.id === postId);
    if (!post) return;

    const oldStatus = post.status;
    post.status = status;
    if (status === 'PUBLISHED' && !post.publishedAt) {
      post.publishedAt = new Date().toISOString();
    }

    this.logAudit(
      'PUBLICATION_STATUS_CHANGED',
      'PUBLICATION',
      postId,
      `Status publikasi "${post.title}" diubah dari ${oldStatus} ke ${status}`
    );

    this.persist();
  }

  // REPORTS & APPROVAL WORKFLOW
  public getReports(): ServiceReport[] {
    return this.reports;
  }

  public createReport(data: {
    title: string;
    period: string;
    reportType: ServiceReport['reportType'];
    summary: string;
    totalBeneficiaries: number;
    totalSessions: number;
    averageAttendancePct: number;
  }): ServiceReport {
    const newReport: ServiceReport = {
      id: `rep-${Date.now()}`,
      title: data.title,
      period: data.period,
      reportType: data.reportType,
      summary: data.summary,
      totalBeneficiaries: data.totalBeneficiaries,
      totalSessions: data.totalSessions,
      averageAttendancePct: data.averageAttendancePct,
      createdBy: this.currentUser.id,
      createdByName: this.currentUser.name,
      status: 'DRAFT',
      workflowLogs: [
        {
          step: 'DRAFT',
          actorId: this.currentUser.id,
          actorName: this.currentUser.name,
          action: 'SUBMITTED',
          comment: 'Penyusunan draft laporan baru.',
          timestamp: new Date().toISOString(),
        },
      ],
      classification: 'INTERNAL',
      isPublicSummaryGenerated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.reports.unshift(newReport);
    this.logAudit('REPORT_CREATED', 'SERVICE_REPORT', newReport.id, `Laporan baru dibuat: "${data.title}"`);
    this.persist();
    return newReport;
  }

  public advanceReportApproval(
    reportId: string,
    action: 'REVIEWED' | 'VALIDATED' | 'APPROVED' | 'REJECTED',
    comment: string
  ): { success: boolean; message: string } {
    const report = this.reports.find((r) => r.id === reportId);
    if (!report) return { success: false, message: 'Laporan tidak ditemukan' };

    // SEPARATION OF DUTIES ENFORCEMENT:
    // The creator of the report cannot give the final approval!
    if (action === 'APPROVED' && report.createdBy === this.currentUser.id) {
      return {
        success: false,
        message: 'Prinsip Pemisahan Tugas (Separation of Duties): Pembuat laporan tidak boleh menyetujui laporannya sendiri.',
      };
    }

    let nextStatus: ApprovalStatus = report.status;
    if (action === 'REJECTED') {
      nextStatus = 'REJECTED';
    } else if (report.status === 'DRAFT') {
      nextStatus = 'PROGRAM_REVIEW';
    } else if (report.status === 'PROGRAM_REVIEW') {
      nextStatus = 'UNIT_VALIDATION';
    } else if (report.status === 'UNIT_VALIDATION') {
      nextStatus = 'APPROVED';
      report.isPublicSummaryGenerated = true;
    }

    report.status = nextStatus;
    report.updatedAt = new Date().toISOString();
    report.workflowLogs.push({
      step: nextStatus,
      actorId: this.currentUser.id,
      actorName: this.currentUser.name,
      action,
      comment: comment || 'Tanpa catatan tambahan',
      timestamp: new Date().toISOString(),
    });

    this.logAudit(
      'REPORT_WORKFLOW_ACTION',
      'SERVICE_REPORT',
      reportId,
      `Aksi persetujuan [${action}] pada laporan "${report.title}". Status baru: ${nextStatus}`
    );

    this.persist();
    return { success: true, message: `Laporan berhasil diproses: ${nextStatus}` };
  }

  // AUDIT LOGS
  public getAuditLogs(): AuditLogEntry[] {
    return this.auditLogs;
  }

  // RESET TO FACTORY DEMO STATE
  public resetToSeed() {
    this.loadInitialSeed();
    this.persist();
  }
}

export const storage = new StorageManager();
