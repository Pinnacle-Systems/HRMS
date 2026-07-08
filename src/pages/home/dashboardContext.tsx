import React, { createContext, useContext, useState, useCallback } from "react";
import { dashboardService, type DashboardData, type DashboardPreferences } from "../../services/modules/dashboard";


interface DashboardContextType {
  dashboardData: DashboardData | null;
  preferences: DashboardPreferences | null;
  loading: boolean;
  loadDashboard: (page: string) => Promise<void>;
  loadPreferences: (page: string) => Promise<void>;
  updateWidget: (widgetId: string, updates: Partial<any>) => Promise<void>;
  refreshDashboard: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [preferences, setPreferences] = useState<DashboardPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>("");

  const loadDashboard = useCallback(async (page: string) => {
    setLoading(true);
    try {
      const response:any = await dashboardService.getDashboard(page);
      const data = response?.data?.data;
      if (data) {
        setDashboardData(data);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPreferences = useCallback(async (page: string) => {
    try {
      const response:any = await dashboardService.getPreferences(page);
      const data = response?.data?.data;
      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
  }, []);

  const updateWidget = useCallback(async (widgetId: string, updates: Partial<any>) => {
    if (!dashboardData) return;

    const updatedWidgets = dashboardData.widgets.map(w => {
      if (w.id === widgetId) {
        return { ...w, ...updates };
      }
      return w;
    });

    try {
      await dashboardService.updatePreferences(currentPage, {
        widgets: updatedWidgets.map(w => ({
          widgetId: w.id,
          visible: w.visible !== false,
          position: w.position,
          size: w.size,
        })),
      });
      await loadDashboard(currentPage);
    } catch (error) {
      console.error("Failed to update widget:", error);
    }
  }, [dashboardData, currentPage, loadDashboard]);

  const refreshDashboard = useCallback(async () => {
    if (currentPage) {
      await loadDashboard(currentPage);
      await loadPreferences(currentPage);
    }
  }, [currentPage, loadDashboard, loadPreferences]);

  const value = {
    dashboardData,
    preferences,
    loading,
    loadDashboard,
    loadPreferences,
    updateWidget,
    refreshDashboard,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}