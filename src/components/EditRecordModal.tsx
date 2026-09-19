import React, { useState } from 'react';
import { 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Send, 
  ShieldAlert,
  Calendar,
  Layers,
  HelpCircle
} from 'lucide-react';
import { 
  AttendanceRecord, 
  AttendanceStatus, 
  UserProfile 
} from '../types';
import { updateAttendanceRecord, submitCRCorrectionRequest } from '../services/attendanceService';

interface EditRecordModalProps {
  record: AttendanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSuccess: () => void;
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  record,
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}) => {
  if (!isOpen || !record) return null;

  const [newStatus, setNewStatus] = useState<AttendanceStatus>(record.status);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check CR same-day edit permissions:
  // "CRs can edit a record directly only on the same day it was created. After that, any change goes to the teacher as a correction request that needs approval."
  const isCR = currentUser.role === 'cr';
  const recordCreated = new Date(record.createdAt);
  const isSameDay = recordCreated.toDateString() === new Date().toDateString();
  const crNeedsApproval = isCR && !isSameDay;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage('Please provide a mandatory explanation for this modification.');
      return;
    }
    if (newStatus === record.status) {
      setErrorMessage('The selected status is identical to current status.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (crNeedsApproval) {
        // Submit correction request to teacher
        await submitCRCorrectionRequest({
          record,
          cr: currentUser,
          requestedStatus: newStatus,
          reason: reason.trim(),
        });
      } else {
        // Direct update with append-only audit trail
        await updateAttendanceRecord({
          record,
          newStatus,
          reason: reason.trim(),
          user: currentUser,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error modifying record:', err);
      setErrorMessage(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs" role="dialog">
      <div 
        id="edit_record_modal"
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/80">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']">
              {crNeedsApproval ? 'Submit Correction Request' : 'Edit Attendance Record'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {crNeedsApproval 
                ? 'Record is older than 1 day • Requires Teacher approval' 
                : 'Direct edit • Permanent audit log entry will be created'}
            </p>
          </div>
          <button
            id="btn_close_edit_modal"
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Record Details */}
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-neutral-900 dark:text-white text-sm">
                {record.studentName}
              </span>
              <span className="font-mono text-neutral-500">{record.rollNumber}</span>
            </div>
            <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-400">
              <span>{record.subjectName}</span>
              <span>•</span>
              <span>Period {record.period}</span>
              <span>•</span>
              <span>{record.date}</span>
            </div>
            <div className="pt-1 text-[11px] text-neutral-400">
              Current Status: <span className="font-semibold uppercase text-neutral-800 dark:text-neutral-200">{record.status}</span>
            </div>
          </div>

          {crNeedsApproval && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>CR Rule Notice:</strong> As a Class Representative, records created on previous days cannot be edited directly. Submitting this will place a Correction Request in the Teacher’s review inbox.
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* New Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Select Corrected Status <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="btn_set_status_present"
                onClick={() => setNewStatus('present')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                  newStatus === 'present'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-emerald-500'
                }`}
              >
                Present
              </button>
              <button
                type="button"
                id="btn_set_status_absent"
                onClick={() => setNewStatus('absent')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                  newStatus === 'absent'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-rose-500'
                }`}
              >
                Absent
              </button>
              <button
                type="button"
                id="btn_set_status_leave"
                onClick={() => setNewStatus('leave')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                  newStatus === 'leave'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-amber-500'
                }`}
              >
                Leave / OD
              </button>
            </div>
          </div>

          {/* Mandatory Reason */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Mandatory Audit Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="input_edit_reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Student was presenting lab demonstration at instructor desk; verified paper roll call error."
              className="w-full p-3 rounded-xl text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <p className="mt-1 text-[11px] text-neutral-400">
              This explanation is permanently committed to the immutable audit trail and cannot be retracted.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              id="btn_cancel_edit"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn_confirm_edit"
              disabled={isSubmitting}
              className="inline-flex items-center px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                'Processing...'
              ) : crNeedsApproval ? (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Submit Request to Teacher
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Save & Log to Audit Trail
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
