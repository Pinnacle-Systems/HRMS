import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface UseUnsavedChangesProps {
  hasUnsavedChanges: boolean;
  onSave?: (callback?: () => void) => void;
  message?: string;
}

const useUnsavedChanges = ({
  hasUnsavedChanges,
  onSave,
  message = 'You have unsaved changes. Do you want to save before leaving?'
}: UseUnsavedChangesProps): void => {
  // const navigate = useNavigate();
  const location = useLocation();
  const lastLocation = useRef<string>(location.pathname);
  const isNavigating = useRef<boolean>(false);
  const hasUnsavedChangesRef = useRef<boolean>(hasUnsavedChanges);

  // Update ref when hasUnsavedChanges changes
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Handle browser tab/window close and page refresh
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent): string | void => {
      if (hasUnsavedChangesRef.current) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Handle route changes
  useEffect(() => {
    const currentPath = location.pathname;
    
    if (lastLocation.current !== currentPath && hasUnsavedChangesRef.current && !isNavigating.current) {
      isNavigating.current = true;
      
      const userChoice = window.confirm(message);
      
      if (userChoice) {
        // User wants to save
        if (onSave) {
          onSave(() => {
            lastLocation.current = currentPath;
            isNavigating.current = false;
          });
        } else {
          lastLocation.current = currentPath;
          isNavigating.current = false;
        }
      } else {
        // User doesn't want to save - allow navigation
        lastLocation.current = currentPath;
        isNavigating.current = false;
      }
    } else {
      lastLocation.current = currentPath;
      isNavigating.current = false;
    }
  }, [location.pathname, message, onSave]);
};

export default useUnsavedChanges;