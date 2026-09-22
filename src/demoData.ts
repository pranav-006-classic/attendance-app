import { 
  UserProfile, 
  Subject, 
  ClassroomSettings,
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
  { day: 'Monday', period: 8, subjectId: 'sub_cs401', subjectCode: 'CS401', subjectName: 'Distributed Systems Tutorial', facultyName: 'Prof. Ananya Sharma', room: 'LH-302', type: 'Tutorial' },

  // Tuesday
  { day: 'Tuesday', period: 1, subjectId: 'sub_cs401', subjectCode: 'CS401', subjectName: 'Distributed Systems', facultyName: 'Prof. Ananya Sharma', room: 'LH-302', type: 'Lecture' },
  { day: 'Tuesday', period: 2, subjectId: 'sub_cs404', subjectCode: 'CS404', subjectName: 'Operating Systems', facultyName: 'Dr. V. Sharma', room: 'LH-302', type: 'Lecture' },
  { day: 'Tuesday', period: 3, subjectId: 'sub_cs405', subjectCode: 'CS405', subjectName: 'Algorithm Design', facultyName: 'Dr. Meenakshi S', room: 'Room 105', type: 'Lecture' },
  { day: 'Tuesday', period: 4, subjectId: 'sub_cs402', subjectCode: 'CS402', subjectName: 'Database Engineering', facultyName: 'Dr. Rajesh K', room: 'Room 204', type: 'Lecture' },
  { day: 'Tuesday', period: 5, subjectId: 'sub_cs403', subjectCode: 'CS403', subjectName: 'Networks Lab', facultyName: 'Prof. Vikram Malhotra', room: 'Lab 2', type: 'Lab' },
  { day: 'Tuesday', period: 6, subjectId: 'sub_cs403', subjectCode: 'CS403', subjectName: 'Networks Lab', facultyName: 'Prof. Vikram Malhotra', room: 'Lab 2', type: 'Lab' },
  { day: 'Tuesday', period: 7, subjectId: 'sub_cs405', subjectCode: 'CS405', subjectName: 'Algorithms Tutorial', facultyName: 'Dr. Meenakshi S', room: 'Room 105', type: 'Tutorial' },
  { day: 'Tuesday', period: 8, subjectId: 'sub_cs402', subjectCode: 'CS402', subjectName: 'Database Engineering Clinic', facultyName: 'Dr. Rajesh K', room: 'Room 204', type: 'Tutorial' },

  // Wednesday
  { day: 'Wednesday', period: 1, subjectId: 'sub_cs403', subjectCode: 'CS403', subjectName: 'Computer Networks', facultyName: 'Prof. Vikram Malhotra', room: 'LH-301', type: 'Lecture' },
  { day: 'Wednesday', period: 2, subjectId: 'sub_cs405', subjectCode: 'CS405', subjectName: 'Algorithm Design', facultyName: 'Dr. Meenakshi S', room: 'Room 105', type: 'Lecture' },
  { day: 'Wednesday', period: 3, subjectId: 'sub_cs401', subjectCode: 'CS401', subjectName: 'Distributed Systems', facultyName: 'Prof. Ananya Sharma', room: 'LH-302', type: 'Lecture' },
  { day: 'Wednesday', period: 4, subjectId: 'sub_cs404', subjectCode: 'CS404', subjectName: 'Operating Systems', facultyName: 'Dr. V. Sharma', room: 'LH-302', type: 'Lecture' },
  { day: 'Wednesday', period: 5, subjectId: 'sub_cs402', subjectCode: 'CS402', subjectName: 'Database Lab', facultyName: 'Dr. Rajesh K', room: 'Lab 3', type: 'Lab' },
  { day: 'Wednesday', period: 6, subjectId: 'sub_cs402', subjectCode: 'CS402', subjectName: 'Database Lab', facultyName: 'Dr. Rajesh K', room: 'Lab 3', type: 'Lab' },
  { day: 'Wednesday', period: 7, subjectId: 'sub_cs401', subjectCode: 'CS401', subjectName: 'DS Seminar', facultyName: 'Prof. Ananya Sharma', room: 'LH-302', type: 'Tutorial' },
  { day: 'Wednesday', period: 8, subjectId: 'sub_cs403', subjectCode: 'CS403', subjectName: 'Network Security Lab', facultyName: 'Prof. Vikram Malhotra', room: 'Lab 2', type: 'Lab' },

  // Thursday
  { day: 'Thursday', period: 1, subjectId: 'sub_cs402', subjectCode: 'CS402', subjectName: 'Database Engineering', facultyName: 'Dr. Rajesh K', room: 'Room 204', type: 'Lecture' },
  { day: 'Thursday', period: 2, subjectId: 'sub_cs403', subjectCode: 'CS403', subjectName: 'Computer Networks', facultyName: 'Prof. Vikram Malhotra', room: 'LH-301', type: 'Lecture' },
  { day: 'Thursday', period: 3, subjectId: 'sub_cs404', subjectCode: 'CS404', subjectName: 'Operating Systems', facultyName: 'Dr. V. Sharma', room: 'LH-302', type: 'Lecture' },
  { day: 'Thursday', period: 4, subjectId: 'sub_cs401', subjectCode: 'CS401', subjectName: 'Distributed Systems', facultyName: 'Prof. Ananya Sharma', room: 'LH-302', type: 'Lecture' },
  { day: 'Thursday', period: 5, subjectId: 'sub_cs405', subjectCode: 'CS405', subjectName: 'Algorithm Design', facultyName: 'Dr. Meenakshi S', room: 'Room 105', type: 'Lecture' },
  { day: 'Thursday', period: 6, subjectId: 'sub_cs404', subjectCode: 'CS404', subjectName: 'Systems Colloquium', facultyName: 'Dr. V. Sharma', room: 'Seminar Hall A', type: 'Tutorial' },
  { day: 'Thursday', period: 7, subjectId: 'sub_cs402', subjectCode: 'CS402', subjectName: 'DB Optimization', facultyName: 'Dr. Rajesh K', room: 'Room 204', type: 'Tutorial' },
  { day: 'Thursday', period: 8, subjectId: 'sub_cs405', subjectCode: 'CS405', subjectName: 'Problem Solving Lab', facultyName: 'Dr. Meenakshi S', room: 'Room 105', type: 'Tutorial' },

  // Friday
  { day: 'Friday', period: 1, subjectId: 'sub_cs405', subjectCode: 'CS405', subjectName: 'Algorithm Design', facultyName: 'Dr. Meenakshi S', room: 'Room 105', type: 'Lecture' },
  { day: 'Friday', period: 2, subjectId: 'sub_cs402', subjectCode: 'CS402', subjectName: 'Database Engineering', facultyName: 'Dr. Rajesh K', room: 'Room 204', type: 'Lecture' },
  { day: 'Friday', period: 3, subjectId: 'sub_cs404', subjectCode: 'CS404', subjectName: 'Operating Systems', facultyName: 'Dr. V. Sharma', room: 'LH-302', type: 'Lecture' },
  { day: 'Friday', period: 4, subjectId: 'sub_cs403', subjectCode: 'CS403', subjectName: 'Computer Networks', facultyName: 'Prof. Vikram Malhotra', room: 'LH-301', type: 'Lecture' },
  { day: 'Friday', period: 5, subjectId: 'sub_cs401', subjectCode: 'CS401', subjectName: 'Distributed Systems', facultyName: 'Prof. Ananya Sharma', room: 'LH-302', type: 'Lecture' },
  { day: 'Friday', period: 6, subjectId: 'sub_cs403', subjectCode: 'CS403', subjectName: 'Networks Security Workshop', facultyName: 'Prof. Vikram Malhotra', room: 'Lab 2', type: 'Lab' },
  { day: 'Friday', period: 7, subjectId: 'sub_cs405', subjectCode: 'CS405', subjectName: 'Competitive Coding', facultyName: 'Dr. Meenakshi S', room: 'Lab 1', type: 'Lab' },
  { day: 'Friday', period: 8, subjectId: 'sub_cs404', subjectCode: 'CS404', subjectName: 'OS Architecture Seminar', facultyName: 'Dr. V. Sharma', room: 'LH-302', type: 'Tutorial' },
];

export const DEFAULT_SETTINGS: ClassroomSettings = {
  id: 'classroom_settings',
  minimumAttendancePercentage: 75,
  academicTermName: 'Fall Semester 2026',
  termStartDate: '2026-08-15',
  termEndDate: '2026-12-15',
  periodsPerDay: 8,
  dailyPeriodTimings: [
    { period: 1, time: '09:00 AM - 09:50 AM' },
    { period: 2, time: '09:55 AM - 10:45 AM' },
    { period: 3, time: '10:50 AM - 11:40 AM' },
    { period: 4, time: '11:45 AM - 12:35 PM' },
    { period: 5, time: '01:30 PM - 02:20 PM' },
    { period: 6, time: '02:25 PM - 03:15 PM' },
    { period: 7, time: '03:20 PM - 04:10 PM' },
    { period: 8, time: '04:15 PM - 05:05 PM' },
  ],
  classroomName: 'LH-302, Dept. of Computer Science',
  department: 'Computer Science & Engineering',
  semester: 'Semester VII',
  classCode: 'CS2026-FALL',
  allowStudentSignups: true,
};
