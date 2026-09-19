import React, { useState } from 'react';
import { 
  ClassroomSettings, 
  Subject, 
  UserProfile 
} from '../types';
import { 
  Settings as SettingsIcon, 
  Save, 
  Sliders, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  ShieldCheck,
  Calendar,
  KeyRound,
  Copy,
  RefreshCw,
  Lock,
  UserCheck
} from 'lucide-react';
import { saveSettings } from '../services/attendanceService';

interface SettingsScreenProps {
  settings: ClassroomSettings;
  subjects: Subject[];
  students: UserProfile[];
  onSaveSettings: (updated: ClassroomSettings) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  subjects,
  students,
  onSaveSettings,
}) => {
  const [minPct, setMinPct] = useState(settings.minimumAttendancePercentage || 75);
  const [classroomName, setClassroomName] = useState(settings.classroomName || 'LH-302, Dept. of Computer Science');
  const [termName, setTermName] = useState(settings.academicTermName || 'Fall Semester 2026');
  const [termStart, setTermStart] = useState(settings.termStartDate || '2026-08-15');
  const [termEnd, setTermEnd] = useState(settings.termEndDate || '2026-12-15');
  const [periodsCount, setPeriodsCount] = useState(settings.periodsPerDay || 4);
  const [classCode, setClassCode] = useState(settings.classCode || 'CS2026-FALL');
  const [allowSignups, setAllowSignups] = useState(settings.allowStudentSignups ?? true);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(classCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRegenerateCode = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newCode = `CS2026-${randomSuffix}`;
    setClassCode(newCode);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const updated: ClassroomSettings = {
      ...settings,
      minimumAttendancePercentage: Number(minPct),
      classroomName,
      academicTermName: termName,
      termStartDate: termStart,
      termEndDate: termEnd,
      periodsPerDay: Number(periodsCount),
      classCode: classCode.trim().toUpperCase(),
      allowStudentSignups: allowSignups,
    };

    try {
      await saveSettings(updated);
      onSaveSettings(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      alert('Error saving settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="settings_screen_container" className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 p-5 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']">
              Classroom & Academic Settings
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Teacher-controlled thresholds, term schedule, and attendance policies
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Attendance Threshold */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-700/60">
            <Sliders className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']">
              Attendance Eligibility Threshold
            </h2>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Minimum Attendance Percentage Requirement: <strong className="text-indigo-600 dark:text-indigo-400 text-sm">{minPct}%</strong>
              </label>
              <span className="text-[11px] text-neutral-400">Default: 75%</span>
            </div>
            <input
              id="input_slider_min_percentage"
              type="range"
              min="50"
              max="90"
              step="1"
              value={minPct}
              onChange={(e) => setMinPct(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Students falling below this threshold will be flagged as defaulters and calculate consecutive recovery classes in their &ldquo;Safe to skip&rdquo; widget.
            </p>
          </div>
        </div>

        {/* Section 2: Term and Room Info */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-700/60">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']">
              Term & Schedule Parameters
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Classroom / Lecture Hall
              </label>
              <input
                type="text"
                value={classroomName}
                onChange={(e) => setClassroomName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Academic Term Name
              </label>
              <input
                type="text"
                value={termName}
                onChange={(e) => setTermName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Term Start Date
              </label>
              <input
                type="date"
                value={termStart}
                onChange={(e) => setTermStart(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Term End Date
              </label>
              <input
                type="date"
                value={termEnd}
                onChange={(e) => setTermEnd(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Class Enrollment & Access Code Management */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-700/60">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']">
                Class Enrollment & Access Codes
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Active Enrollment
            </span>
          </div>

          {/* Class Code Display & Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Active Student Class Code
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="input_class_code"
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 text-xs font-mono font-bold tracking-wider uppercase rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                />
                <button
                  id="btn_copy_class_code"
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 text-xs font-medium flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  title="Copy Class Code"
                >
                  {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  id="btn_regenerate_class_code"
                  type="button"
                  onClick={handleRegenerateCode}
                  className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 text-xs shrink-0 transition-colors cursor-pointer"
                  title="Generate New Code"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-neutral-400">
                Share this code with your students for sign-up. Regenerating this code will not affect already enrolled students.
              </p>
            </div>

            {/* Registration Toggle */}
            <div className="space-y-2 p-3.5 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block">
                    Allow New Student Registrations
                  </span>
                  <span className="text-[11px] text-neutral-400 block mt-0.5">
                    Permit new students and CR candidates to register with the class code.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3">
                  <input
                    id="toggle_allow_signups"
                    type="checkbox"
                    checked={allowSignups}
                    onChange={(e) => setAllowSignups(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 pt-1 border-t border-neutral-200/40 dark:border-neutral-800">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Teacher Access Code is secured server-side on <code className="font-mono text-neutral-600 dark:text-neutral-300">TEACHER_ACCESS_CODE</code>.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Roster Summary */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-700/60">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']">
                Classroom Leadership & Students
              </h2>
            </div>
            <span className="text-xs text-neutral-400">{students.length} Enrolled</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900">
              <span className="font-semibold text-indigo-950 dark:text-indigo-200">
                Class Representatives (CRs):
              </span>
              <span className="text-neutral-600 dark:text-neutral-300 font-mono">
                Rohan Verma (CS2026-01), Sneha Kulkarni (CS2026-02)
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              CRs have same-day roll call creation and edit privileges. Past same-day edits require Teacher approval via the Requests inbox.
            </p>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            id="btn_save_settings"
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
