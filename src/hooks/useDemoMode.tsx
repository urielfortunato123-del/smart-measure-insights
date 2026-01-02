import { useState, useEffect, useCallback } from 'react';

const DEMO_DURATION_MS = 10 * 60 * 60 * 1000; // 10 hours
const DEMO_KEY = 'demo_started_at';
const DEMO_USES_KEY = 'demo_uses';
const DEMO_WEEK_KEY = 'demo_week_start';
const MAX_WEEKLY_USES = 3;

interface DemoUsageData {
  count: number;
  weekStart: number;
}

const getWeekStart = (): number => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.getTime();
};

const getDemoUsage = (): DemoUsageData => {
  const currentWeekStart = getWeekStart();
  const storedWeekStart = localStorage.getItem(DEMO_WEEK_KEY);
  const storedUses = localStorage.getItem(DEMO_USES_KEY);

  // Reset if new week
  if (!storedWeekStart || parseInt(storedWeekStart, 10) < currentWeekStart) {
    localStorage.setItem(DEMO_WEEK_KEY, currentWeekStart.toString());
    localStorage.setItem(DEMO_USES_KEY, '0');
    return { count: 0, weekStart: currentWeekStart };
  }

  return {
    count: storedUses ? parseInt(storedUses, 10) : 0,
    weekStart: parseInt(storedWeekStart, 10)
  };
};

export const useDemoMode = () => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(DEMO_DURATION_MS);
  const [demoExpired, setDemoExpired] = useState(false);
  const [usesRemaining, setUsesRemaining] = useState(MAX_WEEKLY_USES);
  const [weeklyLimitReached, setWeeklyLimitReached] = useState(false);

  // Initialize uses remaining
  useEffect(() => {
    const usage = getDemoUsage();
    const remaining = MAX_WEEKLY_USES - usage.count;
    setUsesRemaining(remaining);
    setWeeklyLimitReached(remaining <= 0);
  }, []);

  const startDemo = useCallback(() => {
    const usage = getDemoUsage();
    const remaining = MAX_WEEKLY_USES - usage.count;

    if (remaining <= 0) {
      setWeeklyLimitReached(true);
      return false;
    }

    // Increment usage count
    const newCount = usage.count + 1;
    localStorage.setItem(DEMO_USES_KEY, newCount.toString());
    setUsesRemaining(MAX_WEEKLY_USES - newCount);

    // Start timer
    localStorage.setItem(DEMO_KEY, Date.now().toString());
    setIsDemoMode(true);
    setTimeRemaining(DEMO_DURATION_MS);
    setDemoExpired(false);
    
    return true;
  }, []);

  const endDemo = useCallback(() => {
    localStorage.removeItem(DEMO_KEY);
    setIsDemoMode(false);
    setDemoExpired(true);
  }, []);

  const resetDemo = useCallback(() => {
    localStorage.removeItem(DEMO_KEY);
    setDemoExpired(false);
    setTimeRemaining(DEMO_DURATION_MS);
  }, []);

  // Check existing demo session on mount
  useEffect(() => {
    const startTime = localStorage.getItem(DEMO_KEY);
    if (startTime) {
      const elapsed = Date.now() - parseInt(startTime, 10);
      if (elapsed >= DEMO_DURATION_MS) {
        endDemo();
      } else {
        setIsDemoMode(true);
        setTimeRemaining(DEMO_DURATION_MS - elapsed);
      }
    }
  }, [endDemo]);

  // Timer countdown
  useEffect(() => {
    if (!isDemoMode || demoExpired) return;

    const interval = setInterval(() => {
      const startTime = localStorage.getItem(DEMO_KEY);
      if (startTime) {
        const elapsed = Date.now() - parseInt(startTime, 10);
        const remaining = DEMO_DURATION_MS - elapsed;
        
        if (remaining <= 0) {
          endDemo();
        } else {
          setTimeRemaining(remaining);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isDemoMode, demoExpired, endDemo]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    isDemoMode,
    demoExpired,
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    usesRemaining,
    weeklyLimitReached,
    maxWeeklyUses: MAX_WEEKLY_USES,
    startDemo,
    endDemo,
    resetDemo
  };
};

