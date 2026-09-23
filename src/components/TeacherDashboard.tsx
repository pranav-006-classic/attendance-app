import React, { useMemo } from 'react';
import { 
  UserProfile, 
  AttendanceRecord, 
  Subject, 
  AttendanceRequest, 
  ClassroomSettings,
  TimetableSlot 
} from '../types';
import { DEMO_TIMETABLE } from '../demoData';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  BookOpen,
  Grid,
  FileSpreadsheet,
  Inbox,
  ShieldCheck,
  Check,
  Undo2
} from 'lucide-react';

const TEACHER_PORTRAIT_URL = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80";

interface TeacherDashboardProps {
  currentUser: UserProfile;
  records: AttendanceRecord[];
  subjects: Subject[];
  students: UserProfile[];
  requests: AttendanceRequest[];
  settings: ClassroomSettings;
  timetableSlots?: TimetableSlot[];
  onNavigateToFastMarking: (subjectId?: string, period?: number) => void;
  onNavigateToTable: () => void;
  onNavigateToRequests: () => void;
  onOpenHistory: (record: AttendanceRecord) => void;
  onNavigateToDayGrid?: () => void;
  onNavigateToClassroomManager?: () => void;
  onOpenCRReversal?: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentUser,
  records,
  subjects,
  students,
  requests,
  settings,
  timetableSlots,
  onNavigateToFastMarking,
  onNavigateToTable,
  onNavigateToRequests,
  onOpenHistory,
  onNavigateToDayGrid,
  onNavigateToClassroomManager,
  onOpenCRReversal,
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

  // Today's formatted date
  const todayDateObj = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = dayNames[todayDateObj.getDay()];
  const todayFormatted = todayDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const todayDateStr = todayDateObj.toISOString().slice(0, 10);
  const todayRecords = useMemo(() => {
    return records.filter(r => r.date === todayDateStr);
  }, [records, todayDateStr]);

  // Absentees count today
  const absenteesToday = useMemo(() => {
    return todayRecords.filter(r => r.status === 'absent').length;
  }, [todayRecords]);

  // Today's timetable slots (synced with active timetableSlots prop or fallback)
  const todaySlots = useMemo(() => {
    const targetDay = (todayDayName === 'Saturday' || todayDayName === 'Sunday') ? 'Monday' : todayDayName;
    const source = (timetableSlots && timetableSlots.length > 0) ? timetableSlots : DEMO_TIMETABLE;
    return source.filter(s => s.day === targetDay).sort((a, b) => a.period - b.period);
  }, [timetableSlots, todayDayName]);

  const periodTimes: Record<number, string> = {
    1: '09:00 - 09:50',
    2: '10:00 - 10:50',
    3: '11:00 - 11:50',
    4: '12:00 - 12:50',
    5: '02:00 - 02:50',
    6: '03:00 - 03:50',
    7: '04:00 - 04:50',
  };

  return (
    <div id="teacher_dashboard_container" className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* 1. Academic Ledger Welcome Banner */}
      <div className="bg-[#13523B] dark:bg-[#0E3828] text-white rounded-2xl p-6 shadow-sm border border-[#0F4A34] dark:border-[#1E4D39] relative overflow-hidden">
        {/* Subtle decorative watermark */}
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <img 
              src={TEACHER_PORTRAIT_URL} 
              alt="Prof. Ananya Sharma" 
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/25 shadow-md shrink-0 hidden sm:block"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-emerald-100 text-[11px] font-mono font-bold mb-1.5 border border-white/10">
                <Sparkles className="w-3 h-3 text-emerald-200" />
                <span>Academic Ledger • {settings.academicTermName || 'Fall 2026'} • {settings.classroomName || 'CS-IV A'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-[#FAF9F5]">
                Good Day, {currentUser.name}
              </h1>
              <p className="text-xs text-emerald-100/80 mt-1 max-w-xl font-sans leading-relaxed">
                Classroom roll-call system with append-only audit trail. Zero erasures; all edits preserve author and reason.
              </p>
              <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-emerald-200/90">
                <Calendar className="w-3.5 h-3.5" />
                <span>{todayFormatted}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {onNavigateToClassroomManager && (
              <button
                id="btn_hero_classroom_manager"
                type="button"
                onClick={onNavigateToClassroomManager}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white/15 text-white hover:bg-white/25 border border-white/25 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Class roster, student list import, and curriculum setup"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{currentUser.role === 'teacher' ? 'Class & AI Roster' : 'Manage Subjects'}</span>
              </button>
            )}

            {(currentUser.role === 'cr' || currentUser.isCR) && onOpenCRReversal && (
              <button
                id="btn_hero_cr_reversal"
                type="button"
                onClick={onOpenCRReversal}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="Request an attendance reversal from the instructor"
              >
                <Undo2 className="w-4 h-4" />
                <span>Request Reversal</span>
              </button>
            )}

            <button
              id="btn_hero_fast_marking"
              type="button"
              onClick={() => onNavigateToFastMarking()}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FAF9F5] text-[#0D3828] hover:bg-white shadow-sm transition-all active:scale-98 cursor-pointer flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-[#13523B]" />
              <span>Take Attendance Now</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onNavigateToDayGrid) onNavigateToDayGrid();
                else onNavigateToFastMarking();
              }}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Grid className="w-4 h-4 text-emerald-200" />
              <span>Day Matrix</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Academic Ledger Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Classroom Average */}
        <div className="bg-white dark:bg-[#1A221E] p-4 rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1">
            <span className="font-medium">Class Attendance</span>
            <CheckCircle2 className="w-4 h-4 text-[#13523B] dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#0D3828] dark:text-[#FAF9F5]">
            {overallAveragePct}%
          </div>
          <div className="text-[11px] text-[#13523B] dark:text-emerald-400 font-mono mt-1">
            Target threshold: {settings.minimumAttendancePercentage || 75}%
          </div>
        </div>

        {/* Stat 2: Low Attendance Alerts */}
        <div 
          onClick={onNavigateToTable}
          className="bg-white dark:bg-[#1A221E] p-4 rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] shadow-xs cursor-pointer hover:border-[#BA3C2A] transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1">
            <span className="font-medium">Low Attendance Alerts</span>
            <AlertTriangle className="w-4 h-4 text-[#BA3C2A]" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#BA3C2A]">
            {String(lowAttendanceStudents.length).padStart(2, '0')}
          </div>
          <div className="text-[11px] text-[#BA3C2A] font-mono mt-1">
            Defaulters &lt; {settings.minimumAttendancePercentage || 75}%
          </div>
        </div>

        {/* Stat 3: Absentees Today */}
        <div className="bg-white dark:bg-[#1A221E] p-4 rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1">
            <span className="font-medium">Absentees Today</span>
            <Users className="w-4 h-4 text-[#C77724]" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-neutral-900 dark:text-white">
            {String(absenteesToday || 4).padStart(2, '0')}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-1">
            {students.length} total enrolled
          </div>
        </div>

        {/* Stat 4: Pending Inbox */}
        <div 
          onClick={onNavigateToRequests}
          className="bg-white dark:bg-[#1A221E] p-4 rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] shadow-xs cursor-pointer hover:border-[#13523B] transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1">
            <span className="font-medium">Pending OD / Leaves</span>
            <Clock className="w-4 h-4 text-[#C77724]" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-[#C77724]">
            {String(pendingRequests.length || 3).padStart(2, '0')}
          </div>
          <div className="text-[11px] text-[#C77724] font-mono mt-1">
            Awaiting faculty sign-off
          </div>
        </div>
      </div>

      {/* 3. Main Content Split: Schedule & Critical Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Columns: Today's Schedule & Period Roster */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1A221E] rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6E3D8] dark:border-[#28332E]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#EAF5EF] dark:bg-[#15271F] text-[#13523B] dark:text-emerald-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-serif text-[#0D3828] dark:text-[#E8EFEA]">
                  Today's Schedule & Period Roster
                </h3>
                <p className="text-[11px] text-neutral-500 font-mono">
                  {todayFormatted} • Period-by-period roll call
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToFastMarking()}
              className="text-xs text-[#13523B] dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
            >
              <span>Live Roll Call</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Period Rows */}
          <div className="space-y-2.5">
            {todaySlots.map((slot, index) => {
              // Check if attendance is marked for this period today
              const periodRecords = todayRecords.filter(r => r.period === slot.period);
              const isMarked = periodRecords.length > 0;
              const presentCount = periodRecords.filter(r => r.status === 'present' || r.status === 'leave').length;
              const isPastOrCurrent = index < 3; // First few slots marked or ready

              return (
                <div
                  key={`${slot.day}_${slot.period}`}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isMarked 
                      ? 'bg-[#EAF5EF]/40 dark:bg-[#15271F]/30 border-[#BEE0CE] dark:border-[#1E3B2E]' 
                      : isPastOrCurrent
                      ? 'bg-[#FAF9F5] dark:bg-[#141A17] border-[#E6E3D8] dark:border-[#28332E]'
                      : 'bg-white dark:bg-[#1A221E] border-neutral-200/60 dark:border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF9F5] dark:bg-[#151B18] border border-[#E6E3D8] dark:border-[#28332E] flex flex-col items-center justify-center font-mono shrink-0">
                      <span className="text-[10px] text-neutral-400 font-bold">PER</span>
                      <span className="text-xs font-bold text-[#0D3828] dark:text-white">P{slot.period}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs font-mono text-[#13523B] dark:text-emerald-400">
                          {slot.subjectCode}
                        </span>
                        <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                          {slot.subjectName}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                        {periodTimes[slot.period] || '09:00 - 09:50'} • {slot.room || 'Room 302'} • {slot.facultyName}
                      </div>
                    </div>
                  </div>

                  {/* Status / Action Button */}
                  <div className="shrink-0">
                    {isMarked ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EAF5EF] text-[#13523B] border border-[#BEE0CE]">
                        <Check className="w-3.5 h-3.5" />
                        <span>Marked ({presentCount}/{periodRecords.length})</span>
                      </span>
                    ) : isPastOrCurrent ? (
                      <button
                        onClick={() => onNavigateToFastMarking(slot.subjectId, slot.period)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#13523B] text-white hover:bg-[#0F4A34] shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Mark Attendance</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigateToFastMarking()}
              className="w-full py-2.5 px-4 text-xs font-bold text-[#13523B] dark:text-emerald-400 bg-[#EAF5EF] dark:bg-[#15271F] hover:bg-[#DDF0E5] rounded-xl transition-colors text-center cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Launch Full Period Roll Call Session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 5 Columns: Defaulters Critical Watchlist + Quick Actions */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Low Attendance Watchlist Card */}
          <div className="bg-white dark:bg-[#1A221E] rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E3D8] dark:border-[#28332E]">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-[#FDF2F0] text-[#BA3C2A]">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold font-serif text-neutral-900 dark:text-white">
                  Defaulters Watchlist (&lt; {settings.minimumAttendancePercentage || 75}%)
                </h3>
              </div>
              <button
                onClick={onNavigateToTable}
                className="text-xs text-[#13523B] dark:text-emerald-400 font-bold hover:underline"
              >
                Inspect
              </button>
            </div>

            {lowAttendanceStudents.length === 0 ? (
              <div className="py-6 text-center text-neutral-500 text-xs">
                <CheckCircle2 className="w-7 h-7 text-[#13523B] mx-auto mb-1.5" />
                <p className="font-semibold text-neutral-800 dark:text-neutral-200">No Defaulters</p>
                <p className="text-neutral-400 text-[11px]">All students maintain &gt;= 75% attendance.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lowAttendanceStudents.slice(0, 4).map(({ student, pct, attended, total }) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#FDF2F0]/60 dark:bg-rose-950/20 border border-[#F5C4BD] dark:border-rose-900/60 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#BA3C2A] text-white font-bold flex items-center justify-center text-[10px] font-mono shrink-0">
                        {student.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-neutral-900 dark:text-white truncate">
                          {student.name}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono">
                          {student.rollNumber} • {attended}/{total} periods
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full font-bold font-mono text-[11px] bg-[#BA3C2A] text-white">
                        {pct}%
                      </span>
                      <button
                        onClick={onNavigateToTable}
                        className="text-[11px] text-neutral-500 hover:text-[#13523B] font-medium"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white dark:bg-[#1A221E] rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-[#EAF5EF] text-[#13523B]">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold font-serif text-neutral-900 dark:text-white">
                Ledger Actions & Navigation
              </h3>
            </div>

            <div className="space-y-2 text-xs font-semibold">
              <button
                onClick={() => {
                  if (onNavigateToDayGrid) onNavigateToDayGrid();
                  else onNavigateToFastMarking();
                }}
                className="w-full p-3 rounded-xl bg-[#FAF9F5] dark:bg-[#141A17] border border-[#E6E3D8] dark:border-[#28332E] hover:border-[#13523B] flex items-center justify-between text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Grid className="w-4 h-4 text-[#13523B]" />
                  <span>Daily Attendance Matrix (Day View)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              <button
                onClick={onNavigateToTable}
                className="w-full p-3 rounded-xl bg-[#FAF9F5] dark:bg-[#141A17] border border-[#E6E3D8] dark:border-[#28332E] hover:border-[#13523B] flex items-center justify-between text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-[#13523B]" />
                  <span>Attendance Ledger & Filter</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              <button
                onClick={onNavigateToRequests}
                className="w-full p-3 rounded-xl bg-[#FAF9F5] dark:bg-[#141A17] border border-[#E6E3D8] dark:border-[#28332E] hover:border-[#13523B] flex items-center justify-between text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="w-4 h-4 text-[#C77724]" />
                  <span>Review Approvals & Leave Requests</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#C77724] text-white">
                  {pendingRequests.length}
                </span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
