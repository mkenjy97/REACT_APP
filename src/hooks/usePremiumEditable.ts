import { useEffect, useRef, useState } from "react";

export function useDebouncedEffect(
  effect: () => void,
  deps: any[],
  delay: number
) {
  useEffect(() => {
    const handler = setTimeout(effect, delay);
    return () => clearTimeout(handler);
  }, [...deps, delay]);
}

export function useSavingIndicator() {
  const [isSaving, setIsSaving] = useState(false);
  const [flash, setFlash] = useState(false);

  const triggerSuccess = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
  };

  return {
    isSaving,
    setIsSaving,
    flash,
    triggerSuccess,
  };
}

export function triggerHaptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(10);
  }
}

export function useUndoDelete<T>(
  onRestore: (item: T) => void,
  delay = 4000
) {
  const timeoutRef = useRef<any>(null);

  const scheduleUndo = () => {
    return new Promise<void>((resolve) => {
      timeoutRef.current = setTimeout(() => {
        resolve();
      }, delay);
    });
  };

  const undo = (item: T) => {
    clearTimeout(timeoutRef.current);
    onRestore(item);
  };

  return { scheduleUndo, undo };
}
