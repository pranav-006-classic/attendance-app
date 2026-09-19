import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare,
  Clock
} from 'lucide-react';
import { AppNotification } from '../types';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc 
} from 'firebase/firestore';

interface NotificationsDrawerProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToRequests?: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  userId,
  isOpen,
  onClose,
  onNavigateToRequests,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    try {
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(d => ({
          ...d.data(),
          id: d.id,
        })) as AppNotification[];
        // Sort chronologically descending
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(list);
        setLoading(false);
      }, (err) => {
        console.warn('Notifications snapshot error:', err);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Could not listen to notifications:', err);
      setLoading(false);
    }
  }, [userId]);

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    } catch (err) {
      console.error('Error marking notif as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      for (const n of unread) {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div 
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose} 
      />

      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div 
          id="notifications_panel"
          className="w-screen max-w-sm bg-white dark:bg-neutral-900 shadow-2xl border-l border-neutral-200 dark:border-neutral-800 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-['Plus_Jakarta_Sans']">
                Notifications
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              {notifications.some(n => !n.read) && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="py-8 text-center text-neutral-400 text-xs">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 text-xs">
                <Bell className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
                <p className="font-medium text-neutral-700 dark:text-neutral-300">No new notifications</p>
                <p className="mt-0.5">You are up to date.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    handleMarkAsRead(n.id);
                    if (n.type === 'dispute' || n.type === 'leave' || n.type === 'correction') {
                      if (onNavigateToRequests) {
                        onNavigateToRequests();
                        onClose();
                      }
                    }
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    n.read 
                      ? 'bg-neutral-50/50 dark:bg-neutral-850/40 border-neutral-200/60 dark:border-neutral-800 opacity-70' 
                      : 'bg-white dark:bg-neutral-800 border-indigo-200 dark:border-indigo-900/60 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                      {n.type === 'low_attendance' && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                      {n.type === 'dispute' && <MessageSquare className="w-3.5 h-3.5 text-amber-500" />}
                      {n.type === 'approval' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                      <span>{n.title}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    {n.message}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-center">
            <button
              onClick={onClose}
              className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
