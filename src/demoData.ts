import { 
  UserProfile, 
  Subject, 
  AttendanceRecord, 
  AuditLogEntry, 
  ClassroomSettings,
  AttendanceRequest,
  AttendanceStatus,
  TimetableSlot
} from './types';

export const DEMO_TEACHER: UserProfile = {
  id: 'user_teacher_sharma',
  uid: 'user_teacher_sharma',
  name: 'Prof. Ananya Sharma',
  email: 'teacher@attendease.edu',
  role: 'teacher',
  status: 'active',
  department: 'Computer Science & Engineering',
  employeeId: 'EMP-CS101',
  subjectsTaught: ['Distributed Systems', 'Database Engineering'],
  phone: '+91 98765 43210',
};

export const DEMO_CRS: UserProfile[] = [
  {
    id: 'user_cr_rohan',
    uid: 'user_cr_rohan',
    name: 'Rohan Verma (CR)',
    email: 'cr.rohan@attendease.edu',
    role: 'cr',
    status: 'active',
    rollNumber: 'CS2026-01',
    department: 'Computer Science',
    year: '4th Year',
    section: 'A',
    isCR: true,
  },
  {
    id: 'user_cr_sneha',
    uid: 'user_cr_sneha',
    name: 'Sneha Kulkarni (CR)',
    email: 'cr.sneha@attendease.edu',
    role: 'cr',
    status: 'active',
    rollNumber: 'CS2026-02',
    department: 'Computer Science',
    year: '4th Year',
    section: 'A',
    isCR: true,
  },
];

export const DEMO_STUDENTS: UserProfile[] = [
  { id: 'stud_01', uid: 'stud_01', name: 'Rohan Verma', email: 'cr.rohan@attendease.edu', role: 'cr', rollNumber: 'CS2026-01', isCR: true },
  { id: 'stud_02', uid: 'stud_02', name: 'Sneha Kulkarni', email: 'cr.sneha@attendease.edu', role: 'cr', rollNumber: 'CS2026-02', isCR: true },
  { id: 'stud_03', uid: 'stud_03', name: 'Aarav Mehta', email: 'aarav.mehta@attendease.edu', role: 'student', rollNumber: 'CS2026-03' },
  { id: 'stud_04', uid: 'stud_04', name: 'Ananya Iyer', email: 'ananya.iyer@attendease.edu', role: 'student', rollNumber: 'CS2026-04' },
  { id: 'stud_05', uid: 'stud_05', name: 'Dev Patel', email: 'dev.patel@attendease.edu', role: 'student', rollNumber: 'CS2026-05' },
  { id: 'stud_06', uid: 'stud_06', name: 'Diya Nambiar', email: 'diya.nambiar@attendease.edu', role: 'student', rollNumber: 'CS2026-06' },
  { id: 'stud_07', uid: 'stud_07', name: 'Ishaan Gupta', email: 'ishaan.gupta@attendease.edu', role: 'student', rollNumber: 'CS2026-07' },
  { id: 'stud_08', uid: 'stud_08', name: 'Kavya Nair', email: 'kavya.nair@attendease.edu', role: 'student', rollNumber: 'CS2026-08' },
  { id: 'stud_09', uid: 'stud_09', name: 'Manish Rao', email: 'manish.rao@attendease.edu', role: 'student', rollNumber: 'CS2026-09' },
  { id: 'stud_10', uid: 'stud_10', name: 'Neha Deshmukh', email: 'neha.d@attendease.edu', role: 'student', rollNumber: 'CS2026-10' },
  { id: 'stud_11', uid: 'stud_11', name: 'Omkar Joshi', email: 'omkar.j@attendease.edu', role: 'student', rollNumber: 'CS2026-11' },
  { id: 'stud_12', uid: 'stud_12', name: 'Pooja Reddy', email: 'pooja.r@attendease.edu', role: 'student', rollNumber: 'CS2026-12' },
  { id: 'stud_13', uid: 'stud_13', name: 'Pranav Saxena', email: 'pranav.s@attendease.edu', role: 'student', rollNumber: 'CS2026-13' },
  { id: 'stud_14', uid: 'stud_14', name: 'Rhea Sen', email: 'rhea.sen@attendease.edu', role: 'student', rollNumber: 'CS2026-14' },
  { id: 'stud_15', uid: 'stud_15', name: 'Samar Singh', email: 'samar.singh@attendease.edu', role: 'student', rollNumber: 'CS2026-15' },
  { id: 'stud_16', uid: 'stud_16', name: 'Tanvi Bhat', email: 'tanvi.b@attendease.edu', role: 'student', rollNumber: 'CS2026-16' },
  { id: 'stud_17', uid: 'stud_17', name: 'Varun Nair', email: 'varun.n@attendease.edu', role: 'student', rollNumber: 'CS2026-17' },
  { id: 'stud_18', uid: 'stud_18', name: 'Yashwardhan Roy', email: 'yash.roy@attendease.edu', role: 'student', rollNumber: 'CS2026-18' },
  { id: 'stud_19', uid: 'stud_19', name: 'Zoya Khan', email: 'zoya.k@attendease.edu', role: 'student', rollNumber: 'CS2026-19' },
  { id: 'stud_20', uid: 'stud_20', name: 'Aditya Chawla', email: 'aditya.c@attendease.edu', role: 'student', rollNumber: 'CS2026-20' },
  { id: 'stud_21', uid: 'stud_21', name: 'Bhavna Menon', email: 'bhavna.m@attendease.edu', role: 'student', rollNumber: 'CS2026-21' },
  { id: 'stud_22', uid: 'stud_22', name: 'Chetan Swaminathan', email: 'chetan.s@attendease.edu', role: 'student', rollNumber: 'CS2026-22' },
  { id: 'stud_23', uid: 'stud_23', name: 'Deepa Hegde', email: 'deepa.h@attendease.edu', role: 'student', rollNumber: 'CS2026-23' },
  { id: 'stud_24', uid: 'stud_24', name: 'Gautam Mathur', email: 'gautam.m@attendease.edu', role: 'student', rollNumber: 'CS2026-24' },
  { id: 'stud_25', uid: 'stud_25', name: 'Harsh Vardhan', email: 'harsh.v@attendease.edu', role: 'student', rollNumber: 'CS2026-25' },
];

export const DEMO_SUBJECTS: Subject[] = [
  {
    id: 'sub_cs404',
    code: 'CS404',
    name: 'Operating Systems & System Kernel',
    teacherName: 'Dr. V. Sharma',
    periodsPerWeek: 5,
    color: '#0F4A34', // Deep Forest Green
    roomNumber: 'LH-302',
    credits: 4,
    syllabus: 'Process concurrency, virtual memory management, file systems & distributed kernel architecture.',
  },
  {
    id: 'sub_cs401',
    code: 'CS401',
    name: 'Distributed Systems',
    teacherName: 'Prof. Ananya Sharma',
    periodsPerWeek: 4,
    color: '#13523B', // Academic Emerald
    roomNumber: 'LH-302',
    credits: 4,
    syllabus: 'Consensus protocols, Raft, Paxos, RPC frameworks, vector clocks and Byzantine fault tolerance.',
  },
  {
    id: 'sub_cs402',
    code: 'CS402',
    name: 'Database Engineering',
    teacherName: 'Dr. Rajesh K',
    periodsPerWeek: 4,
    color: '#C77724', // Amber/Ochre
    roomNumber: 'Room 204',
    credits: 3,
    syllabus: 'Query optimization, B-Tree storage engines, ACID transactions, WAL and distributed locking.',
  },
  {
    id: 'sub_cs403',
    code: 'CS403',
    name: 'Computer Networks',
    teacherName: 'Prof. Vikram Malhotra',
    periodsPerWeek: 4,
    color: '#0284c7', // Sky
    roomNumber: 'LH-301',
    credits: 3,
    syllabus: 'TCP/IP socket architecture, congestion control, BGP routing, TLS 1.3 encryption protocols.',
  },
  {
    id: 'sub_cs405',
    code: 'CS405',
    name: 'Algorithm Design & Analysis',
    teacherName: 'Dr. Meenakshi S',
    periodsPerWeek: 4,
    color: '#BA3C2A', // Terracotta Rust
    roomNumber: 'Room 105',
    credits: 4,
    syllabus: 'Amortized complexity, dynamic programming, max flow-min cut algorithms and NP-completeness.',
  },
];

export const DEMO_TIMETABLE: TimetableSlot[] = [
  // Monday
  { day: 'Monday', period: 1, subjectId: 'sub_cs404', subjectCode: 'CS404', subjectName: 'Operating Systems', facultyName: 'Dr. V. Sharma', room: 'LH-302', type: 'Lecture' },
  { day: 'Monday', period: 2, subjectId: 'sub_cs401', subjectCode: 'CS401', subjectName: 'Distributed Systems', facultyName: 'Prof. Ananya Sharma', room: 'LH-302', type: 'Lecture' },
  { day: 'Monday', period: 3, subjectId: 'sub_cs402', subjectCode: 'CS402', subjectName: 'Database Engineering', facultyName: 'Dr. Rajesh K', room: 'Room 204', type: 'Lecture' },
  { day: 'Monday', period: 4, subjectId: 'sub_cs403', subjectCode: 'CS403', subjectName: 'Computer Networks', facultyName: 'Prof. Vikram Malhotra', room: 'LH-301', type: 'Lecture' },
  { day: 'Monday', period: 5, subjectId: 'sub_cs405', subjectCode: 'CS405', subjectName: 'Algorithm Design', facultyName: 'Dr. Meenakshi S', room: 'Room 105', type: 'Lecture' },
  { day: 'Monday', period: 6, subjectId: 'sub_cs404', subjectCode: 'CS404', subjectName: 'OS Kernel Lab', facultyName: 'Dr. V. Sharma', room: 'Lab 4', type: 'Lab' },
  { day: 'Monday', period: 7, subjectId: 'sub_cs404', subjectCode: 'CS404', subjectName: 'OS Kernel Lab', facultyName: 'Dr. V. Sharma', room: 'Lab 4', type: 'Lab' },

  // Tuesday
  { day: 'Tuesday', period: 1, subjectId: 'sub_cs401', subjectCode: 'CS401', subjectName: 'Distributed Systems', facultyName: 'Prof. Ananya Sharma', room: 'LH-302', type: 'Lecture' },
  { day: 'Tuesday', period: 2, subjectId: 'sub_cs404', subjectCode: 'CS404', subjectName: 'Operating Systems', facultyName: 'Dr. V. Sharma', room: 'LH-302', type: 'Lecture' },
  { day: 'Tuesday', period: 3, subjectId: 'sub_cs405', subjectCode: 'CS405', subjectName: 'Algorithm Design', facultyName: 'Dr. Meenakshi S', room: 'Room 105', type: 'Lecture' },
  { day: 'Tuesday', period: 4, subjectId: 'sub_cs402', subjectCode: 'CS402', subjectName: 'Database Engineering', facultyName: 'Dr. Rajesh K', room: 'Room 204', type: 'Lecture' },
  { day: 'Tuesday', period: 5, subjectId: 'sub_cs403', subjectCode: 'CS403', subjectName: 'Networks Lab', facultyName: 'Prof. Vikram Malhotra', room: 'Lab 2', type: 'Lab' },
  { day: 'Tuesday', period: 6, subjectId: 'sub_cs403', subjectCode: 'CS403', subjectName: 'Networks Lab', facultyName: 'Prof. Vikram Malhotra', room: 'Lab 2', type: 'Lab' },
  { day: 'Tuesday', period: 7, subjectId: 'sub_cs405', subjectCode: 'CS405', subjectName: 'Algorithms Tutorial', facultyName: 'Dr. Meenakshi S', room: 'Room 105', type: 'Tutorial' },

  // Wednesday
  { day: 'Wednesday', period: 1, subjectId: 'sub_cs403', subjectCode: 'CS403', subjectName: 'Computer Networks', facultyName: 'Prof. Vikram Malhotra', room: 'LH-301', type: 'Lecture' },
  { day: 'Wednesday', period: 2, subjectId: 'sub_cs405', subjectCode: 'CS405', subjectName: 'Algorithm Design', facultyName: 'Dr. Meenakshi S', room: 'Room 105', type: 'Lecture' },
  { day: 'Wednesday', period: 3, subjectId: 'sub_cs401', subjectCode: 'CS401', subjectName: 'Distributed Systems', facultyName: 'Prof. Ananya Sharma', room: 'LH-302', type: 'Lecture' },
  { day: 'Wednesday', period: 4, subjectId: 'sub_cs404', subjectCode: 'CS404', subjectName: 'Operating Systems', facultyName: 'Dr. V. Sharma', room: 'LH-302', type: 'Lecture' },
  { day: 'Wednesday', period: 5, subjectId: 'sub_cs402', subjectCode: 'CS402', subjectName: 'Database Lab', facultyName: 'Dr. Rajesh K', room: 'Lab 3', type: 'Lab' },
  { day: 'Wednesday', period: 6, subjectId: 'sub_cs402', subjectCode: 'CS402', subjectName: 'Database Lab', facultyName: 'Dr. Rajesh K', room: 'Lab 3', type: 'Lab' },
  { day: 'Wednesday', period: 7, subjectId: 'sub_cs401', subjectCode: 'CS401', subjectName: 'DS Seminar', facultyName: 'Prof. Ananya Sharma', room: 'LH-302', type: 'Tutorial' },

  // Thursday
  { day: 'Thursday', period: 1, subjectId: 'sub_cs402', subjectCode: 'CS402', subjectName: 'Database Engineering', facultyName: 'Dr. Rajesh K', room: 'Room 204', type: 'Lecture' },
  { day: 'Thursday', period: 2, subjectId: 'sub_cs403', subjectCode: 'CS403', subjectName: 'Computer Networks', facultyName: 'Prof. Vikram Malhotra', room: 'LH-301', type: 'Lecture' },
  { day: 'Thursday', period: 3, subjectId: 'sub_cs404', subjectCode: 'CS404', subjectName: 'Operating Systems', facultyName: 'Dr. V. Sharma', room: 'LH-302', type: 'Lecture' },
  { day: 'Thursday', period: 4, subjectId: 'sub_cs401', subjectCode: 'CS401', subjectName: 'Distributed Systems', facultyName: 'Prof. Ananya Sharma', room: 'LH-302', type: 'Lecture' },
  { day: 'Thursday', period: 5, subjectId: 'sub_cs405', subjectCode: 'CS405', subjectName: 'Algorithm Design', facultyName: 'Dr. Meenakshi S', room: 'Room 105', type: 'Lecture' },
  { day: 'Thursday', period: 6, subjectId: 'sub_cs404', subjectCode: 'CS404', subjectName: 'Systems Colloquium', facultyName: 'Dr. V. Sharma', room: 'Seminar Hall A', type: 'Tutorial' },
  { day: 'Thursday', period: 7, subjectId: 'sub_cs402', subjectCode: 'CS402', subjectName: 'DB Optimization', facultyName: 'Dr. Rajesh K', room: 'Room 204', type: 'Tutorial' },

  // Friday
  { day: 'Friday', period: 1, subjectId: 'sub_cs405', subjectCode: 'CS405', subjectName: 'Algorithm Design', facultyName: 'Dr. Meenakshi S', room: 'Room 105', type: 'Lecture' },
  { day: 'Friday', period: 2, subjectId: 'sub_cs402', subjectCode: 'CS402', subjectName: 'Database Engineering', facultyName: 'Dr. Rajesh K', room: 'Room 204', type: 'Lecture' },
  { day: 'Friday', period: 3, subjectId: 'sub_cs404', subjectCode: 'CS404', subjectName: 'Operating Systems', facultyName: 'Dr. V. Sharma', room: 'LH-302', type: 'Lecture' },
  { day: 'Friday', period: 4, subjectId: 'sub_cs403', subjectCode: 'CS403', subjectName: 'Computer Networks', facultyName: 'Prof. Vikram Malhotra', room: 'LH-301', type: 'Lecture' },
  { day: 'Friday', period: 5, subjectId: 'sub_cs401', subjectCode: 'CS401', subjectName: 'Distributed Systems', facultyName: 'Prof. Ananya Sharma', room: 'LH-302', type: 'Lecture' },
  { day: 'Friday', period: 6, subjectId: 'sub_cs403', subjectCode: 'CS403', subjectName: 'Networks Security Workshop', facultyName: 'Prof. Vikram Malhotra', room: 'Lab 2', type: 'Lab' },
  { day: 'Friday', period: 7, subjectId: 'sub_cs405', subjectCode: 'CS405', subjectName: 'Competitive Coding', facultyName: 'Dr. Meenakshi S', room: 'Lab 1', type: 'Lab' },
];

export const DEFAULT_SETTINGS: ClassroomSettings = {
  id: 'classroom_settings',
  minimumAttendancePercentage: 75,
  academicTermName: 'Fall Semester 2026',
  termStartDate: '2026-08-15',
  termEndDate: '2026-12-15',
  periodsPerDay: 7,
  dailyPeriodTimings: [
    { period: 1, time: '09:00 AM - 09:50 AM' },
    { period: 2, time: '09:55 AM - 10:45 AM' },
    { period: 3, time: '10:50 AM - 11:40 AM' },
    { period: 4, time: '11:45 AM - 12:35 PM' },
    { period: 5, time: '01:30 PM - 02:20 PM' },
    { period: 6, time: '02:25 PM - 03:15 PM' },
    { period: 7, time: '03:20 PM - 04:10 PM' },
  ],
  classroomName: 'LH-302, Dept. of Computer Science',
  department: 'Computer Science & Engineering',
  semester: 'Semester VII',
  classCode: 'CS2026-FALL',
  allowStudentSignups: true,
};

// Generate realistic 4 weeks of attendance records and append-only audit log trail
export function generateDemoAttendanceData() {
  const records: AttendanceRecord[] = [];
  const auditLogs: AuditLogEntry[] = [];
  const requests: AttendanceRequest[] = [];

  // 4 weeks of weekdays (Monday through Friday)
  const dates: string[] = [];
  const baseDate = new Date('2026-08-24'); // Monday 4 weeks back
  for (let i = 0; i < 26; i++) {
    const cur = new Date(baseDate);
    cur.setDate(baseDate.getDate() + i);
    const day = cur.getDay();
    if (day !== 0 && day !== 6) { // Weekdays only
      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, '0');
      const dd = String(cur.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
  }

  let recordCounter = 1;
  let auditCounter = 1;

  dates.forEach((dateStr) => {
    // 2-3 subject sessions per day across periods 1, 2, 3
    [DEMO_SUBJECTS[0], DEMO_SUBJECTS[1], DEMO_SUBJECTS[2]].forEach((subject, subIdx) => {
      const period = subIdx + 1;
      const marker = subIdx === 0 ? DEMO_TEACHER : DEMO_CRS[0];

      DEMO_STUDENTS.forEach((student, sIdx) => {
        // Unique per-period document ID: ${date}_${period}_${studentId}
        const recId = `${dateStr}_${period}_${student.id}`;
        
        // Determinate realistic attendance distribution:
        // Some students have very high (>90%), some moderate (75-85%), a couple below 75% for testing alerts
        let status: AttendanceStatus = 'present';
        const hash = (dateStr.charCodeAt(8) + dateStr.charCodeAt(9) + sIdx * 7 + period * 13) % 100;
        
        // Students with deliberate low attendance to test "Safe to skip" & alerts:
        // stud_07 (Ishaan Gupta) ~60%
        // stud_13 (Pranav Saxena) ~70%
        // stud_24 (Gautam Mathur) ~68%
        if (student.id === 'stud_07') {
          if (hash < 42) status = 'absent';
          else if (hash < 50) status = 'leave';
        } else if (student.id === 'stud_13') {
          if (hash < 32) status = 'absent';
        } else if (student.id === 'stud_24') {
          if (hash < 35) status = 'absent';
        } else {
          // Standard student attendance ~85-95%
          if (hash < 8) status = 'absent';
          else if (hash < 12) status = 'leave';
        }

        const createdAt = `${dateStr}T10:00:00.000Z`;
        let updatedAt = createdAt;
        let lastEditedBy = marker.id;
        let lastEditedByName = marker.name;

        // Add to records: per-student, per-date, per-period
        const record: AttendanceRecord = {
          id: recId,
          studentId: student.id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          subjectId: subject.id,
          subjectName: subject.name,
          subject: subject.name,
          date: dateStr,
          period: period,
          periodNumber: period,
          status: status,
          markedBy: marker.id,
          markedByName: marker.name,
          markedByRole: marker.role,
          markedAt: createdAt,
          createdAt: createdAt,
          updatedAt: updatedAt,
          lastEditedAt: updatedAt,
          lastEditedBy: lastEditedBy,
          lastEditedByName: lastEditedByName,
        };

        // Initial creation audit log entry
        auditLogs.push({
          id: `audit_${auditCounter++}`,
          recordId: recId,
          studentId: student.id,
          studentName: student.name,
          subjectId: subject.id,
          subjectName: subject.name,
          date: dateStr,
          period: period,
          oldStatus: null,
          newStatus: status,
          reason: 'Initial session attendance marking',
          performedBy: marker.id,
          performedByName: marker.name,
          performedByRole: marker.role,
          timestamp: createdAt,
        });

        // Add a few realistic post-marking correction history entries for demonstration:
        if (sIdx === 2 && dateStr === dates[5]) { // Aarav Mehta was corrected from absent to present
          record.status = 'present';
          record.updatedAt = `${dateStr}T14:30:00.000Z`;
          record.lastEditedBy = DEMO_TEACHER.id;
          record.lastEditedByName = DEMO_TEACHER.name;
          auditLogs.push({
            id: `audit_${auditCounter++}`,
            recordId: recId,
            studentId: student.id,
            studentName: student.name,
            subjectId: subject.id,
            subjectName: subject.name,
            date: dateStr,
            period: period,
            oldStatus: 'absent',
            newStatus: 'present',
            reason: 'Student arrived 5 min late due to lab clearance; approved by instructor',
            performedBy: DEMO_TEACHER.id,
            performedByName: DEMO_TEACHER.name,
            performedByRole: 'teacher',
            timestamp: `${dateStr}T14:30:00.000Z`,
          });
        }

        records.push(record);
        recordCounter++;
      });
    });
  });

  // Seed pending / approved requests
  requests.push({
    id: 'req_001',
    type: 'dispute',
    status: 'pending',
    studentId: 'stud_04',
    studentName: 'Ananya Iyer',
    rollNumber: 'CS2026-04',
    recordId: `att_${dates[dates.length - 2]}_p1_stud_04`,
    subjectId: 'sub_cs401',
    subjectName: 'Distributed Systems',
    date: dates[dates.length - 2],
    period: 1,
    requestedStatus: 'present',
    reason: 'I was present in the 3rd bench next to Diya, answered Question 3 in class.',
    createdBy: 'stud_04',
    createdByName: 'Ananya Iyer',
    createdByRole: 'student',
    createdAt: `${dates[dates.length - 2]}T11:30:00.000Z`,
  });

  requests.push({
    id: 'req_002',
    type: 'leave',
    status: 'pending',
    studentId: 'stud_08',
    studentName: 'Kavya Nair',
    rollNumber: 'CS2026-08',
    date: dates[dates.length - 1],
    endDate: dates[dates.length - 1],
    requestedStatus: 'leave',
    reason: 'Representing the college robotics team in the Inter-University Robocon preliminaries.',
    attachmentName: 'Robocon_OD_Approval_Dean.pdf',
    createdBy: 'stud_08',
    createdByName: 'Kavya Nair',
    createdByRole: 'student',
    createdAt: `${dates[dates.length - 1]}T08:00:00.000Z`,
  });

  requests.push({
    id: 'req_003',
    type: 'cr_correction',
    status: 'pending',
    studentId: 'stud_15',
    studentName: 'Samar Singh',
    rollNumber: 'CS2026-15',
    recordId: `att_${dates[dates.length - 3]}_p2_stud_15`,
    subjectId: 'sub_cs402',
    subjectName: 'Database Engineering',
    date: dates[dates.length - 3],
    period: 2,
    requestedStatus: 'present',
    reason: 'Correction request from CR: Mistakenly tapped Absent during fast roll call; verified Samar submitted the paper quiz at 11:10 AM.',
    createdBy: DEMO_CRS[0].id,
    createdByName: DEMO_CRS[0].name,
    createdByRole: 'cr',
    createdAt: `${dates[dates.length - 2]}T09:00:00.000Z`,
  });

  return { records, auditLogs, requests };
}
