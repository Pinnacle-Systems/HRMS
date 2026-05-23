import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Tabs,
    Tab,
    Box,
    Card,
    CardContent,
    IconButton,
    Tooltip,
} from "@mui/material";
import ChecklistIcon from "@mui/icons-material/LibraryBooks";
import AssignIcon from "@mui/icons-material/AssignmentInd";
import ProgressIcon from "@mui/icons-material/TrendingUp";
import DocumentIcon from "@mui/icons-material/AttachFile";
import RefreshIcon from "@mui/icons-material/Refresh";
import HelpIcon from "@mui/icons-material/HelpOutlined";
import { ChecklistBuilder } from "./checklistBuilder";
import { AssignOnboarding } from "./assignOnBoarding";
import { ProgressTracking } from "./progressTracking";
import { DocumentsUpload } from "./documentUpload";
import { useUI } from "../../../../context/Snackbar";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

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

    // Get initial tab from URL query parameter or default to 0
    const getInitialTab = () => {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");
        if (tab) {
            const tabMap: Record<string, number> = {
                checklist: 0,
                assign: 1,
                progress: 2,
                documents: 3,
            };
            return tabMap[tab] || 0;
        }
        return 0;
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());
    const [refreshKey, setRefreshKey] = useState(0);

    // Handle tab change
    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
        // Update URL without refreshing the page
        const tabNames = ["checklist", "assign", "progress", "documents"];
        navigate(`?tab=${tabNames[newValue]}`, { replace: true });
    };

    // Refresh current tab data
    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
        showSnackbar("Refreshed successfully!", "success");
    };

    // Tab configuration
    const tabs = [
        {
            label: "Checklist Builder",
            icon: <ChecklistIcon />,
            component: <ChecklistBuilder key={`checklist-${refreshKey}`} />,
            description: "Create and manage onboarding checklists with tasks",
        },
        {
            label: "Assign Onboarding",
            icon: <AssignIcon />,
            component: <AssignOnboarding key={`assign-${refreshKey}`} />,
            description: "Assign checklists to employees and track assignments",
        },
        {
            label: "Progress Tracking",
            icon: <ProgressIcon />,
            component: <ProgressTracking key={`progress-${refreshKey}`} />,
            description: "Monitor onboarding progress and task completion",
        },
        {
            label: "Documents",
            icon: <DocumentIcon />,
            component: <DocumentsUpload key={`documents-${refreshKey}`} />,
            description: "Upload and manage onboarding documents",
        },
    ];

    // Get counts for badges (you can fetch these from API)
    // const [counts, setCounts] = useState({
    //     checklists: 0,
    //     activeAssignments: 0,
    //     pendingTasks: 0,
    //     pendingDocuments: 0,
    // });

    // You can fetch counts from API here
    // useEffect(() => {
    //   fetchCounts();
    // }, []);

    return (
        <div className="">
            {/* Header Section */}
            <div className="border-b border-gray-200 sticky top-0 z-10">
                <div>
                    <div className="flex justify-between items-center mt-3">
                        <div>
                            <div className="text-gray-500 text-sm flex items-center gap-1">
                                Settings <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
                                <span className="text-primary font-sm">Onboarding Process</span>
                                {/* <span className="text-gray-900 text-[12px]">
                                ({tabs[activeTab].description}) */}
                                {/* </span> */}
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
                                // height: 3,
                            },
                        }}
                    >
                        {tabs.map((tab, index) => (
                            <Tab
                                key={index}
                                label={
                                    <div className="flex items-center gap-2 text-[12px]">
                                        <span className="!text-gray-800">{tab.label}</span>
                                        {/* {index === 1 && counts.activeAssignments > 0 && (
                                            <Badge
                                                badgeContent={counts.activeAssignments}
                                                color="error"
                                            />
                                        )}
                                        {index === 2 && counts.pendingTasks > 0 && (
                                            <Badge
                                                badgeContent={counts.pendingTasks}
                                                color="warning"
                                            />
                                        )} */}
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
                {tabs.map((tab, index) => (
                    <TabPanel key={index} value={activeTab} index={index}>
                        {tab.component}
                    </TabPanel>
                ))}
            </div>

            {/* Quick Stats Footer (Optional) */}
            {activeTab === 1 && (
                <div className="fixed bottom-4 right-4">
                    <Card className="shadow-lg">
                        <CardContent className="py-2 px-4">
                            <div className="flex gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Total Assignments:</span>
                                    <span className="ml-2 font-semibold">0</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">In Progress:</span>
                                    <span className="ml-2 font-semibold text-blue-600">0</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Completed:</span>
                                    <span className="ml-2 font-semibold text-green-600">0</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default OnBoardingProcess;
