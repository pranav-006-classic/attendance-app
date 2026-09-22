import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  Subject, 
  AttendanceRecord, 
  AttendanceStatus 
} from '../types';
import { 
  Undo2, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Calendar, 
  Clock, 
  BookOpen, 
  User as UserIcon, 
  FileText, 
  ShieldAlert 
} from 'lucide-react';
import { submitGeneralCRReversalRequest, submitCRCorrectionRequest } from '../services/attendanceService';

interface CRReversalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  students: UserProfile[];
  subjects: Subject[];
  initialRecord?: AttendanceRecord | null;
  onSubmitted: (message: string) => void;
}

export const CRReversalModal: React.FC<CRReversalModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  students,
  subjects,
  initialRecord,
  onSubmitted,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [period, setPeriod] = useState<number>(1);
  const [currentStatus, setCurrentStatus] = useState<AttendanceStatus>('absent');
  const [requestedStatus, setRequestedStatus] = useState<AttendanceStatus>('present');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialRecord) {
      setSelectedStudentId(initialRecord.studentId);
      setSelectedSubjectId(initialRecord.subjectId);
      setDate(initialRecord.date);
      setPeriod(initialRecord.period);
      setCurrentStatus(initialRecord.status);
      setRequestedStatus(initialRecord.status === 'present' ? 'absent' : 'present');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      if (students.length > 0 && !selectedStudentId) {
        setSelectedStudentId(students[0].id);
      }
      if (subjects.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subjects[0].id);
      }
    }
  }, [initialRecord, isOpen, students, subjects]);

  if (!isOpen) return null;

  const targetStudent = students.find(s => s.id === selectedStudentId);
  const targetSubject = subjects.find(s => s.id === selectedSubjectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage('Please provide an academic justification/reason for the teacher to review.');
      return;
    }
    if (!targetStudent || !targetSubject) {
      setErrorMessage('Please select a valid student and subject.');
      return;
    }
    if (currentStatus === requestedStatus) {
      setErrorMessage('Requested status must be different from current status.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (initialRecord) {
        await submitCRCorrectionRequest({
          record: initialRecord,
          cr: currentUser,
          requestedStatus,
          reason: reason.trim(),
        });
      } else {
        await submitGeneralCRReversalRequest({
          cr: currentUser,
          student: targetStudent,
          subject: targetSubject,
          date,
          period,
          currentStatus,
          requestedStatus,
          reason: reason.trim(),
        });
      }

      onSubmitted(`Reversal request for ${targetStudent.name} (${requestedStatus.toUpperCase()}) submitted for teacher approval.`);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit reversal request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#1A221E] rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] shadow-2xl max-w-lg w-full overflow-hidden transition-all">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E6E3D8] dark:border-[#28332E] flex items-center justify-between bg-[#F6F4EB] dark:bg-[#151B18]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#13523B]/10 dark:bg-emerald-950/60 text-[#13523B] dark:text-emerald-400 flex items-center justify-center">
              <Undo2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif text-neutral-900 dark:text-white">
                Request Attendance Reversal
              </h2>
              <p className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                CR Workflow • Sent to Faculty Inbox for Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Info Callout */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Academic Integrity Rule:</span> As Class Representative, your primary duty is marking live attendance. Modifying or reversing finalized attendance records requires teacher authorization to prevent tampering.
          </div>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Student selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Target Student
            </label>
            {initialRecord ? (
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-[#E6E3D8] dark:border-[#28332E] text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-900 dark:text-white">{initialRecord.studentName}</span>
                  <span className="text-neutral-400 ml-2 font-mono">({initialRecord.rollNumber})</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  Fixed Record
                </span>
              </div>
            ) : (
              <select
                id="cr_reversal_student_select"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#13523B]"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.rollNumber || 'No Roll'}) {s.isCR ? '• (CR)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Subject & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Subject
              </label>
              {initialRecord ? (
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-[#E6E3D8] dark:border-[#28332E] text-xs font-medium truncate">
                  {initialRecord.subjectName}
                </div>
              ) : (
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#13523B]"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code} - {sub.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Date & Period
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={date}
                  disabled={Boolean(initialRecord)}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-2/3 text-xs p-2 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white disabled:opacity-70"
                />
                <select
                  value={period}
                  disabled={Boolean(initialRecord)}
                  onChange={(e) => setPeriod(Number(e.target.value))}
                  className="w-1/3 text-xs p-2 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white disabled:opacity-70"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                    <option key={p} value={p}>P{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Status Change Comparison */}
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-[#E6E3D8] dark:border-[#28332E] space-y-2">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Requested Status Transition
            </span>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-center p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <span className="text-[10px] text-neutral-400 block mb-0.5">Currently Marked</span>
                <span className={`text-xs font-bold uppercase ${
                  currentStatus === 'present' ? 'text-emerald-600 dark:text-emerald-400' :
                  currentStatus === 'absent' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600'
                }`}>
                  {currentStatus}
                </span>
              </div>

              <div className="text-neutral-400 font-bold">➔</div>

              <div className="flex-1">
                <span className="text-[10px] text-neutral-400 block mb-0.5 text-center">New Requested Status</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRequestedStatus('present')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                      requestedStatus === 'present'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestedStatus('absent')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                      requestedStatus === 'absent'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Reason / Justification */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Academic Reason & Explanation <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="cr_reversal_reason_input"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Student was mistakenly marked absent during rapid roll call; was present on bench 4. Or: Student represented department at inter-college symposium."
              className="w-full text-xs p-3 rounded-xl border border-[#E6E3D8] dark:border-[#28332E] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-[#13523B]"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#13523B] hover:bg-[#0E422F] shadow-sm shadow-[#13523B]/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Undo2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Transmitting Request...' : 'Submit Reversal to Teacher'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
