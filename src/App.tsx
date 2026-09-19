import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  Subject, 
  AttendanceRecord, 
  AttendanceRequest, 
  ClassroomSettings,
  AuditLogEntry 
} from './types';
import { 
  DEMO_TEACHER, 
  DEMO_CRS, 
  DEMO_STUDENTS, 
  DEMO_SUBJECTS, 
  DEFAULT_SETTINGS 
} from './demoData';
import { 
  seedDatabaseIfEmpty, 
  fetchUsers, 
  fetchSubjects, 
  fetchSettings, 
  fetchRecordAuditLogs 
} from './services/attendanceService';
import { db } from './firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

// Subcomponents
import { LoginScreen } from './components/LoginScreen';
import { PendingApprovalScreen } from './components/PendingApprovalScreen';
import { TeacherDashboard } from './components/TeacherDashboard';
import { FastMarkingScreen } from './components/FastMarkingScreen';
import { AttendanceTable } from './components/AttendanceTable';
import { StudentDashboard } from './components/StudentDashboard';
import { RequestsInbox } from './components/RequestsInbox';
import { SettingsScreen } from './components/SettingsScreen';
import { RecordHistoryDrawer } from './components/RecordHistoryDrawer';
import { EditRecordModal } from './components/EditRecordModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { MasterTimetableScreen } from './components/MasterTimetableScreen';
import { LeaveApplicationScreen } from './components/LeaveApplicationScreen';
import { AcademicLayout } from './components/AcademicLayout';

// Icons
import { 
  GraduationCap, 
  ShieldCheck, 
  UserCheck, 
  Table2, 
  CheckSquare, 
  Inbox, 
  Settings as SettingsIcon, 
  Bell, 
  LogOut, 
  Wifi, 
  WifiOff, 
  Moon, 
  Sun, 
  ChevronDown,
  LayoutDashboard,
  Grid,
  Calendar,
  FileText,
  Menu,
  X,
  BookOpen,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Offline network status tracking: "Works on weak networks: enable Firestore offline persistence... Show a small 'Offline – will sync' indicator"
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync dark mode class with root document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Auth User State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('attendease_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEMO_TEACHER;
      }
    }
    return DEMO_TEACHER; // Start with teacher active for immediate reviewer testing
  });

  // Application Data States
  const [users, setUsers] = useState<UserProfile[]>([DEMO_TEACHER, ...DEMO_STUDENTS]);
  const [subjects, setSubjects] = useState<Subject[]>(DEMO_SUBJECTS);
  const [settings, setSettings] = useState<ClassroomSettings>(DEFAULT_SETTINGS);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Navigation State
  // 'dashboard' | 'day_view_grid' | 'fast_marking' | 'table' | 'timetable' | 'leave_application' | 'requests' | 'settings' | 'student_home'
  const [activeScreen, setActiveScreen] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [markingPreload, setMarkingPreload] = useState<{
    subjectId?: string;
    period?: number;
    mode?: 'single' | 'day_grid';
  }>({ mode: 'single' });

  const handleNavigateToMarking = (subjectId?: string, period?: number, mode: 'single' | 'day_grid' = 'single') => {
    setMarkingPreload({ subjectId, period, mode });
    if (mode === 'day_grid') {
      setActiveScreen('day_view_grid');
    } else {
      setActiveScreen('fast_marking');
    }
  };

  // Drawers & Modals
  const [historyRecord, setHistoryRecord] = useState<AttendanceRecord | null>(null);
  const [historyLogs, setHistoryLogs] = useState<AuditLogEntry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [editTargetRecord, setEditTargetRecord] = useState<AttendanceRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);

  // Seeding state
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState<string | null>(null);

  // Save current user to localStorage
  const handleSetCurrentUser = (user: UserProfile | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('attendease_user', JSON.stringify(user));
      // Route appropriately based on role
      if (user.role === 'student') {
        setActiveScreen('student_home');
      } else {
        setActiveScreen('dashboard');
      }
    } else {
      localStorage.removeItem('attendease_user');
    }
  };

  // Seed on startup if database is empty
  useEffect(() => {
    async function initData() {
      try {
        setIsSeeding(true);
        await seedDatabaseIfEmpty((progress) => setSeedProgress(progress));
        const [loadedUsers, loadedSubjects, loadedSettings] = await Promise.all([
          fetchUsers(),
          fetchSubjects(),
          fetchSettings(),
        ]);
        if (loadedUsers.length) setUsers(loadedUsers);
        if (loadedSubjects.length) setSubjects(loadedSubjects);
        if (loadedSettings) setSettings(loadedSettings);
      } catch (err) {
        console.warn('Init error:', err);
      } finally {
        setIsSeeding(false);
        setSeedProgress(null);
      }
    }
    initData();
  }, []);

  // Real-time Firestore Listeners with offline cache support
  useEffect(() => {
    // 1. Attendance records listener
    const qAtt = query(collection(db, 'attendance'));
    const unsubAtt = onSnapshot(qAtt, (snap) => {
      const recs = snap.docs.map(d => d.data() as AttendanceRecord);
      setAttendanceRecords(recs);
    }, (err) => console.warn('Attendance sync:', err));

    // 2. Requests listener
    const qReq = query(collection(db, 'requests'));
    const unsubReq = onSnapshot(qReq, (snap) => {
      const list = snap.docs.map(d => ({ ...d.data(), id: d.id }) as AttendanceRequest);
      setRequests(list);
    }, (err) => console.warn('Requests sync:', err));

    return () => {
      unsubAtt();
      unsubReq();
    };
  }, []);

  // Notifications count listener
  useEffect(() => {
    if (!currentUser) return;
    const qNotif = query(collection(db, 'notifications'));
    const unsubNotif = onSnapshot(qNotif, (snap) => {
      const myNotifs = snap.docs
        .map(d => d.data())
        .filter((n: any) => n.recipientId === currentUser.id && !n.read);
      setUnreadNotifCount(myNotifs.length);
    }, (err) => console.warn('Notif count:', err));

    return () => unsubNotif();
  }, [currentUser]);

  // Handle open history drawer
  const handleOpenHistory = async (record: AttendanceRecord) => {
    setHistoryRecord(record);
    setIsHistoryOpen(true);
    setIsHistoryLoading(true);
    try {
      const logs = await fetchRecordAuditLogs(record.id);
      setHistoryLogs(logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setHistoryLogs([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // If no user logged in, show Login Screen
  if (!currentUser) {
    return (
      <LoginScreen 
        onLogin={handleSetCurrentUser}
        onSeedRequested={async () => {
          setIsSeeding(true);
          await seedDatabaseIfEmpty();
          setIsSeeding(false);
        }}
        isSeeding={isSeeding}
      />
    );
  }

  // If user is a CR with pending approval status, show friendly pending screen
  if (currentUser.role === 'cr' && currentUser.status === 'pending') {
    return (
      <PendingApprovalScreen
        currentUser={currentUser}
        onStatusUpdated={handleSetCurrentUser}
        onLogout={() => handleSetCurrentUser(null)}
      />
    );
  }

  // Students list (excluding teacher)
  const studentsList = users.filter(u => u.role === 'student' || u.role === 'cr');

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#121614] text-neutral-900 dark:text-[#E8EFEA] flex flex-col font-sans antialiased">
      
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setActiveScreen(currentUser.role === 'student' ? 'student_home' : 'dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-1.5">
                  AttendEase
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                    {currentUser.role.toUpperCase()}
                  </span>
                </span>
                <span className="text-[11px] text-neutral-400 hidden sm:block">
                  Append-Only Attendance Ledger
                </span>
              </div>
            </div>

            {/* Offline sync status badge */}
            <div className="ml-2 hidden sm:flex items-center">
              {!isOnline ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <WifiOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Offline – will sync</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                  <Wifi className="w-3 h-3 text-emerald-500" />
                  <span>Cloud Synced</span>
                </span>
              )}
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {currentUser.role === 'student' ? (
              <>
                <button
                  id="nav_student_dashboard"
                  type="button"
                  onClick={() => setActiveScreen('student_home')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeScreen === 'student_home'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  My Attendance
                </button>
                <button
                  id="nav_student_table"
                  type="button"
                  onClick={() => setActiveScreen('table')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeScreen === 'table'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Session History
                </button>
              </>
            ) : (
              <>
                <button
                  id="nav_teacher_dashboard"
                  type="button"
                  onClick={() => setActiveScreen('dashboard')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeScreen === 'dashboard'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
                <button
                  id="nav_fast_marking"
                  type="button"
                  onClick={() => setActiveScreen('fast_marking')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeScreen === 'fast_marking'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Fast Roll Call</span>
                </button>
                <button
                  id="nav_table_view"
                  type="button"
                  onClick={() => setActiveScreen('table')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeScreen === 'table'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Table2 className="w-3.5 h-3.5" />
                  <span>Records & Summary</span>
                </button>
                <button
                  id="nav_requests_inbox"
                  type="button"
                  onClick={() => setActiveScreen('requests')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all relative flex items-center gap-1.5 ${
                    activeScreen === 'requests'
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Requests</span>
                  {requests.filter(r => r.status === 'pending').length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </button>
                {currentUser.role === 'teacher' && (
                  <button
                    id="nav_settings"
                    type="button"
                    onClick={() => setActiveScreen('settings')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeScreen === 'settings'
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <SettingsIcon className="w-3.5 h-3.5" />
                    <span>Settings</span>
                  </button>
                )}
              </>
            )}
          </nav>

          {/* Right Action Bar: Dark Mode, Bell, Active User / Quick Switcher */}
          <div className="flex items-center gap-2">
            
            {/* Dark mode toggle */}
            <button
              id="btn_toggle_dark_mode"
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification Bell */}
            <button
              id="btn_open_notifications"
              type="button"
              onClick={() => setIsNotifDrawerOpen(true)}
              className="relative p-2 rounded-xl text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-neutral-900" />
              )}
            </button>

            {/* Quick Demo Switcher / User Profile dropdown */}
            <div className="relative">
              <button
                id="btn_user_profile_menu"
                type="button"
                onClick={() => setIsRoleSwitcherOpen(!isRoleSwitcherOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-left"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  {currentUser.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    Switch Role ▾
                  </div>
                </div>
              </button>

              {/* Role Switcher Menu */}
              {isRoleSwitcherOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-2 z-50">
                  <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Switch Active Persona
                    </span>
                  </div>

                  <div className="space-y-1 py-1 text-xs">
                    {/* Teacher */}
                    <button
                      type="button"
                      onClick={() => {
                        handleSetCurrentUser(DEMO_TEACHER);
                        setIsRoleSwitcherOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left"
                    >
                      <div>
                        <div className="font-bold text-neutral-900 dark:text-white">Prof. Ananya Sharma</div>
                        <div className="text-[11px] text-neutral-400">Teacher • Full Control</div>
                      </div>
                      {currentUser.id === DEMO_TEACHER.id && <span className="text-indigo-600 text-xs">✓</span>}
                    </button>

                    {/* CR Rohan */}
                    <button
                      type="button"
                      onClick={() => {
                        handleSetCurrentUser(DEMO_CRS[0]);
                        setIsRoleSwitcherOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left"
                    >
                      <div>
                        <div className="font-bold text-neutral-900 dark:text-white">Rohan Verma (CR)</div>
                        <div className="text-[11px] text-neutral-400">Class Rep • CS2026-01</div>
                      </div>
                      {currentUser.id === DEMO_CRS[0].id && <span className="text-indigo-600 text-xs">✓</span>}
                    </button>

                    {/* Student 1 (Critical Defaulter Demo) */}
                    <button
                      type="button"
                      onClick={() => {
                        const s = DEMO_STUDENTS.find(st => st.id === 'stud_07') || DEMO_STUDENTS[2];
                        handleSetCurrentUser(s);
                        setIsRoleSwitcherOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left"
                    >
                      <div>
                        <div className="font-bold text-neutral-900 dark:text-white">Ishaan Gupta (Student)</div>
                        <div className="text-[11px] text-amber-500">Defaulter (~60%) Alert demo</div>
                      </div>
                      {currentUser.id === 'stud_07' && <span className="text-indigo-600 text-xs">✓</span>}
                    </button>

                    {/* Student 2 (Standard Student) */}
                    <button
                      type="button"
                      onClick={() => {
                        handleSetCurrentUser(DEMO_STUDENTS[2]);
                        setIsRoleSwitcherOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left"
                    >
                      <div>
                        <div className="font-bold text-neutral-900 dark:text-white">Aarav Mehta (Student)</div>
                        <div className="text-[11px] text-neutral-400">Regular Student (~88%)</div>
                      </div>
                      {currentUser.id === 'stud_03' && <span className="text-indigo-600 text-xs">✓</span>}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => {
                        handleSetCurrentUser(null);
                        setIsRoleSwitcherOpen(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Prominent Log Out button accessible from every role's dashboard */}
            <button
              id="btn_header_logout"
              type="button"
              onClick={() => handleSetCurrentUser(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-rose-300 dark:hover:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold transition-all cursor-pointer"
              title="Sign out of AttendEase"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>

          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeScreen === 'dashboard' && (
          <TeacherDashboard
            currentUser={currentUser}
            records={attendanceRecords}
            subjects={subjects}
            students={studentsList}
            requests={requests}
            settings={settings}
            onNavigateToFastMarking={() => setActiveScreen('fast_marking')}
            onNavigateToTable={() => setActiveScreen('table')}
            onNavigateToRequests={() => setActiveScreen('requests')}
            onOpenHistory={handleOpenHistory}
          />
        )}

        {activeScreen === 'fast_marking' && (
          <FastMarkingScreen
            currentUser={currentUser}
            subjects={subjects}
            students={studentsList}
            settings={settings}
            records={attendanceRecords}
            onSaved={() => setActiveScreen('table')}
            onNavigateToTable={() => setActiveScreen('table')}
          />
        )}

        {activeScreen === 'table' && (
          <AttendanceTable
            records={attendanceRecords}
            subjects={subjects}
            students={studentsList}
            currentUser={currentUser}
            settings={settings}
            onOpenHistory={handleOpenHistory}
            onOpenEdit={(rec) => {
              setEditTargetRecord(rec);
              setIsEditModalOpen(true);
            }}
            onRaiseDispute={async (rec) => {
              // Open dispute flow
              setActiveScreen('student_home');
            }}
          />
        )}

        {activeScreen === 'student_home' && (
          <StudentDashboard
            student={currentUser}
            records={attendanceRecords}
            subjects={subjects}
            settings={settings}
            requests={requests.filter(r => r.studentId === currentUser.id)}
            onOpenHistory={handleOpenHistory}
            onRefreshData={() => {}}
          />
        )}

        {activeScreen === 'requests' && (
          <RequestsInbox
            requests={requests}
            currentUser={currentUser}
            onRefreshData={() => {}}
          />
        )}

        {activeScreen === 'settings' && (
          <SettingsScreen
            settings={settings}
            subjects={subjects}
            students={studentsList}
            onSaveSettings={(updated) => setSettings(updated)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 py-2 px-4 flex items-center justify-around text-[10px] font-semibold">
        {currentUser.role === 'student' ? (
          <>
            <button
              onClick={() => setActiveScreen('student_home')}
              className={`flex flex-col items-center gap-1 ${
                activeScreen === 'student_home' ? 'text-indigo-600' : 'text-neutral-400'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              <span>My Stats</span>
            </button>
            <button
              onClick={() => setActiveScreen('table')}
              className={`flex flex-col items-center gap-1 ${
                activeScreen === 'table' ? 'text-indigo-600' : 'text-neutral-400'
              }`}
            >
              <Table2 className="w-5 h-5" />
              <span>History</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveScreen('dashboard')}
              className={`flex flex-col items-center gap-1 ${
                activeScreen === 'dashboard' ? 'text-indigo-600' : 'text-neutral-400'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveScreen('fast_marking')}
              className={`flex flex-col items-center gap-1 ${
                activeScreen === 'fast_marking' ? 'text-indigo-600' : 'text-neutral-400'
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              <span>Fast Mark</span>
            </button>
            <button
              onClick={() => setActiveScreen('table')}
              className={`flex flex-col items-center gap-1 ${
                activeScreen === 'table' ? 'text-indigo-600' : 'text-neutral-400'
              }`}
            >
              <Table2 className="w-5 h-5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setActiveScreen('requests')}
              className={`flex flex-col items-center gap-1 relative ${
                activeScreen === 'requests' ? 'text-indigo-600' : 'text-neutral-400'
              }`}
            >
              <Inbox className="w-5 h-5" />
              <span>Requests</span>
              {requests.filter(r => r.status === 'pending').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-0 right-3" />
              )}
            </button>
          </>
        )}
      </div>

      {/* Slide-over Audit Trail History Drawer ("CORE RULE: NOTHING IS EVER ERASED") */}
      <RecordHistoryDrawer
        record={historyRecord}
        logs={historyLogs}
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setHistoryRecord(null);
        }}
        isLoading={isHistoryLoading}
      />

      {/* Edit Record Modal (with CR same-day check & audit logging) */}
      <EditRecordModal
        record={editTargetRecord}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditTargetRecord(null);
        }}
        currentUser={currentUser}
        onSuccess={() => {}}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        userId={currentUser.id}
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        onNavigateToRequests={() => setActiveScreen('requests')}
      />

    </div>
  );
}
