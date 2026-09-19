import React, { useMemo } from 'react';
import { 
  UserProfile, 
  AttendanceRecord, 
  Subject, 
  AttendanceRequest, 
  ClassroomSettings 
} from '../types';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  FileSpreadsheet, 
  TrendingDown, 
  ArrowRight,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface TeacherDashboardProps {
  currentUser: UserProfile;
  records: AttendanceRecord[];
  subjects: Subject[];
  students: UserProfile[];
  requests: AttendanceRequest[];
  settings: ClassroomSettings;
  onNavigateToFastMarking: () => void;
  onNavigateToTable: () => void;
  onNavigateToRequests: () => void;
  onOpenHistory: (record: AttendanceRecord) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  records,
  subjects,
  students,
  requests,
  settings,
  onNavigateToFastMarking,
  onNavigateToTable,
  onNavigateToRequests,
  onOpenHistory,
}) => {
  // Pending requests count
  const pendingRequests = useMemo(() => {
    return requests.filter(r => r.status === 'pending');
  }, [requests]);

  // Compute student percentage breakdown and find defaulters (< 75%)
  const { lowAttendanceStudents, overallAveragePct, totalClassesHeld } = useMemo(() => {
    const studentStats = new Map<string, { student: UserProfile; attended: number; total: number }>();
    students.forEach(s => {
      studentStats.set(s.id, { student: s, attended: 0, total: 0 });
    });

    const uniqueDates = new Set<string>();
    records.forEach(r => {
      uniqueDates.add(`${r.date}_p${r.period}_${r.subjectId}`);
      const stat = studentStats.get(r.studentId);
      if (stat) {
        stat.total++;
        if (r.status === 'present' || r.status === 'leave') stat.attended++;
      }
    });

    const minPct = settings.minimumAttendancePercentage || 75;
    const defaulters: { student: UserProfile; pct: number; attended: number; total: number }[] = [];
    let sumPct = 0;
    let count = 0;

    studentStats.forEach(st => {
      const pct = st.total > 0 ? Math.round((st.attended / st.total) * 1000) / 10 : 100;
      sumPct += pct;
      count++;
      if (pct < minPct) {
        defaulters.push({
          student: st.student,
          pct,
          attended: st.attended,
          total: st.total,
        });
      }
    });

    return {
      lowAttendanceStudents: defaulters.sort((a, b) => a.pct - b.pct),
      overallAveragePct: count > 0 ? Math.round((sumPct / count) * 10) / 10 : 0,
      totalClassesHeld: uniqueDates.size,
    };
  }, [records, students, settings]);

  // Today's classes / scheduled slots
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const todayRecords = useMemo(() => {
    return records.filter(r => r.date === todayDateStr);
  }, [records, todayDateStr]);

  return (
    <div id="teacher_dashboard_container" className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Welcome & Fast Action Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-neutral-900 text-white rounded-2xl p-6 shadow-md border border-indigo-950/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{settings.academicTermName} • {settings.classroomName}</span>
            </div>
            <h1 className="text-2xl font-bold font-['Plus_Jakarta_Sans']">
              Good day, {currentUser.name}
            </h1>
            <p className="text-xs text-neutral-300 mt-1 max-w-xl">
              Classroom roll-call system with append-only audit trail. Zero erasures; all edits preserve author and reason.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn_hero_fast_marking"
              type="button"
              onClick={onNavigateToFastMarking}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-indigo-900 hover:bg-neutral-100 shadow-md transition-all active:scale-98 cursor-pointer flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>Take Attendance Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Enrolled */}
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1">
            <span>Enrolled Students</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']">
            {students.length}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            2 Class Representatives
          </div>
        </div>

        {/* Stat 2: Class Average */}
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1">
            <span>Classroom Average</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']">
            {overallAveragePct}%
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
            Target threshold: {settings.minimumAttendancePercentage || 75}%
          </div>
        </div>

        {/* Stat 3: Defaulters / Low Attendance */}
        <div 
          onClick={onNavigateToTable}
          className="bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs cursor-pointer hover:border-rose-300 dark:hover:border-rose-700 transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1">
            <span>Low Attendance Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-['Plus_Jakarta_Sans']">
            {lowAttendanceStudents.length}
          </div>
          <div className="text-[11px] text-rose-500 dark:text-rose-400 mt-1">
            Below {settings.minimumAttendancePercentage}% requirement
          </div>
        </div>

        {/* Stat 4: Pending Inbox */}
        <div 
          onClick={onNavigateToRequests}
          className="bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1">
            <span>Pending Inbox</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']">
            {pendingRequests.length}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
            Disputes & Leave Requests
          </div>
        </div>
      </div>

      {/* Main Split: Low Attendance Warning & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Low Attendance Defaulters List */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']">
                Low-Attendance Critical Watchlist (&lt; {settings.minimumAttendancePercentage || 75}%)
              </h3>
            </div>
            <button
              onClick={onNavigateToTable}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {lowAttendanceStudents.length === 0 ? (
            <div className="py-8 text-center text-neutral-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">No Defaulters</p>
              <p className="text-neutral-400 mt-0.5">All students are maintaining healthy attendance records.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowAttendanceStudents.map(({ student, pct, attended, total }) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-bold flex items-center justify-center text-xs">
                      {student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-white">
                        {student.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                        {student.rollNumber} • {attended}/{total} periods attended
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100">
                      {pct}%
                    </span>
                    <button
                      onClick={onNavigateToTable}
                      className="text-xs text-neutral-500 hover:text-indigo-600 font-medium"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subjects & Today's Schedule */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']">
                Classroom Subjects
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-700/60 text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-neutral-900 dark:text-white text-sm">
                    {sub.code}
                  </span>
                  <span className="text-[11px] font-medium text-neutral-500">
                    {sub.periodsPerWeek || 4} hrs/week
                  </span>
                </div>
                <div className="text-neutral-700 dark:text-neutral-300 font-medium">
                  {sub.name}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Faculty: {sub.teacherName || 'Assigned Professor'}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={onNavigateToFastMarking}
              className="w-full py-2 px-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-xl transition-colors text-center"
            >
              Start Roll Call for Today &rarr;
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
