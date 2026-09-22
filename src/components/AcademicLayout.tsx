import React, { useState } from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  Table2,
  CheckSquare,
  Grid,
  Calendar,
  FileText,
  Inbox,
  Settings as SettingsIcon,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  X,
  School
} from 'lucide-react';
import { UserProfile as User } from '../types';
import { DEMO_TEACHER, DEMO_CRS, DEMO_STUDENTS } from '../demoData';

const TEACHER_PORTRAIT_URL = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80";

interface AcademicLayoutProps {
  currentUser: User;
  activeScreen: string;
  onNavigate: (screen: string) => void;
  isOnline: boolean;
  unreadNotifCount: number;
  onOpenNotifications: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onSwitchPersona: (user: User | null) => void;
  pendingRequestsCount: number;
  children: React.ReactNode;
}

export const AcademicLayout: React.FC<AcademicLayoutProps> = ({
  currentUser,
  activeScreen,
  onNavigate,
  isOnline,
  unreadNotifCount,
  onOpenNotifications,
  isDarkMode,
  onToggleDarkMode,
  onSwitchPersona,
  pendingRequestsCount,
  children,
}) => {
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = currentUser.role === 'student' ? [
    { id: 'student_home', label: 'My Dashboard', icon: LayoutDashboard },
    { id: 'timetable', label: 'Master Timetable', icon: Calendar },
    { id: 'leave_application', label: 'Apply for Leave / OD', icon: FileText },
    { id: 'table', label: 'Attendance Ledger', icon: Table2 },
    { id: 'requests', label: 'Requests & Status', icon: Inbox, badge: pendingRequestsCount },
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'day_view_grid', label: 'Daily Attendance Matrix', icon: Grid },
    { id: 'fast_marking', label: 'Period Marking', icon: CheckSquare },
    { id: 'table', label: 'Attendance Ledger', icon: Table2 },
    { id: 'timetable', label: 'Master Timetable', icon: Calendar },
    { id: 'leave_application', label: 'Leave & OD Portal', icon: FileText },
    { id: 'requests', label: 'Requests & Approvals', icon: Inbox, badge: pendingRequestsCount },
    ...(currentUser.role === 'teacher' || currentUser.role === 'cr' || currentUser.isCR ? [
      { 
        id: 'classroom_manager', 
        label: currentUser.role === 'teacher' ? 'Class & AI Roster' : 'Subjects & Courses', 
        icon: School 
      },
    ] : []),
    ...(currentUser.role === 'teacher' ? [
      { id: 'settings', label: 'Settings & Rules', icon: SettingsIcon },
    ] : []),
  ];

  const handleNav = (screenId: string) => {
    onNavigate(screenId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#121614] text-neutral-900 dark:text-[#E8EFEA] flex flex-col md:flex-row font-sans antialiased">
      
      {/* 1. Desktop Left Sidebar (Academic Ledger Layout) */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#F6F4EB] dark:bg-[#151B18] border-r border-[#E6E3D8] dark:border-[#28332E] h-screen sticky top-0 z-30 shrink-0 select-none">
        
        {/* Brand & Institution Header */}
        <div className="p-5 border-b border-[#E6E3D8] dark:border-[#28332E]">
          <div 
            onClick={() => handleNav(currentUser.role === 'student' ? 'student_home' : 'dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#13523B] text-white flex items-center justify-center shadow-md shadow-[#13523B]/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-[#FAF9F5]" />
            </div>
            <div>
              <div className="font-serif font-bold text-lg text-[#0D3828] dark:text-[#E8EFEA] tracking-tight leading-none">
                AttendEase
              </div>
              <div className="font-mono text-[9px] font-bold text-[#13523B] dark:text-emerald-400 uppercase tracking-widest mt-1">
                Academic Ledger
              </div>
            </div>
          </div>

          {/* Network Sync Status Badge */}
          <div className="mt-3.5 pt-3 border-t border-[#E6E3D8]/80 dark:border-[#28332E]/80 flex items-center justify-between text-[11px]">
            <span className="text-neutral-500 dark:text-neutral-400 font-mono text-[10px]">Cloud Sync</span>
            {!isOnline ? (
              <span className="inline-flex items-center gap-1 text-[#BA3C2A] font-mono text-[10px] font-bold">
                <WifiOff className="w-3 h-3 text-[#BA3C2A]" />
                <span>Offline – will sync</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#13523B] dark:text-emerald-400 font-mono text-[10px] font-bold">
                <Wifi className="w-3 h-3 text-[#13523B] dark:text-emerald-400" />
                <span>Live Synchronized</span>
              </span>
            )}
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
            Navigation Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#13523B] text-white shadow-xs font-bold'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-[#ECE8DD] dark:hover:bg-[#1E2722] hover:text-[#0D3828] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'}`} />
                  <span>{item.label}</span>
                </div>
                {Boolean(item.badge && item.badge > 0) && (
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-mono font-bold ${
                    isActive
                      ? 'bg-white text-[#13523B]'
                      : 'bg-[#BA3C2A] text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Utility Controls at Bottom of Sidebar */}
        <div className="p-3 border-t border-[#E6E3D8] dark:border-[#28332E] bg-[#FAF9F5] dark:bg-[#141A17] space-y-2">
          
          {/* User Profile Info Card */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-[#1A221E] border border-[#E6E3D8] dark:border-[#28332E] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {currentUser.role === 'teacher' ? (
                <img 
                  src={TEACHER_PORTRAIT_URL} 
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-[#13523B]/30 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#13523B] text-white font-bold text-xs flex items-center justify-center font-mono shrink-0">
                  {currentUser.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-bold font-serif text-[#0D3828] dark:text-[#E8EFEA] truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono capitalize">
                  {currentUser.role === 'teacher' ? 'Faculty / Instructor' : currentUser.role === 'cr' ? 'Class Representative' : 'Student'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsRoleSwitcherOpen(!isRoleSwitcherOpen)}
              className="p-1.5 text-neutral-400 hover:text-[#13523B] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              title="Switch demo persona"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Role Switcher Menu Popup */}
          {isRoleSwitcherOpen && (
            <div className="p-2 rounded-xl bg-white dark:bg-[#1A221E] border border-[#E6E3D8] dark:border-[#28332E] shadow-lg text-xs space-y-1">
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-neutral-400 font-bold">
                Switch Test Role
              </div>
              <button
                type="button"
                onClick={() => {
                  onSwitchPersona(DEMO_TEACHER);
                  setIsRoleSwitcherOpen(false);
                }}
                className={`w-full text-left p-2 rounded-lg font-medium transition-colors flex items-center justify-between cursor-pointer ${
                  currentUser.role === 'teacher' ? 'bg-[#EAF5EF] text-[#13523B] font-bold' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <img src={TEACHER_PORTRAIT_URL} alt="Prof. Ananya" className="w-6 h-6 rounded-full object-cover" />
                  <div>
                    <div>Prof. Ananya Sharma</div>
                    <div className="text-[10px] text-neutral-400">Faculty / Teacher</div>
                  </div>
                </div>
                {currentUser.role === 'teacher' && <span className="text-[#13523B]">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  onSwitchPersona(DEMO_CRS[0]);
                  setIsRoleSwitcherOpen(false);
                }}
                className={`w-full text-left p-2 rounded-lg font-medium transition-colors flex items-center justify-between cursor-pointer ${
                  currentUser.role === 'cr' ? 'bg-[#EAF5EF] text-[#13523B] font-bold' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div>
                  <div>Rohan Verma</div>
                  <div className="text-[10px] text-neutral-400">Class Representative (CR)</div>
                </div>
                {currentUser.role === 'cr' && <span className="text-[#13523B]">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  onSwitchPersona(DEMO_STUDENTS[2]); // Priya Patel
                  setIsRoleSwitcherOpen(false);
                }}
                className={`w-full text-left p-2 rounded-lg font-medium transition-colors flex items-center justify-between cursor-pointer ${
                  currentUser.role === 'student' ? 'bg-[#EAF5EF] text-[#13523B] font-bold' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div>
                  <div>Priya Patel</div>
                  <div className="text-[10px] text-neutral-400">Student (CS2026-03)</div>
                </div>
                {currentUser.role === 'student' && <span className="text-[#13523B]">✓</span>}
              </button>
            </div>
          )}

          {/* Bottom Utility Bar: Theme, Notifications, Logout */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-[#E6E3D8]/50 dark:hover:bg-[#28332E] transition-colors cursor-pointer"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-[#E6E3D8]/50 dark:hover:bg-[#28332E] transition-colors cursor-pointer"
              title="Audit Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#BA3C2A] ring-2 ring-[#FAF9F5] dark:ring-[#141A17]" />
              )}
            </button>

            <button
              onClick={() => onSwitchPersona(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#BA3C2A] hover:bg-[#FDF2F0] dark:hover:bg-[#BA3C2A]/20 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>

      </aside>

      {/* 2. Mobile Top Navbar */}
      <div className="md:hidden sticky top-0 z-40 bg-[#F6F4EB] dark:bg-[#151B18] border-b border-[#E6E3D8] dark:border-[#28332E] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg text-neutral-700 dark:text-neutral-200 hover:bg-[#E6E3D8] cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="font-serif font-bold text-base text-[#0D3828] dark:text-[#E8EFEA]">
            AttendEase
          </div>
          <span className="text-[10px] font-mono font-bold text-[#13523B] bg-[#EAF5EF] px-1.5 py-0.5 rounded border border-[#BEE0CE]">
            {currentUser.role.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={onOpenNotifications}
            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#BA3C2A]" />
            )}
          </button>
          <button
            onClick={() => onSwitchPersona(null)}
            className="p-1.5 rounded-lg text-[#BA3C2A] cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#FAF9F5] dark:bg-[#151B18] border-b border-[#E6E3D8] dark:border-[#28332E] px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  isActive
                    ? 'bg-[#13523B] text-white font-bold'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-[#ECE8DD]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-[#BA3C2A] text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Main Content Viewport */}
      <main className="flex-1 min-w-0 bg-[#FAF9F5] dark:bg-[#121614] overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

    </div>
  );
};
