import { useEffect, useState } from "react";
import { Button, Stack } from "@mui/material";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import { useUI } from "../../../context/Snackbar";
import { leaveService } from "../../../services/modules/leave";
import type { LeaveRequest } from "../../../services/modules/leaveTypes";
import LeavePageShell from "../components/LeavePageShell";
import UpcomingEventsCard, { type UpcomingEvent } from "../components/UpcomingEventsCard";

export default function UpcomingEventsPage() {
    const { showSnackbar, showSpinner, hideSpinner } = useUI();
    const [events, setEvents] = useState<UpcomingEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [daysAhead, setDaysAhead] = useState(90);

    const loadEvents = async (days: number = daysAhead) => {
        setLoading(true);
        setError(null);
        showSpinner();

        try {
            const [leavesResponse, holidaysResponse]: any = await Promise.all([
                leaveService.getUpcomingLeaves({ daysAhead: days, limit: 50 }),
                leaveService.getUpcomingHolidays({ daysAhead: days, limit: 50 }),
            ]);

            // Extract data from response
            const leavesData = leavesResponse?.data?.data || [];
            const holidaysData = holidaysResponse?.data?.data || [];

            // Map leaves to events
            const leaveEvents: UpcomingEvent[] = leavesData.map((leave: LeaveRequest) => ({
                id: leave.id,
                type: "leave" as const,
                name: leave.leaveTypeName,
                fromDate: leave.fromDate,
                toDate: leave.toDate,
                days: leave.totalDays,
                status: leave.status,
                approver: leave.managerName,
                employeeCode: leave.employeeCode,
            }));

            // Map holidays to events
            const holidayEvents: UpcomingEvent[] = holidaysData.map((holiday: any) => ({
                id: holiday.id,
                type: "holiday" as const,
                name: holiday.holidayName,
                fromDate: holiday.holidayDate,
                toDate: holiday.holidayDate,
                holidayType: holiday.holidayType,
                daysFromToday: holiday.daysFromToday,
            }));

            const allEvents = [...leaveEvents, ...holidayEvents];

            // Sort events by date
            allEvents.sort((a, b) =>
                new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime()
            );

            setEvents(allEvents);
        } catch (err: any) {
            const message = err?.message || "Failed to load upcoming events";
            setError(message);
            showSnackbar(message, "error");
            setEvents([]);
        } finally {
            hideSpinner();
            setLoading(false);
        }
    };

    const handleDaysAheadChange = (days: number) => {
        setDaysAhead(days);
        loadEvents(days); // Call API with new days
    };

    useEffect(() => {
        loadEvents();
    }, []);

    return (
        <LeavePageShell
            group="hr"
            title="Upcoming Events"
            breadcrumbLabel="Upcoming Leave & Holidays"
            subtitle="View your upcoming approved leaves and company holidays"
            actions={
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshOutlinedIcon className="text-gray-800"/>}
                    onClick={() => loadEvents()}
                    disabled={loading}
                >
                    Refresh
                </Button>
            }
            contentClassName="p-5"
        >
            <Stack spacing={3}>
                <UpcomingEventsCard
                    events={events}
                    loading={loading}
                    error={error}
                    daysAhead={daysAhead}
                    onDaysAheadChange={handleDaysAheadChange}
                    onRefresh={() => loadEvents()}
                />
            </Stack>
        </LeavePageShell>
    );
}