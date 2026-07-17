import dayjs from "dayjs";
import * as XLSX from "xlsx";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export const readExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, {
          type: "array",
          cellDates: true,
        });
        // Get first sheet
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        // Convert to JSON - this automatically uses first row as headers
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          defval: "", // Default value for empty cells
          raw: false, // Get formatted values instead of raw
        });
        // Process dates if needed
        const processedData = jsonData.map((row: any) => {
          const processedRow: any = {};
          Object.keys(row).forEach((key) => {
            let value = row[key];
            // If value is a Date object, format it
            if (value instanceof Date && !isNaN(value.getTime())) {
              value = dayjs(value).format("YYYY-MM-DD HH:mm:ss");
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
      reject(new Error("Failed to read Excel file"));
    };
    reader.readAsArrayBuffer(file);
  });
};
