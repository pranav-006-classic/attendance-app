import React, { useState } from 'react';
import { 
  AttendanceRequest, 
  UserProfile 
} from '../types';
import { 
  Inbox, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Paperclip, 
  FileText, 
  MessageSquare,
  ShieldCheck,
  User
} from 'lucide-react';
import { 
  reviewRequest, 
  approveCRSignup, 
  rejectCRSignup 
} from '../services/attendanceService';

interface RequestsInboxProps {
  requests: AttendanceRequest[];
  currentUser: UserProfile;
  onRefreshData: () => void;
}

export const RequestsInbox: React.FC<RequestsInboxProps> = ({
  requests,
  currentUser,
  onRefreshData,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [activeReviewModal, setActiveReviewModal] = useState<{
    request: AttendanceRequest;
    action: 'approve' | 'reject';
  } | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter requests
  const filtered = requests.filter(r => {
    if (filterType === 'pending') return r.status === 'pending';
    if (filterType === 'reviewed') return r.status !== 'pending';
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleOpenReview = (request: AttendanceRequest, action: 'approve' | 'reject') => {
    setActiveReviewModal({ request, action });
    setReviewComment('');
  };

  const handleConfirmReview = async () => {
    if (!activeReviewModal) return;
    setIsProcessing(true);

    try {
      if (activeReviewModal.request.type === 'cr_approval') {
        if (activeReviewModal.action === 'approve') {
          await approveCRSignup({
            request: activeReviewModal.request,
            reviewer: currentUser,
            comment: reviewComment.trim(),
          });
          setToastMessage(`Class Representative credentials approved for ${activeReviewModal.request.studentName}.`);
        } else {
          await rejectCRSignup({
            request: activeReviewModal.request,
            reviewer: currentUser,
            comment: reviewComment.trim(),
          });
          setToastMessage(`Class Representative request declined.`);
        }
      } else {
        await reviewRequest({
          request: activeReviewModal.request,
          action: activeReviewModal.action,
          comment: reviewComment.trim(),
          reviewer: currentUser,
        });

        setToastMessage(
          `Request ${activeReviewModal.action === 'approve' ? 'approved and attendance updated' : 'rejected'}.`
        );
      }

      setActiveReviewModal(null);
      setErrorMessage(null);
      onRefreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing request');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="requests_inbox_container" className="space-y-4 max-w-4xl mx-auto pb-16">
      
      {/* Error Toast */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Success Toast */}
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

      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <Inbox className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']">
              Requests & Disputes Inbox
            </h2>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Approving updates the record immediately and commits to the immutable audit trail.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setFilterType('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'pending'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Pending ({requests.filter(r => r.status === 'pending').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('reviewed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'reviewed'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Reviewed
          </button>
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            All ({requests.length})
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 p-12 text-center text-neutral-500">
            <Inbox className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
            <p className="text-sm font-semibold">No requests in this view</p>
            <p className="text-xs text-neutral-400 mt-1">
              All student disputes, leave requests, and CR corrections have been processed.
            </p>
          </div>
        ) : (
          filtered.map((req) => {
            const isPending = req.status === 'pending';
            const isApproved = req.status === 'approved';
            const isCRApproval = req.type === 'cr_approval';
            const isDispute = req.type === 'dispute';
            const isLeave = req.type === 'leave';
            const isCR = req.type === 'cr_correction';

            return (
              <div
                key={req.id}
                id={`request_card_${req.id}`}
                className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 p-5 shadow-xs space-y-3 transition-all"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isCRApproval
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        : isDispute
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : isLeave
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                    }`}>
                      {isCRApproval 
                        ? 'CR Role Application' 
                        : isDispute 
                        ? 'Dispute: I was present' 
                        : isLeave 
                        ? 'Leave / OD Request' 
                        : 'CR Record Correction'}
                    </span>

                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${
                      isPending 
                        ? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200' 
                        : isApproved 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <span className="text-[11px] text-neutral-400">
                    {new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Body Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                  <div>
                    <span className="text-neutral-400">Applicant / Student:</span>{' '}
                    <strong className="text-neutral-900 dark:text-white">{req.studentName}</strong> ({req.rollNumber})
                  </div>
                  <div>
                    <span className="text-neutral-400">Submitted By:</span>{' '}
                    <span className="text-neutral-800 dark:text-neutral-200">{req.createdByName} ({req.createdByRole.toUpperCase()})</span>
                  </div>
                  {req.email && (
                    <div>
                      <span className="text-neutral-400">Email:</span>{' '}
                      <span className="text-neutral-800 dark:text-neutral-200">{req.email}</span>
                    </div>
                  )}
                  {req.department && (
                    <div>
                      <span className="text-neutral-400">Department / Class:</span>{' '}
                      <span className="text-neutral-800 dark:text-neutral-200">{req.department} ({req.year || ''} {req.section || ''})</span>
                    </div>
                  )}
                  {req.subjectName && (
                    <div>
                      <span className="text-neutral-400">Subject:</span>{' '}
                      <span className="text-neutral-800 dark:text-neutral-200">{req.subjectName}</span>
                    </div>
                  )}
                  {req.date && (
                    <div>
                      <span className="text-neutral-400">Date/Session:</span>{' '}
                      <span className="text-neutral-800 dark:text-neutral-200">
                        {req.date} {req.endDate && req.endDate !== req.date ? `to ${req.endDate}` : ''} {req.period ? `(Period ${req.period})` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stated Reason */}
                <div className="text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-850 p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-700/60">
                  <div className="font-semibold text-neutral-500 text-[10px] uppercase tracking-wider mb-1">
                    Submitted Reason:
                  </div>
                  &ldquo;{req.reason}&rdquo;
                </div>

                {/* Optional attachment */}
                {req.attachmentName && (
                  <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/80 px-3 py-1.5 rounded-lg w-fit">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Attachment: <strong>{req.attachmentName}</strong></span>
                  </div>
                )}

                {/* Review status or actions */}
                {isPending ? (
                  currentUser.role === 'teacher' ? (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-700/60">
                      <button
                        type="button"
                        id={`btn_reject_req_${req.id}`}
                        onClick={() => handleOpenReview(req, 'reject')}
                        className="px-4 py-1.5 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        id={`btn_approve_req_${req.id}`}
                        onClick={() => handleOpenReview(req, 'approve')}
                        className="px-5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
                      >
                        Approve & Apply
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-400 italic text-right pt-1">
                      Awaiting Teacher review
                    </div>
                  )
                ) : (
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-100 dark:border-neutral-700/60 flex items-center justify-between">
                    <span>Reviewed by {req.reviewedByName || 'Teacher'} on {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : ''}</span>
                    {req.reviewComment && (
                      <span className="italic">Note: &ldquo;{req.reviewComment}&rdquo;</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Approve/Reject Confirmation Modal */}
      {activeReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']">
              {activeReviewModal.action === 'approve' ? 'Confirm Approval' : 'Reject Request'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {activeReviewModal.action === 'approve'
                ? 'Approving will immediately update the affected attendance record(s) and record an audit log entry in the permanent history.'
                : 'Rejecting keeps the current attendance record intact and notifies the student.'}
            </p>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Reviewer Comments / Note (Optional)
              </label>
              <textarea
                rows={2}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="e.g. Verified with lab teaching assistant; approved attendance."
                className="w-full p-2.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveReviewModal(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn_confirm_review_action"
                onClick={handleConfirmReview}
                disabled={isProcessing}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs disabled:opacity-50 ${
                  activeReviewModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {isProcessing ? 'Processing...' : activeReviewModal.action === 'approve' ? 'Approve & Update Log' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
