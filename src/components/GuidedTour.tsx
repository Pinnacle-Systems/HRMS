import { Joyride } from "react-joyride";
import type { EventData, Step } from "react-joyride";

const steps: Step[] = [
    {
        target: '[data-tour="menu-toggle"]',
        title: "Your workspace",
        content: "Use the menu button to expand or collapse your HRMS navigation.",
        placement: "bottom-start",
    },
    {
        target: '[data-tour="sidebar"]',
        title: "Move around quickly",
        content: "Open a workspace such as Employees, Leave, Attendance, or Payroll from here.",
        placement: "right",
    },
    {
        target: '[data-tour="global-search"]',
        title: "Find anything",
        content: "Search across the application from the top bar when you need a fast route to a record or page.",
        placement: "bottom",
    },
    {
        target: '[data-tour="notifications"]',
        title: "Stay up to date",
        content: "Your latest alerts and updates are collected here.",
        placement: "bottom",
    },
    {
        target: '[data-tour="account-menu"]',
        title: "Your account",
        content: "Open your profile, switch workspace, review audit logs, or sign out here.",
        placement: "bottom-end",
    },
];

interface GuidedTourProps {
    run: boolean;
    onComplete: (data: EventData) => void;
}

export default function GuidedTour({ run, onComplete }: GuidedTourProps) {
    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            scrollToFirstStep
            // spotlightClicks
            onEvent={onComplete}
            options={{
                primaryColor: "#72d219",
                textColor: "#263238",
                // backgroundColor: "red",
                arrowColor: "white",
                overlayColor: "rgba(15, 23, 42, 0.65)",
                overlayClickAction: false,
                zIndex: 1500,
                showProgress: true,
                scrollOffset: 120,
                width: 380,
                spotlightRadius: 12,
            }}
            styles={{
                tooltip: {
                    borderRadius: 16,
                    padding: "20px 22px",
                    boxShadow:
                        "0 20px 45px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(15, 23, 42, 0.08)",
                    backgroundColor: "var(--bg-primary)",
                },
                tooltipContainer: {
                    textAlign: "left",
                    lineHeight: 1.6,
                    backgroundColor: "var(--bg-primary)",
                },
                tooltipTitle: {
                    fontSize: 18,
                    fontWeight: 600,
                    marginBottom: 8,
                    color: "var(--color-primary)",
                },
                tooltipContent: {
                    fontSize: 14.5,
                    color: "var(--text-primary)",
                    padding: "4px 0",
                },
                buttonPrimary: {
                    backgroundColor: "var(--color-primary)",
                    borderRadius: 10,
                    color:"white",
                    padding: "10px 20px",
                    fontSize: 14,
                    fontWeight: 600,
                    boxShadow: "0 4px 12px rgba(25, 118, 210, 0.35)",
                },
                buttonBack: {
                    color: "#64748b",
                    marginRight: 10,
                    fontSize: 14,
                    fontWeight: 500,
                },
                buttonSkip: {
                    color: "#94a3b8",
                    fontSize: 13.5,
                },
                buttonClose: {
                    color: "#94a3b8",
                    height: 12,
                    width: 12,
                    top: 14,
                    right: 14,
                },
                beaconInner: {
                    backgroundColor: "#d22519",
                },
                beaconOuter: {
                    backgroundColor: "#f6fafd",
                    borderColor: "#d21919",
                },
            }}
            locale={{
                back: "Back",
                close: "Close",
                last: "Finish",
                next: "Next",
                skip: "Skip tour",
            }}
        />
    );
}