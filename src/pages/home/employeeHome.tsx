import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowForwardRounded,
  CheckCircleOutlineRounded,
  DescriptionOutlined,
  AccessTimeOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useAuth } from "../../auth/authContext";
import { resolveEmployeeIdFromProfile } from "../../auth/sessionIdentity";
import { useUI } from "../../context/Snackbar";
import { attendanceService } from "../../services/modules/attendance";
import type { EmployeeAttendanceInfo } from "../../services/modules/attendanceTypes";
import { authService } from "../../services/modules/auth";
import { leaveService } from "../../services/modules/leave";
import type { LeaveRequest } from "../../services/modules/leaveTypes";

// ============================================================================
// TYPES & HELPERS
// ============================================================================

type AttendanceSummary = Partial<EmployeeAttendanceInfo>;

function unwrapResponse(value: unknown): unknown {
  let result = value;
  for (let depth = 0; depth < 3; depth += 1) {
    if (!result || typeof result !== "object" || !("data" in result)) break;
    result = (result as { data: unknown }).data;
  }
  return result;
}

function getProfileDetails(value: unknown): {
  name: string;
  email: string;
  profileUrl: string;
} {
  const payload = unwrapResponse(value);
  if (!payload || typeof payload !== "object") {
    return { name: "", email: "", profileUrl: "" };
  }

  const root = payload as Record<string, unknown>;
  const profile =
    root.profile && typeof root.profile === "object"
      ? (root.profile as Record<string, unknown>)
      : root;
  const readString = (...values: unknown[]) =>
    values.find(
      (item): item is string => typeof item === "string" && Boolean(item.trim()),
    )?.trim() ?? "";
  const firstName = readString(profile.firstName);
  const lastName = readString(profile.lastName);

  return {
    name:
      readString(profile.fullName, profile.name, profile.displayName) ||
      [firstName, lastName].filter(Boolean).join(" ") ||
      readString(profile.username),
    email: readString(profile.email, profile.emailAddress),
    profileUrl: readString(
      profile.profilePicUrl,
      profile.profilePic,
      profile.profileImage,
      profile.profilePicture,
      profile.avatar,
      profile.imageUrl,
    ),
  };
}

function getList<T>(value: unknown): T[] {
  const payload = unwrapResponse(value);
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    if (Array.isArray(data.content)) return data.content as T[];
    if (Array.isArray(data.items)) return data.items as T[];
  }
  return [];
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function formatTime(value?: string | null): string {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(value?: string): string {
  if (!value) return "Date unavailable";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

function getRequestStatusColor(
  status?: string,
): "success" | "warning" | "error" | "default" {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return "success";
    case "PENDING":
    case "PENDING_HR_VERIFICATION":
      return "warning";
    case "REJECTED":
      return "error";
    default:
      return "default";
  }
}

function getCurrentPosition(): Promise<GeolocationPosition | null> {
  if (!navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 30000,
    });
  });
}

/**
 * Formats a duration in milliseconds into "HH:MM:SS".
 */
function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

// ============================================================================
// TIME-BASED GREETING ASSETS
// ============================================================================

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

function getTimeOfDayAssets(hour: number): {
  greeting: string;
  gif: string;
  label: string;
  emoji: string;
  accent: string;
  bgGradient: string;
} {
  let key: TimeOfDay;
  if (hour >= 5 && hour < 12) key = "morning";
  else if (hour >= 12 && hour < 17) key = "afternoon";
  else if (hour >= 17 && hour < 21) key = "evening";
  else key = "night";

  switch (key) {
    case "morning":
      return {
        greeting: "Good Morning",
        label: "Rise and shine",
        emoji: "🌅",
        accent: "from-amber-100 to-yellow-100",
        bgGradient: "from-amber-50 via-white to-yellow-50",
        gif: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
      };
    case "afternoon":
      return {
        greeting: "Good Afternoon",
        label: "Keep going",
        emoji: "☀️",
        accent: "from-orange-100 to-sky-100",
        bgGradient: "from-sky-50 via-white to-orange-50",
        gif: "https://media.giphy.com/media/3o7TKu8QHwGxJ8w2Hu/giphy.gif",
      };
    case "evening":
      return {
        greeting: "Good Evening",
        label: "Wind down",
        emoji: "🌆",
        accent: "from-purple-100 to-pink-100",
        bgGradient: "from-purple-50 via-white to-pink-50",
        gif: "https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif",
      };
    case "night":
    default:
      return {
        greeting: "Good Night",
        label: "Time to relax",
        emoji: "🌙",
        accent: "from-indigo-100 to-blue-100",
        bgGradient: "from-indigo-50 via-white to-blue-50",
        gif: "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif",
      };
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EmployeeHome() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { showSnackbar } = useUI();
  const employeeId = session?.user.employeeId || session?.user.userId || "";

  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [attendanceEmployeeId, setAttendanceEmployeeId] = useState(employeeId);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [attendanceError, setAttendanceError] = useState("");
  const [requestsError, setRequestsError] = useState("");
  const [clock, setClock] = useState(() => new Date());
  const [profileError, setProfileError] = useState("");
  const [profileDetails, setProfileDetails] = useState({
    name: "User",
    email: session?.user.email ?? "",
    profileUrl: session?.user.profilePic ?? "",
  });

  // Live "now" tick used for the working-hours timer (updates every second).
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setProfileError("");
      setProfileDetails({
        name: "User",
        email: session?.user.email ?? "",
        profileUrl: session?.user.profilePic ?? "",
      });

      try {
        const details = getProfileDetails(await authService.getProfile());
        if (cancelled) return;
        setProfileDetails({
          name: details.name || "User",
          email: details.email || session?.user.email || "",
          profileUrl: details.profileUrl || session?.user.profilePic || "",
        });
      } catch (error) {
        if (cancelled) return;
        setProfileError(
          getErrorMessage(error, "Unable to load your profile details."),
        );
      }
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const userName = profileDetails.name;
  const profileImage = profileDetails.profileUrl;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join("");

  // ---- Greeting + time-of-day assets ----
  const timeAssets = useMemo(
    () => getTimeOfDayAssets(clock.getHours()),
    [clock],
  );
  const greeting = timeAssets.greeting;

  useEffect(() => {
    const interval = window.setInterval(() => setClock(new Date()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  // ---- Live seconds ticker (only runs while the timer is active) ----
  const hasCheckedInFlag = Boolean(
    attendance?.todayCheckIn || attendance?.todayStatus === "checked_in",
  );
  const hasCheckedOutFlag = Boolean(
    attendance?.todayCheckOut || attendance?.todayStatus === "checked_out",
  );
  const timerActive = hasCheckedInFlag && !hasCheckedOutFlag;

  useEffect(() => {
    if (!timerActive) return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [timerActive]);

  // ---- Derived timer values ----
  const checkInMs = attendance?.todayCheckIn
    ? new Date(attendance.todayCheckIn).getTime()
    : NaN;
  const checkOutMs = attendance?.todayCheckOut
    ? new Date(attendance.todayCheckOut).getTime()
    : NaN;

  // Elapsed time: live while active, frozen at check-out once done.
  const elapsedMs = useMemo(() => {
    if (!Number.isFinite(checkInMs)) return 0;
    if (Number.isFinite(checkOutMs)) return Math.max(0, checkOutMs - checkInMs);
    return Math.max(0, now - checkInMs);
  }, [checkInMs, checkOutMs, now]);

  // Load attendance + recent leave requests
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setAttendanceError("");
    setRequestsError("");

    try {
      const resolvedEmployeeId =
        session?.user.employeeId ||
        (await resolveEmployeeIdFromProfile(session, authService));

      if (!resolvedEmployeeId) {
        throw new Error("Your employee profile could not be identified.");
      }
      setAttendanceEmployeeId(resolvedEmployeeId);

      const [attendanceResult, requestResult] = await Promise.allSettled([
        attendanceService.getAttendanceInfo(resolvedEmployeeId),
        leaveService.getMyLeaves({
          page: 0,
          size: 5,
          sort: "createdAt,DESC",
        }),
      ]);

      if (attendanceResult.status === "fulfilled") {
        const payload = unwrapResponse(attendanceResult.value);
        setAttendance(
          payload && typeof payload === "object"
            ? (payload as AttendanceSummary)
            : null,
        );
      } else {
        setAttendanceError(
          getErrorMessage(
            attendanceResult.reason,
            "Attendance details are unavailable.",
          ),
        );
      }

      if (requestResult.status === "fulfilled") {
        setRequests(getList<LeaveRequest>(requestResult.value));
      } else {
        setRequestsError(
          getErrorMessage(
            requestResult.reason,
            "Recent leave requests are unavailable.",
          ),
        );
      }
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Could not load your employee dashboard.",
      );
      setAttendanceError(message);
      setRequestsError(message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard, refreshKey]);

  const hasCheckedIn = Boolean(
    attendance?.todayCheckIn ||
    (attendance as any)?.checkInTime ||
    attendance?.todayStatus === "checked_in",
  );

  const hasCheckedOut = Boolean(
    attendance?.todayCheckOut || attendance?.todayStatus === "checked_out",
  );

  const handlePunch = async () => {
    if (!attendanceEmployeeId) {
      showSnackbar("Your employee profile could not be identified.", "error");
      return;
    }

    setPunching(true);
    try {
      if (!hasCheckedIn) {
        const position = await getCurrentPosition();
        const response = await attendanceService.checkIn({
          employeeId: attendanceEmployeeId,
          checkInTime: new Date().toISOString(),
          ...(position
            ? {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }
            : {}),
        });

        const root =
          response && typeof response === "object"
            ? (response as Record<string, unknown>)
            : {};
        const payload = unwrapResponse(response);
        const result =
          payload && typeof payload === "object"
            ? (payload as Record<string, unknown>)
            : {};
        const geofence =
          result.geofence && typeof result.geofence === "object"
            ? (result.geofence as Record<string, unknown>)
            : result;
        const geofenceMode = String(
          geofence.geofenceMode ?? geofence.mode ?? "",
        ).toUpperCase();
        const withinGeofence =
          geofence.withinGeofence ?? geofence.checkInWithinGeofence;

        if (
          result.success === false ||
          root.success === false ||
          geofence.allowed === false ||
          (geofenceMode === "STRICT" && withinGeofence === false)
        ) {
          showSnackbar(
            typeof result.message === "string"
              ? result.message
              : "Check-in was rejected by attendance validation.",
            "error",
          );
          return;
        }
        showSnackbar(
          position
            ? "Check-in marked successfully."
            : "Check-in submitted without location; validation is handled by the server.",
          position ? "success" : "warning",
        );
      } else {
        await attendanceService.checkOut({
          employeeId: attendanceEmployeeId,
          checkOutTime: new Date().toISOString(),
        });
        showSnackbar("Check-out marked successfully.", "success");
      }
      setRefreshKey((current) => current + 1);
    } catch (error) {
      showSnackbar(
        getErrorMessage(error, "Unable to record your attendance."),
        "error",
      );
    } finally {
      setPunching(false);
    }
  };

  const weekday = clock.toLocaleDateString([], { weekday: "long" });
  const dayNumber = clock.toLocaleDateString([], { day: "numeric" });
  const monthYear = clock.toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto w-full space-y-4 p-2">
      {/* ================= GREETING HEADER ================= */}
      <div
        className={`flex flex-wrap items-center justify-between gap-6 rounded-xl border border-gray-200 bg-white ${timeAssets.bgGradient} p-6 shadow-sm`}
      >
        <div className="flex items-center gap-5">
          {/* User profile image + greeting */}
          <div className="flex items-center gap-4">
            {/* Profile Image */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-blue-100 to-orange-100 shadow">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={userName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="text-sm font-semibold text-blue-600">
                  {getInitials(userName)}
                </span>
              )}
            </div>

            <div>
              <h2 className="mb-2 text-sm font-bold text-gray-800">
                {greeting}, {userName}! {timeAssets.emoji}
              </h2>
              <p className="max-w-2xl text-[12px] leading-relaxed text-gray-600">
                The great thing in this world is not so much where you stand,
                as in what direction you are moving.
              </p>
              {profileDetails.email && (
                <p className="mt-1 text-[12px] text-gray-500">
                  {profileDetails.email}
                </p>
              )}
              {profileError && (
                <p role="status" className="mt-1 text-[12px] text-amber-700">
                  {profileError}
                </p>
              )}
              <p className="mt-2 text-[12px] text-gray-500">
                - Oliver Wendell Holmes
              </p>
            </div>
          </div>
        </div>

        {/* Right side illustration */}
        <div className="hidden h-32 w-64 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 lg:flex">
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=200&fit=crop"
            alt="Workspace illustration"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* ================= CARD GRID ================= */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* -------- Column 1: Review + IT Declaration -------- */}
        <div className="flex flex-col gap-6">
          {/* Review Card */}
          <div className="relative flex h-64 flex-col items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="absolute inset-0 opacity-5">
              <img
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop"
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-orange-200">
                <DescriptionOutlined
                  className="text-orange-500"
                  style={{ fontSize: 40 }}
                />
              </div>
              <div className="mb-2 font-semibold text-gray-800">Review</div>
              <p className="px-4 text-[12px] text-gray-500">
                Hurrah! You've nothing to review.
              </p>
            </div>
          </div>

          {/* IT Declaration Card */}
          <div className="relative flex h-48 flex-col justify-center overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="absolute inset-0 opacity-5">
              <img
                src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop"
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="relative z-10">
              <div className="mb-3 font-semibold text-gray-800">
                IT Declaration
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gradient-to-br from-blue-100 to-blue-200">
                  <DescriptionOutlined
                    className="text-blue-500"
                    style={{ fontSize: 20 }}
                  />
                </div>
                <p className="text-[12px] leading-relaxed text-gray-500">
                  Hold on! You can submit your Income Tax (IT) declaration once
                  released.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* -------- Column 2: Date/Attendance + Quick Access -------- */}
        <div className="flex flex-col gap-6">
          {/* Date / Attendance Card */}
          <div className="relative flex min-h-[16rem] flex-col justify-between gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl opacity-5">
              <img
                src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&h=400&fit=crop"
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="relative z-10">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="text-lg font-bold text-gray-800">
                    {dayNumber} {monthYear}
                  </div>
                  <p className="text-[12px] text-gray-500">{weekday}</p>
                </div>
                <div
                  className={`h-3 w-3 rounded-full ${hasCheckedOut
                      ? "bg-emerald-400"
                      : hasCheckedIn
                        ? "bg-teal-400"
                        : "bg-gray-300"
                    }`}
                />
              </div>

              {attendanceError ? (
                <p className="text-[12px] text-amber-600">{attendanceError}</p>
              ) : (
                <>
                  <p className="mb-1 text-[12px] font-medium text-gray-700">
                    {hasCheckedIn
                      ? `Checked in at ${formatTime(attendance?.todayCheckIn)}`
                      : 'You cannot "Sign in"'}
                  </p>
                  <p className="text-[12px] text-gray-500">
                    {attendance?.shiftName
                      ? `Shift: ${attendance.shiftName} (${attendance.shiftStart ?? "--:--"} - ${attendance.shiftEnd ?? "--:--"})`
                      : "We couldn't find your shift details."}
                  </p>
                </>
              )}

              {/* ---------- LIVE TIMER ---------- */}
              {!attendanceError && hasCheckedIn && (
                <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-gray-400">
                    <span>Work Timer</span>
                    {timerActive ? (
                      <span className="flex items-center gap-1 text-teal-600">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
                        Running
                      </span>
                    ) : (
                      <span className="text-emerald-600">Stopped</span>
                    )}
                  </div>

                  {/* Big elapsed time */}
                  <div
                    className={`mt-1 font-mono text-2xl font-bold tabular-nums ${hasCheckedOut ? "text-red-600" : "text-emerald-600"
                      }`}
                  >
                    {formatDuration(elapsedMs)}
                  </div>

                  {/* Check-in / Check-out markers */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-gray-500">In:</span>
                      <span className="font-semibold text-emerald-600">
                        {formatTime(attendance?.todayCheckIn)}
                      </span>
                    </span>
                    {hasCheckedOut && (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-gray-500">Out:</span>
                        <span className="font-semibold text-red-600">
                          {formatTime(attendance?.todayCheckOut)}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ---------- ACTION BUTTONS ---------- */}
            <div className="relative z-10 mt-4 flex gap-2">
              {loading ? (
                <CircularProgress size={20} />
              ) : hasCheckedOut ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircleOutlineRounded style={{ fontSize: 16 }} />
                  Completed for today
                </span>
              ) : !hasCheckedIn ? (
                // ---- CHECK IN BUTTON (GREEN) ----
                <Button
                  variant="contained"
                  size="small"
                  onClick={handlePunch}
                  disabled={punching}
                  className="!rounded-md !bg-emerald-600 !text-xs hover:!bg-emerald-700"
                  startIcon={
                    punching ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <AccessTimeOutlined style={{ fontSize: 16 }} />
                    )
                  }
                >
                  {punching ? "Processing..." : "Check In"}
                </Button>
              ) : (
                // ---- CHECK OUT BUTTON (RED) ----
                <Button
                  variant="contained"
                  size="small"
                  onClick={handlePunch}
                  disabled={punching}
                  className="!rounded-md !bg-red-600 !text-xs hover:!bg-red-700"
                  startIcon={
                    punching ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <AccessTimeOutlined style={{ fontSize: 16 }} />
                    )
                  }
                >
                  {punching ? "Processing..." : "Check Out"}
                </Button>
              )}
            </div>
          </div>

          {/* Quick Access Card */}
          <div className="relative flex h-48 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="absolute inset-0 opacity-5">
              <img
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop"
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="relative z-10 flex h-full flex-col">
              <div className="mb-4 font-semibold text-gray-800">
                Quick Access
              </div>
              <div className="flex flex-1 gap-4">
                <div className="flex-1 space-y-3">
                  <button
                    onClick={() => navigate("/my-portal")}
                    className="block text-[12px] text-gray-600 hover:text-blue-600"
                  >
                    IT Statement
                  </button>
                  <button
                    onClick={() => navigate("/my-portal")}
                    className="block text-[12px] text-gray-600 hover:text-blue-600"
                  >
                    YTD Reports
                  </button>
                  <button
                    onClick={() => navigate("/my-portal")}
                    className="block text-[12px] text-gray-600 hover:text-blue-600"
                  >
                    Loan Statement
                  </button>
                </div>
                <div className="flex w-32 items-center rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 p-3 text-xs leading-tight text-orange-800">
                  Use quick access to view important salary details.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* -------- Column 3: Upcoming Holidays -------- */}
        <div className="relative flex h-[432px] flex-col items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="absolute inset-0 opacity-5">
            <img
              src="https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&h=800&fit=crop"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-6 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-teal-100 to-teal-200">
              <img
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop"
                alt="Holiday"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mb-3 text-sm font-semibold text-gray-800">
              Upcoming Holidays
            </div>
            <p className="px-4 text-[12px] text-gray-500">
              Uh oh! No holidays to show.
            </p>
          </div>
        </div>

        {/* -------- Column 4: Payslip + Track -------- */}
        <div className="flex flex-col gap-6">
          {/* Payslip Card */}
          <div className="relative flex h-64 flex-col items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="absolute inset-0 opacity-5">
              <img
                src="https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&h=400&fit=crop"
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-red-100 to-red-200">
                <img
                  src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=200&h=200&fit=crop"
                  alt="Payslip"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mb-2 text-sm font-semibold text-gray-800">
                Payslip
              </div>
              <p className="px-2 text-[12px] text-gray-500">
                Uh oh! Your Payslip will show up here after the release of
                Payroll.
              </p>
            </div>
          </div>

          {/* Track Card */}
          <div className="relative flex h-48 flex-col items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="absolute inset-0 opacity-5">
              <img
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop"
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                <img
                  src="https://images.unsplash.com/photo-1501139083538-0139583c060f?w=100&h=100&fit=crop"
                  alt="Track"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="font-semibold text-gray-800">Track</div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RECENT LEAVE REQUESTS ================= */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
          <div>
            <div className="text-sm font-semibold text-gray-800">
              Recent Leave Requests
            </div>
            <p className="text-[12px] text-gray-500">
              Keep an eye on your latest submissions.
            </p>
          </div>
          <Button
            endIcon={<ArrowForwardRounded className="!w-4" />}
            onClick={() => navigate("/leaves/my-requests")}
            className="!text-[12px] !font-semibold !text-primary"
          >
            View all
          </Button>
        </div>

        {requestsError ? (
          <Alert severity="warning">{requestsError}</Alert>
        ) : loading ? (
          <div className="flex items-center gap-2 py-5 text-[12px] text-gray-500">
            <CircularProgress size={18} /> Loading your requests...
          </div>
        ) : requests.length ? (
          <div className="divide-y divide-gray-100">
            {requests.slice(0, 4).map((request) => {
              const status = request.currentStatus || request.status;
              return (
                <div
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900">
                      {request.leaveTypeName || "Leave request"}
                    </div>
                    <div className="mt-1 text-[12px] text-gray-500">
                      {formatDate(request.fromDate)} –{" "}
                      {formatDate(request.toDate)}
                      {request.days
                        ? ` · ${request.days} ${request.days === 1 ? "day" : "days"
                        }`
                        : ""}
                    </div>
                  </div>
                  <Chip
                    size="small"
                    label={String(status || "Unknown").replaceAll("_", " ")}
                    color={getRequestStatusColor(status)}
                    variant="outlined"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
            <Typography className="!font-medium !text-gray-700">
              Nothing to track yet
            </Typography>
            <Typography variant="body2" className="!mt-1 !text-gray-500">
              Your leave requests will appear here.
            </Typography>
          </div>
        )}
      </div>
    </div>
  );
}