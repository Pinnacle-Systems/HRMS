// Shared diffing helpers used by both the Compare Versions dialog and the
// Change Timeline in PolicyVersionHistory — previously duplicated inline in
// that one large file.
export interface ConfigChange {
  field: string;
  changeType: string;
  oldValue: any;
  newValue: any;
}

export const getConfigChanges = (oldConfig: any, newConfig: any): ConfigChange[] => {
  const changes: ConfigChange[] = [];

  const findDifferences = (obj1: any, obj2: any, path: string = '') => {
    const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
    for (const key of allKeys) {
      const val1 = obj1?.[key];
      const val2 = obj2?.[key];
      const currentPath = path ? `${path}.${key}` : key;
      if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
        findDifferences(val1, val2, currentPath);
      } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        const changeType = val1 === undefined ? 'ADDED' : val2 === undefined ? 'REMOVED' : 'MODIFIED';
        changes.push({ field: currentPath, changeType, oldValue: val1, newValue: val2 });
      }
    }
  };

  findDifferences(oldConfig, newConfig);
  return changes;
};

export const formatDiffValue = (value: any): string => {
  if (value === undefined || value === null) return '—';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};
