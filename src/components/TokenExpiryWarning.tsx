import { useEffect, useState } from 'react';
import { TOKEN_EXPIRY_EVENT } from '../auth/AuthProvider';

interface TokenExpiryWarningProps {
  /** Show warning when time remaining is less than this (in seconds) */
  warningThreshold?: number;
  /** Check interval in seconds */
  checkInterval?: number;
}

export function TokenExpiryWarning({ 
  warningThreshold = 120, // Default: show warning when 2 minutes remaining
  checkInterval = 10 // Check every 10 seconds
}: TokenExpiryWarningProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  // const [lastEventThreshold, setLastEventThreshold] = useState<number | null>(null);

  // Listen for token expiry events
  useEffect(() => {
    const handleTokenExpiry = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { timeRemaining: remaining, threshold } = customEvent.detail;
      
      setTimeRemaining(remaining);
      // setLastEventThreshold(threshold);
      
      // Show warning when threshold matches our warning threshold
      if (threshold === warningThreshold || threshold === 60) {
        setShowWarning(true);
        setIsCritical(remaining < 60);
        setIsUrgent(remaining < warningThreshold);
        
        // Auto-dismiss after 10 seconds unless critical
        if (remaining >= 60) {
          setTimeout(() => {
            setIsDismissed(true);
          }, 10000);
        }
      }
    };

    window.addEventListener(TOKEN_EXPIRY_EVENT, handleTokenExpiry);
    
    return () => {
      window.removeEventListener(TOKEN_EXPIRY_EVENT, handleTokenExpiry);
    };
  }, [warningThreshold]);

  // Periodically check token expiry as a fallback
  useEffect(() => {
    if (!timeRemaining) return;

    const interval = setInterval(() => {
      // Update time remaining
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) return prev;
        const newTime = prev - checkInterval;
        
        // Check if we should show warning based on the threshold
        if (newTime <= warningThreshold && newTime > 0 && !isDismissed) {
          setShowWarning(true);
          setIsCritical(newTime < 60);
          setIsUrgent(newTime < warningThreshold);
        }
        
        return newTime > 0 ? newTime : 0;
      });
    }, checkInterval * 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, warningThreshold, checkInterval, isDismissed]);

  // Also check periodically using session expiry directly
  useEffect(() => {
    // This is a fallback for when the event doesn't fire
    // You can keep this or remove it and rely solely on events
    const checkSession = () => {
      // You could add logic here to check session expiry from localStorage
      // or from the session state if you have access to it
    };

    const interval = setInterval(checkSession, checkInterval * 1000);
    return () => clearInterval(interval);
  }, [checkInterval]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowWarning(false);
  };

  // Show again if critical and was dismissed
  useEffect(() => {
    if (isDismissed && isCritical) {
      setIsDismissed(false);
      setShowWarning(true);
    }
  }, [isCritical, isDismissed]);

  // Don't show if dismissed or no time remaining
  if (!showWarning || timeRemaining === null || isDismissed || timeRemaining <= 0) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  
  // Determine warning level
  const warningLevel = isCritical ? 'critical' : isUrgent ? 'urgent' : 'warning';

  const styles = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-400',
      text: 'text-red-800',
      icon: '🔴',
      title: 'Session Expiring Immediately!',
      message: 'Please save your work immediately',
    },
    urgent: {
      bg: 'bg-orange-50',
      border: 'border-orange-400',
      text: 'text-orange-800',
      icon: '🟠',
      title: 'Session Expiring Very Soon',
      message: 'Your session will be automatically renewed',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      text: 'text-yellow-800',
      icon: '🟡',
      title: 'Session Expiring Soon',
      message: 'Your session will be automatically renewed',
    },
  };

  const currentStyle = styles[warningLevel];

  return (
    <div 
      className={`fixed top-4 right-4 z-[2001] max-w-md p-4 rounded-lg shadow-lg border ${currentStyle.bg} ${currentStyle.border} ${currentStyle.text}`}
      role="alert"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0 text-2xl">
            {currentStyle.icon}
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium">
              {currentStyle.title}
            </h3>
            <div className="mt-1 text-sm">
              <p>
                Your session will expire in{' '}
                <span className="font-bold">
                  {minutes > 0 ? `${minutes}m ` : ''}
                  {seconds}s
                </span>
              </p>
              <p className={`text-xs mt-1 ${isCritical ? 'text-red-700' : 'text-gray-800'}`}>
                {currentStyle.message}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className={`ml-4 ${isCritical ? 'text-red-400 hover:text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
          aria-label="Dismiss warning"
        >
          ✕
        </button>
      </div>
    </div>
  );
}