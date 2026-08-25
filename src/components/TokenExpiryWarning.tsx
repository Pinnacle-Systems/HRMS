import { useEffect, useState } from 'react';
import { useAuth } from '../auth/authContext';

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
  const { session } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!session) {
      setTimeRemaining(null);
      setShowWarning(false);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, (session.expiresAt - now) / 1000);
      setTimeRemaining(remaining);

      // Show warning when less than threshold and not dismissed
      if (remaining < warningThreshold && remaining > 0 && !isDismissed) {
        setShowWarning(true);
      } else if (remaining >= warningThreshold || remaining <= 0) {
        setShowWarning(false);
      }
    };

    // Update immediately
    updateTimer();

    // Update every checkInterval seconds
    const interval = setInterval(updateTimer, checkInterval * 1000);

    return () => clearInterval(interval);
  }, [session, warningThreshold, checkInterval, isDismissed]);

  if (!showWarning || !timeRemaining) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  
  // Determine warning level
  const isCritical = timeRemaining < 60; // Less than 1 minute
  const isUrgent = timeRemaining < 120; // Less than 2 minutes

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // If warning is dismissed but we're in critical state, show again
  if (isDismissed && timeRemaining < 60) {
    setIsDismissed(false);
  }

  return (
    <div 
      className={`fixed top-4 right-4 z-[2001] max-w-md p-4 rounded-lg shadow-lg border ${
        isCritical 
          ? 'bg-red-50 border-red-400 text-red-800' 
          : isUrgent 
          ? 'bg-orange-50 border-orange-400 text-orange-800'
          : 'bg-yellow-50 border-yellow-400 text-yellow-800'
      }`}
      role="alert"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {isCritical ? '🔴' : isUrgent ? '🟠' : '🟡'}
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium">
              {isCritical 
                ? 'Session Expiring Immediately!' 
                : 'Session Expiring Soon'
              }
            </h3>
            <div className="mt-1 text-sm">
              <p>
                Your session will expire in{' '}
                <span className="font-bold">
                  {minutes > 0 ? `${minutes}m ` : ''}
                  {seconds}s
                </span>
              </p>
              <p className="text-xs mt-1 text-black">
                {isCritical 
                  ? 'Please save your work immediately' 
                  : 'Your session will be automatically renewed'
                }
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-4 text-gray-400 hover:text-gray-600"
          aria-label="Dismiss warning"
        >
          ✕
        </button>
      </div>
    </div>
  );
}