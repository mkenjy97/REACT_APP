import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Notification = {
  id: string;
  titleKey: string;
  descKey: string;
  timeLabel: string;
};

type NotificationState = {
  notifications: Notification[];
  unreadChatCount: number;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  setUnreadChatCount: (count: number) => void;
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [
        { id: '1', titleKey: 'notifications_page.system_update', descKey: 'notifications_page.update_desc', timeLabel: '1' },
        { id: '2', titleKey: 'notifications_page.system_update', descKey: 'notifications_page.update_desc', timeLabel: '2' },
      ],
      unreadChatCount: 0,
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearAll: () => set({ notifications: [] }),
      addNotification: (notification) =>
        set((state) => ({
          notifications: [{ ...notification, id: Math.random().toString(36).substring(7) }, ...state.notifications],
        })),
      setUnreadChatCount: (count) => set({ unreadChatCount: count }),
    }),
    {
      name: 'notification-storage',
    }
  )
);
