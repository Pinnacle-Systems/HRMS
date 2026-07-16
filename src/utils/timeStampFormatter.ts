import dayjs from "dayjs";
import * as XLSX from 'xlsx';
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);


export const parseTimestamp = (timestamp: string): string => {
  if (!timestamp) return '';
  
  let parsedDate: dayjs.Dayjs | null = null;
  
  const formats = [
    'YYYY-MM-DDTHH:mm:ss.SSSZ',
    'YYYY-MM-DDTHH:mm:ss.SSS',
    'YYYY-MM-DDTHH:mm:ss',
    'YYYY-MM-DD HH:mm:ss',
    'YYYY-MM-DD HH:mm',
    'YYYY-MM-DDTHH:mm',
    'DD/MM/YYYY HH:mm:ss',
    'DD/MM/YYYY HH:mm',
    'MM/DD/YYYY HH:mm:ss',
    'MM/DD/YYYY HH:mm',
    'YYYY-MM-DD',
    'DD-MM-YYYY HH:mm:ss',
    'DD-MM-YYYY HH:mm',
    'MM-DD-YYYY HH:mm:ss',
    'MM-DD-YYYY HH:mm',
  ];
  
  for (const format of formats) {
    const tryParse = dayjs(timestamp, format, true);
    if (tryParse.isValid()) {
      parsedDate = tryParse;
      break;
    }
  }
  
  if (!parsedDate) {
    const nativeDate = new Date(timestamp);
    if (!isNaN(nativeDate.getTime())) {
      parsedDate = dayjs(nativeDate);
    }
  }
  
  if (parsedDate && parsedDate.isValid()) {
    return parsedDate.toISOString();
  }
  
  return timestamp;
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      let text = e.target?.result as string;
      // Remove BOM if present
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }
      resolve(text);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
};

export const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Double quote inside quotes
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

// export const formatTimestampForAPI = (timestamp: any): string => {
//   if (!timestamp) return '';
  
//   // If it's a Date object (from Excel)
//   if (timestamp instanceof Date) {
//     return dayjs(timestamp).toISOString();
//   }
  
//   const cleanTimestamp = String(timestamp).trim();
//   if (!cleanTimestamp) return '';
  
//   // Try various formats
//   let parsedDate: dayjs.Dayjs | null = null;
  
//   const formats = [
//     'YYYY-MM-DDTHH:mm:ss.SSSZ',
//     'YYYY-MM-DDTHH:mm:ss.SSS',
//     'YYYY-MM-DDTHH:mm:ss',
//     'YYYY-MM-DDTHH:mm',
//     'YYYY-MM-DD HH:mm:ss',
//     'YYYY-MM-DD HH:mm',
//     'DD/MM/YYYY HH:mm:ss',
//     'DD/MM/YYYY HH:mm',
//     'MM/DD/YYYY HH:mm:ss',
//     'MM/DD/YYYY HH:mm',
//     'DD-MM-YYYY HH:mm:ss',
//     'MM-DD-YYYY HH:mm:ss',
//     'YYYY-MM-DD',
//     'DD/MM/YYYY',
//     'MM/DD/YYYY'
//   ];
  
//   for (const format of formats) {
//     const tryParse = dayjs(cleanTimestamp, format, true);
//     if (tryParse.isValid()) {
//       parsedDate = tryParse;
//       break;
//     }
//   }
  
//   // Try native Date parsing
//   if (!parsedDate) {
//     const nativeDate = new Date(cleanTimestamp);
//     if (!isNaN(nativeDate.getTime())) {
//       parsedDate = dayjs(nativeDate);
//     }
//   }
  
//   if (parsedDate && parsedDate.isValid()) {
//     return parsedDate.toISOString();
//   }
  
//   // Try to extract date and time from string
//   const dateMatch = cleanTimestamp.match(/(\d{4}-\d{2}-\d{2})/);
//   const timeMatch = cleanTimestamp.match(/(\d{2}:\d{2}(?::\d{2})?)/);
  
//   if (dateMatch) {
//     const date = dateMatch[1];
//     const time = timeMatch ? timeMatch[1] : '00:00:00';
//     const formatted = `${date}T${time}.000Z`;
//     return formatted;
//   }
  
//   return '';
// };

export const createTransformedCSV = (data: any[], originalFileName: string): File => {
  if (data.length === 0) {
    throw new Error("No data to transform");
  }
  
  // Create CSV content with proper headers
  const headers = ['Employee Code', 'Timestamp', 'Device ID', 'Remarks'];
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      [
        row.employeeCode,
        row.timestamp,
        row.deviceId || '',
        row.remarks || ''
      ].join(',')
    )
  ];
  
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = `transformed_${originalFileName}`;
  return new File([blob], fileName, { type: 'text/csv' });
};

export const getFileFormat = (fileName: string): string => {
  if (!fileName) return 'unknown';
  
  const parts = fileName.split('.');
  const extension = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  const formatMap: { [key: string]: string } = {
    'csv': 'csv',
    'txt': 'txt',
    'xlsx': 'excel',
    'xls': 'excel',
    'xlsm': 'excel',
    'xlsb': 'excel',    'xltx': 'excel',
    'xltm': 'excel'
  };
  
  return formatMap[extension] || 'unknown';
};

export const parseCSVContent = (content: string): any[] => {
  // Split by newline and clean
  const lines = content.split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  console.log('Lines found:', lines.length);
  
  if (lines.length < 2) {
    console.error('Not enough lines in file');
    return [];
  }
  
  // Get headers from first line (always use comma as delimiter)
  const headers = lines[0].split(',').map(h => h.trim());
  console.log('Headers:', headers);
  
  if (headers.length === 0 || headers[0] === '') {
    console.error('No valid headers found');
    return [];
  }
  
  // Parse data rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    // Split by comma
    const values = line.split(',').map(v => v.trim());
    
    // Skip empty rows
    if (values.every(v => v === '')) continue;
    
    // Create row object
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = index < values.length ? values[index] : '';
    });
    
    rows.push(row);
  }
  
  console.log(`Parsed ${rows.length} rows`);
  console.log('First row:', rows[0]);
  
  return rows;
};

export const validateAndTransformData = (data: any[]): { validData: any[], errors: string[] } => {
  const validData: any[] = [];
  const errors: string[] = [];
  
  if (!data || data.length === 0) {
    errors.push("No data rows found in the file");
    return { validData, errors };
  }
  
  console.log('Validating data, total rows:', data.length);
  
  // Process data rows
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    console.log(`Processing row ${i + 1}:`, row);
    
    // Skip empty rows
    if (!row || Object.values(row).every(v => v === '' || v === null || v === undefined)) {
      continue;
    }
    
    // Get all possible column names
    const keys = Object.keys(row);
    console.log(`Row ${i + 1} keys:`, keys);
    
    // Find employee code
    let employeeCode = '';
    const employeeCodeKeys = [
      'Employee Code', 'employeeCode', 'EmployeeCode', 'EmpCode', 'emp_code', 
      'Employee ID', 'EmployeeId', 'emp_id', 'Code', 'code'
    ];
    
    for (const key of employeeCodeKeys) {
      if (row[key] && row[key] !== '') {
        employeeCode = String(row[key]).trim();
        console.log(`Found employee code from key "${key}":`, employeeCode);
        break;
      }
    }
    
    // If not found, try to find any value that looks like an employee code
    if (!employeeCode) {
      for (const key of keys) {
        const value = row[key];
        if (value && typeof value === 'string') {
          const trimmed = value.trim();
          // Check if it looks like an employee code (EMP-XXX, EMPXXX, etc.)
          if (/^[A-Z]{2,4}[-\s]?\d{3,5}$/.test(trimmed) || 
              /^EMP-?\d{3,5}$/i.test(trimmed) ||
              /^[A-Z]{3,4}\d{3,4}$/.test(trimmed)) {
            employeeCode = trimmed;
            console.log(`Found employee code from value:`, employeeCode);
            break;
          }
        }
      }
    }
    
    // Find timestamp
    let timestamp = '';
    const timestampKeys = [
      'Timestamp', 'timestamp', 'Time', 'DateTime', 'Date/Time', 
      'CheckInTime', 'CheckIn', 'PunchTime', 'Punch', 'Date', 'date'
    ];
    
    for (const key of timestampKeys) {
      if (row[key] && row[key] !== '') {
        timestamp = String(row[key]).trim();
        console.log(`Found timestamp from key "${key}":`, timestamp);
        break;
      }
    }
    
    // If timestamp not found, try to find any value that looks like a timestamp
    if (!timestamp) {
      for (const key of keys) {
        const value = row[key];
        if (value && typeof value === 'string') {
          const trimmed = value.trim();
          // Check if it looks like a timestamp
          if (/^\d{4}-\d{2}-\d{2}/.test(trimmed) || 
              /^\d{2}\/\d{2}\/\d{4}/.test(trimmed)) {
            timestamp = trimmed;
            console.log(`Found timestamp from value:`, timestamp);
            break;
          }
        }
      }
    }
    
    // Skip if no employee code
    if (!employeeCode) {
      errors.push(`Row ${i + 1}: Missing employee code. Available data: ${JSON.stringify(row)}`);
      continue;
    }
    
    // Skip if no timestamp
    if (!timestamp) {
      errors.push(`Row ${i + 1}: Missing timestamp for employee ${employeeCode}`);
      continue;
    }
    
    // Format timestamp
    const formattedTimestamp = formatTimestampForAPI(timestamp);
    if (!formattedTimestamp) {
      errors.push(`Row ${i + 1}: Invalid timestamp format '${timestamp}' for employee ${employeeCode}`);
      continue;
    }
    
    // Find device ID
    let deviceId = '';
    const deviceKeys = ['Device ID', 'deviceId', 'DeviceId', 'Device', 'device_id'];
    for (const key of deviceKeys) {
      if (row[key] && row[key] !== '') {
        deviceId = String(row[key]).trim();
        break;
      }
    }
    
    // Find remarks
    let remarks = '';
    const remarkKeys = ['Remarks', 'remarks', 'Notes', 'Note', 'remark'];
    for (const key of remarkKeys) {
      if (row[key] && row[key] !== '') {
        remarks = String(row[key]).trim();
        break;
      }
    }
    
    validData.push({
      employeeCode: employeeCode,
      timestamp: formattedTimestamp,
      deviceId: deviceId,
      remarks: remarks
    });
  }
  
  console.log(`Validated ${validData.length} rows, ${errors.length} errors`);
  
  return { validData, errors };
};

export const readExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellDates: true
        });
        
        // Get first sheet
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to JSON - this automatically uses first row as headers
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          defval: '', // Default value for empty cells
          raw: false  // Get formatted values instead of raw
        });
        
        // Process dates if needed
        const processedData = jsonData.map((row: any) => {
          const processedRow: any = {};
          Object.keys(row).forEach(key => {
            let value = row[key];
            // If value is a Date object, format it
            if (value instanceof Date && !isNaN(value.getTime())) {
              value = dayjs(value).format('YYYY-MM-DD HH:mm:ss');
            }
            processedRow[key] = value;
          });
          return processedRow;
        });
        
        resolve(processedData);
      } catch (error) {
        reject(new Error(`Failed to read Excel file: ${error}`));
      }
    };
    reader.onerror = (_e) => {
      reject(new Error('Failed to read Excel file'));
    };
    reader.readAsArrayBuffer(file);
  });
};

export const cleanDataRows = (data: any[]): any[] => {
  if (!data || data.length === 0) return [];
  
  console.log('Cleaning data, total rows:', data.length);
  console.log('First row before cleaning:', data[0]);
  
  // Check if the first row has the expected headers
  const firstRow = data[0];
  const keys = Object.keys(firstRow);
  console.log('First row keys:', keys);
  
  // Check if the first row is a header row (contains 'Employee Code' or similar)
  const isHeader = keys.some(key => 
    key.toLowerCase().includes('employee') || 
    key.toLowerCase().includes('code') ||
    key.toLowerCase().includes('timestamp') ||
    key.toLowerCase().includes('time')
  );
  
  // Also check if any value in the first row looks like a header
  const values = Object.values(firstRow);
  const hasHeaderValues = values.some((v: any) => {
    if (typeof v !== 'string') return false;
    const lowerV = v.toLowerCase().trim();
    return lowerV === 'employee code' || 
           lowerV === 'timestamp' || 
           lowerV === 'time' ||
           lowerV === 'code';
  });
  
  console.log('Is header row?', isHeader || hasHeaderValues);
  
  let cleanedData = [...data];
  
  // If the first row is a header, remove it
  if (isHeader || hasHeaderValues) {
    console.log('Removing header row:', firstRow);
    cleanedData = data.slice(1);
  }
  
  console.log('Cleaned data rows:', cleanedData.length);
  if (cleanedData.length > 0) {
    console.log('First row after cleaning:', cleanedData[0]);
  }
  
  return cleanedData;
};

export const isHeaderRowStrict = (row: any): boolean => {
  if (!row) return true;
  
  const values = Object.values(row).filter(v => v !== '' && v !== null && v !== undefined);
  if (values.length === 0) return true;
  
  // Check for exact header matches
  const exactHeaderMatches = values.some((v: any) => {
    if (typeof v !== 'string') return false;
    const lowerV = v.toLowerCase().trim();
    return lowerV === 'employee code' || 
           lowerV === 'employee_code' || 
           lowerV === 'timestamp' || 
           lowerV === 'deviceid' ||
           lowerV === 'remarks' ||
           lowerV === 'employee id' ||
           lowerV === 'empid' ||
           lowerV === 'code';
  });
  
  if (exactHeaderMatches) return true;
  
  // Check for valid employee code pattern - if found, it's likely not a header
  const hasValidEmployeeCode = values.some((v: any) => {
    if (typeof v !== 'string') return false;
    return /^[A-Z]{2,4}[-\s]?\d{3,4}$/.test(v.trim()) || 
           /^EMP-?\d{3,5}$/i.test(v.trim()) ||
           /^[A-Z]{3,4}\d{3,4}$/.test(v.trim());
  });
  
  // Check for valid timestamp pattern
  const hasValidTimestamp = values.some((v: any) => {
    if (typeof v !== 'string') return false;
    return /^\d{4}-\d{2}-\d{2}/.test(v.trim()) && /^\d{2}:\d{2}/.test(v.trim());
  });
  
  // If it has valid employee code AND valid timestamp, it's data, not header
  if (hasValidEmployeeCode && hasValidTimestamp) {
    return false;
  }
  
  // Check if all values look like headers
  const allTextHeaders = values.every((v: any) => {
    if (typeof v !== 'string') return false;
    const trimmed = v.trim();
    return trimmed.length > 0 && trimmed.length < 30 && 
           !/^\d/.test(trimmed) &&
           !/^[A-Z]{2,4}-\d/.test(trimmed);
  });
  
  return allTextHeaders && values.length >= 2;
};

export const parseFileContent = (content: string): any[] => {
  // Split into lines and clean
  const lines = content.split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  console.log('Total lines found:', lines.length);
  console.log('First line raw:', lines[0]);
  
  if (lines.length < 2) {
    console.error('Not enough lines in file');
    return [];
  }
  
  // First, try to detect if the file is comma-separated
  const firstLine = lines[0];
  const hasComma = firstLine.includes(',');
  const hasTab = firstLine.includes('\t');
  const hasSemicolon = firstLine.includes(';');
  
  console.log('Delimiter detection:', { hasComma, hasTab, hasSemicolon });
  
  let delimiter = ',';
  if (hasTab && !hasComma) {
    delimiter = '\t';
  } else if (hasSemicolon && !hasComma && !hasTab) {
    delimiter = ';';
  } else if (hasComma) {
    delimiter = ',';
  }
  
  console.log(`Using delimiter: "${delimiter === '\t' ? 'tab' : delimiter}"`);
  
  // Parse headers from first line
  const headers = firstLine.split(delimiter)
    .map(h => h.trim())
    .filter(h => h !== '');
  
  console.log('Headers:', headers);
  
  if (headers.length === 0) {
    console.error('No valid headers found');
    return [];
  }
  
  // Parse data rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    console.log(`Row ${i} raw:`, line);
    
    // Split by delimiter
    const values = line.split(delimiter).map(v => v.trim());
    console.log(`Row ${i} values:`, values);
    
    // Skip empty rows
    if (values.every(v => v === '')) continue;
    
    // Create row object
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = index < values.length ? values[index] : '';
    });
    
    console.log(`Row ${i} object:`, row);
    rows.push(row);
  }
  
  console.log(`Parsed ${rows.length} data rows`);
  if (rows.length > 0) {
    console.log('First row:', rows[0]);
  }
  
  return rows;
};

export const detectDelimiter = (lines: string[]): string => {
  if (lines.length === 0) return ',';
  
  const firstLine = lines[0];
  
  // Count occurrences of each delimiter in the first line
  const delimiters = ['\t', ',', ';', '|', ':'];
  let maxCount = 0;
  let detectedDelimiter = ',';
  
  for (const delim of delimiters) {
    const count = (firstLine.match(new RegExp(delim, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      detectedDelimiter = delim;
    }
  }
  
  // If no delimiter found, default to comma
  if (maxCount === 0) {
    return ',';
  }
  
  return detectedDelimiter;
};

export function formatTimestampForAPI(timestamp: string | number | Date): string {
  if (!timestamp) return '';
  
  try {
    // If it's already a valid ISO string with timezone
    if (typeof timestamp === 'string' && dayjs(timestamp).isValid()) {
      return dayjs(timestamp).toISOString();
    }
    
    // Try to parse the timestamp
    let parsedDate = dayjs(timestamp);
    
    // If it's a number (Excel date serial number)
    if (typeof timestamp === 'number') {
      // Excel dates start from 1900-01-01
      const excelEpoch = dayjs('1899-12-30');
      parsedDate = excelEpoch.add(timestamp, 'day');
    }
    
    // If it's a string, try various formats
    if (typeof timestamp === 'string') {
      // Try common formats
      const formats = [
        'YYYY-MM-DDTHH:mm:ss.SSSZ',
        'YYYY-MM-DDTHH:mm:ssZ',
        'YYYY-MM-DD HH:mm:ss',
        'YYYY-MM-DD HH:mm',
        'YYYY-MM-DD',
        'DD/MM/YYYY HH:mm:ss',
        'DD/MM/YYYY HH:mm',
        'DD/MM/YYYY',
        'MM/DD/YYYY HH:mm:ss',
        'MM/DD/YYYY HH:mm',
        'MM/DD/YYYY'
      ];
      
      for (const format of formats) {
        const testDate = dayjs(timestamp, format);
        if (testDate.isValid()) {
          parsedDate = testDate;
          break;
        }
      }
    }
    
    // If we have a valid date, convert to ISO string
    if (parsedDate && parsedDate.isValid()) {
      return parsedDate.toISOString();
    }
    
    return '';
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return '';
  }
}