import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { DEMO_TEACHER, DEMO_CRS, DEMO_STUDENTS } from '../demoData';
import { 
  loginUser, 
  signUpUser, 
  requestPasswordReset, 
  fetchSettings 
} from '../services/attendanceService';
import { 
  GraduationCap, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  KeyRound, 
  Building, 
  BookOpen, 
  Phone, 
  FileBadge, 
  X,
  Send
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
  onSeedRequested?: () => Promise<void>;
  isSeeding?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLogin, 
}) => {
  // Auth Tab: 'login' or 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Selected Role: 'student' | 'cr' | 'teacher'
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');

  // Form Fields - Common
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form Fields - Student & CR
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('4th Year');
  const [section, setSection] = useState('Section A');
  const [classCode, setClassCode] = useState('');

  // Form Fields - Teacher
  const [employeeId, setEmployeeId] = useState('');
  const [subjectsTaught, setSubjectsTaught] = useState('Distributed Systems, Database Engineering');
  const [teacherAccessCode, setTeacherAccessCode] = useState('');

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeClassCodeHint, setActiveClassCodeHint] = useState('CS2026-FALL');

  // Rate Limiting & Lockout State for Teacher Access Code
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);
  const [failedTeacherAttempts, setFailedTeacherAttempts] = useState<number>(0);

  // Forgot Password Modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  // Fetch active class code on mount
  useEffect(() => {
    fetchSettings().then(s => {
      if (s?.classCode) {
        setActiveClassCodeHint(s.classCode);
      }
    }).catch(() => {});
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // Password Strength Calculation
  const calculatePasswordStrength = (pass: string): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: '', color: 'bg-neutral-200 dark:bg-neutral-700' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass) || pass.length >= 12) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, label: 'Medium', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = calculatePasswordStrength(password);

  // Quick Demo Login Button Handler
  const handleQuickDemoLogin = (role: UserRole) => {
    setErrorMessage(null);
    if (role === 'teacher') {
      onLogin(DEMO_TEACHER);
    } else if (role === 'cr') {
      onLogin(DEMO_CRS[0]);
    } else {
      onLogin(DEMO_STUDENTS[2]); // Aarav Mehta
    }
  };

  // Submit Login Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your university email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginUser(email, password);
      onLogin(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Sign Up Handler
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Common validations
    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid university email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    // Role-specific validations
    if (selectedRole === 'teacher') {
      if (lockoutTimer > 0) {
        setErrorMessage(`Security lockout active. Please wait ${lockoutTimer} seconds before retrying.`);
        return;
      }
      if (!teacherAccessCode.trim()) {
        setErrorMessage('Secret Teacher Access Code is required to register faculty accounts.');
        return;
      }
    } else {
      // Student or CR
      if (!rollNumber.trim()) {
        setErrorMessage('Roll Number / Register Number is required.');
        return;
      }
      if (!classCode.trim()) {
        setErrorMessage(`Class Code is required. (e.g. "${activeClassCodeHint}")`);
        return;
      }
    }

    setIsLoading(true);
    try {
      const user = await signUpUser({
        role: selectedRole,
        name: fullName,
        email: email.trim(),
        password,
        phone: phone.trim(),
        rollNumber: rollNumber.trim().toUpperCase(),
        department,
        year,
        section,
        classCode: classCode.trim().toUpperCase(),
        employeeId: employeeId.trim(),
        subjectsTaught: subjectsTaught.split(',').map(s => s.trim()).filter(Boolean),
        teacherAccessCode: teacherAccessCode.trim(),
      });

      if (selectedRole === 'cr') {
        setSuccessMessage('Class Representative account created! Your request is submitted for teacher verification.');
      } else {
        setSuccessMessage('Account created successfully! Logging you in...');
      }

      // Reset lockout if teacher registration succeeded
      if (selectedRole === 'teacher') {
        setFailedTeacherAttempts(0);
      }

      setTimeout(() => {
        onLogin(user);
      }, 1000);
    } catch (err: any) {
      const errorText = err.message || 'Sign up failed.';
      setErrorMessage(errorText);

      // Handle failed teacher code lockout
      if (selectedRole === 'teacher') {
        const nextAttempts = failedTeacherAttempts + 1;
        setFailedTeacherAttempts(nextAttempts);
        if (nextAttempts >= 5) {
          setLockoutTimer(60);
          setErrorMessage('Maximum failed access code attempts reached. Security lockout active for 60 seconds.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Password reset handler
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setIsSendingReset(true);
    setResetFeedback(null);
    try {
      const res = await requestPasswordReset(forgotEmail.trim());
      setResetFeedback(res.message);
    } catch {
      setResetFeedback(`Password reset instructions sent to ${forgotEmail}.`);
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div id="auth_page_root" className="min-h-screen w-full bg-neutral-900 text-neutral-100 flex items-center justify-center p-0 lg:p-6 font-['Plus_Jakarta_Sans'] selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container: Split on Desktop, Centered on Mobile */}
      <div className="w-full max-w-6xl min-h-screen lg:min-h-[640px] bg-neutral-900 lg:bg-neutral-900/80 lg:border lg:border-neutral-800 lg:rounded-3xl lg:shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 backdrop-blur-xl z-10">
        
        {/* ================= LEFT BRANDED PANEL (Desktop Only) ================= */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-indigo-950/80 via-neutral-900 to-indigo-950/40 p-10 flex-col justify-between border-r border-neutral-800/80 relative overflow-hidden">
          
          {/* Subtle geometric pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

          {/* Top Brand Logo & Name */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 ring-4 ring-indigo-500/10">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <span className="text-2xl font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  AttendEase
                </span>
                <span className="block text-[11px] font-medium tracking-wide text-indigo-300 uppercase">
                  Classroom Attendance Ledger
                </span>
              </div>
            </div>

            <p className="mt-8 text-xl font-medium text-neutral-200 leading-snug">
              Attendance made <span className="text-indigo-400 font-semibold">simple</span>,{' '}
              <span className="text-emerald-400 font-semibold">transparent</span>, and{' '}
              <span className="text-amber-400 font-semibold">tamper-proof</span>.
            </p>

            <p className="mt-3 text-xs text-neutral-400 leading-relaxed">
              Replacing vulnerable paper notebooks with an append-only digital record. Mistakes are never covered up; every correction is logged with a permanent audit trail.
            </p>
          </div>

          {/* Core Feature Value Badges */}
          <div className="relative z-10 space-y-3.5 my-8">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-sm">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-200">Zero-Deletion Guarantee</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Records can never be erased or wiped. Every adjustment requires justification and timestamps.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-sm">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-200">Append-Only Audit Trail</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Complete immutable ledger showing who marked, when edited, previous status, and instructor approvals.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-sm">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-200">Role-Based Transparency</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Teachers hold final authority; CRs execute rapid roll calls; Students monitor Safe-to-Skip margins.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="relative z-10 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
            <span>Fall Term 2026</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Ledger Active
            </span>
          </div>
        </div>

        {/* ================= RIGHT FORM PANEL (Desktop & Mobile) ================= */}
        <div className="col-span-1 lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between overflow-y-auto max-h-screen lg:max-h-[850px]">
          
          <div className="space-y-6">
            
            {/* Mobile Header Brand */}
            <div className="lg:hidden flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white">AttendEase</h2>
                  <p className="text-[11px] text-neutral-400">Classroom Attendance System</p>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                2026 Term
              </span>
            </div>

            {/* Top Toggle: Log In / Sign Up */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  {authMode === 'login' 
                    ? 'Select your role and sign in to your dashboard' 
                    : 'Join your class or register as faculty'}
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex p-1 bg-neutral-800 rounded-xl border border-neutral-700/80 text-xs">
                <button
                  id="tab_auth_login"
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Log In
                </button>
                <button
                  id="tab_auth_signup"
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Error / Success Banners */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMessage}</div>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">{successMessage}</div>
              </div>
            )}

            {/* STEP 1: ROLE SELECTOR CARDS (3 large cards with icons) */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2.5">
                Select Your Role
              </label>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                
                {/* Student Card */}
                <button
                  id="role_card_student"
                  type="button"
                  onClick={() => {
                    setSelectedRole('student');
                    setErrorMessage(null);
                  }}
                  className={`p-3 sm:p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                    selectedRole === 'student'
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500'
                      : 'bg-neutral-800/70 border-neutral-700/80 hover:bg-neutral-800 hover:border-neutral-600'
                  }`}
                >
                  {selectedRole === 'student' && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-400 ring-2 ring-indigo-500/20" />
                  )}
                  <div className={`p-2 rounded-xl w-fit ${
                    selectedRole === 'student' ? 'bg-indigo-600 text-white' : 'bg-neutral-700/60 text-neutral-300'
                  }`}>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="mt-3">
                    <span className="block text-xs sm:text-sm font-bold text-white">Student</span>
                    <span className="block text-[10px] text-neutral-400 mt-0.5 leading-tight line-clamp-2">
                      View attendance, margin & disputes
                    </span>
                  </div>
                </button>

                {/* CR Card */}
                <button
                  id="role_card_cr"
                  type="button"
                  onClick={() => {
                    setSelectedRole('cr');
                    setErrorMessage(null);
                  }}
                  className={`p-3 sm:p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                    selectedRole === 'cr'
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500'
                      : 'bg-neutral-800/70 border-neutral-700/80 hover:bg-neutral-800 hover:border-neutral-600'
                  }`}
                >
                  {selectedRole === 'cr' && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-400 ring-2 ring-indigo-500/20" />
                  )}
                  <div className={`p-2 rounded-xl w-fit ${
                    selectedRole === 'cr' ? 'bg-indigo-600 text-white' : 'bg-neutral-700/60 text-neutral-300'
                  }`}>
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="mt-3">
                    <span className="block text-xs sm:text-sm font-bold text-white">Class Rep (CR)</span>
                    <span className="block text-[10px] text-neutral-400 mt-0.5 leading-tight line-clamp-2">
                      Mark roll call & same-day edits
                    </span>
                  </div>
                </button>

                {/* Teacher Card */}
                <button
                  id="role_card_teacher"
                  type="button"
                  onClick={() => {
                    setSelectedRole('teacher');
                    setErrorMessage(null);
                  }}
                  className={`p-3 sm:p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                    selectedRole === 'teacher'
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500'
                      : 'bg-neutral-800/70 border-neutral-700/80 hover:bg-neutral-800 hover:border-neutral-600'
                  }`}
                >
                  {selectedRole === 'teacher' && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-400 ring-2 ring-indigo-500/20" />
                  )}
                  <div className={`p-2 rounded-xl w-fit ${
                    selectedRole === 'teacher' ? 'bg-indigo-600 text-white' : 'bg-neutral-700/60 text-neutral-300'
                  }`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="mt-3">
                    <span className="block text-xs sm:text-sm font-bold text-white">Teacher</span>
                    <span className="block text-[10px] text-neutral-400 mt-0.5 leading-tight line-clamp-2">
                      Full control, rules & approvals
                    </span>
                  </div>
                </button>

              </div>
            </div>

            {/* ================= FORM: LOG IN ================= */}
            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    University Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="login_email_input"
                      type="email"
                      required
                      placeholder={
                        selectedRole === 'teacher' 
                          ? 'teacher@attendease.edu' 
                          : selectedRole === 'cr' 
                          ? 'cr.rohan@attendease.edu' 
                          : 'aarav.mehta@attendease.edu'
                      }
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-800/90 border border-neutral-700 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password Field with Show/Hide Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-neutral-300">
                      Password
                    </label>
                    <button
                      id="btn_forgot_password"
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setIsForgotModalOpen(true);
                        setResetFeedback(null);
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login_password_input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-neutral-800/90 border border-neutral-700 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  id="btn_submit_login"
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>{isLoading ? 'Signing In...' : `Sign In as ${selectedRole.toUpperCase()}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

              </form>
            ) : (
              /* ================= FORM: SIGN UP ================= */
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                
                {/* Full Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      id="signup_fullname_input"
                      type="text"
                      required
                      placeholder="e.g. Vikram Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800/90 border border-neutral-700 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <input
                        id="signup_phone_input"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-neutral-800/90 border border-neutral-700 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* University Email */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    University Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="signup_email_input"
                      type="email"
                      required
                      placeholder={selectedRole === 'teacher' ? 'faculty.name@attendease.edu' : 'student.name@attendease.edu'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-800/90 border border-neutral-700 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Password * (Min 8 chars)
                    </label>
                    <div className="relative">
                      <input
                        id="signup_password_input"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 pr-10 py-2.5 rounded-xl bg-neutral-800/90 border border-neutral-700 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        id="signup_confirm_password_input"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3.5 pr-10 py-2.5 rounded-xl bg-neutral-800/90 border border-neutral-700 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-200 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Visual Password Strength Indicator */}
                {password && (
                  <div className="p-2.5 bg-neutral-800/60 rounded-xl border border-neutral-700/60 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-neutral-400">Password Strength:</span>
                      <span className={`font-semibold ${
                        passwordStrength.score === 1 
                          ? 'text-rose-400' 
                          : passwordStrength.score === 2 
                          ? 'text-amber-400' 
                          : 'text-emerald-400'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-700 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-transparent'}`} />
                    </div>
                  </div>
                )}

                {/* ROLE-SPECIFIC FIELDS */}
                {selectedRole === 'teacher' ? (
                  /* Teacher Fields */
                  <div className="space-y-3 pt-2 border-t border-neutral-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Department
                        </label>
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Employee ID *
                        </label>
                        <input
                          id="signup_employee_id"
                          type="text"
                          required
                          placeholder="e.g. EMP-CS104"
                          value={employeeId}
                          onChange={(e) => setEmployeeId(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Subjects Taught (comma separated)
                      </label>
                      <input
                        type="text"
                        placeholder="Distributed Systems, Database Engineering"
                        value={subjectsTaught}
                        onChange={(e) => setSubjectsTaught(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs"
                      />
                    </div>

                    {/* Teacher Secret Access Code */}
                    <div className="p-3 bg-neutral-800/80 rounded-xl border border-amber-500/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Teacher Access Code * (Server Verified)</span>
                        </label>
                        {lockoutTimer > 0 && (
                          <span className="text-[11px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-800">
                            Locked: {lockoutTimer}s
                          </span>
                        )}
                      </div>
                      <input
                        id="signup_teacher_access_code"
                        type="password"
                        required
                        disabled={lockoutTimer > 0}
                        placeholder="Enter secret departmental code"
                        value={teacherAccessCode}
                        onChange={(e) => setTeacherAccessCode(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                      <p className="text-[10px] text-neutral-400">
                        Secret code provided to university faculty. Verified on the server; never exposed to client scripts. (Default: <code className="text-amber-300">TEACHER2026</code>)
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Student & CR Fields */
                  <div className="space-y-3 pt-2 border-t border-neutral-800">
                    
                    {/* CR Information Notice */}
                    {selectedRole === 'cr' && (
                      <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/80 text-purple-200 text-xs flex items-start gap-2">
                        <UserCheck className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                        <div>
                          <strong>Class Representative Approval Flow:</strong> Your account will be created with status <span className="underline font-semibold">pending</span>. You can mark attendance once approved by your instructor in the Requests inbox.
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Roll / Register Number *
                        </label>
                        <input
                          id="signup_roll_number"
                          type="text"
                          required
                          placeholder="e.g. CS2026-30"
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                          className="w-full px-3.5 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs font-mono"
                        />
                        <span className="text-[10px] text-neutral-400">Must be unique within class</span>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Class Code *
                        </label>
                        <input
                          id="signup_class_code"
                          type="text"
                          required
                          placeholder={`e.g. ${activeClassCodeHint}`}
                          value={classCode}
                          onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                          className="w-full px-3.5 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs font-mono uppercase"
                        />
                        <span className="text-[10px] text-neutral-400">Shared by your instructor</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-400 mb-1">Department</label>
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-400 mb-1">Year</label>
                        <select
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs"
                        >
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-400 mb-1">Section</label>
                        <input
                          type="text"
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-xs"
                        />
                      </div>
                    </div>

                  </div>
                )}

                {/* Submit Sign Up Button */}
                <button
                  id="btn_submit_signup"
                  type="submit"
                  disabled={isLoading || (selectedRole === 'teacher' && lockoutTimer > 0)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <span>{isLoading ? 'Creating Account...' : `Register as ${selectedRole.toUpperCase()}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

              </form>
            )}

            {/* ================= 1-TAP DEMO LOGIN SWITCHER ================= */}
            <div className="pt-4 border-t border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  1-Tap Instant Demo Login
                </span>
                <span className="inline-flex items-center text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-2.5 h-2.5 mr-1" /> Live Preview
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  id="demo_login_teacher"
                  type="button"
                  onClick={() => handleQuickDemoLogin('teacher')}
                  className="py-2 px-2.5 rounded-xl bg-neutral-800 hover:bg-indigo-950/60 hover:border-indigo-500 border border-neutral-700 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-200 group-hover:text-indigo-400 text-xs">Teacher</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <span className="block text-[10px] text-neutral-400 truncate mt-0.5">Prof. Sharma</span>
                </button>

                <button
                  id="demo_login_cr"
                  type="button"
                  onClick={() => handleQuickDemoLogin('cr')}
                  className="py-2 px-2.5 rounded-xl bg-neutral-800 hover:bg-indigo-950/60 hover:border-indigo-500 border border-neutral-700 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-200 group-hover:text-indigo-400 text-xs">Class Rep</span>
                    <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <span className="block text-[10px] text-neutral-400 truncate mt-0.5">Rohan Verma</span>
                </button>

                <button
                  id="demo_login_student"
                  type="button"
                  onClick={() => handleQuickDemoLogin('student')}
                  className="py-2 px-2.5 rounded-xl bg-neutral-800 hover:bg-indigo-950/60 hover:border-indigo-500 border border-neutral-700 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-200 group-hover:text-indigo-400 text-xs">Student</span>
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="block text-[10px] text-neutral-400 truncate mt-0.5">Aarav Mehta</span>
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Security Note */}
          <div className="pt-6 mt-4 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Secured with SHA-256 & Firestore RBAC
            </span>
            <span>AttendEase v2.0</span>
          </div>

        </div>

      </div>

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Reset Your Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Enter your registered university email address. We will dispatch a password recovery link to your inbox.
            </p>

            {resetFeedback ? (
              <div className="p-4 rounded-xl bg-indigo-950/80 border border-indigo-800 text-indigo-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  <span>Request Dispatched</span>
                </div>
                <p>{resetFeedback}</p>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="mt-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    University Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@attendease.edu"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingReset}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingReset ? 'Sending...' : 'Send Reset Link'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
