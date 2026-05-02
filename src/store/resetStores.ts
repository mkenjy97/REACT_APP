import { useAuthStore } from './useAuthStore';
import { useNotificationStore } from './useNotificationStore';
import { useBudgetStore } from './useBudgetStore';

export const resetAllStores = () => {
  // Clear auth data
  useAuthStore.getState().logout();
  
  // Clear notifications
  useNotificationStore.getState().clearAll();
  
  // Clear budget data
  useBudgetStore.getState().resetBudgetStore();
};

