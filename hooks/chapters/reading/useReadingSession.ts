// useReadingSession.ts
import { useState, useRef, useCallback, useEffect } from 'react';

// Constants
const INACTIVITY_THRESHOLD_MS = 60000; // 1 minute
const DEBUG_MODE = process.env.NODE_ENV === 'development';

interface ReadingSession {
  startTime: number;
  totalTimeMs: number;
  isActive: boolean;
  lastActiveTime: number;
}

export function useReadingSession() {
  const [session, setSession] = useState<ReadingSession>({
    startTime: Date.now(),
    totalTimeMs: 0,
    isActive: false,
    lastActiveTime: Date.now(),
  });

  const activityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const readTimeRef = useRef<number>(0);
  const lastActiveTimeRef = useRef<number>(Date.now());
  const isMountedRef = useRef<boolean>(true);
  const sessionRef = useRef<ReadingSession>(session);
  sessionRef.current = session;

  // Calculate total read time in minutes
  const calculateReadTimeMinutes = useCallback((): number => {
    const s = sessionRef.current;
    const currentSessionMs = s.isActive 
      ? Date.now() - s.startTime 
      : 0;
    
    const totalMs = s.totalTimeMs + currentSessionMs;
    const minutes = Math.round(totalMs / 60000 * 100) / 100;
    
    DEBUG_MODE && console.log(`[READ TIME DEBUG] Session - Current: ${currentSessionMs}ms, Total: ${totalMs}ms, Minutes: ${minutes}`);
    
    readTimeRef.current = minutes;
    return minutes;
  }, []);

  // Handle pausing the reading session - stable callback
  const pauseReading = useCallback(() => {
    if (!sessionRef.current.isActive) return;
    
    const now = Date.now();
    const sessionTime = now - sessionRef.current.startTime;
    
    setSession(prev => {
      if (!prev.isActive) return prev;
      const updatedTotalMs = prev.totalTimeMs + sessionTime;
      DEBUG_MODE && console.log(`[READ TIME DEBUG] Pausing session. Added ${sessionTime}ms, total: ${updatedTotalMs}ms`);
      
      return {
        ...prev,
        isActive: false,
        totalTimeMs: updatedTotalMs,
        lastActiveTime: now
      };
    });
  }, []);

  // Start or resume the reading session - stable callback
  const startReading = useCallback(() => {
    if (!isMountedRef.current) return;
    
    if (sessionRef.current.isActive) {
      lastActiveTimeRef.current = Date.now();
      return;
    }
    
    DEBUG_MODE && console.log('[READ TIME DEBUG] Starting/resuming reading session');
    
    setSession(prev => {
      if (prev.isActive) return prev;
      const now = Date.now();
      return {
        ...prev,
        isActive: true,
        startTime: now,
        lastActiveTime: now
      };
    });
    
    // Clear any existing interval to prevent memory leaks
    if (activityCheckIntervalRef.current) {
      clearInterval(activityCheckIntervalRef.current);
      activityCheckIntervalRef.current = null;
    }
    
    // Set up activity check
    activityCheckIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        if (activityCheckIntervalRef.current) {
          clearInterval(activityCheckIntervalRef.current);
          activityCheckIntervalRef.current = null;
        }
        return;
      }
      
      const now = Date.now();
      if (now - lastActiveTimeRef.current > INACTIVITY_THRESHOLD_MS) {
        DEBUG_MODE && console.log('[READ TIME DEBUG] Inactivity detected, pausing session');
        pauseReading();
      }
    }, 10000); // Check every 10 seconds
  }, [pauseReading]);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    if (!isMountedRef.current) return;
    
    const now = Date.now();
    lastActiveTimeRef.current = now;
    
    // If session is paused, resume it
    if (!sessionRef.current.isActive) {
      DEBUG_MODE && console.log('[READ TIME DEBUG] Resuming session on activity');
      startReading();
      return;
    }
    
    // Update last active time in state occasionally
    if (now - sessionRef.current.lastActiveTime > 5000) {
      setSession(prev => ({
        ...prev,
        lastActiveTime: now
      }));
    }
  }, [startReading]);

  // Reset the session
  const resetSession = useCallback(() => {
    if (!isMountedRef.current) return;
    
    DEBUG_MODE && console.log('[READ TIME DEBUG] Resetting session');
    
    setSession({
      startTime: Date.now(),
      totalTimeMs: 0,
      isActive: false,
      lastActiveTime: Date.now(),
    });
    
    readTimeRef.current = 0;
  }, []);

  // Set up cleanup on unmount - fix memory leak by removing dependencies
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // Save final time before unmounting
      const currentSession = session;
      if (currentSession.isActive) {
        const now = Date.now();
        const sessionTime = now - currentSession.startTime;
        readTimeRef.current = Math.round((currentSession.totalTimeMs + sessionTime) / 60000 * 100) / 100;
      }
      
      // Clear interval
      if (activityCheckIntervalRef.current) {
        clearInterval(activityCheckIntervalRef.current);
        activityCheckIntervalRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Calculate read time on each render
  const currentReadTime = calculateReadTimeMinutes();

  return {
    session,
    isReading: session.isActive,
    readTimeMinutes: currentReadTime,
    startReading,
    pauseReading,
    updateActivity,
    resetSession
  };
}