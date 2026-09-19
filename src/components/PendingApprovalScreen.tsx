import React, { useState } from 'react';
import { UserProfile } from '../types';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  Clock, 
  ShieldCheck, 
  RotateCw, 
  LogOut, 
  UserCheck, 
  AlertCircle,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';

interface PendingApprovalScreenProps {
  currentUser: UserProfile;
  onStatusUpdated: (updatedUser: UserProfile) => void;
  onLogout: () => void;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({
  currentUser,
  onStatusUpdated,
  onLogout,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setStatusMessage(null);
    try {
      const userRef = doc(db, 'users', currentUser.id);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const freshData = snap.data() as UserProfile;
        if (freshData.status === 'active') {
          setStatusMessage('Congratulations! Your Class Representative credentials have been approved.');
          setTimeout(() => {
            onStatusUpdated(freshData);
          }, 1200);
          return;
        } else if (freshData.status === 'rejected') {
          setStatusMessage('Your CR request was reviewed and declined. You remain enrolled as a standard student.');
          setTimeout(() => {
            onStatusUpdated({ ...freshData, role: 'student' });
          }, 1500);
          return;
        }
      }
      setStatusMessage('Your application is still under review by Prof. Ananya Sharma.');
    } catch (err: any) {
      setStatusMessage('Could not reach the server to verify status. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div id="pending_approval_container" className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 flex flex-col justify-center items-center p-4 sm:p-6 font-['Plus_Jakarta_Sans']">
      
      {/* Background ambient accents */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-200/80 dark:border-neutral-700/80 p-8 shadow-xl relative z-10 text-center space-y-6">
        
        {/* Animated Status Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 border-2 border-white dark:border-neutral-800"></span>
          </span>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
            <UserCheck className="w-3.5 h-3.5" />
            <span>CR Role Verification</span>
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            Waiting for Teacher Approval
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Welcome, <strong className="text-neutral-900 dark:text-white">{currentUser.name}</strong>! Your Class Representative registration for <strong className="text-indigo-600 dark:text-indigo-400">{currentUser.rollNumber}</strong> has been submitted.
          </p>
        </div>

        {/* Details Card */}
        <div className="bg-neutral-50 dark:bg-neutral-900/60 rounded-2xl p-4 border border-neutral-200/60 dark:border-neutral-700/60 text-left text-xs space-y-2.5">
          <div className="flex justify-between items-center py-1 border-b border-neutral-200/40 dark:border-neutral-800">
            <span className="text-neutral-500">Applicant:</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{currentUser.name}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-neutral-200/40 dark:border-neutral-800">
            <span className="text-neutral-500">Roll Number:</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{currentUser.rollNumber || 'CR Candidate'}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-neutral-200/40 dark:border-neutral-800">
            <span className="text-neutral-500">Department:</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{currentUser.department || 'Computer Science'}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-neutral-500">Assigned Faculty:</span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">Prof. Ananya Sharma</span>
          </div>
        </div>

        {/* Status alert if checked */}
        {statusMessage && (
          <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            id="btn_check_approval_status"
            type="button"
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking Authorization...' : 'Check Approval Status'}</span>
          </button>

          <button
            id="btn_pending_logout"
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700/60 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-medium text-xs transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out or Switch Account</span>
          </button>
        </div>

        {/* Helper Note for testing */}
        <div className="pt-2 text-[11px] text-neutral-400 dark:text-neutral-500 border-t border-neutral-100 dark:border-neutral-800">
          Tip: Log in as <strong className="text-neutral-700 dark:text-neutral-300">teacher@attendease.edu</strong> to review and approve this CR application from the Requests Inbox.
        </div>
      </div>
    </div>
  );
};
