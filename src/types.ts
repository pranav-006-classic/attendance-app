export type UserRole = 'teacher' | 'cr' | 'student';

export type UserAccountStatus = 'active' | 'pending' | 'rejected';

export type AttendanceStatus = 'present' | 'absent' | 'leave';

export interface UserProfile {
  id: string; // Auth UID or student ID
  uid?: string;
  name: string;
  email: string;
  role: UserRole;
  status?: UserAccountStatus; // 'active' by default, 'pending' for CRs until teacher approves
  rollNumber?: string;
  avatarUrl?: string;
  phone?: string;
  isCR?: boolean;
  department?: string;
  year?: string;
  section?: string;
  employeeId?: string;
  subjectsTaught?: string[];
  passwordHash?: string;
  registeredAt?: string;
}

export type User = UserProfile;

export interface Subject {
  id: string;
  code: string;
  name: string;
  teacherName?: string;
  periodsPerWeek?: number;
  color?: string;
  roomNumber?: string;
  credits?: number;
  syllabus?: string;
}

export interface TimetableSlot {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  period: number;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  room: string;
  type: 'Lecture' | 'Lab' | 'Tutorial';
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber?: string;
  subjectId: string;
  subjectName: string;
  subject?: string; // Subject name alias
  date: string; // YYYY-MM-DD
  period: number; // 1, 2, 3, etc.
  periodNumber?: number; // Period number alias
  status: AttendanceStatus;
  markedBy: string; // User ID
  markedByName: string;
  markedByRole: UserRole;
  markedAt?: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  lastEditedAt?: string; // ISO string
  lastEditedBy?: string;
  lastEditedByName?: string;
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  recordId: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectName: string;
  date: string;
  period: number;
  oldStatus: AttendanceStatus | null; // null if initial creation
  newStatus: AttendanceStatus;
  reason: string;
  performedBy: string; // User ID
  performedByName: string;
  performedByRole: UserRole;
  timestamp: string; // ISO string
}

export type RequestType = 'dispute' | 'leave' | 'cr_correction' | 'cr_approval';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface AttendanceRequest {
  id: string;
  type: RequestType;
  status: RequestStatus;
  studentId: string;
  studentName: string;
  rollNumber?: string;
  email?: string;
  department?: string;
  year?: string;
  section?: string;
  phone?: string;
  recordId?: string; // For dispute or CR correction on existing record
  subjectId?: string;
  subjectName?: string;
  date?: string; // Single date or start date
  endDate?: string; // For multi-day leave
  period?: number;
  currentStatus?: AttendanceStatus; // e.g. 'absent' when requesting reversal to 'present'
  requestedStatus?: AttendanceStatus; // e.g. 'present' for dispute, 'leave' for leave
  reason: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdBy: string;
  createdByName: string;
  createdByRole: UserRole;
  createdAt: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewComment?: string;
}

export interface ClassroomSettings {
  id: string;
  minimumAttendancePercentage: number; // default 75
  academicTermName: string;
  termStartDate: string;
  termEndDate: string;
  periodsPerDay: number;
  dailyPeriodTimings: { period: number; time: string }[];
  classroomName: string;
  department: string;
  semester: string;
  classCode?: string; // Default: 'CS2026-FALL'
  allowStudentSignups?: boolean; // Default: true
}

export interface AppNotification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'dispute' | 'leave' | 'correction' | 'low_attendance' | 'approval' | 'record_change';
  read: boolean;
  createdAt: string;
  link?: string;
}
