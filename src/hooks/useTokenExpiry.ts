import { useState, useEffect } from 'react';
import { useAuth } from '../auth/authContext';

export function useTokenExpiry() {
  const { session } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [warningLevel, setWarningLevel] = useState<'none' | 'warning' | 'critical'>('none');

  useEffect(() => {
    if (!session) {
      setTimeRemaining(null);
      setWarningLevel('none');
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, (session.expiresAt - Date.now()) / 1000);
      setTimeRemaining(remaining);
      
      if (remaining < 60) {
        setWarningLevel('critical');
      } else if (remaining < 300) { // 5 minutes
        setWarningLevel('warning');
      } else {
        setWarningLevel('none');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session]);

  return {
    timeRemaining,
    warningLevel,
    isExpiringSoon: warningLevel !== 'none',
    minutesRemaining: timeRemaining ? Math.floor(timeRemaining / 60) : 0,
    secondsRemaining: timeRemaining ? Math.floor(timeRemaining % 60) : 0,
    formattedTime: timeRemaining 
      ? `${Math.floor(timeRemaining / 60)}m ${Math.floor(timeRemaining % 60)}s`
      : 'N/A'
  };
}