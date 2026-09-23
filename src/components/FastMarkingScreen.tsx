import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, 
  X, 
  Clock, 
  Save, 
  Users, 
  Sparkles, 
  RotateCcw, 
  AlertCircle,
  Calendar,
  Layers,
  BookOpen,
  ChevronDown,
  Grid,
  CheckCheck,
  CheckCircle2,
  ListFilter,
  Info
} from 'lucide-react';
import { 
  UserProfile, 
  Subject, 
  AttendanceStatus, 
  ClassroomSettings,
  AttendanceRecord,
  TimetableSlot
} from '../types';
import { 
  saveSessionAttendance, 
  saveSingleStudentPeriodAttendance, 
  compareStudentsByRoster,
  fetchTimetable
} from '../services/attendanceService';

const DEFAULT_FALLBACK_SUBJECT: Subject = {
  id: 'sub_general',
  code: 'GEN101',
  name: 'Core Classroom Session',
  teacherName: 'Faculty In-Charge',
  periodsPerWeek: 4,
  color: '#13523B',
  roomNumber: 'LH-302',
  credits: 4,
};

interface FastMarkingScreenProps {
  currentUser: UserProfile;
  subjects: Subject[];
  students: UserProfile[];
  settings: ClassroomSettings;
  records: AttendanceRecord[];
  timetableSlots?: TimetableSlot[];
  initialMode?: 'single' | 'day_grid';
  initialSubjectId?: string;
  initialPeriod?: number;
  onSaved: () => void;
  onNavigateToTable: () => void;
  onRefreshData?: () => Promise<void> | void;
}

export const FastMarkingScreen: React.FC<FastMarkingScreenProps> = ({
  currentUser,
  subjects,
  students,
  settings,
  records,
  timetableSlots,
  initialMode = 'single',
  initialSubjectId,
  initialPeriod,
  onSaved,
  onNavigateToTable,
  onRefreshData,
}) => {
  // Today in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // View Mode: 'single' (Period View) or 'day_grid' (Day View Grid)
  const [viewMode, setViewMode] = useState<'single' | 'day_grid'>(initialMode);

  useEffect(() => {
    if (initialMode) {
      setViewMode(initialMode);
    }
  }, [initialMode]);

  // Active Timetable Slots State with auto-load from Firestore/local storage
  const [activeSlots, setActiveSlots] = useState<TimetableSlot[]>(timetableSlots || []);

  useEffect(() => {
    if (timetableSlots && timetableSlots.length > 0) {
      setActiveSlots(timetableSlots);
    } else {
      fetchTimetable().then(slots => {
        if (slots && slots.length > 0) {
          setActiveSlots(slots);
        }
      });
    }
  }, [timetableSlots]);

  // Total periods configured (default 8)
  const totalPeriods = useMemo(() => {
    return settings.periodsPerDay || 8;
  }, [settings.periodsPerDay]);

  const periodsList = useMemo(() => {
    return Array.from({ length: totalPeriods }, (_, i) => i + 1);
  }, [totalPeriods]);

  // Selected Date, Period, and Subject
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(initialPeriod || 1);

  // Helper to get day name for date string
  const getDayOfWeekName = (dateStr: string): 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' => {
    if (!dateStr) return 'Monday';
    const [yyyy, mm, dd] = dateStr.split('-').map(Number);
    const d = new Date(yyyy, mm - 1, dd);
    const days: ('Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];
    return days[d.getDay()];
  };

  // Find slot currently scheduled in Timetable for selected Date and Period
  const scheduledSlot = useMemo(() => {
    const rawDay = getDayOfWeekName(selectedDate);
    // If weekend, map to Monday for scheduling preview
    const targetDay = (rawDay === 'Saturday' || rawDay === 'Sunday') ? 'Monday' : rawDay;
    return activeSlots.find(
      s => s.day === targetDay && s.period === selectedPeriod
    );
  }, [activeSlots, selectedDate, selectedPeriod]);

  // Combine subjects prop with any unique subjects defined in the active timetable
  const allSelectableSubjects = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach(s => {
      map.set(s.id, s);
      if (s.code) map.set(s.code.trim().toUpperCase(), s);
    });

    // If scheduled slot subject is not yet in subjects, inject it dynamically
    if (scheduledSlot && scheduledSlot.subjectCode) {
      const codeKey = scheduledSlot.subjectCode.trim().toUpperCase();
      if (!map.has(scheduledSlot.subjectId) && !map.has(codeKey)) {
        const injected: Subject = {
          id: scheduledSlot.subjectId || `sub_${codeKey.toLowerCase()}`,
          code: scheduledSlot.subjectCode,
          name: scheduledSlot.subjectName || scheduledSlot.subjectCode,
          teacherName: scheduledSlot.facultyName || 'Faculty In-Charge',
          periodsPerWeek: 4,
          color: '#13523B',
          roomNumber: scheduledSlot.room || 'LH-302',
          credits: scheduledSlot.type === 'Lab' ? 2 : 4,
        };
        map.set(injected.id, injected);
      }
    }

    // Return unique values by id
    const seenIds = new Set<string>();
    const list: Subject[] = [];
    map.forEach(sub => {
      if (!seenIds.has(sub.id)) {
        seenIds.add(sub.id);
        list.push(sub);
      }
    });

    return list.length > 0 ? list : [DEFAULT_FALLBACK_SUBJECT];
  }, [subjects, scheduledSlot]);

  // Calculate default initial subject ID synced to scheduled slot
  const computeScheduledSubjectId = (): string => {
    if (initialSubjectId && allSelectableSubjects.some(s => s.id === initialSubjectId)) {
      return initialSubjectId;
    }
    if (scheduledSlot) {
      const match = allSelectableSubjects.find(s => 
        s.id === scheduledSlot.subjectId || 
        (s.code && scheduledSlot.subjectCode && s.code.trim().toUpperCase() === scheduledSlot.subjectCode.trim().toUpperCase())
      );
      if (match) return match.id;
      if (scheduledSlot.subjectId) return scheduledSlot.subjectId;
    }
    return allSelectableSubjects[0]?.id || 'sub_general';
  };

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(computeScheduledSubjectId);

  // Student roster state for this session: studentId -> status
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});
  // Track original statuses to know whether status actually changed for audit log
  const [originalStatusMap, setOriginalStatusMap] = useState<Record<string, AttendanceStatus | null>>({});
  const [isExistingSession, setIsExistingSession] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick helper to show ephemeral toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Map of existing records for the selected date: keyed by `${period}_${studentId}`
  const dayRecordsMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    records.forEach(r => {
      if (r.date === selectedDate) {
        map.set(`${r.period}_${r.studentId}`, r);
        if (r.rollNumber) {
          map.set(`${r.period}_${r.rollNumber}`, r);
        }
      }
    });
    return map;
  }, [records, selectedDate]);

  // When Date or Period changes in Single Period View:
  // 1. Load existing saved statuses if session was already marked
  // 2. OR automatically sync selectedSubjectId to the timetable's scheduled subject for that day & period!
  useEffect(() => {
    const existingPeriodRecords = records.filter(
      r => r.date === selectedDate && r.period === selectedPeriod
    );

    const nextStatusMap: Record<string, AttendanceStatus> = {};
    const nextOriginalMap: Record<string, AttendanceStatus | null> = {};

    if (existingPeriodRecords.length > 0) {
      setIsExistingSession(true);
      // Map both by studentId and rollNumber
      const recordByIdOrRoll = new Map<string, AttendanceRecord>();
      existingPeriodRecords.forEach(r => {
        recordByIdOrRoll.set(r.studentId, r);
        if (r.rollNumber) recordByIdOrRoll.set(r.rollNumber, r);
      });

      // Populate from existing saved records
      students.forEach(s => {
        const found = recordByIdOrRoll.get(s.id) || (s.rollNumber ? recordByIdOrRoll.get(s.rollNumber) : undefined);
        if (found) {
          nextStatusMap[s.id] = found.status;
          nextOriginalMap[s.id] = found.status;
        } else {
          nextStatusMap[s.id] = 'present';
          nextOriginalMap[s.id] = null;
        }
      });

      // Auto-set subject if present on existing records
      const savedSubjectId = existingPeriodRecords[0]?.subjectId;
      if (savedSubjectId) {
        setSelectedSubjectId(savedSubjectId);
      }
    } else {
      setIsExistingSession(false);
      // New session: everyone defaults to Present
      students.forEach(s => {
        nextStatusMap[s.id] = 'present';
        nextOriginalMap[s.id] = null;
      });

      // SYNC WITH TIMETABLE: Auto-select scheduled subject for this period & day
      const rawDay = getDayOfWeekName(selectedDate);
      const targetDay = (rawDay === 'Saturday' || rawDay === 'Sunday') ? 'Monday' : rawDay;
      const scheduled = activeSlots.find(
        s => s.day === targetDay && s.period === selectedPeriod
      );

      if (scheduled) {
        const match = allSelectableSubjects.find(s => 
          s.id === scheduled.subjectId || 
          (s.code && scheduled.subjectCode && s.code.trim().toUpperCase() === scheduled.subjectCode.trim().toUpperCase()) ||
          s.name.trim().toLowerCase() === scheduled.subjectName.trim().toLowerCase()
        );
        if (match) {
          setSelectedSubjectId(match.id);
        } else if (scheduled.subjectId) {
          setSelectedSubjectId(scheduled.subjectId);
        }
      }
    }

    setStatusMap(nextStatusMap);
    setOriginalStatusMap(nextOriginalMap);
  }, [selectedDate, selectedPeriod, records, students, activeSlots, allSelectableSubjects]);

  // Selected subject object
  const currentSubject = allSelectableSubjects.find(s => s.id === selectedSubjectId) || allSelectableSubjects[0] || DEFAULT_FALLBACK_SUBJECT;

  // Helper to determine subject for a given period in Day View
  const getSubjectForPeriod = (periodNum: number): Subject => {
    // 1. If any record exists for this date and period, use its subject
    for (const [key, rec] of dayRecordsMap.entries()) {
      if (rec.period === periodNum) {
        const found = allSelectableSubjects.find(s => s.id === rec.subjectId);
        if (found) return found;
      }
    }
    // 2. Lookup scheduled class from master timetable for this day of week!
    const rawDay = getDayOfWeekName(selectedDate);
    const targetDay = (rawDay === 'Saturday' || rawDay === 'Sunday') ? 'Monday' : rawDay;
    const scheduled = activeSlots.find(
      s => s.day === targetDay && s.period === periodNum
    );
    if (scheduled) {
      const match = allSelectableSubjects.find(s => 
        s.id === scheduled.subjectId || 
        (s.code && scheduled.subjectCode && s.code.trim().toUpperCase() === scheduled.subjectCode.trim().toUpperCase())
      );
      if (match) return match;
      return {
        id: scheduled.subjectId || `sub_${(scheduled.subjectCode || 'GEN').toLowerCase()}`,
        code: scheduled.subjectCode || 'GEN',
        name: scheduled.subjectName || 'Class Session',
        teacherName: scheduled.facultyName || 'Faculty In-Charge',
        periodsPerWeek: 4,
        color: '#13523B',
        roomNumber: scheduled.room || 'LH-302',
        credits: scheduled.type === 'Lab' ? 2 : 4,
      };
    }
    // 3. Fallback to currentSubject
    return currentSubject || DEFAULT_FALLBACK_SUBJECT;
  };

  // Quick action: Mark all present for the current single period
  const handleMarkAllPresent = () => {
    const nextMap: Record<string, AttendanceStatus> = {};
    students.forEach(s => {
      nextMap[s.id] = 'present';
    });
    setStatusMap(nextMap);
  };

  // Quick action: Mark all absent for the current single period
  const handleMarkAllAbsent = () => {
    const nextMap: Record<string, AttendanceStatus> = {};
    students.forEach(s => {
      nextMap[s.id] = 'absent';
    });
    setStatusMap(nextMap);
  };

  // Tap action: primary tap toggles between Present and Absent (Fast marking)
  const handleToggleStudent = (studentId: string) => {
    setStatusMap(prev => {
      const current = prev[studentId] || 'present';
      return {
        ...prev,
        [studentId]: current === 'present' ? 'absent' : 'present',
      };
    });
  };

  // Set explicit status (e.g. Leave / On-Duty)
  const handleSetExplicitStatus = (studentId: string, status: AttendanceStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    setStatusMap(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Live counters for current single period
  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    students.forEach(s => {
      const st = statusMap[s.id] || 'present';
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'leave') leave++;
    });
    return { present, absent, leave, total: students.length };
  }, [students, statusMap]);

  // Filtered student list for quick find (strictly ordered from starting roll number / given order)
  const filteredStudents = useMemo(() => {
    const sorted = [...students].sort(compareStudentsByRoster);
    if (!searchQuery.trim()) return sorted;
    const q = searchQuery.toLowerCase().trim();
    return sorted.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.rollNumber && s.rollNumber.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  // Save single period session attendance
  const handleSaveSession = async () => {
    if (students.length === 0) {
      setErrorMessage('No enrolled students found in this classroom. Please add students in Classroom Manager first.');
      return;
    }

    const subjectToUse = currentSubject || subjects[0] || DEFAULT_FALLBACK_SUBJECT;

    // Check CR same-day edit constraint
    if (currentUser.role === 'cr' && isExistingSession && selectedDate !== todayStr) {
      setErrorMessage(
        'CR policy notice: CRs can only directly modify records on the same day. Older changes must be submitted as correction requests.'
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const recordsToSave = students.map(st => ({
        student: st,
        status: statusMap[st.id] || 'present',
        oldStatus: originalStatusMap[st.id] ?? null,
      }));

      await saveSessionAttendance({
        date: selectedDate,
        period: selectedPeriod,
        subject: subjectToUse,
        records: recordsToSave,
        user: currentUser,
        sessionNote: isExistingSession ? `Period ${selectedPeriod} corrections saved` : undefined,
      });

      setSaveSuccess(true);
      showToast(`Period ${selectedPeriod} attendance saved successfully.`);
      setTimeout(() => {
        setSaveSuccess(false);
        onSaved();
      }, 700);
    } catch (err: any) {
      console.error('Error saving fast attendance:', err);
      setErrorMessage(err.message || 'Failed to save attendance records.');
    } finally {
      setIsSaving(false);
    }
  };

  // DAY VIEW: Tap a single cell to cycle status: not_marked -> present -> absent -> leave -> present
  const handleDayViewCellTap = async (student: UserProfile, period: number) => {
    const existingRec = dayRecordsMap.get(`${period}_${student.id}`) || (student.rollNumber ? dayRecordsMap.get(`${period}_${student.rollNumber}`) : undefined);
    const currentStatus: AttendanceStatus | 'not_marked' = existingRec ? existingRec.status : 'not_marked';

    let nextStatus: AttendanceStatus;
    if (currentStatus === 'not_marked') nextStatus = 'present';
    else if (currentStatus === 'present') nextStatus = 'absent';
    else if (currentStatus === 'absent') nextStatus = 'leave';
    else nextStatus = 'present';

    const periodSubject = getSubjectForPeriod(period) || currentSubject || DEFAULT_FALLBACK_SUBJECT;

    try {
      await saveSingleStudentPeriodAttendance({
        student,
        date: selectedDate,
        period,
        subject: periodSubject,
        status: nextStatus,
        oldStatus: existingRec ? existingRec.status : null,
        user: currentUser,
        reason: existingRec 
          ? `Day view cell edit: ${student.name} P${period} updated from ${existingRec.status} to ${nextStatus}`
          : `Day view marking: ${student.name} P${period} marked ${nextStatus}`,
      });

      showToast(`${student.name.split(' ')[0]} P${period}: ${nextStatus.toUpperCase()}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating record');
    }
  };

  // DAY VIEW COLUMN SHORTCUT: Mark entire period All Present or All Absent
  const handleColumnShortcut = async (period: number, status: AttendanceStatus) => {
    const periodSubject = getSubjectForPeriod(period) || currentSubject || DEFAULT_FALLBACK_SUBJECT;
    setIsSaving(true);
    try {
      const recordsToSave = students.map(st => {
        const existing = dayRecordsMap.get(`${period}_${st.id}`) || (st.rollNumber ? dayRecordsMap.get(`${period}_${st.rollNumber}`) : undefined);
        return {
          student: st,
          status,
          oldStatus: existing ? existing.status : null,
        };
      });

      await saveSessionAttendance({
        date: selectedDate,
        period,
        subject: periodSubject,
        records: recordsToSave,
        user: currentUser,
        sessionNote: `Day view column shortcut: All students marked ${status} for Period ${period}`,
      });

      showToast(`Period ${period} marked All ${status.toUpperCase()}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update period');
    } finally {
      setIsSaving(false);
    }
  };

  // DAY VIEW ROW SHORTCUT: Mark all periods for a single student Present
  const handleRowShortcutStudentAllPresent = async (student: UserProfile) => {
    setIsSaving(true);
    try {
      for (const p of periodsList) {
        const existing = dayRecordsMap.get(`${p}_${student.id}`) || (student.rollNumber ? dayRecordsMap.get(`${p}_${student.rollNumber}`) : undefined);
        const periodSubject = getSubjectForPeriod(p) || currentSubject || DEFAULT_FALLBACK_SUBJECT;
        await saveSingleStudentPeriodAttendance({
          student,
          date: selectedDate,
          period: p,
          subject: periodSubject,
          status: 'present',
          oldStatus: existing ? existing.status : null,
          user: currentUser,
          reason: `Day view row shortcut: ${student.name} marked Present for all periods`,
        });
      }
      showToast(`${student.name} marked Present for all periods today.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update student records');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="fast_marking_container" className="max-w-6xl mx-auto space-y-5 pb-28">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-3 bg-emerald-600 text-white rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Control Card */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 p-5 shadow-xs">
        
        {/* Top View Mode Switcher + Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-700/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Per-Period Ledger
              </span>
              <span className="text-xs text-neutral-400">Independent period records</span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white mt-1 font-['Plus_Jakarta_Sans']">
              {viewMode === 'single' ? 'Mark Attendance by Period' : 'Day View Attendance Grid'}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {viewMode === 'single' 
                ? 'Select date, period, and subject. Saving records only this selected period.'
                : 'Interactive day matrix. Tap any cell to independently toggle that student and period.'}
            </p>
          </div>

          {/* View Mode Toggle Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <button
                id="btn_view_single_period"
                type="button"
                onClick={() => setViewMode('single')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'single'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Period View</span>
              </button>
              <button
                id="btn_view_day_grid"
                type="button"
                onClick={() => setViewMode('day_grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'day_grid'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Day View Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Row: 1. Date, 2. Period, 3. Subject */}
        {viewMode === 'single' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            
            {/* 1. Date Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                1. Session Date
              </label>
              <div className="relative">
                <input
                  id="input_session_date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 2. Period Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                2. Period / Hour (Total {totalPeriods})
              </label>
              <div className="relative">
                <select
                  id="select_period"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                  className="w-full appearance-none pl-9 pr-8 py-2 text-xs font-semibold rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {periodsList.map((p) => {
                    const timing = settings.dailyPeriodTimings?.[p - 1]?.time || `Hour ${p}`;
                    return (
                      <option key={p} value={p}>
                        Period {p} ({timing})
                      </option>
                    );
                  })}
                </select>
                <Layers className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
                <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 3. Subject Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="select_subject" className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  3. Subject for Period {selectedPeriod}
                </label>
                {scheduledSlot && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Timetable Synced
                  </span>
                )}
              </div>

              <div className="relative">
                <select
                  id="select_subject"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full appearance-none pl-9 pr-8 py-2 text-xs font-semibold rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#13523B]"
                >
                  {allSelectableSubjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code}: {s.name} ({s.teacherName || 'Faculty'})
                    </option>
                  ))}
                </select>
                <BookOpen className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
                <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Real-time Timetable Scheduled Indicator */}
              {scheduledSlot && (
                <div className="p-2.5 rounded-xl bg-[#EAF5EF] dark:bg-[#15271F] border border-[#BEE0CE] dark:border-[#1E3B2E] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2 text-[#0D3828] dark:text-emerald-200">
                    <Calendar className="w-3.5 h-3.5 text-[#13523B] dark:text-emerald-400 shrink-0" />
                    <span>
                      <strong className="font-semibold">{scheduledSlot.day} Period {selectedPeriod}:</strong>{' '}
                      <span className="font-mono font-bold text-[#13523B] dark:text-emerald-300">{scheduledSlot.subjectCode}</span> — {scheduledSlot.subjectName}{' '}
                      <span className="text-neutral-500 dark:text-neutral-400">({scheduledSlot.room || 'LH-302'}, {scheduledSlot.facultyName})</span>
                    </span>
                  </div>

                  {currentSubject.code?.toUpperCase() !== scheduledSlot.subjectCode?.toUpperCase() ? (
                    <button
                      type="button"
                      onClick={() => {
                        const match = allSelectableSubjects.find(s => 
                          s.id === scheduledSlot.subjectId || 
                          s.code?.toUpperCase() === scheduledSlot.subjectCode?.toUpperCase()
                        );
                        if (match) setSelectedSubjectId(match.id);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-[#13523B] text-white font-bold hover:bg-[#0E422F] text-[10px] shrink-0 cursor-pointer shadow-xs transition-colors"
                    >
                      Sync to Scheduled ({scheduledSlot.subjectCode})
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-[#13523B] dark:text-emerald-300 flex items-center gap-1 shrink-0 bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded-full border border-emerald-300/60 dark:border-emerald-700/60">
                      <Check className="w-3 h-3 text-[#13523B] dark:text-emerald-400" />
                      Active Timetable Subject
                    </span>
                  )}
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Day View Header Controls */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
            <div className="flex items-center gap-3">
              <div className="relative min-w-[200px]">
                <input
                  id="input_day_grid_date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>

              <span className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:inline">
                Showing all {totalPeriods} periods for {selectedDate}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-400">
                Tap any cell to cycle: <strong className="text-neutral-700 dark:text-neutral-300">—</strong> &gt; <strong className="text-emerald-600">P</strong> &gt; <strong className="text-rose-600">A</strong> &gt; <strong className="text-amber-600">OD</strong>
              </span>
            </div>
          </div>
        )}

        {/* Existing Session Alert / Notice */}
        {viewMode === 'single' && (
          <div className="mt-3">
            {isExistingSession ? (
              <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>
                    Existing records loaded for <strong>Period {selectedPeriod}</strong> ({selectedDate}). Editing will safely update only this period's ledger.
                  </span>
                </div>
                {currentUser.role === 'cr' && selectedDate !== todayStr && (
                  <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                    Past date: teacher approval required
                  </span>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-neutral-400 shrink-0" />
                <span>
                  No records yet for Period {selectedPeriod} on {selectedDate}. All students default to Present.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Single Period View Quick Action Bar & Counters */}
        {viewMode === 'single' && (
          <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200/80 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                Period {selectedPeriod}: <span className="font-bold text-neutral-900 dark:text-white">{counts.total}</span> students
              </span>
              <span className="inline-flex items-center text-emerald-700 dark:text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                {counts.present} Present
              </span>
              <span className="inline-flex items-center text-rose-700 dark:text-rose-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5" />
                {counts.absent} Absent
              </span>
              {counts.leave > 0 && (
                <span className="inline-flex items-center text-amber-700 dark:text-amber-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
                  {counts.leave} Leave (OD)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-700 dark:text-neutral-200 transition-colors"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={handleMarkAllAbsent}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-700 dark:text-neutral-200 transition-colors"
              >
                Mark All Absent
              </button>
              <div className="w-36">
                <input
                  id="input_search_fast_marking"
                  type="text"
                  placeholder="Filter student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 1: SINGLE PERIOD LIST VIEW                            */}
      {/* ========================================================= */}
      {viewMode === 'single' && (
        <div className="space-y-2">
          {filteredStudents.map((student, index) => {
            const status = statusMap[student.id] || 'present';
            const isAbsent = status === 'absent';
            const isLeave = status === 'leave';

            return (
              <div
                key={student.id}
                id={`student_row_${student.id}`}
                onClick={() => handleToggleStudent(student.id)}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none group ${
                  isAbsent
                    ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/80 hover:bg-rose-100/70'
                    : isLeave
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 hover:bg-amber-100/70'
                    : 'bg-white dark:bg-neutral-800/90 border-neutral-200/80 dark:border-neutral-700/80 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-xs'
                }`}
              >
                {/* Left Student Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-xs font-mono font-medium text-neutral-400 w-6 text-right">
                    {index + 1}.
                  </div>

                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isAbsent
                      ? 'bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200'
                      : isLeave
                      ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                      : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                  }`}>
                    {student.name.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                        {student.name}
                      </span>
                      {student.isCR && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          CR
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                      {student.rollNumber || 'No Roll #'}
                    </span>
                  </div>
                </div>

                {/* Right Status Toggle Pill Controls */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Present Button */}
                  <button
                    type="button"
                    id={`btn_present_${student.id}`}
                    onClick={(e) => handleSetExplicitStatus(student.id, 'present', e)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      status === 'present'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                    }`}
                  >
                    Present
                  </button>

                  {/* Absent Button */}
                  <button
                    type="button"
                    id={`btn_absent_${student.id}`}
                    onClick={(e) => handleSetExplicitStatus(student.id, 'absent', e)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      status === 'absent'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                    }`}
                  >
                    Absent
                  </button>

                  {/* Leave (On-Duty) Button */}
                  <button
                    type="button"
                    id={`btn_leave_${student.id}`}
                    onClick={(e) => handleSetExplicitStatus(student.id, 'leave', e)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      status === 'leave'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 hover:text-neutral-800 dark:hover:text-white'
                    }`}
                    title="Mark as Leave / On-Duty"
                  >
                    OD
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: DAY VIEW GRID (STUDENTS AS ROWS, PERIODS AS COLS) */}
      {/* ========================================================= */}
      {viewMode === 'day_grid' && (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs overflow-hidden">
          
          {/* Quick Filter in Day Grid */}
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <Grid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>
                Day Ledger: {selectedDate} ({students.length} students across {totalPeriods} periods)
              </span>
            </div>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search student in grid..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          {/* Table Container with Horizontal Scroll & Pinned Left Column */}
          <div className="overflow-x-auto relative max-h-[600px]">
            <table className="min-w-full border-collapse text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-900/90 sticky top-0 z-20 shadow-xs">
                <tr>
                  {/* Pinned Student Name Column */}
                  <th 
                    scope="col" 
                    className="sticky left-0 z-30 bg-neutral-50 dark:bg-neutral-900 px-4 py-3 min-w-[180px] sm:min-w-[220px] font-bold text-neutral-800 dark:text-neutral-200 border-r border-b border-neutral-200 dark:border-neutral-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]"
                  >
                    Student
                  </th>

                  {/* Period Columns (P1, P2, P3...) */}
                  {periodsList.map((p) => {
                    const timing = settings.dailyPeriodTimings?.[p - 1]?.time;
                    const periodSubject = getSubjectForPeriod(p);
                    return (
                      <th
                        key={p}
                        scope="col"
                        className="px-3 py-2.5 min-w-[120px] text-center border-b border-r border-neutral-200 dark:border-neutral-700"
                      >
                        <div className="flex flex-col items-center">
                          <span className="font-extrabold text-neutral-900 dark:text-white text-xs">
                            Period {p}
                          </span>
                          <span 
                            className="text-[11px] font-mono font-bold text-[#13523B] dark:text-emerald-400 truncate max-w-[110px]"
                            title={`${periodSubject.code}: ${periodSubject.name} (${periodSubject.teacherName})`}
                          >
                            {periodSubject.code}
                          </span>
                          <span className="text-[9px] text-neutral-400 truncate max-w-[110px]">
                            {periodSubject.name}
                          </span>
                          {timing && (
                            <span className="text-[10px] text-neutral-400 font-mono mt-0.5">
                              {timing.split('-')[0].trim()}
                            </span>
                          )}

                          {/* Column Shortcuts */}
                          <div className="flex items-center gap-1 mt-1.5">
                            <button
                              type="button"
                              onClick={() => handleColumnShortcut(p, 'present')}
                              title={`Mark Period ${p} all Present`}
                              className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            >
                              All P
                            </button>
                            <button
                              type="button"
                              onClick={() => handleColumnShortcut(p, 'absent')}
                              title={`Mark Period ${p} all Absent`}
                              className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            >
                              All A
                            </button>
                          </div>
                        </div>
                      </th>
                    );
                  })}

                  {/* Actions Column */}
                  <th scope="col" className="px-3 py-2.5 text-center min-w-[90px] border-b border-neutral-200 dark:border-neutral-700 font-semibold text-neutral-700 dark:text-neutral-300">
                    Row Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/60 bg-white dark:bg-neutral-800">
                {filteredStudents.map((student, sIdx) => (
                  <tr 
                    key={student.id}
                    className="hover:bg-neutral-50/70 dark:hover:bg-neutral-700/30 transition-colors"
                  >
                    {/* PINNED STUDENT COLUMN */}
                    <td className="sticky left-0 z-10 bg-white dark:bg-neutral-800 px-4 py-2.5 border-r border-neutral-200 dark:border-neutral-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-neutral-400 w-5">
                          {sIdx + 1}.
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-neutral-900 dark:text-white truncate text-xs">
                            {student.name}
                          </div>
                          <div className="text-[10px] font-mono text-neutral-400">
                            {student.rollNumber || 'No Roll #'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* PERIOD CELLS */}
                    {periodsList.map((p) => {
                      const rec = dayRecordsMap.get(`${p}_${student.id}`);
                      const status = rec ? rec.status : 'not_marked';

                      return (
                        <td
                          key={p}
                          className="px-2 py-2 text-center border-r border-neutral-200 dark:border-neutral-700"
                        >
                          <button
                            type="button"
                            id={`cell_${student.id}_p${p}`}
                            onClick={() => handleDayViewCellTap(student, p)}
                            className={`w-full py-1.5 px-2 rounded-lg font-bold text-xs transition-all select-none cursor-pointer flex items-center justify-center gap-1 ${
                              status === 'present'
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xs'
                                : status === 'absent'
                                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-2xs'
                                : status === 'leave'
                                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-2xs'
                                : 'bg-neutral-100 dark:bg-neutral-700/60 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 border border-dashed border-neutral-300 dark:border-neutral-600'
                            }`}
                            title={`Tap to cycle status for ${student.name}, Period ${p}`}
                          >
                            {status === 'present' && (
                              <>
                                <Check className="w-3 h-3" />
                                <span>P</span>
                              </>
                            )}
                            {status === 'absent' && (
                              <>
                                <X className="w-3 h-3" />
                                <span>A</span>
                              </>
                            )}
                            {status === 'leave' && (
                              <span>OD</span>
                            )}
                            {status === 'not_marked' && (
                              <span className="text-[11px]">—</span>
                            )}
                          </button>
                        </td>
                      );
                    })}

                    {/* ROW ACTION: Mark student all present */}
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRowShortcutStudentAllPresent(student)}
                        className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 transition-colors whitespace-nowrap"
                        title="Mark all periods present for this student today"
                      >
                        All Present
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>
              Pinned student column supports touch swipe on mobile devices.
            </span>
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              Changes in Day View commit immediately to each period record.
            </span>
          </div>
        </div>
      )}

      {/* Sticky Bottom Save Action Bar (Single Period View) */}
      {viewMode === 'single' && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 p-3 sm:p-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <span className="text-neutral-500 dark:text-neutral-400 hidden sm:inline">Session:</span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                {currentSubject?.code} • Period {selectedPeriod}
              </span>
              <span className="text-neutral-400">•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {counts.present}P
              </span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">
                {counts.absent}A
              </span>
              {counts.leave > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  {counts.leave}L
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn_cancel_marking"
                type="button"
                onClick={onNavigateToTable}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
              >
                View Table
              </button>

              <button
                id="btn_save_attendance_session"
                type="button"
                onClick={handleSaveSession}
                disabled={isSaving}
                className="inline-flex items-center px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-98 rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving Period {selectedPeriod}...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5" />
                    Period {selectedPeriod} Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Period {selectedPeriod} Attendance
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
