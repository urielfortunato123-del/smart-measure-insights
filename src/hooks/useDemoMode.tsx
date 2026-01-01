import { useState, useEffect, useCallback } from 'react';

const DEMO_DURATION_MS = 3 * 60 * 1000; // 3 minutes
const DEMO_KEY = 'demo_started_at';
const DEMO_EXPIRED_KEY = 'demo_expired';

export const useDemoMode = () => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(DEMO_DURATION_MS);
  const [demoExpired, setDemoExpired] = useState(false);

  const startDemo = useCallback(() => {
    const existingStart = localStorage.getItem(DEMO_KEY);
    const wasExpired = localStorage.getItem(DEMO_EXPIRED_KEY);
    
    if (wasExpired === 'true') {
      setDemoExpired(true);
      return false;
    }

    if (!existingStart) {
      localStorage.setItem(DEMO_KEY, Date.now().toString());
    }
    setIsDemoMode(true);
    return true;
  }, []);

  const endDemo = useCallback(() => {
    localStorage.setItem(DEMO_EXPIRED_KEY, 'true');
    setIsDemoMode(false);
    setDemoExpired(true);
  }, []);

  const resetDemo = useCallback(() => {
    localStorage.removeItem(DEMO_KEY);
    localStorage.removeItem(DEMO_EXPIRED_KEY);
    setDemoExpired(false);
    setTimeRemaining(DEMO_DURATION_MS);
  }, []);

  useEffect(() => {
    const wasExpired = localStorage.getItem(DEMO_EXPIRED_KEY);
    if (wasExpired === 'true') {
      setDemoExpired(true);
      return;
    }

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
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    isDemoMode,
    demoExpired,
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    startDemo,
    endDemo,
    resetDemo
  };
};
