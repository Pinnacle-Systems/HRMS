export const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export const getShiftTypeClass = (type: string) => {
  switch (type?.toLowerCase()) {
    case "night":
      return "!bg-indigo-100 !text-indigo-700";
    case "flexible":
      return "!bg-green-100 !text-green-700";
    case "rotational":
      return "!bg-orange-100 !text-orange-700";
    case "morning":
      return "!bg-yellow-100 !text-yellow-700";
    case "evening":
      return "!bg-purple-100 !text-purple-700";
    default:
      return "!bg-blue-100 !text-blue-700";
  }
};

export const colorClasses = {
  red: {
    border: "border-red-500",
    text: "text-red-700",
    icon: "text-red-500",
  },
  green: {
    border: "border-green-500",
    text: "text-green-700",
    icon: "text-green-500",
  },
  blue: {
    border: "border-blue-500",
    text: "text-blue-700",
    icon: "text-blue-500",
  },
  yellow: {
    border: "border-yellow-500",
    text: "text-yellow-700",
    icon: "text-yellow-500",
  },
};

// Format time string to 12-hour format
 export const formatTimeTo12Hour = (timeString?: string): string => {
    if (!timeString) return '--:--';

    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return '--:--';

      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      return '--:--';
    }
  };

export const statusColors = {
  Scheduled: '#3b82f6',
  Completed: '#10b981',
  Unassigned: '#ef4444',
  InProgress: '#f59e0b',
  WeeklyOff: '#f97316',
};