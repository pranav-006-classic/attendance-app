import { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { DEMO_TEACHER, DEMO_CRS, DEMO_STUDENTS } from '../demoData';
import { fetchUsers } from '../services/attendanceService';

const AUTH_STORAGE_KEY = 'attendease_current_user_id';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    // Default to Teacher for immediate full review, but persistent in localStorage
    const savedId = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedId) {
      if (savedId === DEMO_TEACHER.id) return DEMO_TEACHER;
      const foundCr = DEMO_CRS.find((c: UserProfile) => c.id === savedId);
      if (foundCr) return foundCr;
      const foundStudent = DEMO_STUDENTS.find((s: UserProfile) => s.id === savedId);
      if (foundStudent) return foundStudent;
    }
    return DEMO_TEACHER;
  });

  const [allUsers, setAllUsers] = useState<UserProfile[]>([DEMO_TEACHER, ...DEMO_STUDENTS]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers().then((users: UserProfile[]) => {
      if (users && users.length > 0) {
        setAllUsers(users);
      }
    }).catch((err: any) => console.warn('Could not fetch live users list:', err));
  }, []);

  const switchUser = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem(AUTH_STORAGE_KEY, user.id);
  };

  const loginWithCredentials = async (email: string, _pass: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const match = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);
      if (match) {
        switchUser(match);
        return match;
      }
      // If student email not found directly, check student roll or default demo
      if (normalizedEmail.includes('teacher')) {
        switchUser(DEMO_TEACHER);
        return DEMO_TEACHER;
      }
      if (normalizedEmail.includes('cr')) {
        switchUser(DEMO_CRS[0]);
        return DEMO_CRS[0];
      }
      // fallback to first student
      switchUser(DEMO_STUDENTS[2]);
      return DEMO_STUDENTS[2];
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    // Switch to first student or null
    setCurrentUser(null);
  };

  return {
    currentUser,
    setCurrentUser,
    switchUser,
    loginWithCredentials,
    logout,
    allUsers,
    loading,
  };
}
