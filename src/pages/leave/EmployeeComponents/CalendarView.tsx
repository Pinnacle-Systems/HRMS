import { useEffect, useMemo, useState, useRef } from "react";
import dayjs, { Dayjs } from "dayjs";
import { Tooltip } from "@mui/material";
import type { LeaveDayType } from "../../../services/modules/leaveTypes";
import { isDateBetween } from "../../../utils/dateUtils";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";

type SessionType = LeaveDayType | null;

interface CalendarDate {
  date: Dayjs;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  session: SessionType;
  isDisabled: boolean;
  isMiddleDate: boolean;
  hasExistingLeave: boolean;
  existingLeaveType?: string;
  needsSession: boolean;
}

interface CalendarViewProps {
  selectedStartDate: Dayjs | null;
  selectedEndDate: Dayjs | null;
  onDateRangeSelect: (start: Dayjs | null, end: Dayjs | null) => void;
  fromSession: LeaveDayType | null;
  toSession: LeaveDayType | null;
  onSessionChange: (from: LeaveDayType | null, to: LeaveDayType | null) => void;
  onDateSessionsChange?: (sessions: Map<string, LeaveDayType>) => void;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  excludedDates?: string[];
  disabledDates?: string[];
  leaveTypeId?: string;
  allowHalfDay?: boolean;
  onCalculate?: () => void;
  existingLeaveDates?: string[];
  existingLeaveDetails?: Map<string, string>;
}

export function CalendarView({
  selectedStartDate,
  selectedEndDate,
  onDateRangeSelect,
  // fromSession,
  // toSession,
  onSessionChange,
  onDateSessionsChange,
  minDate = dayjs(),
  maxDate = dayjs().add(365, 'day'),
  excludedDates = [],
  disabledDates = [],
  allowHalfDay = true,
  onCalculate,
  existingLeaveDates = [],
  existingLeaveDetails = new Map(),
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Dayjs | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Dayjs | null>(null);
  const [clickMode, setClickMode] = useState<'select' | 'session'>('select');
  const [localDateSessions, setLocalDateSessions] = useState<Map<string, LeaveDayType>>(new Map());
  const calendarRef = useRef<HTMLDivElement>(null);

  const isMouseDownRef = useRef(false);
  const dragStartRef = useRef<Dayjs | null>(null);
  const hasDraggedRef = useRef(false);

  useEffect(() => {
    if (!allowHalfDay) {
      setClickMode('select');
    }
  }, [allowHalfDay]);

  useEffect(() => {
    if (onDateSessionsChange) {
      onDateSessionsChange(localDateSessions);
    }
  }, [localDateSessions]);

  // Clear all sessions when a new range is selected
  useEffect(() => {
    setLocalDateSessions(new Map());
  }, [selectedStartDate?.format('YYYY-MM-DD'), selectedEndDate?.format('YYYY-MM-DD')]);

  // Helper: enumerate all dates of the range as strings
  const rangeDateStrings = useMemo(() => {
    if (!selectedStartDate || !selectedEndDate) return [] as string[];
    const out: string[] = [];
    let cur = selectedStartDate;
    while (cur.isBefore(selectedEndDate) || cur.isSame(selectedEndDate, 'day')) {
      out.push(cur.format('YYYY-MM-DD'));
      cur = cur.add(1, 'day');
    }
    return out;
  }, [selectedStartDate, selectedEndDate]);

  const allSessionsAssigned = useMemo(() => {
    if (rangeDateStrings.length === 0) return false;
    return rangeDateStrings.every((d) => localDateSessions.has(d));
  }, [rangeDateStrings, localDateSessions]);

  // Global mouseup so drag ends even outside the grid
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (!isMouseDownRef.current) return;

      if (hasDraggedRef.current && dragStartRef.current && hoveredDate) {
        const start = dragStartRef.current.isBefore(hoveredDate) ? dragStartRef.current : hoveredDate;
        const end = dragStartRef.current.isBefore(hoveredDate) ? hoveredDate : dragStartRef.current;

        let hasConflict = false;
        let cur = start;
        while (cur.isBefore(end) || cur.isSame(end, 'day')) {
          if (existingLeaveDates.includes(cur.format('YYYY-MM-DD'))) {
            hasConflict = true;
            break;
          }
          cur = cur.add(1, 'day');
        }

        if (!hasConflict && !start.isBefore(minDate, 'day') && !end.isAfter(maxDate, 'day')) {
          onDateRangeSelect(start, end);
          setLocalDateSessions(new Map());
        }
      }

      isMouseDownRef.current = false;
      hasDraggedRef.current = false;
      dragStartRef.current = null;
      setIsDragging(false);
      setDragStart(null);
      setHoveredDate(null);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [hoveredDate, existingLeaveDates, minDate, maxDate, onDateRangeSelect]);

  // Build calendar days
  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDate = startOfMonth.startOf('week');
    const endDate = endOfMonth.endOf('week');
    const days: CalendarDate[] = [];
    let current = startDate;

    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      const isCurrentMonth = current.month() === currentMonth.month();
      const isToday = current.isSame(dayjs(), 'day');
      const dateStr = current.format('YYYY-MM-DD');
      const isExcluded = excludedDates.includes(dateStr);
      const hasExistingLeave = existingLeaveDates.includes(dateStr);
      const existingLeaveType = existingLeaveDetails.get(dateStr) || '';

      const isDisabled = !isCurrentMonth ||
        current.isBefore(minDate, 'day') ||
        current.isAfter(maxDate, 'day') ||
        isExcluded ||
        disabledDates.includes(dateStr) ||
        hasExistingLeave;

      let isSelected = false;
      let isRangeStart = false;
      let isRangeEnd = false;
      let isInRange = false;
      let isMiddleDate = false;
      let session: SessionType = null;
      let needsSession = false;

      if (selectedStartDate && selectedEndDate) {
        const inRange = isDateBetween(current, selectedStartDate, selectedEndDate, 'day', '[]');
        isSelected = current.isSame(selectedStartDate, 'day') || current.isSame(selectedEndDate, 'day');
        isRangeStart = current.isSame(selectedStartDate, 'day');
        isRangeEnd = current.isSame(selectedEndDate, 'day');
        isInRange = inRange && !isSelected;
        isMiddleDate = isInRange;

        // Every date in range must have an explicit session from localDateSessions
        if (inRange) {
          const picked = localDateSessions.get(dateStr) ?? null;
          session = picked;
          needsSession = picked === null && !hasExistingLeave;
        }
      }

      // Drag preview
      if (isDragging && dragStart && hoveredDate && !selectedEndDate) {
        const a = dragStart.isBefore(hoveredDate) ? dragStart : hoveredDate;
        const b = dragStart.isBefore(hoveredDate) ? hoveredDate : dragStart;
        if (isDateBetween(current, a, b, 'day', '[]')) {
          if (current.isSame(a, 'day')) { isRangeStart = true; isSelected = true; }
          else if (current.isSame(b, 'day')) { isRangeEnd = true; isSelected = true; }
          else { isInRange = true; isMiddleDate = true; }
        }
      }

      days.push({
        date: current,
        isCurrentMonth,
        isToday,
        isSelected,
        isRangeStart,
        isRangeEnd,
        isInRange,
        isMiddleDate,
        session,
        isDisabled,
        hasExistingLeave,
        existingLeaveType,
        needsSession,
      });

      current = current.add(1, 'day');
    }

    return days;
  }, [currentMonth, selectedStartDate, selectedEndDate,
      dragStart, hoveredDate, isDragging, excludedDates, disabledDates, minDate, maxDate,
      localDateSessions, existingLeaveDates, existingLeaveDetails]);

  const weeks = useMemo(() => {
    const result: CalendarDate[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  const isSelectedDate = (date: Dayjs) =>
    (selectedStartDate && date.isSame(selectedStartDate, 'day')) ||
    (selectedEndDate && date.isSame(selectedEndDate, 'day'));

  // Assign a session to one date
  const assignSessionToDate = (date: Dayjs, newSession: LeaveDayType) => {
    const dateStr = date.format('YYYY-MM-DD');
    if (existingLeaveDates.includes(dateStr)) return;

    const updated = new Map(localDateSessions);
    updated.set(dateStr, newSession);
    setLocalDateSessions(updated);

    // Keep parent from/to in sync for start/end
    if (selectedStartDate && selectedEndDate) {
      const startStr = selectedStartDate.format('YYYY-MM-DD');
      const endStr = selectedEndDate.format('YYYY-MM-DD');
      const from = updated.get(startStr) ?? null;
      const to = updated.get(endStr) ?? null;
      onSessionChange(from, to);

      // Only trigger calculation when every date has a session
      const allAssigned = rangeDateStrings.every((d) => updated.has(d));
      if (allAssigned && onCalculate) {
        setTimeout(onCalculate, 100);
      }
    }
  };

  // Cycle: null -> FULL_DAY -> FIRST_HALF -> SECOND_HALF -> FULL_DAY ...
  const cycleSession = (date: Dayjs) => {
    if (!allowHalfDay) {
      assignSessionToDate(date, 'FULL_DAY');
      return;
    }
    const dateStr = date.format('YYYY-MM-DD');
    const current = localDateSessions.get(dateStr) ?? null;
    const cycle: LeaveDayType[] = ['FULL_DAY', 'FIRST_HALF', 'SECOND_HALF'];
    const next = current === null ? cycle[0] : cycle[(cycle.indexOf(current) + 1) % cycle.length];
    assignSessionToDate(date, next);
  };

  // Mouse interactions
  const handleMouseDown = (date: Dayjs) => {
    if (date.isBefore(minDate, 'day') || date.isAfter(maxDate, 'day')) return;
    if (excludedDates.includes(date.format('YYYY-MM-DD'))) return;
    if (existingLeaveDates.includes(date.format('YYYY-MM-DD'))) return;

    isMouseDownRef.current = true;
    hasDraggedRef.current = false;
    dragStartRef.current = date;
    setDragStart(date);
    setHoveredDate(date);
    setIsDragging(false);
  };

  const handleMouseEnter = (date: Dayjs) => {
    if (!isMouseDownRef.current || !dragStartRef.current) return;
    if (date.isSame(dragStartRef.current, 'day')) return;
    hasDraggedRef.current = true;
    setIsDragging(true);
    setHoveredDate(date);
  };

  const handleDateClick = (date: Dayjs, _e: React.MouseEvent) => {
    if (hasDraggedRef.current) return;
    if (date.isBefore(minDate, 'day') || date.isAfter(maxDate, 'day')) return;
    if (excludedDates.includes(date.format('YYYY-MM-DD'))) return;
    if (existingLeaveDates.includes(date.format('YYYY-MM-DD'))) return;

    // const dateStr = date.format('YYYY-MM-DD');
    const inRange = selectedStartDate && selectedEndDate &&
      isDateBetween(date, selectedStartDate, selectedEndDate, 'day', '[]');
    const isSelected = isSelectedDate(date);

    // If clicking a date already in the range -> cycle its session (unless in select mode with half-day disabled)
    if ((inRange || isSelected) && selectedStartDate && selectedEndDate) {
      cycleSession(date);
      return;
    }

    // Otherwise: start or complete a range
    if (selectedStartDate && !selectedEndDate) {
      const start = selectedStartDate.isBefore(date) ? selectedStartDate : date;
      const end = selectedStartDate.isBefore(date) ? date : selectedStartDate;

      let hasConflict = false;
      let cur = start;
      while (cur.isBefore(end) || cur.isSame(end, 'day')) {
        if (existingLeaveDates.includes(cur.format('YYYY-MM-DD'))) {
          hasConflict = true;
          break;
        }
        cur = cur.add(1, 'day');
      }

      if (!hasConflict && !start.isBefore(minDate, 'day') && !end.isAfter(maxDate, 'day')) {
        setLocalDateSessions(new Map());
        onDateRangeSelect(start, end);
        onSessionChange(null, null);
      }
    } else {
      // Fresh selection
      setLocalDateSessions(new Map());
      onDateRangeSelect(date, null);
      onSessionChange(null, null);
    }
  };

  const goToPrevMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'));
  const goToNextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'));
  const goToToday = () => setCurrentMonth(dayjs());

  // const toggleClickMode = () => {
  //   if (!allowHalfDay) return;
  //   setClickMode(prev => prev === 'select' ? 'session' : 'select');
  // };

  // Day classes — highlight "needsSession" dates
  const getDayClassName = (day: CalendarDate) => {
    const base = "relative w-10 h-10 rounded-lg transition-all duration-200 flex items-center justify-center text-sm font-medium select-none";

    if (day.hasExistingLeave) {
      return `${base} bg-red-100 text-red-700 cursor-not-allowed border-2 border-red-500`;
    }
    if (day.isDisabled) {
      return `${base} text-gray-300 cursor-not-allowed opacity-40`;
    }
    if (day.needsSession) {
      return `${base} bg-amber-100 text-amber-800 border-2 border-dashed border-amber-500 animate-pulse`;
    }
    if (day.isSelected) {
      return `${base} bg-blue-600 text-white shadow-lg transform scale-105 z-10`;
    }
    if (day.isInRange) {
      return `${base} bg-blue-100 text-blue-800 hover:bg-blue-200`;
    }
    if (day.isToday) {
      return `${base} border-2 border-blue-500 text-gray-800 hover:bg-blue-50`;
    }
    return `${base} hover:bg-gray-100 text-gray-800`;
  };

  const renderSessionBar = (session: SessionType) => {
    if (!session) return null;
    const colors = {
      'FULL_DAY': 'bg-blue-500',
      'FIRST_HALF': 'bg-green-500',
      'SECOND_HALF': 'bg-yellow-500',
    };
    return (
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${colors[session]} rounded-b-lg`} />
    );
  };

  const renderSessionButtons = (day: CalendarDate) => {
    if (!allowHalfDay) return null;
    if (!day.isInRange && !day.isSelected) return null;
    if (day.hasExistingLeave) return null;

    const sessionColors = {
      'FULL_DAY': 'bg-blue-500',
      'FIRST_HALF': 'bg-indigo-500',
      'SECOND_HALF': 'bg-yellow-500',
    };
    const sessionLabels = {
      'FULL_DAY': 'Full',
      'FIRST_HALF': 'AM',
      'SECOND_HALF': 'PM',
    };
    const dateStr = day.date.format('YYYY-MM-DD');
    const currentSession = localDateSessions.get(dateStr) ?? null;
    const cycle: LeaveDayType[] = ['FULL_DAY', 'FIRST_HALF', 'SECOND_HALF'];

    // Always show the buttons for range dates (not just on hover) so user can't miss them
    const alwaysVisible = day.needsSession || clickMode === 'session';
    const visibilityClass = alwaysVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100';

    return (
      <div
        className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex gap-0.5 ${visibilityClass} transition-opacity z-20`}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
      >
        {cycle.map((session) => (
          <button
            key={session}
            type="button"
            onClick={(e) => {
              e.stopPropagation(); e.preventDefault();
              assignSessionToDate(day.date, session);
            }}
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
            className={`text-[8px] px-1 py-0.5 rounded transition-all ${
              currentSession === session
                ? `${sessionColors[session]} text-white font-bold`
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {sessionLabels[session]}
          </button>
        ))}
      </div>
    );
  };

  const quickPresets = [
    { label: 'Today', days: 0 },
    { label: '3 Days', days: 2 },
    { label: '1 Week', days: 6 },
    { label: '2 Weeks', days: 13 },
  ];

  return (
    <div className="w-full bg-white-50 p-5 rounded-lg border border-gray-200 shadow-sm" ref={calendarRef}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1">
          <button onClick={goToPrevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-800" />
          </button>
          <h2 className="text-sm font-semibold text-gray-800 min-w-[120px] text-center">
            {currentMonth.format('MMMM YYYY')}
          </h2>
          <button onClick={goToNextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-800" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="text-xs px-2.5 py-1 bg-primary-50 text-primary rounded-lg hover:bg-primary-100 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Quick presets */}
      <div className="flex flex-wrap gap-1.5 mb-3 justify-center">
        {quickPresets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              const start = dayjs();
              const end = start.add(preset.days, 'day');

              let hasConflict = false;
              let cur = start;
              while (cur.isBefore(end) || cur.isSame(end, 'day')) {
                if (existingLeaveDates.includes(cur.format('YYYY-MM-DD'))) { hasConflict = true; break; }
                cur = cur.add(1, 'day');
              }

              if (!hasConflict && !end.isAfter(maxDate, 'day')) {
                setLocalDateSessions(new Map());
                onDateRangeSelect(start, end);
                onSessionChange(null, null);
              }
            }}
            className="text-[10px] px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-700"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Pending selection warning */}
      {selectedStartDate && !selectedEndDate && (
        <div className="mb-2 text-center text-[10px] text-blue-700 bg-blue-50 py-1 rounded-lg border border-blue-200">
          📅 Start: {selectedStartDate.format('DD MMM YYYY')} — click another date to finish the range
        </div>
      )}

      {/* Sessions required warning */}
      {selectedStartDate && selectedEndDate && !allSessionsAssigned && (
        <div className="mb-2 text-center text-[10px] text-amber-700 bg-amber-50 py-1 rounded-lg border border-amber-300">
          ⚠️ Please assign Full / AM / PM for every highlighted date before calculating
        </div>
      )}

      {/* Existing leave warning */}
      {existingLeaveDates.length > 0 && (
        <div className="mb-2 text-center text-[10px] text-red-600 bg-red-50 py-1 rounded-lg border border-red-200">
          ⚠️ Dates highlighted in red already have leave applications and cannot be selected
        </div>
      )}

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-500 py-0.5">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="relative">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-0.5 mb-0.5">
            {week.map((day, di) => (
              <div
                key={di}
                className="relative group"
                onMouseDown={() => !day.isDisabled && handleMouseDown(day.date)}
                onMouseEnter={() => !day.isDisabled && handleMouseEnter(day.date)}
              >
                <Tooltip
                  title={
                    day.hasExistingLeave
                      ? `❌ ${day.date.format('DD MMM YYYY')}\nLeave already applied${day.existingLeaveType ? `\nType: ${day.existingLeaveType}` : ''}\nCannot select this date`
                      : day.isDisabled
                        ? 'Not available'
                        : day.needsSession
                          ? `${day.date.format('DD MMM YYYY')}\n⚠️ Session not assigned yet — pick Full / AM / PM`
                          : day.isInRange || day.isSelected
                            ? `${day.date.format('DD MMM YYYY')}\nSession: ${day.session ?? 'Not set'}\nClick to cycle Full → AM → PM`
                            : day.date.format('DD MMM YYYY')
                  }
                  placement="top"
                  arrow
                >
                  <div
                    className={getDayClassName(day)}
                    onClick={(e) => !day.isDisabled && handleDateClick(day.date, e)}
                    style={{ cursor: day.isDisabled || day.hasExistingLeave ? 'not-allowed' : 'pointer' }}
                  >
                    <span className="relative z-10">{day.date.format('D')}</span>

                    {day.hasExistingLeave && (
                      <span className="absolute inset-0 flex items-center justify-center text-red-600 text-lg font-bold opacity-40">✕</span>
                    )}

                    {day.session && renderSessionBar(day.session)}

                    {(day.isInRange || day.isSelected) && day.session && !day.hasExistingLeave && (
                      <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 text-[6px] font-bold text-white z-10">
                        {day.session === 'FULL_DAY' ? 'F' : day.session === 'FIRST_HALF' ? 'H' : 'S'}
                      </span>
                    )}

                    {/* "Needs session" indicator */}
                    {day.needsSession && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 text-white text-[8px] flex items-center justify-center font-bold z-20">!</span>
                    )}

                    {day.isSelected && !day.hasExistingLeave && !day.needsSession && (
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
                    )}

                    {day.isToday && !day.isSelected && !day.isInRange && !day.hasExistingLeave && (
                      <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                </Tooltip>

                {renderSessionButtons(day)}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] text-gray-500 bg-gray-50 p-1.5 rounded-lg">
        <div className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 bg-blue-600 rounded"></span><span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 bg-blue-100 rounded"></span><span>Range</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 bg-amber-100 border-2 border-dashed border-amber-500 rounded"></span>
          <span className="text-amber-700 font-medium">Needs Session</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 border border-blue-500 rounded"></span><span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 bg-red-100 border-2 border-red-500 rounded"></span>
          <span className="text-red-600 font-medium">Leave Applied</span>
        </div>
      </div>

      {/* Session legend */}
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 text-[10px]">
        <div className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-1 bg-blue-500 rounded"></span><span className="text-gray-800">Full Day</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-1 bg-green-500 rounded"></span><span className="text-gray-800">First Half (AM)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-1 bg-yellow-500 rounded"></span><span className="text-gray-800">Second Half (PM)</span>
        </div>
      </div>

      {/* Selection info + per-date session picker */}
      {selectedStartDate && selectedEndDate && (
        <div className="mt-2 space-y-2">
          <div className="p-2 bg-head rounded-lg border border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-medium text-gray-500">Range:</span>
                <span className="text-xs font-semibold text-gray-800">
                  {selectedStartDate.format('DD MMM')} → {selectedEndDate.format('DD MMM YYYY')}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                  allSessionsAssigned ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {localDateSessions.size}/{rangeDateStrings.length} assigned
                </span>
              </div>
            </div>

            {/* Per-date session rows */}
            <div className="mt-1.5 space-y-1 border-t border-blue-100 pt-1.5">
              {rangeDateStrings.map((dateStr) => {
                const d = dayjs(dateStr);
                const hasExistingLeave = existingLeaveDates.includes(dateStr);
                const picked = localDateSessions.get(dateStr) ?? null;

                return (
                  <div key={dateStr} className="flex items-center gap-1.5 text-[10px]">
                    <span className="w-16 font-medium text-gray-600">
                      {d.format('DD MMM')}
                      <span className="text-gray-400 ml-1">({d.format('ddd')})</span>
                    </span>
                    {hasExistingLeave ? (
                      <span className="text-red-600 font-medium">🔴 Already applied</span>
                    ) : (
                      <>
                        {(['FULL_DAY', 'FIRST_HALF', 'SECOND_HALF'] as LeaveDayType[]).map((s) => {
                          const isActive = picked === s;
                          const colorClass =
                            s === 'FULL_DAY' ? 'bg-blue-500' :
                            s === 'FIRST_HALF' ? 'bg-green-500' : 'bg-yellow-500';
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => assignSessionToDate(d, s)}
                              className={`px-2 py-0.5 rounded text-[9px] transition-colors ${
                                isActive
                                  ? `${colorClass} text-white font-bold`
                                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                              }`}
                            >
                              {s === 'FULL_DAY' ? 'Full' : s === 'FIRST_HALF' ? 'AM' : 'PM'}
                            </button>
                          );
                        })}
                        {!picked && (
                          <span className="text-amber-600 text-[9px] ml-1">← pick one</span>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick set all */}
          {(() => {
            let hasConflict = false;
            let cur = selectedStartDate;
            while (cur.isBefore(selectedEndDate) || cur.isSame(selectedEndDate, 'day')) {
              if (existingLeaveDates.includes(cur.format('YYYY-MM-DD'))) { hasConflict = true; break; }
              cur = cur.add(1, 'day');
            }

            return (
              <div className={`flex flex-wrap items-center justify-center gap-1 bg-gray-50 p-1.5 rounded-lg border ${hasConflict ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                <span className="text-[9px] text-gray-500">Set all to:</span>
                {(['FULL_DAY', 'FIRST_HALF', 'SECOND_HALF'] as LeaveDayType[]).map((session) => (
                  <button
                    key={session}
                    onClick={() => {
                      const updated = new Map(localDateSessions);
                      let cur = selectedStartDate;
                      while (cur.isBefore(selectedEndDate) || cur.isSame(selectedEndDate, 'day')) {
                        const ds = cur.format('YYYY-MM-DD');
                        if (!existingLeaveDates.includes(ds)) updated.set(ds, session);
                        cur = cur.add(1, 'day');
                      }
                      setLocalDateSessions(updated);
                      const from = updated.get(selectedStartDate.format('YYYY-MM-DD')) ?? null;
                      const to = updated.get(selectedEndDate.format('YYYY-MM-DD')) ?? null;
                      onSessionChange(from, to);
                      if (updated.size >= rangeDateStrings.length && onCalculate) {
                        setTimeout(onCalculate, 100);
                      }
                    }}
                    disabled={hasConflict}
                    className={`text-[9px] px-2 py-0.5 rounded transition-colors ${
                      hasConflict
                        ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500'
                        : session === 'FULL_DAY' ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : session === 'FIRST_HALF' ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-yellow-500 text-white hover:bg-yellow-600'
                    }`}
                  >
                    {session === 'FULL_DAY' ? 'Full Day' : session === 'FIRST_HALF' ? 'AM' : 'PM'}
                  </button>
                ))}
                {hasConflict && (
                  <span className="text-[8px] text-red-600 ml-1">⚠️ Some dates have existing leave</span>
                )}
              </div>
            );
          })()}

          {/* Calculate button — enabled only when every date has a session */}
          {onCalculate && (
            <div className="flex justify-end">
              <button
                onClick={() => onCalculate()}
                disabled={!allSessionsAssigned}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  allSessionsAssigned
                    ? 'bg-primary text-white hover:bg-primary-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {allSessionsAssigned ? 'Calculate' : `Assign ${rangeDateStrings.length - localDateSessions.size} more date(s)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}