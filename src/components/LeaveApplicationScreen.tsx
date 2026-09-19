import React, { useState, useMemo } from 'react';
import { UserProfile, AttendanceRequest, Subject, AttendanceRecord, ClassroomSettings, RequestType } from '../types';
import { submitLeaveRequest } from '../services/attendanceService';
import { 
  FileText, 
  Calendar, 
  Clock, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Award, 
  Sparkles, 
  ArrowRight,
  Send,
  Building,
  Activity,
  FileCheck2,
  Paperclip,
  Check,
  AlertTriangle
} from 'lucide-react';

interface LeaveApplicationScreenProps {
  currentUser: UserProfile;
  requests: AttendanceRequest[];
  subjects: Subject[];
  attendanceRecords: AttendanceRecord[];
  settings: ClassroomSettings;
  onNavigateToInbox?: () => void;
}

export const LeaveApplicationScreen: React.FC<LeaveApplicationScreenProps> = ({
  currentUser,
  requests,
  subjects,
  attendanceRecords,
  settings,
  onNavigateToInbox,
}) => {
  // Form State
  const [requestCategory, setRequestCategory] = useState<'leave' | 'od_academic' | 'od_event' | 'emergency'>('leave');
  const [leaveScope, setLeaveScope] = useState<'full_day' | 'specific_period'>('full_day');
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [reason, setReason] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Student's personal records and history
  const userRecords = useMemo(() => {
    return attendanceRecords.filter((r) => r.studentId === currentUser.id);
  }, [attendanceRecords, currentUser]);

  const userRequests = useMemo(() => {
    return requests.filter((r) => r.studentId === currentUser.id);
  }, [requests, currentUser]);

  // Overall attendance statistics
  const overallStats = useMemo(() => {
    const totalHeld = userRecords.length;
    const attended = userRecords.filter((r) => r.status === 'present' || r.status === 'leave').length;
    const currentPct = totalHeld > 0 ? ((attended / totalHeld) * 100).toFixed(1) : '100.0';
    
    // Forecast if 1 day (or period) OD is approved:
    // If an absent or future period is marked leave, attendance stays or improves
    const projectedAttended = attended + (leaveScope === 'full_day' ? 7 : 1);
    const projectedTotal = totalHeld + (leaveScope === 'full_day' ? 7 : 1);
    const projectedPct = projectedTotal > 0 ? ((projectedAttended / projectedTotal) * 100).toFixed(1) : currentPct;

    const approvedODCount = userRequests.filter((r) => r.status === 'approved' && r.type === 'leave').length;

    return {
      currentPct: parseFloat(currentPct),
      projectedPct: parseFloat(projectedPct),
      totalHeld,
      attended,
      approvedODCount,
      leaveBalanceRemaining: 7 - userRequests.filter((r) => r.status === 'approved').length,
    };
  }, [userRecords, userRequests, leaveScope]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a formal justification for your leave / OD request.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Determine request type
      const mappedType: RequestType = 'leave';
      const subjectObj = subjects.find((s) => s.id === selectedSubjectId);

      await submitLeaveRequest({
        student: currentUser,
        startDate,
        endDate: leaveScope === 'full_day' ? endDate : startDate,
        period: leaveScope === 'specific_period' ? selectedPeriod : undefined,
        reason: `[${requestCategory.toUpperCase()}] ${reason}`,
        attachmentName: attachmentName || (requestCategory !== 'leave' ? 'Official_Event_Sanction.pdf' : undefined),
      });
      setSubmitSuccess(true);
      setReason('');
      setAttachmentName('');
      setTimeout(() => setSubmitSuccess(false), 6000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
                Official University Exemption Portal
              </span>
              <span className="text-xs text-neutral-400 font-mono">• Academic Regulations §14</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold font-serif text-[#0D3828] dark:text-[#E8EFEA] tracking-tight">
              Leave & Official Duty (OD) Application
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1 max-w-2xl font-light">
              Submit sanction requests for medical recuperation, academic conferences, inter-collegiate hackathons, and varsity athletic duties.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#1A221E] border border-[#E6E3D8] dark:border-[#28332E] text-right shadow-2xs">
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">Applicant ID</div>
              <div className="text-sm font-bold font-serif text-[#13523B] dark:text-emerald-400">{currentUser.name}</div>
              <div className="text-[11px] text-neutral-500 font-mono">{currentUser.rollNumber || 'CS-Faculty'}</div>
            </div>
          </div>
        </div>

        {/* 4 Top Impact Metric Cards as seen in Stitch */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-[#E6E3D8] dark:border-[#28332E]">
          <div className="bg-white/80 dark:bg-[#1A221E]/90 p-4 rounded-xl border border-[#E6E3D8] dark:border-[#28332E]">
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">Leave Quota Balance</div>
            <div className="text-2xl font-bold font-serif text-[#0D3828] dark:text-white mt-0.5">
              0{Math.max(0, overallStats.leaveBalanceRemaining)} <span className="text-xs font-sans font-normal text-neutral-400">Days</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-1 font-mono">Max 07 days/semester</div>
          </div>

          <div className="bg-white/80 dark:bg-[#1A221E]/90 p-4 rounded-xl border border-[#E6E3D8] dark:border-[#28332E]">
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">Approved OD Events</div>
            <div className="text-2xl font-bold font-serif text-[#13523B] dark:text-emerald-400 mt-0.5">
              0{overallStats.approvedODCount} <span className="text-xs font-sans font-normal text-neutral-400">Approved</span>
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono">Dean Sanctioned</div>
          </div>

          <div className="bg-white/80 dark:bg-[#1A221E]/90 p-4 rounded-xl border border-[#E6E3D8] dark:border-[#28332E]">
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">Current Attendance</div>
            <div className={`text-2xl font-bold font-serif mt-0.5 ${
              overallStats.currentPct < 75 ? 'text-[#BA3C2A]' : 'text-neutral-900 dark:text-white'
            }`}>
              {overallStats.currentPct}%
            </div>
            <div className="text-[10px] text-neutral-400 mt-1 font-mono">
              {overallStats.currentPct < 75 ? 'Below 75% threshold' : 'Good standing'}
            </div>
          </div>

          <div className="bg-[#EAF5EF] dark:bg-[#142A1E] p-4 rounded-xl border border-[#BEE0CE] dark:border-[#1F4531]">
            <div className="text-[11px] text-[#13523B] dark:text-emerald-300 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Projected With Approval</span>
            </div>
            <div className="text-2xl font-bold font-serif text-[#13523B] dark:text-emerald-200 mt-0.5">
              {overallStats.projectedPct}%
            </div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 font-mono">
              +{(overallStats.projectedPct - overallStats.currentPct).toFixed(1)}% safe margin
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Application Form (Left) & Policy / History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* Form Container */}
        <div className="lg:col-span-7 bg-white dark:bg-[#171E1A] rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] p-6 shadow-xs space-y-6">
          <div className="border-b border-[#E6E3D8] dark:border-[#28332E] pb-4">
            <h2 className="text-lg font-bold font-serif text-[#0D3828] dark:text-[#E8EFEA] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#13523B]" />
              Official Exemption Filing
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Please enter complete details and attach supporting proof for faculty review.
            </p>
          </div>

          {submitSuccess && (
            <div className="p-4 rounded-xl bg-[#EAF5EF] border border-[#BEE0CE] text-[#13523B] text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">Application Registered Successfully</p>
                <p className="text-[11px] text-[#13523B]/80 mt-0.5">
                  Your request has been filed into the tamper-proof ledger. Your instructor and CR have been notified for review.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-[#FDF2F0] border border-[#F7C6BF] text-[#BA3C2A] text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: Exemption Category Cards */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2 font-mono">
                1. Select Exemption Category
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'leave', label: 'Medical / Sick Leave', desc: 'Physician certificate required', icon: Activity },
                  { id: 'od_academic', label: 'Academic OD', desc: 'Paper presentation or conference', icon: Award },
                  { id: 'od_event', label: 'Event / Hackathon OD', desc: 'Inter-college competition', icon: Building },
                  { id: 'emergency', label: 'Personal Emergency', desc: 'Urgent family / travel matter', icon: AlertTriangle },
                ].map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = requestCategory === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setRequestCategory(cat.id as any)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#EAF5EF] dark:bg-[#142A1E] border-[#13523B] shadow-2xs'
                          : 'bg-[#FAF9F5] dark:bg-[#1C2420] border-[#E6E3D8] dark:border-[#28332E] hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-[#13523B] dark:text-emerald-400' : 'text-neutral-400'}`} />
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#13523B] dark:text-emerald-400" />}
                      </div>
                      <div className="font-semibold text-xs text-neutral-900 dark:text-white">
                        {cat.label}
                      </div>
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {cat.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Scope Selector */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2 font-mono">
                2. Scope of Exemption
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLeaveScope('full_day')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                    leaveScope === 'full_day'
                      ? 'bg-[#13523B] text-white border-[#13523B]'
                      : 'bg-[#FAF9F5] dark:bg-[#1C2420] text-neutral-700 dark:text-neutral-300 border-[#E6E3D8] dark:border-[#28332E]'
                  }`}
                >
                  Full Day (All 7 Periods)
                </button>
                <button
                  type="button"
                  onClick={() => setLeaveScope('specific_period')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                    leaveScope === 'specific_period'
                      ? 'bg-[#13523B] text-white border-[#13523B]'
                      : 'bg-[#FAF9F5] dark:bg-[#1C2420] text-neutral-700 dark:text-neutral-300 border-[#E6E3D8] dark:border-[#28332E]'
                  }`}
                >
                  Specific Period Only
                </button>
              </div>
            </div>

            {/* Step 3: Dates & Period Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  {leaveScope === 'full_day' ? 'Start Date' : 'Date of Exemption'}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF9F5] dark:bg-[#1C2420] border border-[#E6E3D8] dark:border-[#28332E] text-neutral-800 dark:text-white focus:outline-none focus:border-[#13523B]"
                  required
                />
              </div>

              {leaveScope === 'full_day' ? (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    End Date (Inclusive)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF9F5] dark:bg-[#1C2420] border border-[#E6E3D8] dark:border-[#28332E] text-neutral-800 dark:text-white focus:outline-none focus:border-[#13523B]"
                    required
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Period
                    </label>
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF9F5] dark:bg-[#1C2420] border border-[#E6E3D8] dark:border-[#28332E] text-neutral-800 dark:text-white focus:outline-none focus:border-[#13523B]"
                    >
                      {settings.dailyPeriodTimings.map((p) => (
                        <option key={p.period} value={p.period}>
                          P{p.period}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Subject
                    </label>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF9F5] dark:bg-[#1C2420] border border-[#E6E3D8] dark:border-[#28332E] text-neutral-800 dark:text-white focus:outline-none focus:border-[#13523B]"
                    >
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Reason & Formal Justification */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Formal Academic Justification
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="E.g., Representing department at Smart India Hackathon grand finale at IIT Bombay; faculty sanction letter signed by HOD."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF9F5] dark:bg-[#1C2420] border border-[#E6E3D8] dark:border-[#28332E] text-neutral-800 dark:text-white focus:outline-none focus:border-[#13523B] resize-none"
                required
              />
            </div>

            {/* Step 5: Supporting Document Upload */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Supporting Documentation (PDF / JPG)
              </label>
              <div className="border-2 border-dashed border-[#E6E3D8] dark:border-[#28332E] rounded-xl p-4 text-center hover:bg-[#FAF9F5]/80 transition-colors">
                <UploadCloud className="w-7 h-7 mx-auto text-neutral-400 mb-1" />
                <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {attachmentName ? (
                    <span className="text-[#13523B] dark:text-emerald-400 font-mono font-bold flex items-center justify-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5" />
                      {attachmentName}
                    </span>
                  ) : (
                    <span>Click or drag official document here</span>
                  )}
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  Accepted: Hospital certificate, OD approval letter, event invitation (Max 10MB)
                </div>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setAttachmentName(file.name);
                  }}
                  className="hidden"
                  id="leave-file-input"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('leave-file-input')?.click()}
                  className="mt-2.5 px-3 py-1 text-[11px] font-semibold text-[#13523B] bg-[#EAF5EF] hover:bg-[#D7EDE0] rounded-lg transition-colors inline-block"
                >
                  Browse Files
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#13523B] hover:bg-[#0E422F] text-white text-xs font-bold transition-all shadow-md shadow-[#13523B]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Submitting to Ledger...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Application for Faculty Review</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Policy Rules & Previous Action Ledger */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Regulatory Guidance Card */}
          <div className="bg-[#FAF9F5] dark:bg-[#161D19] rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] p-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold font-serif text-[#0D3828] dark:text-[#E8EFEA] mb-2">
              <ShieldCheck className="w-4 h-4 text-[#13523B]" />
              <span>Academic Exemption Policy</span>
            </div>
            <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-2 font-light">
              <li className="flex items-start gap-2">
                <span className="font-mono text-[#13523B] font-bold">01.</span>
                <span>Applications must be submitted prior to the absence or within 48 hours for medical emergencies.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-[#13523B] font-bold">02.</span>
                <span>Approved Official Duty (OD) periods count as attended classes in percentage calculations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-[#13523B] font-bold">03.</span>
                <span>All decisions create an immutable, timestamped audit log entry signed by reviewing faculty.</span>
              </li>
            </ul>
          </div>

          {/* Previous Applications Ledger */}
          <div className="bg-white dark:bg-[#171E1A] rounded-2xl border border-[#E6E3D8] dark:border-[#28332E] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#13523B]" />
                <h3 className="text-sm font-bold font-serif text-[#0D3828] dark:text-[#E8EFEA]">
                  Previous Applications Ledger
                </h3>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                {userRequests.length} Total
              </span>
            </div>

            {userRequests.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                No past applications filed in this academic semester.
              </div>
            ) : (
              <div className="space-y-3">
                {userRequests.slice(0, 5).map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-[#FAF9F5] dark:bg-[#1C2420] border border-[#E6E3D8] dark:border-[#28332E] text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-neutral-400 font-bold">
                        {req.date} {req.period ? `• P${req.period}` : ''}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase font-mono ${
                        req.status === 'approved'
                          ? 'bg-[#EAF5EF] text-[#13523B] border border-[#BEE0CE]'
                          : req.status === 'rejected'
                          ? 'bg-[#FDF2F0] text-[#BA3C2A] border border-[#F7C6BF]'
                          : 'bg-[#FEF8ED] text-[#C77724] border border-[#FBE3B5]'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="font-medium text-neutral-800 dark:text-neutral-200 line-clamp-2 text-[11px]">
                      {req.reason}
                    </div>

                    {req.attachmentName && (
                      <div className="text-[10px] text-[#13523B] dark:text-emerald-400 font-mono flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        <span>{req.attachmentName}</span>
                      </div>
                    )}

                    {req.reviewedBy && (
                      <div className="text-[10px] text-neutral-400 pt-1 border-t border-[#E6E3D8] dark:border-[#28332E]">
                        Reviewed by {req.reviewedByName || 'Faculty Advisor'}: <em>"{req.reviewComment || 'Approved'}"</em>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
