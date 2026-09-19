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

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Offline network status tracking
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

  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

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
  const [activeScreen, setActiveScreen] = useState<string>(() => {
    return currentUser?.role === 'student' ? 'student_home' : 'dashboard';
  });

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

  // Seeding state
  const [isSeeding, setIsSeeding] = useState(false);

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
        await seedDatabaseIfEmpty();
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
    <AcademicLayout
      currentUser={currentUser}
      activeScreen={activeScreen}
      onNavigate={(screen) => setActiveScreen(screen)}
      isOnline={isOnline}
      unreadNotifCount={unreadNotifCount}
      onOpenNotifications={() => setIsNotifDrawerOpen(true)}
      isDarkMode={isDarkMode}
      onToggleDarkMode={handleToggleDarkMode}
      onSwitchPersona={(user) => handleSetCurrentUser(user)}
      pendingRequestsCount={requests.filter(r => r.status === 'pending').length}
    >
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
          onNavigateToDayGrid={() => setActiveScreen('day_view_grid')}
        />
      )}

      {activeScreen === 'day_view_grid' && (
        <FastMarkingScreen
          currentUser={currentUser}
          subjects={subjects}
          students={studentsList}
          settings={settings}
          records={attendanceRecords}
          initialMode="day_grid"
          onSaved={() => setActiveScreen('table')}
          onNavigateToTable={() => setActiveScreen('table')}
        />
      )}

      {activeScreen === 'fast_marking' && (
        <FastMarkingScreen
          currentUser={currentUser}
          subjects={subjects}
          students={studentsList}
          settings={settings}
          records={attendanceRecords}
          initialMode="single"
          initialSubjectId={markingPreload.subjectId}
          initialPeriod={markingPreload.period}
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
          onRaiseDispute={async () => {
            setActiveScreen('student_home');
          }}
        />
      )}

      {activeScreen === 'timetable' && (
        <MasterTimetableScreen
          currentUser={currentUser}
          subjects={subjects}
          attendanceRecords={attendanceRecords}
          settings={settings}
          onNavigateToMarking={(subId, period) => {
            handleNavigateToMarking(subId, period, 'single');
          }}
          onNavigateToTable={() => setActiveScreen('table')}
        />
      )}

      {activeScreen === 'leave_application' && (
        <LeaveApplicationScreen
          currentUser={currentUser}
          requests={requests}
          subjects={subjects}
          attendanceRecords={attendanceRecords}
          settings={settings}
          onNavigateToInbox={() => setActiveScreen('requests')}
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
          onNavigateToLeaveApplication={() => setActiveScreen('leave_application')}
          onNavigateToTimetable={() => setActiveScreen('timetable')}
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

      {/* Slide-over Audit Trail History Drawer */}
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
    </AcademicLayout>
  );
}
