import React, { useState, useMemo } from 'react';
import { Subject, AttendanceRecord, TimetableSlot, UserProfile, ClassroomSettings } from '../types';
import { DEMO_TIMETABLE } from '../demoData';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  MapPin, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Printer,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Layers,
  GraduationCap
} from 'lucide-react';

interface MasterTimetableScreenProps {
  currentUser: UserProfile;
  subjects: Subject[];
  attendanceRecords: AttendanceRecord[];
  settings: ClassroomSettings;
  onNavigateToMarking?: (subjectId?: string, period?: number) => void;
  onNavigateToTable?: (subjectId?: string) => void;
}

export const MasterTimetableScreen: React.FC<MasterTimetableScreenProps> = ({
  currentUser,
  subjects,
  attendanceRecords,
  settings,
  onNavigateToMarking,
  onNavigateToTable,
}) => {
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [activeTab, setActiveTab] = useState<'all_week' | 'day_focus'>('all_week');

  const days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
  ];

  // Calculate subject attendance statistics
  const subjectStats = useMemo(() => {
    return subjects.map((sub) => {
      // Filter records for this subject
      // If student, filter for this student; if teacher/CR, classroom wide
      const subRecords = attendanceRecords.filter((r) => r.subjectId === sub.id);
      const studentRecords = currentUser.role === 'student' 
        ? subRecords.filter((r) => r.studentId === currentUser.id)
        : subRecords;

      // Calculate total periods held for this subject
      const uniquePeriodSessions = new Set<string>();
      studentRecords.forEach((r) => uniquePeriodSessions.add(`${r.date}_p${r.period}`));
      const totalHeld = currentUser.role === 'student'
        ? studentRecords.length
        : uniquePeriodSessions.size;

      const attended = currentUser.role === 'student'
        ? studentRecords.filter((r) => r.status === 'present' || r.status === 'leave').length
        : subRecords.filter((r) => r.status === 'present' || r.status === 'leave').length;

      const totalPossible = currentUser.role === 'student'
        ? totalHeld
        : (totalHeld * 25); // 25 students

      const pct = totalPossible > 0 ? Math.round((attended / totalPossible) * 100) : 100;
      const minThreshold = settings.minimumAttendancePercentage || 75;
      const isCritical = pct < minThreshold;

      // Safe to skip or required to attend calculation (for student)
      let safeMargin = 0;
      let needClasses = 0;
      if (totalHeld > 0) {
        if (pct >= minThreshold) {
          safeMargin = Math.max(0, Math.floor((attended - (minThreshold / 100) * totalHeld) / (minThreshold / 100)));
        } else {
          needClasses = Math.ceil(((minThreshold / 100) * totalHeld - attended) / (1 - minThreshold / 100));
        }
      }

      return {
        ...sub,
        totalHeld,
        attended,
        pct,
        isCritical,
        safeMargin,
        needClasses,
      };
    });
  }, [subjects, attendanceRecords, currentUser, settings]);

  const criticalCount = subjectStats.filter((s) => s.isCritical).length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-7 pb-16 font-sans">
      {/* Top Academic Ledger Header Banner */}
      <div className="bg-[#FAF9F5] dark:bg-[#151B18] border border-[#E6E3D8] dark:border-[#28332E] rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#13523B]/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-[11px] font-semibold font-mono tracking-wider uppercase bg-[#EAF5EF] text-[#13523B] dark:bg-[#13523B]/30 dark:text-emerald-300 rounded-md border border-[#BEE0CE] dark:border-emerald-800">
                {settings.department || 'Department of Computer Science'}
              </span>
              <span className="text-xs text-neutral-400 font-mono">• {settings.academicTermName}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold font-serif text-[#0D3828] dark:text-[#E8EFEA] tracking-tight">
              Subject Breakdown & Master Timetable
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1 max-w-2xl font-light">
              Weekly scheduled curriculum hours, lecture room allocations, and individual course attendance compliance thresholds.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-[#1C2420] text-neutral-700 dark:text-neutral-200 border border-[#E6E3D8] dark:border-[#28332E] hover:bg-[#F2EFE8] dark:hover:bg-[#232C27] transition-all shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-500" />
              <span>Print Schedule</span>
            </button>
            {(currentUser.role === 'teacher' || currentUser.role === 'cr') && onNavigateToMarking && (
              <button
                onClick={() => onNavigateToMarking()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#13523B] hover:bg-[#0E422F] text-white transition-all shadow-sm shadow-[#13523B]/20"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Mark Today's Period</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Architectural Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-[#E6E3D8] dark:border-[#28332E]">
          <div className="bg-white/80 dark:bg-[#1A221E]/90 p-3.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E]">
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">Enrolled Courses</div>
            <div className="text-2xl font-bold font-serif text-[#0D3828] dark:text-white mt-0.5">
              {subjects.length} <span className="text-xs font-sans font-normal text-neutral-400">Subjects</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-1 font-mono">Curriculum VII</div>
          </div>

          <div className="bg-white/80 dark:bg-[#1A221E]/90 p-3.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E]">
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">Weekly Lecture Load</div>
            <div className="text-2xl font-bold font-serif text-[#13523B] dark:text-emerald-400 mt-0.5">
              22 <span className="text-xs font-sans font-normal text-neutral-400">Periods/Wk</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-1 font-mono">Mon – Fri (7 hrs/day)</div>
          </div>

          <div className="bg-white/80 dark:bg-[#1A221E]/90 p-3.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E]">
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">Attendance Threshold</div>
            <div className="text-2xl font-bold font-serif text-neutral-900 dark:text-white mt-0.5">
              {settings.minimumAttendancePercentage || 75}% <span className="text-xs font-sans font-normal text-neutral-400">Mandatory</span>
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono">Board Regulation 12.B</div>
          </div>

          <div className={`p-3.5 rounded-xl border ${
            criticalCount > 0 
              ? 'bg-[#FDF2F0] dark:bg-[#2B1715] border-[#F7C6BF] dark:border-rose-900/60' 
              : 'bg-white/80 dark:bg-[#1A221E]/90 border-[#E6E3D8] dark:border-[#28332E]'
          }`}>
            <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Compliance Watch</div>
            <div className={`text-2xl font-bold font-serif mt-0.5 ${
              criticalCount > 0 ? 'text-[#BA3C2A] dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-400'
            }`}>
              {criticalCount > 0 ? `${criticalCount} Critical` : 'All Clear'}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1 font-mono">
              {criticalCount > 0 ? 'Action needed to avoid condonation' : 'Healthy standing across all courses'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Timetable View */}
      <div className="bg-white dark:bg-[#171E1A] rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E3D8] dark:border-[#28332E]">
          <div>
            <h2 className="text-base font-bold font-serif text-[#0D3828] dark:text-[#E8EFEA] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#13523B]" />
              Weekly Master Lecture Matrix
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              LH-302 Lecture Hall & Computing Labs • Standard 50-Minute Periods
            </p>
          </div>

          {/* View switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-[#FAF9F5] dark:bg-[#1E2722] rounded-xl border border-[#E6E3D8] dark:border-[#28332E]">
            <button
              onClick={() => setActiveTab('all_week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'all_week'
                  ? 'bg-[#13523B] text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              Full Week Matrix
            </button>
            <button
              onClick={() => setActiveTab('day_focus')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'day_focus'
                  ? 'bg-[#13523B] text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              Day Detail
            </button>
          </div>
        </div>

        {/* Day Focus Selector (if day_focus selected) */}
        {activeTab === 'day_focus' && (
          <div className="flex items-center gap-2 pt-4 pb-2 overflow-x-auto">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                  selectedDay === day
                    ? 'bg-[#13523B] text-white shadow-xs'
                    : 'bg-[#FAF9F5] dark:bg-[#1D2521] text-neutral-700 dark:text-neutral-300 border border-[#E6E3D8] dark:border-[#28332E] hover:bg-[#F2EFE8]'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        )}

        {/* Full Week Timetable Table */}
        {activeTab === 'all_week' ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-[#FAF9F5] dark:bg-[#1A221E] text-neutral-600 dark:text-neutral-400 text-[11px] font-mono border-b border-[#E6E3D8] dark:border-[#28332E]">
                  <th className="py-3 px-3.5 font-bold uppercase tracking-wider w-28">Day</th>
                  {settings.dailyPeriodTimings.map((pt) => (
                    <th key={pt.period} className="py-3 px-2.5 font-medium border-l border-[#E6E3D8] dark:border-[#28332E] text-center">
                      <div className="font-bold text-[#13523B] dark:text-emerald-400">P{pt.period}</div>
                      <div className="text-[9px] text-neutral-400 font-mono tracking-tight">{pt.time.replace(/ - /g, '–')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E3D8] dark:divide-[#28332E] text-xs">
                {days.map((day) => {
                  const daySlots = DEMO_TIMETABLE.filter((s) => s.day === day);
                  return (
                    <tr key={day} className="hover:bg-[#FAF9F5]/60 dark:hover:bg-[#1B231F]/40 transition-colors">
                      <td className="py-3 px-3.5 font-serif font-bold text-[#0D3828] dark:text-white bg-[#FAF9F5]/40 dark:bg-[#161D19]">
                        {day}
                      </td>
                      {settings.dailyPeriodTimings.map((pt) => {
                        const slot = daySlots.find((s) => s.period === pt.period);
                        if (!slot) {
                          return (
                            <td key={pt.period} className="py-2.5 px-2 border-l border-[#E6E3D8] dark:border-[#28332E] text-center text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/30 text-[11px]">
                              —
                            </td>
                          );
                        }

                        const isLab = slot.type === 'Lab';
                        const isTutorial = slot.type === 'Tutorial';

                        return (
                          <td 
                            key={pt.period} 
                            className="py-2 px-2 border-l border-[#E6E3D8] dark:border-[#28332E] align-top"
                          >
                            <div 
                              onClick={() => onNavigateToMarking && onNavigateToMarking(slot.subjectId, slot.period)}
                              className={`p-2 rounded-xl transition-all cursor-pointer border ${
                                isLab 
                                  ? 'bg-[#FEF8ED] dark:bg-[#2A2113] border-[#FBE3B5] dark:border-[#42341D] hover:border-[#D9822B]' 
                                  : isTutorial
                                  ? 'bg-neutral-50 dark:bg-[#202722] border-[#E6E3D8] dark:border-[#2C3730] hover:border-neutral-400'
                                  : 'bg-[#EAF5EF] dark:bg-[#142A1E] border-[#BEE0CE] dark:border-[#1F4531] hover:border-[#13523B]'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-mono font-bold text-[10px] text-[#0D3828] dark:text-emerald-300">
                                  {slot.subjectCode}
                                </span>
                                <span className={`text-[9px] font-semibold px-1 py-0.2 rounded font-mono ${
                                  isLab 
                                    ? 'bg-[#D9822B]/20 text-[#C77724] dark:text-amber-300' 
                                    : 'bg-[#13523B]/15 text-[#13523B] dark:text-emerald-300'
                                }`}>
                                  {slot.type}
                                </span>
                              </div>
                              <div className="font-semibold text-neutral-900 dark:text-white text-[11px] truncate leading-tight">
                                {slot.subjectName}
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 font-mono">
                                <span>{slot.room}</span>
                                <span className="truncate max-w-[65px]">{slot.facultyName.split(' ').slice(-1)[0]}</span>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Day Detail Cards View */
          <div className="mt-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#13523B] font-mono">
              Schedule for {selectedDay}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {DEMO_TIMETABLE.filter((s) => s.day === selectedDay).map((slot) => {
                const pt = settings.dailyPeriodTimings.find((p) => p.period === slot.period);
                return (
                  <div
                    key={slot.period}
                    className="p-4 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-[#FAF9F5] dark:bg-[#19221D] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-[#13523B] text-white">
                          Period {slot.period}
                        </span>
                        <span className="font-mono text-neutral-500 text-[11px]">
                          {pt ? pt.time : ''}
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-neutral-900 dark:text-white text-base">
                        {slot.subjectName}
                      </h3>
                      <div className="text-xs text-neutral-500 font-mono mt-0.5">
                        {slot.subjectCode} • {slot.type}
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#E6E3D8] dark:border-[#28332E] space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{slot.facultyName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Venue: {slot.room}</span>
                        </div>
                      </div>
                    </div>

                    {(currentUser.role === 'teacher' || currentUser.role === 'cr') && onNavigateToMarking && (
                      <button
                        onClick={() => onNavigateToMarking(slot.subjectId, slot.period)}
                        className="mt-4 w-full py-1.5 px-3 text-xs font-bold text-[#13523B] dark:text-emerald-400 bg-[#EAF5EF] dark:bg-[#14291F] hover:bg-[#D4EBDD] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Mark Period {slot.period} Attendance</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Individual Subject Breakdown Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-serif text-[#0D3828] dark:text-[#E8EFEA] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#13523B]" />
              Subject Breakdown & Compliance Cards
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Detailed tracking of syllabus hours, faculty advisors, and personal threshold security.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjectStats.map((sub) => (
            <div
              key={sub.id}
              className={`p-5 rounded-2xl border transition-all shadow-xs flex flex-col justify-between ${
                sub.isCritical
                  ? 'bg-white dark:bg-[#1C1816] border-[#F7C6BF] dark:border-rose-900/60'
                  : 'bg-white dark:bg-[#171E1A] border-[#E6E3D8] dark:border-[#28332E]'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#FAF9F5] dark:bg-[#202924] border border-[#E6E3D8] dark:border-[#2B3630] text-[#13523B] dark:text-emerald-400">
                        {sub.code}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {sub.credits || 4} Credits
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-neutral-900 dark:text-white text-base mt-1.5 leading-snug">
                      {sub.name}
                    </h3>
                  </div>

                  {/* Attendance Percentage Badge */}
                  <div className={`px-2.5 py-1 rounded-xl font-mono font-bold text-xs ${
                    sub.isCritical
                      ? 'bg-[#FDF2F0] text-[#BA3C2A] dark:bg-rose-950/80 dark:text-rose-200'
                      : 'bg-[#EAF5EF] text-[#13523B] dark:bg-[#13523B]/30 dark:text-emerald-300'
                  }`}>
                    {sub.pct}%
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden mt-3 mb-3">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      sub.isCritical ? 'bg-[#BA3C2A]' : 'bg-[#13523B]'
                    }`}
                    style={{ width: `${Math.min(100, sub.pct)}%` }}
                  />
                </div>

                {/* Attended vs Held metrics */}
                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-3 font-mono">
                  <span>Periods: {sub.attended} Attended</span>
                  <span>{sub.totalHeld} Total Held</span>
                </div>

                {/* Safe-to-skip or Deficit notice */}
                <div className={`p-2.5 rounded-xl text-xs mb-3 font-sans ${
                  sub.isCritical
                    ? 'bg-[#FDF2F0] dark:bg-[#291714] border border-[#F7C6BF] dark:border-rose-900/60 text-[#BA3C2A] dark:text-rose-200'
                    : 'bg-[#FAF9F5] dark:bg-[#1A221E] border border-[#E6E3D8] dark:border-[#28332E] text-neutral-700 dark:text-neutral-300'
                }`}>
                  {sub.isCritical ? (
                    <div className="flex items-center gap-2 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#BA3C2A]" />
                      <span>Deficit: Must attend next <strong>{sub.needClasses} periods</strong> without absence.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span>Buffer: Safe to miss <strong>{sub.safeMargin} periods</strong> while staying ≥ 75%.</span>
                    </div>
                  )}
                </div>

                {/* Syllabus description */}
                {sub.syllabus && (
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 italic mb-3">
                    "{sub.syllabus}"
                  </p>
                )}

                {/* Faculty & Venue */}
                <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400 pt-2 border-t border-[#E6E3D8] dark:border-[#28332E]">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Faculty:</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{sub.teacherName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Hall:</span>
                    <span className="font-mono">{sub.roomNumber || 'LH-302'}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-[#E6E3D8] dark:border-[#28332E] flex items-center gap-2">
                {onNavigateToTable && (
                  <button
                    onClick={() => onNavigateToTable(sub.id)}
                    className="flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg bg-neutral-50 dark:bg-[#202722] hover:bg-neutral-100 dark:hover:bg-[#28312B] text-neutral-700 dark:text-neutral-300 transition-colors text-center"
                  >
                    View Ledger
                  </button>
                )}
                {(currentUser.role === 'teacher' || currentUser.role === 'cr') && onNavigateToMarking && (
                  <button
                    onClick={() => onNavigateToMarking(sub.id)}
                    className="flex-1 py-1.5 px-2.5 text-xs font-bold rounded-lg bg-[#13523B] hover:bg-[#0E422F] text-white transition-colors text-center"
                  >
                    Mark Roll
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
