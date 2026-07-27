import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Tabs,
    Tab,
    Box,
    IconButton,
    Tooltip,
    Badge,
} from "@mui/material";
import AssignIcon from "@mui/icons-material/AssignmentInd";
import ProgressIcon from "@mui/icons-material/TrendingUp";
import DocumentIcon from "@mui/icons-material/AttachFile";
import PersonIcon from "@mui/icons-material/Person";
import RefreshIcon from "@mui/icons-material/Refresh";
import HelpIcon from "@mui/icons-material/HelpOutlined";
import { ChecklistBuilder } from "./checklistBuilder";
import { AssignOnboarding } from "./assignOnBoarding";
import { ProgressTracking } from "./progressTracking";
import { DocumentsUpload } from "./documentUpload";
import { EmployeeDashboard } from "./employeeDashboard";
import { useUI } from "../../../../context/Snackbar";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import type { TabPanelProps } from "./type";
import { useAuth } from "../../../../auth/authContext";
import { onBoardService } from "../../../../services/modules/onBoard";
import { ChecklistOutlined } from "@mui/icons-material";

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`onboarding-tabpanel-${index}`}
            aria-labelledby={`onboarding-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 0 }}>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `onboarding-tab-${index}`,
        "aria-controls": `onboarding-tabpanel-${index}`,
    };
}

const OnBoardingProcess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showSnackbar } = useUI();
    const { session } = useAuth();
    
    const isAdmin = session?.user?.roles?.includes('ADMIN') || 
                    session?.user?.roles?.includes('HR');
    const userId = session?.user?.userId || "";

    const [refreshKey, setRefreshKey] = useState(0);
    const [pendingTasksCount, setPendingTasksCount] = useState(0);
    const [activeAssignmentsCount, setActiveAssignmentsCount] = useState(0);
    
    const hasFetched = useRef(false);

    const allTabs = [
        {
            label: "Checklist Builder",
            icon: <ChecklistOutlined className="!w-4 text-gray-500" />,
            component: <ChecklistBuilder key={`checklist-${refreshKey}`} />,
            description: "Create and manage onboarding checklists with tasks",
            role: "admin",
            show: isAdmin,
        },
        {
            label: "Assign Onboarding",
            icon: <AssignIcon className="!w-4 text-gray-500"/>,
            component: <AssignOnboarding key={`assign-${refreshKey}`} />,
            description: "Assign checklists to employees and track assignments",
            role: "admin",
            show: isAdmin,
            badge: activeAssignmentsCount > 0 ? activeAssignmentsCount : undefined,
        },
        {
            label: "Progress Tracking",
            icon: <ProgressIcon className="!w-4 text-gray-500"/>,
            component: <ProgressTracking key={`progress-${refreshKey}`} />,
            description: "Monitor onboarding progress and task completion",
            role: "admin",
            show: isAdmin,
        },
        {
            label: "Documents",
            icon: <DocumentIcon className="!w-4 text-gray-500"/>,
            component: <DocumentsUpload key={`documents-${refreshKey}`} />,
            description: "Upload and manage onboarding documents",
            role: "admin",
            show: isAdmin,
        },
        {
            label: "My Onboarding",
            icon: <PersonIcon className="!w-4 text-gray-500"/>,
            component: <EmployeeDashboard key={`employee-${refreshKey}`} employeeId={userId} />,
            description: "View and complete your onboarding tasks",
            role: "employee",
            show: !isAdmin && !!userId,
            badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
        },
    ];

    // Filter tabs based on user role
    const visibleTabs = allTabs.filter(tab => tab.show);

    // Map actual index to visible index
    const getVisibleIndex = (actualIndex: number) => {
        return visibleTabs.findIndex(tab => allTabs.indexOf(tab) === actualIndex);
    };

    // Get actual index from visible index
    const getActualIndex = (visibleIndex: number) => {
        if (visibleIndex >= 0 && visibleIndex < visibleTabs.length) {
            return allTabs.indexOf(visibleTabs[visibleIndex]);
        }
        return -1;
    };

    // Get initial tab from URL query parameter or default based on role
    const getInitialTab = () => {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");        
        const allTabMap: Record<string, number> = {
            checklist: 0,
            assign: 1,
            progress: 2,
            documents: 3,
            myonboarding: 4,
        };        
        let requestedActualIndex = -1;        
        if (tab && tab in allTabMap) {
            requestedActualIndex = allTabMap[tab];
        }        
        if (requestedActualIndex === -1) {
            requestedActualIndex = isAdmin ? 0 : 4;
        }        
        const requestedTab = allTabs[requestedActualIndex];
        if (requestedTab && requestedTab.show) {
            return getVisibleIndex(requestedActualIndex);
        }        
        return 0;
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());

    const fetchCounts = useCallback(async () => {
        if (hasFetched.current) {
            return;
        }
        if (!isAdmin && userId) {
            try {
                const response: any = await onBoardService.getProgress(userId);
                const data = response.data;
                if (data) {
                    let pending = 0;
                    data.checklists?.forEach((checklist: any) => {
                        checklist.tasks?.forEach((task: any) => {
                            if (task.status !== "COMPLETED") {
                                pending++;
                            }
                        });
                    });
                    setPendingTasksCount(pending);
                }
            } catch (error) {
                // Silently fail
            }
        } else if (isAdmin) {
            try {
                const response: any = await onBoardService.getAssignments({ 
                    size: 1,
                    status: "IN_PROGRESS"
                });
                setActiveAssignmentsCount(response.data?.totalElements || 0);
            } catch (error) {
                // Silently fail
            }
        }
        hasFetched.current = true;
    }, [isAdmin, userId]);

    // Refresh handler
    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
        showSnackbar("Refreshed successfully!", "success");
        hasFetched.current = false;
        fetchCounts();
    };

    // Handle tab change
    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
        const actualIndex = getActualIndex(newValue);
        if (actualIndex !== -1) {
            const tabNames = ["checklist", "assign", "progress", "documents", "myonboarding"];
            navigate(`?tab=${tabNames[actualIndex]}`, { replace: true });
        }
    };

    // Use useEffect with proper dependencies
    useEffect(() => {
        if ((isAdmin || userId) && !hasFetched.current) {
            fetchCounts();
        }
        const interval = setInterval(() => {
            hasFetched.current = false;
            fetchCounts();
        }, 30000);
        return () => {
            clearInterval(interval);
            hasFetched.current = false;
        };
    }, [isAdmin, userId, fetchCounts]);

    return (
        <div className="">
            {/* Header Section */}
            <div className="border-b border-gray-200 sticky top-0 z-10">
                <div>
                    <div className="flex justify-between items-center mt-3 px-2">
                        <div>
                            <div className="text-gray-500 text-sm flex items-center gap-1">
                                Settings <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
                                <span className="text-primary font-sm">Onboarding Process</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Tooltip title="Refresh">
                                <IconButton
                                    onClick={handleRefresh}
                                    size="small"
                                    className="!text-gray-600"
                                >
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Help">
                                <IconButton size="small" className="!text-gray-600">
                                    <HelpIcon />
                                </IconButton>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        indicatorColor="primary"
                        className="!text-gray-900"
                        sx={{
                            "& .MuiTab-root": {
                                "&.Mui-selected": {
                                    color: "var(--text-primary)",
                                },
                            },
                            "& .MuiTabs-indicator": {
                                backgroundColor: "var(--color-primary)",
                            },
                        }}
                    >
                        {visibleTabs.map((tab, index) => (
                            <Tab
                                key={index}
                                label={
                                    <div className="flex items-center gap-2 text-[12px]">
                                        {tab.icon}
                                        <span className="!text-gray-800">{tab.label}</span>
                                        {tab.badge && (
                                            <Badge
                                                badgeContent={tab.badge}
                                                color="error"
                                                className="ml-1"
                                            />
                                        )}
                                    </div>
                                }
                                {...a11yProps(index)}
                            />
                        ))}
                    </Tabs>
                </Box>
            </div>

            {/* Tab Panels */}
            <div className="">
                {visibleTabs.map((tab, index) => {
                    const actualIndex = allTabs.indexOf(tab);
                    return (
                        <TabPanel key={index} value={activeTab} index={index}>
                            {allTabs[actualIndex].component}
                        </TabPanel>
                    );
                })}
            </div>
        </div>
    );
};

export default OnBoardingProcess;