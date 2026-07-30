import React from 'react';
import { Chip } from '@mui/material';

interface ConfigurationViewerProps {
  configJson: any;
  versionNo?: string | number;
  className?: string;
}

export const ConfigurationViewer: React.FC<ConfigurationViewerProps> = ({ 
  configJson, 
  versionNo,
  className = ''
}) => {
  if (!configJson) return null;

  // Helper to format keys into readable labels
  const formatLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Helper to format values for display
  const formatDisplayValue = (value: any): string => {
    if (value === null || value === undefined) return 'Not specified';
    if (typeof value === 'boolean') return value ? '✅ Enabled' : '❌ Disabled';
    if (typeof value === 'number') {
      // Format currency if it looks like an amount
      if (value > 1000) return `₹${value.toLocaleString('en-IN')}`;
      if (Number.isInteger(value)) return value.toString();
      return value.toFixed(2);
    }
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
  };

  // Check if value is a primitive array (strings, numbers, etc.)
  const isPrimitiveArray = (arr: any[]): boolean => {
    return arr.every(item => typeof item !== 'object' || item === null);
  };

  // Render primitive arrays as chips
  const renderPrimitiveArray = (data: any[]): React.ReactNode => {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {data.map((item, index) => (
          <Chip
            key={index}
            label={String(item)}
            size="small"
            sx={{
              bgcolor: '#e3f2fd',
              color: '#1565c0',
              border: '1px solid #90caf9',
              fontSize: 12,
              fontWeight: 600,
            }}
          />
        ))}
      </div>
    );
  };

  // Render arrays of objects as tables
  const renderObjectArray = (data: any[], title?: string): React.ReactNode => {
    if (!Array.isArray(data) || data.length === 0) {
      return <span className="text-gray-500 text-xs">None configured</span>;
    }

    const allKeys = Array.from(new Set(
      data.flatMap(item => Object.keys(item))
    ));

    return (
      <div className="mt-2 overflow-x-auto">
        {title && (
          <div className="text-xs font-semibold text-gray-700 mb-2">{title}</div>
        )}
        <table className="min-w-full border border-gray-200 text-xs">
          <thead className="bg-gray-50">
            <tr>
              {allKeys.map(key => (
                <th key={key} className="px-3 py-2 text-left text-xs bg-gray-100 whitespace-nowrap text-gray-600 font-semibold">
                  {formatLabel(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {data.map((item, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {allKeys.map(key => {
                  const value = item[key];
                  // Handle nested objects within array items
                  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    return (
                      <td key={key} className="px-3 py-2 text-xs whitespace-nowrap text-gray-900">
                        {Object.entries(value).map(([k, v]) => (
                          <div key={k} className="text-xs whitespace-nowrap">
                            <span className="font-medium">{formatLabel(k)}:</span> {formatDisplayValue(v)}
                          </div>
                        ))}
                      </td>
                    );
                  }
                  return (
                    <td key={key} className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap">
                      {typeof value === 'boolean' ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {value ? 'Yes' : 'No'}
                        </span>
                      ) : (
                        formatDisplayValue(value)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render simple key-value pairs
  const renderKeyValuePairs = (obj: any): React.ReactNode => {
    if (!obj || typeof obj !== 'object') {
      return <span className="text-gray-900">{formatDisplayValue(obj)}</span>;
    }

    return Object.entries(obj).map(([key, value]) => {
      // Skip arrays of objects (handled separately)
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        return null;
      }

      // Handle primitive arrays
      if (Array.isArray(value) && isPrimitiveArray(value)) {
        return (
          <div key={key} className="py-1 border-b border-gray-200 last:border-0">
            <div className="text-xs text-gray-600 mb-1">{formatLabel(key)}:</div>
            {renderPrimitiveArray(value)}
          </div>
        );
      }

      // Handle nested objects
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return (
          <div key={key} className="mb-3">
            <div className="font-medium text-xs text-gray-700">{formatLabel(key)}:</div>
            <div className="ml-3 mt-1 space-y-1 bg-gray-50 p-2 rounded">
              {Object.entries(value).map(([subKey, subValue]) => (
                <div key={subKey} className="flex items-center justify-between py-1 border-b border-gray-200 last:border-0">
                  <span className="text-xs text-gray-600">{formatLabel(subKey)}</span>
                  <span className="text-xs font-medium text-gray-900">
                    {typeof subValue === 'boolean' ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${subValue ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {subValue ? '✅ Enabled' : '❌ Disabled'}
                      </span>
                    ) : (
                      formatDisplayValue(subValue)
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      // Render simple key-value
      return (
        <div key={key} className="flex items-center justify-between py-1 border-b border-gray-200 last:border-0">
          <span className="text-xs text-gray-600">{formatLabel(key)}</span>
          <span className="text-xs font-medium text-gray-900">
            {typeof value === 'boolean' ? (
              <span className={`px-2 py-0.5 rounded-full text-xs ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {value ? '✅ Enabled' : '❌ Disabled'}
              </span>
            ) : (
              formatDisplayValue(value)
            )}
          </span>
        </div>
      );
    });
  };

  // Render a configuration section
  const renderSection = (key: string, value: any): React.ReactNode => {
    const label = formatLabel(key);

    // Handle arrays of objects
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      return (
        <div key={key} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs font-semibold text-gray-900 mb-2 flex items-center justify-between">
            <span>{label}</span>
            <Chip
              label={`${value.length} items`}
              size="small"
              color="info"
              variant="outlined"
              sx={{ height: 18, fontSize: 9 }}
            />
          </div>
          {renderObjectArray(value)}
        </div>
      );
    }

    // Handle primitive arrays
    if (Array.isArray(value)) {
      return (
        <div key={key} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs font-semibold text-gray-900 mb-2 flex items-center justify-between">
            <span>{label}</span>
            <Chip
              label={`${value.length} items`}
              size="small"
              color="info"
              variant="outlined"
              sx={{ height: 18, fontSize: 9 }}
            />
          </div>
          {renderPrimitiveArray(value)}
        </div>
      );
    }

    // Handle nested objects
    if (typeof value === 'object' && value !== null) {
      // Check if this object has arrays of objects inside
      const hasArrayOfObjects = Object.values(value).some(
        val => Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null
      );

      if (hasArrayOfObjects) {
        return (
          <div key={key} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs font-semibold text-gray-900 mb-3">{label}</div>
            <div className="space-y-3">
              {Object.entries(value).map(([subKey, subValue]) => {
                if (Array.isArray(subValue) && subValue.length > 0 && typeof subValue[0] === 'object' && subValue[0] !== null) {
                  return renderObjectArray(subValue, formatLabel(subKey));
                }
                if (typeof subValue === 'object' && subValue !== null && !Array.isArray(subValue)) {
                  return (
                    <div key={subKey} className="bg-gray-50 rounded-lg p-3">
                      <div className="font-medium text-gray-700 mb-2 text-xs">{formatLabel(subKey)}</div>
                      {renderKeyValuePairs(subValue)}
                    </div>
                  );
                }
                if (Array.isArray(subValue) && isPrimitiveArray(subValue)) {
                  return (
                    <div key={subKey} className="bg-gray-50 rounded-lg p-3">
                      <div className="font-medium text-gray-700 mb-2 text-xs">{formatLabel(subKey)}</div>
                      {renderPrimitiveArray(subValue)}
                    </div>
                  );
                }
                return (
                  <div key={subKey} className="flex items-center justify-between py-1 border-b border-gray-200">
                    <span className="text-xs text-gray-600">{formatLabel(subKey)}</span>
                    <span className="text-xs font-medium text-gray-900">{formatDisplayValue(subValue)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      // Regular nested object
      return (
        <div key={key} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs font-semibold text-gray-900 mb-3">{label}</div>
          <div className="space-y-1">
            {renderKeyValuePairs(value)}
          </div>
        </div>
      );
    }

    // Simple key-value pair
    return (
      <div key={key} className="bg-white rounded-lg border border-gray-200 px-4 py-2 flex justify-between gap-4 items-center">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-900">{formatDisplayValue(value)}</span>
      </div>
    );
  };

  return (
    <div className={`bg-gray-50 border border-gray-200 !p-4 rounded-lg w-full ${className}`}>
      {versionNo && (
        <div className="flex justify-between items-center mb-4">
          <div className="text-gray-800 text-xs font-semibold">⚙️ Configuration</div>
          <Chip
            label={`v${versionNo}`}
            size="small"
            sx={{ bgcolor: '#f1f5f9', color: '#475569' }}
          />
        </div>
      )}
      
      <div className="flex flex-col gap-4">
        {Object.entries(configJson).map(([key, value]) => renderSection(key, value))}
      </div>
    </div>
  );
};

export default ConfigurationViewer;