import { useEffect, useMemo, useState, useRef, type JSX } from "react";
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
}

interface CalendarViewProps {
  selectedStartDate: Dayjs | null;
  selectedEndDate: Dayjs | null;
  onDateRangeSelect: (start: Dayjs | null, end: Dayjs | null) => void;
  fromSession: LeaveDayType;
  toSession: LeaveDayType;
  onSessionChange: (from: LeaveDayType, to: LeaveDayType) => void;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  excludedDates?: string[];
  disabledDates?: string[];
  leaveTypeId?: string;
  onCalculate?: () => void; // Add this prop
}

export function CalendarView({
  selectedStartDate,
  selectedEndDate,
  onDateRangeSelect,
  fromSession,
  toSession,
  onSessionChange,
  minDate = dayjs(),
  maxDate = dayjs().add(365, 'day'),
  excludedDates = [],
  disabledDates = [],
  leaveTypeId,
  onCalculate,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Dayjs | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Dayjs | null>(null);
  const [clickMode, setClickMode] = useState<'select' | 'session'>('select');
  const [localDateSessions, setLocalDateSessions] = useState<Map<string, LeaveDayType>>(new Map());
  const calendarRef = useRef<HTMLDivElement>(null);

  // Generate calendar days
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
      const isDisabled = !isCurrentMonth || 
        current.isBefore(minDate, 'day') || 
        current.isAfter(maxDate, 'day') ||
        isExcluded ||
        disabledDates.includes(dateStr);

      // Check selection state
      let isSelected = false;
      let isRangeStart = false;
      let isRangeEnd = false;
      let isInRange = false;
      let isMiddleDate = false;
      let session: SessionType = null;

      if (selectedStartDate && selectedEndDate) {
        const isInSelectedRange = isDateBetween(current, selectedStartDate, selectedEndDate, 'day', '[]');
        isSelected = current.isSame(selectedStartDate, 'day') || current.isSame(selectedEndDate, 'day');
        isRangeStart = current.isSame(selectedStartDate, 'day');
        isRangeEnd = current.isSame(selectedEndDate, 'day');
        isInRange = isInSelectedRange && !isSelected;
        isMiddleDate = isInRange;

        // Get session - check if there's a custom session for this date
        const customSession = localDateSessions.get(dateStr);
        
        if (customSession) {
          session = customSession;
        } else if (isRangeStart) {
          session = fromSession as SessionType;
        } else if (isRangeEnd) {
          session = toSession as SessionType;
        } else if (isInRange) {
          // Middle dates default to FULL_DAY
          session = 'FULL_DAY';
        }
      }

      // Handle dragging preview
      if (isDragging && dragStart && hoveredDate && !selectedEndDate) {
        const dragStartDate = dragStart.isBefore(hoveredDate) ? dragStart : hoveredDate;
        const dragEndDate = dragStart.isBefore(hoveredDate) ? hoveredDate : dragStart;
        const isInDragRange = isDateBetween(current, dragStartDate, dragEndDate, 'day', '[]');
        
        if (isInDragRange) {
          if (current.isSame(dragStartDate, 'day')) {
            isRangeStart = true;
            isSelected = true;
          } else if (current.isSame(dragEndDate, 'day')) {
            isRangeEnd = true;
            isSelected = true;
          } else {
            isInRange = true;
            isMiddleDate = true;
          }
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
      });

      current = current.add(1, 'day');
    }

    return days;
  }, [currentMonth, selectedStartDate, selectedEndDate, fromSession, toSession, 
      dragStart, hoveredDate, isDragging, excludedDates, disabledDates, minDate, maxDate,
      localDateSessions]);

  const weeks = useMemo(() => {
    const result: CalendarDate[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  // Helper function to check if date is selected (start or end)
  const isSelectedDate = (date: Dayjs) => {
    return (selectedStartDate && date.isSame(selectedStartDate, 'day')) ||
           (selectedEndDate && date.isSame(selectedEndDate, 'day'));
  };

  // Handle session change for a specific date
  const handleDateSessionChange = (date: Dayjs, newSession: LeaveDayType) => {
    const dateStr = date.format('YYYY-MM-DD');
    
    // Update local state
    const newSessions = new Map(localDateSessions);
    newSessions.set(dateStr, newSession);
    setLocalDateSessions(newSessions);
    
    // If this is the start or end date, update the parent state
    if (selectedStartDate && date.isSame(selectedStartDate, 'day')) {
      onSessionChange(newSession, toSession);
    } else if (selectedEndDate && date.isSame(selectedEndDate, 'day')) {
      onSessionChange(fromSession, newSession);
    }
    
    // Trigger recalculation
    if (onCalculate) {
      setTimeout(onCalculate, 100);
    }
  };

  // Toggle session for a date
  const toggleSessionForDate = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const currentSession = localDateSessions.get(dateStr) || 
      (selectedStartDate && date.isSame(selectedStartDate, 'day') ? fromSession :
       selectedEndDate && date.isSame(selectedEndDate, 'day') ? toSession : 'FULL_DAY');
    const sessionCycle: LeaveDayType[] = ['FULL_DAY', 'FIRST_HALF', 'SECOND_HALF'];
    let nextIndex = (sessionCycle.indexOf(currentSession) + 1) % sessionCycle.length;
    const newSession = sessionCycle[nextIndex];
    
    handleDateSessionChange(date, newSession);
  };

  // Handle mouse events for drag selection
  const handleMouseDown = (date: Dayjs) => {
    if (date.isBefore(minDate, 'day') || date.isAfter(maxDate, 'day')) return;
    if (excludedDates.includes(date.format('YYYY-MM-DD'))) return;
    
    setIsDragging(true);
    setDragStart(date);
    setHoveredDate(date);
  };

  const handleMouseEnter = (date: Dayjs) => {
    if (isDragging && dragStart) {
      setHoveredDate(date);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && hoveredDate) {
      const start = dragStart.isBefore(hoveredDate) ? dragStart : hoveredDate;
      const end = dragStart.isBefore(hoveredDate) ? hoveredDate : dragStart;
      
      if (!start.isBefore(minDate, 'day') && !end.isAfter(maxDate, 'day')) {
        onDateRangeSelect(start, end);
        // Clear local sessions when new range is selected
        setLocalDateSessions(new Map());
        if (start.isSame(end, 'day')) {
          onSessionChange('FULL_DAY', 'FULL_DAY');
        } else {
          onSessionChange('FULL_DAY', 'FULL_DAY');
        }
      }
    }
    setIsDragging(false);
    setDragStart(null);
    setHoveredDate(null);
  };

  // Handle click for session selection or single date
  const handleDateClick = (date: Dayjs, e: React.MouseEvent) => {
    if (isDragging) return;
    if (date.isBefore(minDate, 'day') || date.isAfter(maxDate, 'day')) return;
    if (excludedDates.includes(date.format('YYYY-MM-DD'))) return;

    // Check if date is in range or is selected
    const isInRange = selectedStartDate && selectedEndDate && 
      isDateBetween(date, selectedStartDate, selectedEndDate, 'day', '[]');
    const isSelected = isSelectedDate(date);

    // If in session mode and date is in range OR is selected
    if (clickMode === 'session' && (isInRange || isSelected)) {
      // Toggle session for this date - PREVENT date selection
      toggleSessionForDate(date);
      return; // IMPORTANT: Stop here to prevent date selection
    }

    // If in session mode but clicking outside range, switch to select mode
    if (clickMode === 'session') {
      // Optional: You could auto-switch to select mode here
      // setClickMode('select');
    }

    // Regular click - select single date or range
    if (selectedStartDate && !selectedEndDate) {
      // If start date is selected, complete the range
      const start = selectedStartDate.isBefore(date) ? selectedStartDate : date;
      const end = selectedStartDate.isBefore(date) ? date : selectedStartDate;
      
      if (!start.isBefore(minDate, 'day') && !end.isAfter(maxDate, 'day')) {
        onDateRangeSelect(start, end);
        setLocalDateSessions(new Map());
        if (!start.isSame(end, 'day')) {
          onSessionChange('FULL_DAY', 'FULL_DAY');
        }
      }
    } else {
      // Start new selection
      onDateRangeSelect(date, null);
      setLocalDateSessions(new Map());
      onSessionChange('FULL_DAY', 'FULL_DAY');
    }
  };

  // Navigation
  const goToPrevMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'));
  const goToNextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'));
  const goToToday = () => setCurrentMonth(dayjs());

  // Toggle click mode
  const toggleClickMode = () => {
    setClickMode(prev => prev === 'select' ? 'session' : 'select');
  };

  // Get day styles
  const getDayClassName = (day: CalendarDate) => {
    const baseClasses = "relative w-10 h-10 rounded-lg transition-all duration-200 flex items-center justify-center text-sm font-medium select-none";
    
    if (day.isDisabled) {
      return `${baseClasses} text-gray-300 cursor-not-allowed opacity-40`;
    }
    
    if (day.isSelected) {
      return `${baseClasses} bg-blue-600 text-white shadow-lg transform scale-105 z-10`;
    }
    
    if (day.isInRange) {
      return `${baseClasses} bg-blue-100 text-blue-800 hover:bg-blue-200`;
    }
    
    if (day.isToday) {
      return `${baseClasses} border-2 border-blue-500 text-gray-800 hover:bg-blue-50`;
    }
    
    return `${baseClasses} hover:bg-gray-100 text-gray-800`;
  };

  // Render session bar
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

  // Render session buttons for any date in range
  const renderSessionButtons = (day: CalendarDate) => {
    if (!day.isInRange && !day.isSelected) return null;
    
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
    const currentSession = localDateSessions.get(dateStr) || day.session || 'FULL_DAY';
    const sessionCycle: LeaveDayType[] = ['FULL_DAY', 'FIRST_HALF', 'SECOND_HALF'];

    // Only show on hover when in session mode
    if (clickMode !== 'session') return null;

    return (
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20" onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}>
        {sessionCycle.map((session) => (
          <button
            key={session}
              type="button"
            onClick={(e) => {
              e.stopPropagation(); e.preventDefault();
              handleDateSessionChange(day.date, session);
            }}
             onMouseDown={(e) => {
            // Prevent mousedown from triggering drag
            e.stopPropagation();
            e.preventDefault();
          }}
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

  // Quick select presets
  const quickPresets = [
    { label: 'Today', days: 0 },
    { label: '3 Days', days: 2 },
    { label: '1 Week', days: 6 },
    { label: '2 Weeks', days: 13 },
  ];

  return (
    <div className="w-full bg-white-50 p-5 rounded-lg border border-gray-200 shadow-sm" ref={calendarRef}>
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-800" />
          </button>
          <h2 className="text-sm font-semibold text-gray-800 min-w-[120px] text-center">
            {currentMonth.format('MMMM YYYY')}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
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
          <button
            onClick={toggleClickMode}
            className={`text-[10px] px-2 py-1 rounded-lg transition-colors ${
              clickMode === 'session'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {clickMode === 'session' ? '🎯 Session Mode' : '📅 Select Mode'}
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-1.5 mb-3 justify-center">
        {quickPresets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              const today = dayjs();
              const start = today;
              const end = today.add(preset.days, 'day');
              if (!end.isAfter(maxDate, 'day')) {
                onDateRangeSelect(start, end);
                setLocalDateSessions(new Map());
                onSessionChange('FULL_DAY', 'FULL_DAY');
              }
            }}
            className="text-[10px] px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-700"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Mode Indicator */}
      {clickMode === 'session' && selectedStartDate && selectedEndDate && (
        <div className="mb-2 text-center text-[10px] text-primary bg-primary-50 py-1 rounded-lg border border-primary">
          🎯 Click any date in the range to change session (Full → AM → PM)
        </div>
      )}

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-center text-[10px] font-medium text-gray-500 py-0.5">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="relative">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-0.5 mb-0.5">
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className="relative group"
                onMouseDown={() => !day.isDisabled && handleMouseDown(day.date)}
                onMouseEnter={() => !day.isDisabled && handleMouseEnter(day.date)}
                onMouseUp={handleMouseUp}
              >
                <Tooltip
                  title={
                    day.isDisabled 
                      ? 'Not available' 
                      : day.isInRange || day.isSelected
                        ? `${day.date.format('DD MMM YYYY')}\nSession: ${day.session || 'Full Day'}\n${clickMode === 'session' ? 'Click to change session' : ''}`
                        : day.date.format('DD MMM YYYY')
                  }
                  placement="top"
                  arrow
                >
                  <div
                    className={getDayClassName(day)}
                    onClick={(e) => !day.isDisabled && handleDateClick(day.date, e)}
                    style={{
                      cursor: day.isDisabled 
                        ? 'not-allowed' 
                        : clickMode === 'session' && (day.isInRange || day.isSelected)
                          ? 'pointer'
                          : 'pointer',
                    }}
                  >
                    <span className="relative z-10">{day.date.format('D')}</span>
                    
                    {/* Session indicator bar */}
                    {day.session && renderSessionBar(day.session)}
                    
                    {/* Session label on dates in range */}
                    {(day.isInRange || day.isSelected) && day.session && (
                      <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 text-[6px] font-bold text-white z-10">
                        {day.session === 'FULL_DAY' ? 'F' : day.session === 'FIRST_HALF' ? 'H' : 'S'}
                      </span>
                    )}
                    
                    {/* Selection indicator dot */}
                    {day.isSelected && (
                      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
                    )}
                    
                    {/* Today indicator */}
                    {day.isToday && !day.isSelected && !day.isInRange && (
                      <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}

                    {/* Click indicator for session mode */}
                    {clickMode === 'session' && (day.isInRange || day.isSelected) && (
                      <div className="absolute inset-0 rounded-lg border-2 border-green-400 border-dashed opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </Tooltip>

                {/* Session change buttons on hover */}
                {renderSessionButtons(day)}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] text-gray-500 bg-gray-50 p-1.5 rounded-lg">
        <div className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 bg-blue-600 rounded"></span>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 bg-blue-100 rounded"></span>
          <span>Range</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 border border-blue-500 rounded"></span>
          <span>Today</span>
        </div>
        <span className="text-gray-300">|</span>
        <span>🔄 Click & drag to select</span>
        <span>🎯 Click any date in range for session</span>
      </div>

      {/* Session Legend */}
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 text-[10px]">
        <div className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-1 bg-blue-500 rounded"></span>
          <span className="text-gray-800">Full Day</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-1 bg-green-500 rounded"></span>
          <span className="text-gray-800">First Half (AM)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-1 bg-yellow-500 rounded"></span>
          <span className="text-gray-800">Second Half (PM)</span>
        </div>
      </div>

      {/* Selection Info with Session Details */}
      {selectedStartDate && selectedEndDate && (
        <div className="mt-2 space-y-2">
          <div className="p-2 bg-head rounded-lg border border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-medium text-gray-500">Range:</span>
                <span className="text-xs font-semibold text-gray-800">
                  {selectedStartDate.format('DD MMM')} → {selectedEndDate.format('DD MMM YYYY')}
                </span>
              </div>
              <button
                onClick={toggleClickMode}
                className={`text-[9px] px-2 py-0.5 rounded transition-colors ${
                  clickMode === 'session'
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {clickMode === 'session' ? '🎯 Session Mode ON' : 'Switch to Session Mode'}
              </button>
            </div>

            {/* Show sessions for all dates in range */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 border-t border-blue-100 pt-1.5">
              <span className="text-[9px] font-medium text-gray-500">Sessions:</span>
              {selectedStartDate && selectedEndDate && (() => {
                const sessions: JSX.Element[] = [];
                let current = selectedStartDate;
                while (current.isBefore(selectedEndDate) || current.isSame(selectedEndDate, 'day')) {
                  const dateStr = current.format('YYYY-MM-DD');
                  const session = localDateSessions.get(dateStr) || 
                    (current.isSame(selectedStartDate, 'day') ? fromSession :
                     current.isSame(selectedEndDate, 'day') ? toSession : 'FULL_DAY');
                  
                  const colors = {
                    'FULL_DAY': 'bg-blue-100 text-blue-700',
                    'FIRST_HALF': 'bg-green-100 text-green-700',
                    'SECOND_HALF': 'bg-yellow-200 text-yellow-800',
                  };
                  
                  const labels = {
                    'FULL_DAY': 'Full',
                    'FIRST_HALF': 'First Half',
                    'SECOND_HALF': 'Second Half',
                  };
                  
                  sessions.push(
                    <span key={dateStr} className={`text-[8px] px-1.5 py-0.5 rounded ${colors[session as keyof typeof colors] || 'bg-gray-100 text-gray-600'}`}>
                      {current.format('DD')} {labels[session as keyof typeof labels] || 'Full'}
                    </span>
                  );
                  current = current.add(1, 'day');
                }
                return sessions;
              })()}
            </div>
          </div>

          {/* Quick Set All */}
          <div className="flex flex-wrap items-center justify-center gap-1 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
            <span className="text-[9px] text-gray-500">Set all to:</span>
            {(['FULL_DAY', 'FIRST_HALF', 'SECOND_HALF'] as LeaveDayType[]).map((session) => (
              <button
                key={session}
                onClick={() => {
                  // Set all dates in range to this session
                  if (selectedStartDate && selectedEndDate) {
                    let current = selectedStartDate;
                    const newSessions = new Map(localDateSessions);
                    while (current.isBefore(selectedEndDate) || current.isSame(selectedEndDate, 'day')) {
                      newSessions.set(current.format('YYYY-MM-DD'), session);
                      current = current.add(1, 'day');
                    }
                    setLocalDateSessions(newSessions);
                    
                    // Also update from/to sessions
                    onSessionChange(session, session);
                    
                    // Trigger recalculation
                    if (onCalculate) {
                      setTimeout(onCalculate, 100);
                    }
                  }
                }}
                className={`text-[9px] px-2 py-0.5 rounded transition-colors ${
                  session === 'FULL_DAY' 
                    ? 'bg-blue-500 text-white' 
                    : session === 'FIRST_HALF' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-yellow-500 text-white'
                }`}
              >
                {session === 'FULL_DAY' ? 'Full Day' : session === 'FIRST_HALF' ? 'AM' : 'PM'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}