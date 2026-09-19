import React from 'react';
import { 
  X, 
  History, 
  ArrowRight, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  User, 
  Tag 
} from 'lucide-react';
import { AttendanceRecord, AuditLogEntry } from '../types';

interface RecordHistoryDrawerProps {
  record: AttendanceRecord | null;
  logs: AuditLogEntry[];
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

export const RecordHistoryDrawer: React.FC<RecordHistoryDrawerProps> = ({
  record,
  logs,
  isOpen,
  onClose,
  isLoading
}) => {
  if (!isOpen || !record) return null;

  const getStatusBadge = (status: string | null) => {
    if (!status) return <span className="text-neutral-400 text-xs italic">Initial (None)</span>;
    if (status === 'present') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          Present
        </span>
      );
    }
    if (status === 'absent') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
          Absent
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
        Leave (OD)
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      {/* Background backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose} 
      />

      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div 
          id="history_drawer_panel"
          className="w-screen max-w-md bg-white dark:bg-neutral-900 shadow-2xl border-l border-neutral-200 dark:border-neutral-800 flex flex-col"
        >
          {/* Drawer Header */}
          <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                    <History className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']" id="slide-over-title">
                    Permanent Audit Trail
                  </h2>
                </div>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Immutable record change log • Enforced append-only
                </p>
              </div>
              <button
                id="btn_close_history_drawer"
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              >
                <span className="sr-only">Close panel</span>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Record Card */}
            <div className="mt-4 p-3.5 bg-white dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-neutral-900 dark:text-white">
                  {record.studentName}
                </span>
                {getStatusBadge(record.status)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                <div>
                  <span className="text-neutral-400">Roll:</span> {record.rollNumber || 'N/A'}
                </div>
                <div>
                  <span className="text-neutral-400">Period:</span> Period {record.period}
                </div>
                <div className="col-span-2">
                  <span className="text-neutral-400">Subject:</span> {record.subjectName}
                </div>
                <div className="col-span-2">
                  <span className="text-neutral-400">Session Date:</span> {record.date}
                </div>
              </div>
            </div>
          </div>

          {/* Core Rule Banner */}
          <div className="px-5 py-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center gap-2 text-xs text-indigo-900 dark:text-indigo-300">
            <ShieldAlert className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span>
              <strong>Zero Erasures:</strong> All updates are permanently logged with author, timestamp, and verified rationale.
            </span>
          </div>

          {/* Audit Timeline */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto" />
                <p className="mt-2 text-xs text-neutral-500">Retrieving audit timeline...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <Clock className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                <p className="text-sm font-medium">No prior modifications</p>
                <p className="text-xs text-neutral-400">This record retains its original marked state.</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-800">
                {logs.map((entry, index) => (
                  <div key={entry.id || index} className="relative group">
                    {/* Timeline Node */}
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-neutral-900 border-2 border-indigo-600 dark:border-indigo-400 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700/60 shadow-2xs">
                      {/* Transition */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {getStatusBadge(entry.oldStatus)}
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                        {getStatusBadge(entry.newStatus)}
                      </div>

                      {/* Required Reason for Edit */}
                      <div className="text-xs text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-200/80 dark:border-neutral-700/80 mb-2.5">
                        <span className="font-semibold text-neutral-500 dark:text-neutral-400 block text-[10px] uppercase tracking-wider mb-0.5">
                          Required Reason:
                        </span>
                        &ldquo;{entry.reason}&rdquo;
                      </div>

                      {/* Author & Timestamp */}
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="font-medium text-neutral-700 dark:text-neutral-300">
                            {entry.performedByName}
                          </span>
                          <span className="capitalize text-[10px] px-1.5 py-0.2 bg-neutral-200 dark:bg-neutral-700 rounded text-neutral-700 dark:text-neutral-300">
                            {entry.performedByRole}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(entry.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
            <span className="font-mono text-[11px]">ID: {record.id}</span>
            <button
              id="btn_done_history_drawer"
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
            >
              Close History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
