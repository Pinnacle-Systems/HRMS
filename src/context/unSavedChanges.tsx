import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface UnsavedChangesContextType {
  hasUnsavedChanges: boolean;
  setPageDirty: (pageId: string, isDirty: boolean) => void;
  clearAllDirty: () => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(undefined);

export const UnsavedChangesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dirtyPages, setDirtyPages] = useState<Map<string, boolean>>(new Map());

  const hasUnsavedChanges = Array.from(dirtyPages.values()).some(value => value === true);

  const setPageDirty = (pageId: string, isDirty: boolean): void => {
    setDirtyPages(prev => {
      const newMap = new Map(prev);
      if (isDirty) {
        newMap.set(pageId, true);
      } else {
        newMap.delete(pageId);
      }
      return newMap;
    });
  };

  const clearAllDirty = (): void => {
    setDirtyPages(new Map());
  };

  return (
    <UnsavedChangesContext.Provider
      value={{
        hasUnsavedChanges,
        setPageDirty,
        clearAllDirty,
      }}
    >
      {children}
    </UnsavedChangesContext.Provider>
  );
};

export const useUnsavedChangesContext = (): UnsavedChangesContextType => {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error('useUnsavedChangesContext must be used within UnsavedChangesProvider');
  }
  return context;
};