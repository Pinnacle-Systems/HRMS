export const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const shiftTypes = ['General', 'Night', 'Flexible', 'Rotational'];

export const getShiftTypeClass = (type: string) => {
  switch (type) {
    case 'Night':
      return '!bg-indigo-100 !text-indigo-700';

    case 'Flexible':
      return '!bg-green-100 !text-green-700';

    case 'Rotational':
      return '!bg-orange-100 !text-orange-700';

    case 'Morning':
      return '!bg-yellow-100 !text-yellow-700';

    case 'Evening':
      return '!bg-purple-100 !text-purple-700';

    default:
      return '!bg-blue-100 !text-blue-700';
  }
};