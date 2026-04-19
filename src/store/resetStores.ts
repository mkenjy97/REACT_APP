import { useAuthStore } from './useAuthStore';
import { useNotificationStore } from './useNotificationStore';

export const resetAllStores = () => {
  // Clear auth data
  useAuthStore.getState().logout();
  
  // Clear notifications
  useNotificationStore.getState().clearAll();
  
  // Note: Theme store might not want to be fully reset to keep user settings, 
  // but we can reset the session-specific parts if any.
  
  // Clear places cache
  // usePlacesStore.getState().reset(); // Need to implement this if it exists
};
