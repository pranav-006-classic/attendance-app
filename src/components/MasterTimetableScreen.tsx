import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Subject, 
  AttendanceRecord, 
  TimetableSlot, 
  UserProfile, 
  ClassroomSettings 
} from '../types';
import { DEMO_TIMETABLE, DEFAULT_SETTINGS } from '../demoData';
import { 
  fetchTimetable, 
  saveTimetable, 
  generateWeekAttendanceFromTimetable,
  saveSubject 
} from '../services/attendanceService';
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
  Sparkles, 
  Layers, 
  GripVertical, 
  Upload, 
  Image as ImageIcon, 
  Save, 
  RotateCcw, 
  Calculator, 
  Trash2, 
  Plus, 
  Edit3, 
  Check, 
  X, 
  Info, 
  Users, 
  FileSpreadsheet,
  Shuffle
} from 'lucide-react';

interface MasterTimetableScreenProps {
  currentUser: UserProfile;
  subjects: Subject[];
  students?: UserProfile[];
  attendanceRecords: AttendanceRecord[];
  settings: ClassroomSettings;
  onRefreshData?: () => Promise<void> | void;
  onNavigateToMarking?: (subjectId?: string, period?: number) => void;
  onNavigateToTable?: (subjectId?: string) => void;
}

export const MasterTimetableScreen: React.FC<MasterTimetableScreenProps> = ({
  currentUser,
  subjects,
  students = [],
  attendanceRecords,
  settings,
  onRefreshData,
  onNavigateToMarking,
  onNavigateToTable,
}) => {
  const days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
  ];

  // Guaranteed 8 periods per day
  const periodTimings = useMemo(() => {
    if (settings.dailyPeriodTimings && settings.dailyPeriodTimings.length >= 8) {
      return settings.dailyPeriodTimings.slice(0, 8);
    }
    return DEFAULT_SETTINGS.dailyPeriodTimings;
  }, [settings.dailyPeriodTimings]);

  // Timetable slots state (persisted to Firestore)
  const [slots, setSlots] = useState<TimetableSlot[]>(DEMO_TIMETABLE);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active view tab: 'all_week', 'day_focus', or 'week_calculator'
  const [activeTab, setActiveTab] = useState<'all_week' | 'day_focus' | 'week_calculator'>('all_week');
  const [selectedDay, setSelectedDay] = useState<string>('Monday');

  // Drag & drop state
  const [hoveredCell, setHoveredCell] = useState<{ day: string; period: number } | null>(null);
  const [draggedSubjectId, setDraggedSubjectId] = useState<string | null>(null);

  // Slot edit modal state
  const [editModalSlot, setEditModalSlot] = useState<{
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
    period: number;
    existing?: TimetableSlot;
  } | null>(null);
  const [editSubjectId, setEditSubjectId] = useState<string>('');
  const [editType, setEditType] = useState<'Lecture' | 'Lab' | 'Tutorial'>('Lecture');
  const [editRoom, setEditRoom] = useState<string>('LH-302');
  const [editFaculty, setEditFaculty] = useState<string>('');

  // AI Timetable Scanner Modal State
  const [isAIScannerOpen, setIsAIScannerOpen] = useState(false);
  const [scannerImageBase64, setScannerImageBase64] = useState<string | null>(null);
  const [scannerMimeType, setScannerMimeType] = useState<string>('image/png');
  const [scannerRawText, setScannerRawText] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    slots: TimetableSlot[];
    extractedSubjects: any[];
    summary: string;
  } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // 1-Week Attendance Calculator State
  const [calcWeekDate, setCalcWeekDate] = useState<string>(() => {
    // Current week's Monday in YYYY-MM-DD
    const d = new Date();
    const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mon = new Date(d);
    mon.setDate(d.getDate() + diffToMonday);
    const yyyy = mon.getFullYear();
    const mm = String(mon.getMonth() + 1).padStart(2, '0');
    const dd = String(mon.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [isSimulatingWeek, setIsSimulatingWeek] = useState(false);
  const [simulationMode, setSimulationMode] = useState<'realistic' | 'all_present'>('realistic');
  const [simulationResult, setSimulationResult] = useState<{ sessions: number; records: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canEdit = currentUser.role === 'teacher' || currentUser.role === 'cr';

  // Load timetable from Firestore on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const savedSlots = await fetchTimetable();
        if (mounted && savedSlots && savedSlots.length > 0) {
          setSlots(savedSlots);
        }
      } catch (err) {
        console.warn('Could not load timetable from Firestore, using default:', err);
      } finally {
        if (mounted) setIsInitialLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Save changes to Firestore and Local Storage
  const persistSlots = async (newSlots: TimetableSlot[], toastMsg?: string) => {
    setSlots(newSlots);
    setIsSaving(true);
    try {
      await saveTimetable(newSlots, currentUser.id);
      setHasUnsavedChanges(false);
      setSaveSuccess(true);
      if (toastMsg) showToast(toastMsg);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      console.warn('Timetable cloud sync error:', err);
      // LocalStorage was still updated inside saveTimetable
      setHasUnsavedChanges(true);
      if (toastMsg) showToast(toastMsg + ' (saved locally)');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTimetable = async () => {
    await persistSlots(slots, 'Timetable saved and synchronized to cloud!');
  };

  // Drag and Drop handlers
  const handleDragStartFromSubject = (e: React.DragEvent, sub: Subject) => {
    if (!canEdit) return;
    setDraggedSubjectId(sub.id);
    e.dataTransfer.effectAllowed = 'copyMove';
    e.dataTransfer.setData('application/json', JSON.stringify({
      kind: 'SUBJECT',
      subjectId: sub.id,
      code: sub.code,
      name: sub.name,
      teacher: sub.teacherName || '',
      room: sub.roomNumber || 'LH-302',
    }));
  };

  const handleDragStartFromSlot = (e: React.DragEvent, fromDay: string, fromPeriod: number) => {
    if (!canEdit) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      kind: 'MOVE_SLOT',
      fromDay,
      fromPeriod,
    }));
  };

  const handleDragStartSpecial = (e: React.DragEvent, kind: 'CLEAR' | 'LAB' | 'TUTORIAL') => {
    if (!canEdit) return;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({ kind }));
  };

  const handleDragOver = (e: React.DragEvent, day: string, period: number) => {
    if (!canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (hoveredCell?.day !== day || hoveredCell?.period !== period) {
      setHoveredCell({ day, period });
    }
  };

  const handleDragLeave = () => {
    setHoveredCell(null);
  };

  const handleDrop = (e: React.DragEvent, targetDay: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday', targetPeriod: number) => {
    if (!canEdit) return;
    e.preventDefault();
    setHoveredCell(null);
    setDraggedSubjectId(null);

    try {
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;
      const data = JSON.parse(raw);

      if (data.kind === 'CLEAR') {
        // Remove slot and auto-persist
        const updated = slots.filter(s => !(s.day === targetDay && s.period === targetPeriod));
        persistSlots(updated, `Cleared Period ${targetPeriod} on ${targetDay}`);
        return;
      }

      if (data.kind === 'SUBJECT') {
        // Find existing subject for rich details
        const sub = subjects.find(s => s.id === data.subjectId);
        const newSlot: TimetableSlot = {
          day: targetDay,
          period: targetPeriod,
          subjectId: data.subjectId,
          subjectCode: data.code || sub?.code || 'GEN',
          subjectName: data.name || sub?.name || 'Class Session',
          facultyName: data.teacher || sub?.teacherName || currentUser.name,
          room: data.room || sub?.roomNumber || 'LH-302',
          type: targetPeriod >= 6 ? 'Lab' : 'Lecture',
        };

        const filtered = slots.filter(s => !(s.day === targetDay && s.period === targetPeriod));
        const updated = [...filtered, newSlot];
        persistSlots(updated, `Assigned ${newSlot.subjectCode} to ${targetDay} Period ${targetPeriod}`);
        return;
      }

      if (data.kind === 'MOVE_SLOT') {
        const { fromDay, fromPeriod } = data;
        if (fromDay === targetDay && fromPeriod === targetPeriod) return;

        const sourceSlot = slots.find(s => s.day === fromDay && s.period === fromPeriod);
        const targetSlot = slots.find(s => s.day === targetDay && s.period === targetPeriod);

        const filtered = slots.filter(s => 
          !(s.day === fromDay && s.period === fromPeriod) &&
          !(s.day === targetDay && s.period === targetPeriod)
        );

        const updated: TimetableSlot[] = [...filtered];

        if (sourceSlot) {
          updated.push({
            ...sourceSlot,
            day: targetDay,
            period: targetPeriod,
          });
        }

        if (targetSlot) {
          // Swap
          updated.push({
            ...targetSlot,
            day: fromDay,
            period: fromPeriod,
          });
        }

        persistSlots(updated, `Moved period to ${targetDay} Period ${targetPeriod}`);
      }
    } catch (err) {
      console.warn('Drop error:', err);
    }
  };

  // Open slot editor
  const handleOpenEditSlot = (day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday', period: number) => {
    if (!canEdit) return;
    const existing = slots.find(s => s.day === day && s.period === period);
    setEditModalSlot({ day, period, existing });
    setEditSubjectId(existing?.subjectId || subjects[0]?.id || '');
    setEditType(existing?.type || (period >= 6 ? 'Lab' : 'Lecture'));
    setEditRoom(existing?.room || 'LH-302');
    setEditFaculty(existing?.facultyName || subjects[0]?.teacherName || '');
  };

  const handleSaveSlotEdit = () => {
    if (!editModalSlot) return;
    const { day, period } = editModalSlot;

    const sub = subjects.find(s => s.id === editSubjectId);
    const newSlot: TimetableSlot = {
      day,
      period,
      subjectId: editSubjectId || (sub ? sub.id : 'sub_custom'),
      subjectCode: sub?.code || 'GEN',
      subjectName: sub?.name || 'Class Session',
      facultyName: editFaculty || sub?.teacherName || currentUser.name,
      room: editRoom || 'LH-302',
      type: editType,
    };

    const filtered = slots.filter(s => !(s.day === day && s.period === period));
    const updated = [...filtered, newSlot];

    setEditModalSlot(null);
    persistSlots(updated, `Updated and saved ${day} Period ${period}`);
  };

  const handleClearCurrentSlot = () => {
    if (!editModalSlot) return;
    const { day, period } = editModalSlot;
    const updated = slots.filter(s => !(s.day === day && s.period === period));
    setEditModalSlot(null);
    persistSlots(updated, `Slot cleared for ${day} Period ${period}`);
  };

  // Reset timetable to default 8 periods
  const handleResetTimetable = () => {
    if (window.confirm('Reset timetable back to the standard 8-period semester curriculum? Unsaved edits will be replaced.')) {
      persistSlots(DEMO_TIMETABLE, 'Timetable reset to standard 8-period schedule.');
    }
  };

  // AI Scanner handlers
  const handleImageFileSelect = (file: File) => {
    if (!file) return;
    setScannerMimeType(file.type || 'image/png');
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setScannerImageBase64(base64);
      setScanError(null);
      setScanResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRunAIScan = async () => {
    if (!scannerImageBase64 && !scannerRawText.trim()) {
      setScanError('Please select a timetable image or paste text schedule.');
      return;
    }

    setIsScanning(true);
    setScanError(null);

    try {
      const res = await fetch('/api/ai/parse-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: scannerImageBase64,
          mimeType: scannerMimeType,
          rawText: scannerRawText,
          existingSubjects: subjects.map(s => ({ id: s.id, code: s.code, name: s.name, teacherName: s.teacherName, room: s.roomNumber })),
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setScanResult(data.data);
      } else {
        setScanError(data.message || 'AI Timetable analysis was unable to parse the schedule.');
      }
    } catch (err: any) {
      setScanError('Network error while analyzing timetable: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyScanResult = async () => {
    if (!scanResult || !scanResult.slots || scanResult.slots.length === 0) return;

    // Apply parsed slots and auto-persist to Firestore & local storage
    await persistSlots(scanResult.slots, `Applied and saved ${scanResult.slots.length} AI-parsed class slots across 8 periods!`);

    setIsAIScannerOpen(false);
    setScanResult(null);
    setScannerImageBase64(null);
    setScannerRawText('');
  };

  // 1-Week Attendance Simulation & Calculation Handler
  const handleSimulateWeekAttendance = async () => {
    if (!students || students.length === 0) {
      alert('No students found in classroom roster. Please add students first via Classroom Manager.');
      return;
    }

    setIsSimulatingWeek(true);
    try {
      const result = await generateWeekAttendanceFromTimetable({
        weekMondayDate: calcWeekDate,
        slots,
        students,
        subjects,
        user: currentUser,
        mode: simulationMode,
      });

      setSimulationResult({
        sessions: result.createdSessions,
        records: result.createdRecords,
      });

      showToast(`Generated 1 week of attendance: ${result.createdSessions} sessions and ${result.createdRecords} student attendance records!`);
      if (onRefreshData) {
        await onRefreshData();
      }
    } catch (err: any) {
      alert('Failed to generate weekly attendance: ' + err.message);
    } finally {
      setIsSimulatingWeek(false);
    }
  };

  // Calculate 1-Week Attendance Statistics based on Timetable
  const weekTimetableMetrics = useMemo(() => {
    // 1. Count scheduled periods per subject in the active 8-period timetable
    const scheduledPerSubject: Record<string, number> = {};
    let totalScheduledWeekPeriods = 0;

    slots.forEach(slot => {
      if (!slot.subjectName || slot.subjectName.toLowerCase().includes('free period')) return;
      scheduledPerSubject[slot.subjectId] = (scheduledPerSubject[slot.subjectId] || 0) + 1;
      totalScheduledWeekPeriods++;
    });

    // 2. Determine dates for the chosen Monday to Friday
    const [y, m, d] = calcWeekDate.split('-').map(Number);
    const weekDates: string[] = [];
    for (let i = 0; i < 5; i++) {
      const cur = new Date(y, m - 1, d + i);
      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, '0');
      const dd = String(cur.getDate()).padStart(2, '0');
      weekDates.push(`${yyyy}-${mm}-${dd}`);
    }

    const weekDatesSet = new Set(weekDates);

    // 3. Filter existing attendance records that fall within this week
    const weekRecords = attendanceRecords.filter(r => weekDatesSet.has(r.date));
    const markedSessions = new Set<string>();
    weekRecords.forEach(r => markedSessions.add(`${r.date}_p${r.period}_${r.subjectId}`));

    // 4. Per-student metrics for this week
    const studentBreakdown = students.map(student => {
      const stRecords = weekRecords.filter(r => r.studentId === student.id);
      const attended = stRecords.filter(r => r.status === 'present' || r.status === 'leave').length;
      const totalRecorded = stRecords.length;
      const pct = totalRecorded > 0 ? Math.round((attended / totalRecorded) * 100) : 0;
      const isDeficit = totalRecorded > 0 && pct < (settings.minimumAttendancePercentage || 75);

      return {
        student,
        attended,
        totalRecorded,
        pct,
        isDeficit,
      };
    });

    const totalStudentsAttended = weekRecords.filter(r => r.status === 'present' || r.status === 'leave').length;
    const overallWeekPct = weekRecords.length > 0 
      ? Math.round((totalStudentsAttended / weekRecords.length) * 100) 
      : 0;

    return {
      weekDates,
      totalScheduledWeekPeriods,
      scheduledPerSubject,
      markedSessionCount: markedSessions.size,
      totalRecordsInWeek: weekRecords.length,
      overallWeekPct,
      studentBreakdown,
    };
  }, [slots, calcWeekDate, attendanceRecords, students, settings]);

  // General subject stats for breakdown cards
  const subjectStats = useMemo(() => {
    return subjects.map((sub) => {
      const subRecords = attendanceRecords.filter((r) => r.subjectId === sub.id);
      const studentRecords = currentUser.role === 'student' 
        ? subRecords.filter((r) => r.studentId === currentUser.id)
        : subRecords;

      const uniqueSessions = new Set<string>();
      studentRecords.forEach((r) => uniqueSessions.add(`${r.date}_p${r.period}`));
      const totalHeld = currentUser.role === 'student' ? studentRecords.length : uniqueSessions.size;

      const attended = currentUser.role === 'student'
        ? studentRecords.filter((r) => r.status === 'present' || r.status === 'leave').length
        : subRecords.filter((r) => r.status === 'present' || r.status === 'leave').length;

      const totalPossible = currentUser.role === 'student' ? totalHeld : (totalHeld * Math.max(1, students.length));
      const pct = totalPossible > 0 ? Math.round((attended / totalPossible) * 100) : 100;
      const minThreshold = settings.minimumAttendancePercentage || 75;
      const isCritical = pct < minThreshold;

      let safeMargin = 0;
      let needClasses = 0;
      if (totalHeld > 0) {
        if (pct >= minThreshold) {
          safeMargin = Math.max(0, Math.floor((attended - (minThreshold / 100) * totalHeld) / (minThreshold / 100)));
        } else {
          needClasses = Math.ceil(((minThreshold / 100) * totalHeld - attended) / (1 - minThreshold / 100));
        }
      }

      // Scheduled in active timetable
      const periodsInTimetable = slots.filter(s => s.subjectId === sub.id).length;

      return {
        ...sub,
        totalHeld,
        attended,
        pct,
        isCritical,
        safeMargin,
        needClasses,
        periodsInTimetable,
      };
    });
  }, [subjects, attendanceRecords, currentUser, settings, slots, students]);

  const criticalCount = subjectStats.filter((s) => s.isCritical).length;

  return (
    <div id="master_timetable_screen" className="space-y-7 pb-16 font-sans">
      {/* Toast message alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#13523B] text-white px-4 py-2.5 rounded-xl shadow-lg border border-emerald-400/40 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Academic Ledger Header Banner */}
      <div className="bg-[#FAF9F5] dark:bg-[#151B18] border border-[#E6E3D8] dark:border-[#28332E] rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#13523B]/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-[11px] font-semibold font-mono tracking-wider uppercase bg-[#EAF5EF] text-[#13523B] dark:bg-[#13523B]/30 dark:text-emerald-300 rounded-md border border-[#BEE0CE] dark:border-emerald-800">
                {settings.department || 'Computer Science & Engineering'}
              </span>
              <span className="text-xs text-neutral-400 font-mono">• {settings.academicTermName || 'Semester VII'}</span>
              <span className="px-2 py-0.5 text-[10px] font-bold font-mono uppercase bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800">
                8 Periods / Day
              </span>
              {isSaving ? (
                <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                  Saving...
                </span>
              ) : saveSuccess ? (
                <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Saved
                </span>
              ) : hasUnsavedChanges ? (
                <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-800">
                  Unsynced Edits
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-medium font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/80 rounded border border-neutral-200 dark:border-neutral-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Synced
                </span>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold font-serif text-[#0D3828] dark:text-[#E8EFEA] tracking-tight">
              Master Timetable & Curriculum Matrix
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1 max-w-2xl font-light">
              Drag-and-drop subject scheduling across 8 daily periods, auto-saved to cloud & local storage with AI scanning.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* AI Image Scan Timetable Button */}
            {canEdit && (
              <button
                id="btn_ai_scan_timetable"
                onClick={() => setIsAIScannerOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-[#13523B] hover:from-emerald-700 hover:to-[#0E422F] text-white shadow-sm shadow-emerald-900/20 transition-all cursor-pointer"
                title="Upload photo of timetable to let AI extract schedule"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>AI Timetable Scanner</span>
              </button>
            )}

            {/* 1-Week Attendance Calculator */}
            <button
              id="btn_open_week_calculator"
              onClick={() => setActiveTab('week_calculator')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                activeTab === 'week_calculator'
                  ? 'bg-[#13523B] text-white border-[#13523B]'
                  : 'bg-white dark:bg-[#1C2420] text-neutral-700 dark:text-neutral-200 border-[#E6E3D8] dark:border-[#28332E] hover:bg-[#F2EFE8]'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-amber-500" />
              <span>Week Attendance Calc</span>
            </button>

            {/* Save Timetable Button */}
            {canEdit && (
              <button
                id="btn_save_timetable"
                onClick={handleSaveTimetable}
                disabled={isSaving}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer ${
                  hasUnsavedChanges
                    ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                    : 'bg-white dark:bg-[#1C2420] text-neutral-700 dark:text-neutral-200 border border-[#E6E3D8] dark:border-[#28332E] hover:bg-[#F2EFE8]'
                }`}
                title="Save current timetable to cloud database"
              >
                <Save className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isSaving ? 'Syncing...' : hasUnsavedChanges ? 'Save Changes' : 'Synced'}</span>
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-[#1C2420] text-neutral-700 dark:text-neutral-200 border border-[#E6E3D8] dark:border-[#28332E] hover:bg-[#F2EFE8] dark:hover:bg-[#232C27] transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-500" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* 4 Architectural Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-[#E6E3D8] dark:border-[#28332E]">
          <div className="bg-white/80 dark:bg-[#1A221E]/90 p-3.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E]">
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">Curriculum Subjects</div>
            <div className="text-2xl font-bold font-serif text-[#0D3828] dark:text-white mt-0.5">
              {subjects.length} <span className="text-xs font-sans font-normal text-neutral-400">Active</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-1 font-mono">Draggable in Matrix</div>
          </div>

          <div className="bg-white/80 dark:bg-[#1A221E]/90 p-3.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E]">
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">Scheduled Weekly Periods</div>
            <div className="text-2xl font-bold font-serif text-[#13523B] dark:text-emerald-400 mt-0.5">
              {slots.length} <span className="text-xs font-sans font-normal text-neutral-400">/ 40 Max</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-1 font-mono">5 Days × 8 Periods/Day</div>
          </div>

          <div className="bg-white/80 dark:bg-[#1A221E]/90 p-3.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E]">
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">Attendance Threshold</div>
            <div className="text-2xl font-bold font-serif text-neutral-900 dark:text-white mt-0.5">
              {settings.minimumAttendancePercentage || 75}% <span className="text-xs font-sans font-normal text-neutral-400">Mandatory</span>
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono">Academic Regulation 12.B</div>
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
              {criticalCount > 0 ? `${criticalCount} In Deficit` : 'All Clear'}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1 font-mono">
              {criticalCount > 0 ? 'Action needed to reach 75%' : 'Meeting University Standards'}
            </div>
          </div>
        </div>
      </div>

      {/* DRAGGABLE SUBJECTS PALETTE (Visible to Teacher & CR) */}
      {canEdit && (
        <div id="subject_drag_palette" className="bg-[#FAF9F5] dark:bg-[#171E1A] rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#13523B] dark:text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0D3828] dark:text-emerald-300 font-mono">
                Draggable Subjects Palette — Drag into Timetable Slots Below
              </h3>
            </div>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Tip: Drag any subject chip into an 8-period cell, or drag slots inside the grid to rearrange them.
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1">
            {/* Draggable Free Period / Clear Eraser */}
            <div
              draggable
              onDragStart={(e) => handleDragStartSpecial(e, 'CLEAR')}
              className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-dashed border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 cursor-grab active:cursor-grabbing hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0 shadow-2xs transition-all"
              title="Drag onto any slot to clear it"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Slot (Free)</span>
            </div>

            {/* Render each edited subject as a draggable card */}
            {subjects.map((sub) => (
              <div
                key={sub.id}
                draggable
                onDragStart={(e) => handleDragStartFromSubject(e, sub)}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1E2621] border border-[#BEE0CE] dark:border-emerald-800/60 hover:border-[#13523B] text-xs font-semibold flex items-center gap-2 cursor-grab active:cursor-grabbing hover:shadow-xs shrink-0 transition-all"
              >
                <GripVertical className="w-3.5 h-3.5 text-neutral-400" />
                <span className="font-mono font-bold text-[#13523B] dark:text-emerald-300 bg-[#EAF5EF] dark:bg-[#13523B]/30 px-1.5 py-0.5 rounded text-[10px]">
                  {sub.code}
                </span>
                <span className="text-neutral-900 dark:text-white truncate max-w-[140px]">
                  {sub.name}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {sub.roomNumber || 'LH-302'}
                </span>
              </div>
            ))}

            {/* If zero subjects configured */}
            {subjects.length === 0 && (
              <div className="text-xs text-neutral-500 italic py-1">
                No custom subjects yet. Add subjects in Classroom Manager, or use AI Timetable Scanner above to generate them automatically!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Timetable View or Week Calculator Tab */}
      <div className="bg-white dark:bg-[#171E1A] rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] p-5 shadow-xs">
        {/* Navigation tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E3D8] dark:border-[#28332E]">
          <div>
            <h2 className="text-base font-bold font-serif text-[#0D3828] dark:text-[#E8EFEA] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#13523B]" />
              {activeTab === 'week_calculator' 
                ? '1-Week Attendance Calculator & Timetable Ledger' 
                : 'Weekly Master Lecture Matrix (8 Periods)'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {activeTab === 'week_calculator'
                ? 'Calculate and generate 1-week attendance records from scheduled timetable lectures'
                : 'All 8 daily periods from 09:00 AM to 05:05 PM • Drag subjects to reorder slots'}
            </p>
          </div>

          {/* View switcher buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-[#FAF9F5] dark:bg-[#1E2722] rounded-xl border border-[#E6E3D8] dark:border-[#28332E] flex-wrap">
            <button
              onClick={() => setActiveTab('all_week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'all_week'
                  ? 'bg-[#13523B] text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              Full 8-Period Matrix
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
            <button
              onClick={() => setActiveTab('week_calculator')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'week_calculator'
                  ? 'bg-[#13523B] text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Week Calculator</span>
            </button>
          </div>
        </div>

        {/* TAB 1: FULL 8-PERIOD WEEK MATRIX */}
        {activeTab === 'all_week' && (
          <div className="mt-4 overflow-x-auto">
            <div className="flex items-center justify-between pb-3 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="font-mono">8 Academic Periods per Day • Drag & Drop Enabled</span>
              {canEdit && (
                <button
                  onClick={handleResetTimetable}
                  className="text-[11px] text-neutral-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to standard curriculum</span>
                </button>
              )}
            </div>

            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-[#FAF9F5] dark:bg-[#1A221E] text-neutral-600 dark:text-neutral-400 text-[11px] font-mono border-b border-[#E6E3D8] dark:border-[#28332E]">
                  <th className="py-3 px-3 font-bold uppercase tracking-wider w-24">Day</th>
                  {periodTimings.map((pt) => (
                    <th key={pt.period} className="py-3 px-2 font-medium border-l border-[#E6E3D8] dark:border-[#28332E] text-center w-[120px]">
                      <div className="font-bold text-[#13523B] dark:text-emerald-400">Period {pt.period}</div>
                      <div className="text-[9px] text-neutral-400 font-mono tracking-tight">{pt.time.replace(/ - /g, '–')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E3D8] dark:divide-[#28332E] text-xs">
                {days.map((day) => {
                  const daySlots = slots.filter((s) => s.day === day);
                  return (
                    <tr key={day} className="hover:bg-[#FAF9F5]/60 dark:hover:bg-[#1B231F]/40 transition-colors">
                      <td className="py-3 px-3 font-serif font-bold text-[#0D3828] dark:text-white bg-[#FAF9F5]/40 dark:bg-[#161D19] align-top">
                        {day}
                      </td>

                      {periodTimings.map((pt) => {
                        const slot = daySlots.find((s) => s.period === pt.period);
                        const isHovered = hoveredCell?.day === day && hoveredCell?.period === pt.period;

                        if (!slot) {
                          return (
                            <td 
                              key={pt.period}
                              onDragOver={(e) => handleDragOver(e, day, pt.period)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, day, pt.period)}
                              onClick={() => handleOpenEditSlot(day, pt.period)}
                              className={`py-2 px-1.5 border-l border-[#E6E3D8] dark:border-[#28332E] text-center transition-all ${
                                isHovered 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500 ring-2 ring-emerald-400/40' 
                                  : 'bg-neutral-50/40 dark:bg-neutral-900/20 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40'
                              } cursor-pointer`}
                            >
                              <div className="min-h-[72px] flex flex-col items-center justify-center text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 rounded-lg border border-dashed border-transparent hover:border-neutral-300">
                                <Plus className="w-3.5 h-3.5 mb-0.5 opacity-50" />
                                <span className="text-[10px]">Free</span>
                              </div>
                            </td>
                          );
                        }

                        const isLab = slot.type === 'Lab';
                        const isTutorial = slot.type === 'Tutorial';

                        return (
                          <td 
                            key={pt.period}
                            onDragOver={(e) => handleDragOver(e, day, pt.period)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, day, pt.period)}
                            className={`py-1.5 px-1.5 border-l border-[#E6E3D8] dark:border-[#28332E] align-top transition-all ${
                              isHovered ? 'bg-emerald-100/60 dark:bg-emerald-950/80 ring-2 ring-emerald-500' : ''
                            }`}
                          >
                            <div 
                              draggable={canEdit}
                              onDragStart={(e) => handleDragStartFromSlot(e, day, pt.period)}
                              onClick={() => handleOpenEditSlot(day, pt.period)}
                              className={`p-2 rounded-xl transition-all border group relative ${
                                isLab 
                                  ? 'bg-[#FEF8ED] dark:bg-[#2A2113] border-[#FBE3B5] dark:border-[#42341D] hover:border-[#D9822B]' 
                                  : isTutorial
                                  ? 'bg-neutral-50 dark:bg-[#202722] border-[#E6E3D8] dark:border-[#2C3730] hover:border-neutral-400'
                                  : 'bg-[#EAF5EF] dark:bg-[#142A1E] border-[#BEE0CE] dark:border-[#1F4531] hover:border-[#13523B]'
                              } cursor-pointer shadow-2xs hover:shadow-xs`}
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
                                <span className="truncate max-w-[55px]">{slot.facultyName.split(' ').slice(-1)[0]}</span>
                              </div>

                              {/* Hover drag cue */}
                              {canEdit && (
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 bg-white/80 dark:bg-neutral-800 rounded">
                                  <GripVertical className="w-2.5 h-2.5 text-neutral-400" />
                                </div>
                              )}
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
        )}

        {/* TAB 2: DAY FOCUS DETAIL VIEW */}
        {activeTab === 'day_focus' && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    selectedDay === day
                      ? 'bg-[#13523B] text-white shadow-xs'
                      : 'bg-[#FAF9F5] dark:bg-[#1D2521] text-neutral-700 dark:text-neutral-300 border border-[#E6E3D8] dark:border-[#28332E] hover:bg-[#F2EFE8]'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="text-xs font-bold uppercase tracking-wider text-[#13523B] dark:text-emerald-400 font-mono pt-2">
              All 8 Periods for {selectedDay}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {periodTimings.map((pt) => {
                const slot = slots.find((s) => s.day === selectedDay && s.period === pt.period);

                if (!slot) {
                  return (
                    <div
                      key={pt.period}
                      onClick={() => handleOpenEditSlot(selectedDay as any, pt.period)}
                      className="p-4 rounded-xl border border-dashed border-[#E6E3D8] dark:border-[#28332E] bg-neutral-50/50 dark:bg-neutral-900/30 hover:bg-white dark:hover:bg-neutral-800/60 cursor-pointer flex flex-col justify-between transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                            Period {pt.period}
                          </span>
                          <span className="font-mono text-neutral-400 text-[11px]">{pt.time}</span>
                        </div>
                        <div className="text-neutral-400 text-xs py-4 text-center">
                          + Assign Subject
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={pt.period}
                    className="p-4 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-[#FAF9F5] dark:bg-[#19221D] flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-[#13523B] text-white">
                          Period {slot.period}
                        </span>
                        <span className="font-mono text-neutral-500 text-[11px]">
                          {pt.time}
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

                    <div className="mt-4 pt-3 border-t border-[#E6E3D8] dark:border-[#28332E] flex items-center gap-2">
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEditSlot(selectedDay as any, slot.period)}
                          className="flex-1 py-1.5 px-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-center"
                        >
                          Edit
                        </button>
                      )}
                      {onNavigateToMarking && (
                        <button
                          onClick={() => onNavigateToMarking(slot.subjectId, slot.period)}
                          className="flex-1 py-1.5 px-2 text-xs font-bold text-[#13523B] dark:text-emerald-400 bg-[#EAF5EF] dark:bg-[#14291F] hover:bg-[#D4EBDD] rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <span>Mark</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: 1-WEEK ATTENDANCE CALCULATOR */}
        {activeTab === 'week_calculator' && (
          <div id="week_attendance_calculator_tab" className="mt-4 space-y-6">
            {/* Week Selector & Simulator Banner */}
            <div className="p-4 rounded-xl bg-[#FAF9F5] dark:bg-[#1B231F] border border-[#E6E3D8] dark:border-[#28332E] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider font-mono mb-1">
                  Select Week for Calculation:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={calcWeekDate}
                    onChange={(e) => setCalcWeekDate(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-xs font-mono text-neutral-800 dark:text-neutral-200"
                  />
                  <span className="text-xs text-neutral-500">
                    Week Range: {weekTimetableMetrics.weekDates[0]} to {weekTimetableMetrics.weekDates[4]}
                  </span>
                </div>
              </div>

              {canEdit && (
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={simulationMode}
                    onChange={(e: any) => setSimulationMode(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-xs font-medium"
                  >
                    <option value="realistic">Realistic Attendance (92-96% Present)</option>
                    <option value="all_present">100% Full Attendance (All Present)</option>
                  </select>

                  <button
                    id="btn_auto_record_week"
                    onClick={handleSimulateWeekAttendance}
                    disabled={isSimulatingWeek}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-[#13523B] hover:bg-[#0E422F] text-white shadow-sm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>{isSimulatingWeek ? 'Recording Week...' : 'Auto-Record 1 Week from Timetable'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Weekly Timetable Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-[#1A221E]">
                <div className="text-[11px] text-neutral-500 font-medium">Timetable Periods in Week</div>
                <div className="text-2xl font-serif font-bold text-[#0D3828] dark:text-white mt-1">
                  {weekTimetableMetrics.totalScheduledWeekPeriods}
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Across Mon – Fri (8 periods/day)</div>
              </div>

              <div className="p-4 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-[#1A221E]">
                <div className="text-[11px] text-neutral-500 font-medium">Sessions Marked This Week</div>
                <div className="text-2xl font-serif font-bold text-[#13523B] dark:text-emerald-400 mt-1">
                  {weekTimetableMetrics.markedSessionCount} <span className="text-xs text-neutral-400">/ {weekTimetableMetrics.totalScheduledWeekPeriods}</span>
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  {weekTimetableMetrics.markedSessionCount === weekTimetableMetrics.totalScheduledWeekPeriods 
                    ? 'All scheduled classes recorded!' 
                    : `${weekTimetableMetrics.totalScheduledWeekPeriods - weekTimetableMetrics.markedSessionCount} remaining`}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-[#1A221E]">
                <div className="text-[11px] text-neutral-500 font-medium">Weekly Class Attendance Rate</div>
                <div className={`text-2xl font-serif font-bold mt-1 ${
                  weekTimetableMetrics.overallWeekPct >= (settings.minimumAttendancePercentage || 75)
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {weekTimetableMetrics.totalRecordsInWeek > 0 ? `${weekTimetableMetrics.overallWeekPct}%` : 'No Records Yet'}
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  {weekTimetableMetrics.totalRecordsInWeek} total student responses
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-[#1A221E]">
                <div className="text-[11px] text-neutral-500 font-medium">Enrolled Students Roster</div>
                <div className="text-2xl font-serif font-bold text-neutral-900 dark:text-white mt-1">
                  {students.length} <span className="text-xs text-neutral-400">Students</span>
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Tracked for compliance</div>
              </div>
            </div>

            {/* Subject Scheduled Hours Table */}
            <div className="border border-[#E6E3D8] dark:border-[#28332E] rounded-xl overflow-hidden">
              <div className="bg-[#FAF9F5] dark:bg-[#1A221E] px-4 py-2.5 border-b border-[#E6E3D8] dark:border-[#28332E] text-xs font-bold text-[#0D3828] dark:text-emerald-300 font-mono">
                Scheduled Periods in 1 Week (From Active 8-Period Timetable)
              </div>
              <div className="divide-y divide-[#E6E3D8] dark:divide-[#28332E] text-xs">
                {subjects.map((sub) => {
                  const scheduledPeriods = weekTimetableMetrics.scheduledPerSubject[sub.id] || 0;
                  return (
                    <div key={sub.id} className="p-3.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold px-2 py-0.5 bg-[#EAF5EF] dark:bg-emerald-950/60 text-[#13523B] dark:text-emerald-400 rounded text-[11px]">
                          {sub.code}
                        </span>
                        <span className="font-semibold text-neutral-900 dark:text-white">{sub.name}</span>
                        <span className="text-neutral-400 text-[11px]">({sub.teacherName})</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-neutral-700 dark:text-neutral-300 font-bold">
                          {scheduledPeriods} Periods / Week
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Student Weekly Attendance Ledger */}
            {students.length > 0 && (
              <div className="border border-[#E6E3D8] dark:border-[#28332E] rounded-xl overflow-hidden">
                <div className="bg-[#FAF9F5] dark:bg-[#1A221E] px-4 py-2.5 border-b border-[#E6E3D8] dark:border-[#28332E] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0D3828] dark:text-emerald-300 font-mono">
                    Student-by-Student Calculated Attendance for Week
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Threshold: {settings.minimumAttendancePercentage || 75}%
                  </span>
                </div>

                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-50 dark:bg-neutral-800/80 text-neutral-500 font-mono text-[11px] border-b border-neutral-200 dark:border-neutral-700 sticky top-0">
                        <th className="py-2.5 px-3">Roll #</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3 text-center">Periods Attended</th>
                        <th className="py-2.5 px-3 text-center">Total Sessions Marked</th>
                        <th className="py-2.5 px-3 text-center">Weekly Attendance %</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
                      {weekTimetableMetrics.studentBreakdown.map(({ student, attended, totalRecorded, pct, isDeficit }) => (
                        <tr key={student.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30">
                          <td className="py-2.5 px-3 font-bold text-[#13523B] dark:text-emerald-400">
                            {student.rollNumber || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-sans font-medium text-neutral-900 dark:text-white">
                            {student.name}
                          </td>
                          <td className="py-2.5 px-3 text-center text-neutral-700 dark:text-neutral-300">
                            {attended}
                          </td>
                          <td className="py-2.5 px-3 text-center text-neutral-500">
                            {totalRecorded}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold">
                            <span className={pct >= 75 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                              {totalRecorded > 0 ? `${pct}%` : '—'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {totalRecorded === 0 ? (
                              <span className="text-[10px] text-neutral-400 font-sans">Unrecorded</span>
                            ) : isDeficit ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Low (&lt;75%)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                In Good Standing
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
                        {sub.periodsInTimetable} Periods in Matrix
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
                {canEdit && onNavigateToMarking && (
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

      {/* SLOT EDIT MODAL */}
      {editModalSlot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  Configure Slot: {editModalSlot.day} — Period {editModalSlot.period}
                </h3>
                <span className="text-xs text-neutral-500 font-mono">
                  {periodTimings.find(p => p.period === editModalSlot.period)?.time || ''}
                </span>
              </div>
              <button
                onClick={() => setEditModalSlot(null)}
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Subject Course:
                </label>
                <select
                  value={editSubjectId}
                  onChange={(e) => {
                    setEditSubjectId(e.target.value);
                    const matched = subjects.find(s => s.id === e.target.value);
                    if (matched) {
                      setEditFaculty(matched.teacherName || '');
                      setEditRoom(matched.roomNumber || 'LH-302');
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name} ({s.teacherName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Session Type:
                  </label>
                  <select
                    value={editType}
                    onChange={(e: any) => setEditType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  >
                    <option value="Lecture">Lecture</option>
                    <option value="Lab">Lab (Practical)</option>
                    <option value="Tutorial">Tutorial</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Room / Lab Venue:
                  </label>
                  <input
                    type="text"
                    value={editRoom}
                    onChange={(e) => setEditRoom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                    placeholder="LH-302 or Lab 2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Faculty Name:
                </label>
                <input
                  type="text"
                  value={editFaculty}
                  onChange={(e) => setEditFaculty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  placeholder="Prof. or Dr."
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={handleClearCurrentSlot}
                className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
              >
                Clear Slot
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalSlot(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSlotEdit}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#13523B] hover:bg-[#0E422F] rounded-xl shadow-xs"
                >
                  Save Slot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI TIMETABLE SCANNER MODAL */}
      {isAIScannerOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#13523B] dark:text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white font-serif">
                    AI Timetable Scanner (Photo & Schedule Parser)
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Upload a picture or document of your class timetable to automatically populate the 8-period weekly matrix.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAIScannerOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Upload or Drop Area */}
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#BEE0CE] dark:border-emerald-800/60 rounded-2xl p-6 text-center cursor-pointer hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFileSelect(file);
                  }}
                />

                {scannerImageBase64 ? (
                  <div className="space-y-3">
                    <img 
                      src={scannerImageBase64} 
                      alt="Timetable upload preview" 
                      className="max-h-48 mx-auto rounded-xl shadow-xs border border-neutral-200"
                    />
                    <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      ✓ Image loaded. Ready for AI scanning. Click to choose a different photo.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-[#13523B] dark:text-emerald-300 mx-auto flex items-center justify-center">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      Drop a timetable photo or click to browse
                    </div>
                    <p className="text-xs text-neutral-500 font-light">
                      Supports JPG, PNG, WEBP photos of department schedules, noticeboard printouts, or phone snapshots.
                    </p>
                  </div>
                )}
              </div>

              {/* Or paste text schedule */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider font-mono mb-1">
                  Or Paste Timetable Text / Raw Schedule:
                </label>
                <textarea
                  rows={3}
                  value={scannerRawText}
                  onChange={(e) => setScannerRawText(e.target.value)}
                  placeholder="e.g. Monday: P1 OS, P2 DS, P3 DBMS, P4 CN, P5 Algo, P6-7 OS Lab, P8 DS Tutorial..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono text-neutral-800 dark:text-neutral-200"
                />
              </div>

              {scanError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}

              {/* Preview of Parsed Result */}
              {scanResult && (
                <div className="p-4 rounded-xl bg-[#FAF9F5] dark:bg-[#1A221E] border border-[#BEE0CE] dark:border-emerald-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#0D3828] dark:text-emerald-300 font-mono">
                      AI Analysis Success: {scanResult.slots.length} Class Slots Extracted
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">
                      8 Daily Periods Configured
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-400 italic">
                    {scanResult.summary}
                  </p>

                  <div className="max-h-40 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
                    {scanResult.slots.slice(0, 10).map((s, idx) => (
                      <div key={idx} className="py-1.5 flex items-center justify-between">
                        <span className="font-mono text-neutral-500">{s.day} P{s.period}:</span>
                        <span className="font-semibold text-neutral-900 dark:text-white">{s.subjectCode} — {s.subjectName}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">{s.room} ({s.type})</span>
                      </div>
                    ))}
                    {scanResult.slots.length > 10 && (
                      <div className="pt-1 text-[11px] text-neutral-400 text-center font-mono">
                        + {scanResult.slots.length - 10} additional scheduled periods
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsAIScannerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {!scanResult ? (
                  <button
                    type="button"
                    onClick={handleRunAIScan}
                    disabled={isScanning || (!scannerImageBase64 && !scannerRawText.trim())}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-[#13523B] hover:bg-[#0E422F] rounded-xl shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isScanning ? 'Analyzing with Gemini...' : 'Analyze Timetable with AI'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyScanResult}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Apply Parsed Timetable to Matrix</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
