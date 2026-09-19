import React, { useState, useMemo } from 'react';
import { 
  UserProfile, 
  AttendanceRecord, 
  Subject, 
  ClassroomSettings,
  AttendanceRequest 
} from '../types';
import { 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  PlusCircle, 
  Send, 
  FileText, 
  ChevronRight,
  HelpCircle,
  BarChart3,
  Flame
} from 'lucide-react';
import { submitDispute, submitLeaveRequest } from '../services/attendanceService';

interface StudentDashboardProps {
  student: UserProfile;
  records: AttendanceRecord[];
  subjects: Subject[];
  settings: ClassroomSettings;
  requests: AttendanceRequest[];
  onOpenHistory: (record: AttendanceRecord) => void;
  onRefreshData: () => void;
  onNavigateToLeaveApplication?: () => void;
  onNavigateToTimetable?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  records,
  subjects,
  settings,
  requests,
  onOpenHistory,
  onRefreshData,
  onNavigateToLeaveApplication,
  onNavigateToTimetable,
}) => {
  // Only records for this student
  const studentRecords = useMemo(() => {
    return records
      .filter(r => r.studentId === student.id)
      .sort((a, b) => b.date.localeCompare(a.date) || b.period - a.period);
  }, [records, student.id]);

  // Overall attendance statistics
  const stats = useMemo(() => {
    const total = studentRecords.length;
    let present = 0;
    let absent = 0;
    let leave = 0;

    studentRecords.forEach(r => {
      if (r.status === 'present') present++;
      else if (r.status === 'absent') absent++;
      else if (r.status === 'leave') leave++;
    });

    const attended = present + leave; // OD counts as authorized attendance
    const percentage = total > 0 ? (attended / total) * 100 : 100;
    const roundedPercentage = Math.round(percentage * 10) / 10;

    // "Safe to Skip" calculator:
    // Minimum percentage required: P_min = settings.minimumAttendancePercentage (e.g. 75)
    // Formula to stay above P_min:
    // (attended) / (total + skip) >= P_min / 100
    // attended >= (P_min / 100) * (total + skip)
    // skip <= (attended / (P_min / 100)) - total
    const pMin = (settings.minimumAttendancePercentage || 75) / 100;
    
    let safeToSkip = 0;
    let consecutiveNeeded = 0;

    if (percentage >= (settings.minimumAttendancePercentage || 75)) {
      safeToSkip = Math.max(0, Math.floor((attended / pMin) - total));
    } else {
      // Below required threshold:
      // How many consecutive classes to attend?
      // (attended + N) / (total + N) >= P_min
      // attended + N >= P_min * total + P_min * N
      // N * (1 - P_min) >= P_min * total - attended
      // N >= (P_min * total - attended) / (1 - P_min)
      consecutiveNeeded = Math.ceil((pMin * total - attended) / (1 - pMin));
    }

    return {
      total,
      present,
      absent,
      leave,
      attended,
      percentage: roundedPercentage,
      safeToSkip,
      consecutiveNeeded,
      isBelow: roundedPercentage < (settings.minimumAttendancePercentage || 75),
    };
  }, [studentRecords, settings]);

  // Subject-wise breakdown
  const subjectStats = useMemo(() => {
    return subjects.map(sub => {
      const subRecords = studentRecords.filter(r => r.subjectId === sub.id);
      const total = subRecords.length;
      let attended = 0;
      subRecords.forEach(r => {
        if (r.status === 'present' || r.status === 'leave') attended++;
      });
      const pct = total > 0 ? Math.round((attended / total) * 1000) / 10 : 100;
      return {
        subject: sub,
        total,
        attended,
        percentage: pct,
        isBelow: pct < (settings.minimumAttendancePercentage || 75),
      };
    });
  }, [subjects, studentRecords, settings]);

  // Leave / On-Duty form state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveScope, setLeaveScope] = useState<'full_day' | 'specific_period'>('full_day');
  const [leavePeriod, setLeavePeriod] = useState<number>(1);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveAttachment, setLeaveAttachment] = useState('');
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Dispute form state
  const [disputeRecord, setDisputeRecord] = useState<AttendanceRecord | null>(null);
  const [disputeNote, setDisputeNote] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  // Success message toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenDispute = (rec: AttendanceRecord) => {
    setDisputeRecord(rec);
    setDisputeNote('');
  };

  const handleSubmitDisputeModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeRecord || !disputeNote.trim()) return;

    setIsSubmittingDispute(true);
    try {
      await submitDispute({
        record: disputeRecord,
        student,
        note: disputeNote.trim(),
      });
      setToastMessage('Dispute submitted for instructor review.');
      setDisputeRecord(null);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit dispute');
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveReason.trim()) return;

    setIsSubmittingLeave(true);
    try {
      await submitLeaveRequest({
        student,
        startDate: leaveStartDate,
        endDate: leaveScope === 'full_day' ? (leaveEndDate || leaveStartDate) : leaveStartDate,
        period: leaveScope === 'specific_period' ? leavePeriod : undefined,
        reason: leaveReason.trim(),
        attachmentName: leaveAttachment || undefined,
      });
      setToastMessage('Leave/OD request submitted successfully.');
      setShowLeaveModal(false);
      setLeaveStartDate('');
      setLeaveEndDate('');
      setLeaveReason('');
      setLeaveScope('full_day');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit leave request');
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  // Daily Period Breakdown: groups records by day and periods (e.g. Mon: P1 Present, P2 Absent, P3 Present)
  const dailyBreakdowns = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>();
    studentRecords.forEach(r => {
      const list = map.get(r.date) || [];
      list.push(r);
      map.set(r.date, list);
    });

    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([dateStr, recs]) => {
        const sorted = [...recs].sort((a, b) => a.period - b.period);
        const [year, month, day] = dateStr.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return {
          dateStr,
          dayName,
          monthDay,
          formatted: `${dayName}, ${monthDay}`,
          records: sorted,
          presentCount: sorted.filter(r => r.status === 'present').length,
          absentCount: sorted.filter(r => r.status === 'absent').length,
          leaveCount: sorted.filter(r => r.status === 'leave').length,
        };
      });
  }, [studentRecords]);

  // SVG Circular Progress calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.percentage / 100) * circumference;

  return (
    <div id="student_dashboard_container" className="space-y-6 max-w-5xl mx-auto pb-16">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Analytics Card: Progress Ring + Safe to Skip */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Circular Progress Ring */}
          <div className="md:col-span-5 flex flex-col items-center justify-center text-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-neutral-100 dark:text-neutral-700/60"
                  fill="transparent"
                />
                <circle
                  cx="88"
                  cy="88"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={stats.isBelow ? "text-rose-500 transition-all duration-1000 ease-out" : "text-emerald-500 transition-all duration-1000 ease-out"}
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']">
                  {stats.percentage}%
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Overall Attendance
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs">
              <span className="text-neutral-600 dark:text-neutral-300">
                <strong className="text-neutral-900 dark:text-white">{stats.attended}</strong> / {stats.total} Classes Attended
              </span>
              <span className="text-neutral-400">•</span>
              <span className="text-neutral-600 dark:text-neutral-300">
                Req: <strong className="text-indigo-600 dark:text-indigo-400">{settings.minimumAttendancePercentage || 75}%</strong>
              </span>
            </div>
          </div>

          {/* "Safe to Skip" Intelligence Calculator Card */}
          <div className="md:col-span-7 space-y-4">
            <div className={`p-5 rounded-2xl border transition-all ${
              stats.isBelow 
                ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60' 
                : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    {stats.isBelow ? (
                      <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    )}
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']">
                      {stats.isBelow ? 'Recovery Required' : 'Safe to Skip Calculator'}
                    </h3>
                  </div>

                  {stats.isBelow ? (
                    <div className="mt-2 text-xs text-rose-900 dark:text-rose-200 space-y-1">
                      <p className="font-semibold text-sm">
                        You are below the {settings.minimumAttendancePercentage || 75}% threshold.
                      </p>
                      <p>
                        You must attend the next <strong className="underline text-rose-950 dark:text-rose-100 font-bold">{stats.consecutiveNeeded} consecutive class periods</strong> without missing any to restore eligibility.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                      <p className="font-semibold text-sm">
                        You can safely skip <strong className="text-emerald-950 dark:text-emerald-100 font-bold text-base">{stats.safeToSkip} classes</strong> while staying at or above {settings.minimumAttendancePercentage || 75}%.
                      </p>
                      <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">
                        Calculated against total sessions conducted to date.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Student Quick Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                id="btn_request_leave_student"
                type="button"
                onClick={() => onNavigateToLeaveApplication ? onNavigateToLeaveApplication() : setShowLeaveModal(true)}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#13523B] hover:bg-[#0E422F] shadow-sm shadow-[#13523B]/20 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Apply for Leave / On-Duty (OD)
              </button>
              {onNavigateToTimetable && (
                <button
                  type="button"
                  onClick={onNavigateToTimetable}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-[#E6E3D8] dark:border-[#28332E] hover:bg-neutral-50 transition-all cursor-pointer"
                >
                  Master Timetable
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Subject-Wise Attendance Breakdown */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-3 font-['Plus_Jakarta_Sans']">
          Subject Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {subjectStats.map((item) => (
            <div
              key={item.subject.id}
              className={`p-4 rounded-xl border transition-all ${
                item.isBelow 
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60' 
                  : 'bg-neutral-50 dark:bg-neutral-900/60 border-neutral-200/80 dark:border-neutral-700/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-neutral-900 dark:text-white">
                  {item.subject.code}
                </span>
                <span className={`font-bold ${item.isBelow ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {item.percentage}%
                </span>
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate mb-2">
                {item.subject.name}
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${item.isBelow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, item.percentage)}%` }}
                />
              </div>
              <div className="mt-2 text-[11px] text-neutral-400 flex justify-between">
                <span>{item.attended} attended</span>
                <span>{item.total} total</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar History Heatmap & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Calendar View: Color Coded Days & Per-Period Breakdown */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']">
              Daily Period Breakdown
            </h3>
            <span className="text-[11px] text-neutral-400">By date & hour</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {dailyBreakdowns.map((d) => {
              const hasAbsent = d.absentCount > 0;
              const hasLeave = d.leaveCount > 0;

              return (
                <div 
                  key={d.dateStr}
                  className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-700/60 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        hasAbsent ? 'bg-rose-500' : hasLeave ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {d.formatted}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {d.presentCount}P
                      </span>
                      {d.absentCount > 0 && (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          {d.absentCount}A
                        </span>
                      )}
                      {d.leaveCount > 0 && (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          {d.leaveCount}OD
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Individual Period Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {d.records.map((rec) => (
                      <span
                        key={rec.id}
                        onClick={() => rec.status === 'absent' && handleOpenDispute(rec)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all ${
                          rec.status === 'present'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : rec.status === 'absent'
                            ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 cursor-pointer hover:bg-rose-100 hover:border-rose-300'
                            : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                        }`}
                        title={rec.status === 'absent' ? 'Click to dispute this absence' : `Period ${rec.period}: ${rec.subjectName}`}
                      >
                        P{rec.period}: {rec.status === 'present' ? 'Present' : rec.status === 'absent' ? 'Absent' : 'Leave'}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Records List with Dispute Button */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']">
              Recent Session Logs
            </h3>
            <span className="text-xs text-neutral-400">Tap Absent to Dispute</span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {studentRecords.slice(0, 15).map((rec) => {
              const isAbsent = rec.status === 'absent';
              const isLeave = rec.status === 'leave';

              return (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-700/60 text-xs hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {rec.subjectName}
                      </span>
                      <span className="text-[11px] text-neutral-400">Period {rec.period}</span>
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {rec.date} • Marked by {rec.markedByName}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                      isAbsent 
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' 
                        : isLeave
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {rec.status.toUpperCase()}
                    </span>

                    {/* Dispute button on Absent record */}
                    {isAbsent && (
                      <button
                        id={`btn_dispute_record_${rec.id}`}
                        type="button"
                        onClick={() => handleOpenDispute(rec)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors cursor-pointer"
                      >
                        I was present
                      </button>
                    )}

                    {/* View audit history */}
                    <button
                      type="button"
                      onClick={() => onOpenHistory(rec)}
                      className="p-1 rounded-lg text-neutral-400 hover:text-indigo-600 transition-colors"
                      title="View audit history"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* DISPUTE MODAL */}
      {disputeRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']">
              Raise Attendance Dispute
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Submit a formal contest for <strong>{disputeRecord.subjectName}</strong> (Period {disputeRecord.period}, {disputeRecord.date}).
            </p>

            <form onSubmit={handleSubmitDisputeModal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Why were you present? <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={disputeNote}
                  onChange={(e) => setDisputeNote(e.target.value)}
                  placeholder="e.g. I was sitting in the second row, answered the question regarding Paxos, and submitted the lab assignment."
                  className="w-full p-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeRecord(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDispute}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {isSubmittingDispute ? 'Submitting...' : 'Submit to Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEAVE / ON-DUTY MODAL */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']">
              Submit Leave / On-Duty Request
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Upon instructor approval, affected records will be updated to Leave (OD) and recorded in the audit trail.
            </p>

            <form onSubmit={handleSubmitLeave} className="space-y-3">
              {/* Leave Scope: Full Day vs Specific Period */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Request Scope
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLeaveScope('full_day')}
                    className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                      leaveScope === 'full_day'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-700 dark:text-indigo-300'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    Full Day (All Periods)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaveScope('specific_period')}
                    className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                      leaveScope === 'specific_period'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-700 dark:text-indigo-300'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    Specific Period Only
                  </button>
                </div>
              </div>

              {leaveScope === 'specific_period' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Select Period
                  </label>
                  <select
                    value={leavePeriod}
                    onChange={(e) => setLeavePeriod(Number(e.target.value))}
                    className="w-full p-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  >
                    {Array.from({ length: settings.periodsPerDay || 7 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Period {i + 1} ({settings.dailyPeriodTimings?.[i]?.time || `Hour ${i + 1}`})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    {leaveScope === 'specific_period' ? 'Date' : 'Start Date'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  />
                </div>
                {leaveScope === 'full_day' && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={leaveEndDate}
                      onChange={(e) => setLeaveEndDate(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Reason & Purpose <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="e.g. Attending ACM Student Chapter Hackathon representing the University."
                  className="w-full p-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Attachment Name (Optional)
                </label>
                <input
                  type="text"
                  value={leaveAttachment}
                  onChange={(e) => setLeaveAttachment(e.target.value)}
                  placeholder="e.g. Dean_Approval_Letter.pdf"
                  className="w-full p-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLeave}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {isSubmittingLeave ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
