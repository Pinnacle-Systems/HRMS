import type { ReactNode } from "react";
import { IconButton, Tooltip, CircularProgress, Button } from "@mui/material";
import {
  ArrowBackOutlined, FileDownloadOutlined,
  PictureAsPdfOutlined, TableViewOutlined, RefreshOutlined,
  NoteAltOutlined,
} from "@mui/icons-material";
import { attendanceService } from "../../../services/modules/attendance";
import { apiService } from "../../../services/api/api.config";
import { useUI } from "../../../context/Snackbar";

interface ExportConfig {
  reportType: string;
  params: Record<string, any>;
}

interface ReportLayoutProps {
  title: string;
  description: string;
  onBack: () => void;
  children: ReactNode;
  filterPanel: ReactNode;
  onGenerate: () => void;
  generating?: boolean;
  hasData?: boolean;
  exportConfig?: ExportConfig;
  totalRecords?: number;
}

export function ReportLayout({
  title,
  description,
  onBack,
  children,
  filterPanel,
  onGenerate,
  generating = false,
  hasData = false,
  exportConfig,
  // totalRecords,
}: ReportLayoutProps) {
  const { showSnackbar } = useUI();

  async function handleExport(format: "excel" | "pdf" | "csv") {
    if (!exportConfig) return;
    try {
      showSnackbar(`Generating ${format.toUpperCase()}...`, "info");
      const res = await attendanceService.exportReport(
        exportConfig.reportType,
        format,
        exportConfig.params
      );
      const ext = format === "excel" ? "xlsx" : format;
      await apiService.downloadFromPath(res.data.fileUrl, `${exportConfig.reportType}-report.${ext}`);
    } catch {
      showSnackbar(`Failed to export ${format.toUpperCase()}`, "error");
    }
  }

  return (
    <div className="space-y-4">
      {/* Report Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowBackOutlined fontSize="small" />
            All Reports
          </button>
          <span className="text-gray-300">|</span>
          <div>
            <div className="font-semibold text-gray-800">{title}</div>
            <div className="text-[12px] text-gray-500">{description}</div>
          </div>
        </div>

        {/* Export Buttons — shown only when data exists */}
        {hasData && exportConfig && (
          <div className="flex items-center gap-1">
            <span className="text-[12px] text-gray-500 mr-1">Export:</span>
            <Tooltip title="Export Excel">
              <IconButton size="small" onClick={() => handleExport("excel")} className="border border-gray-300">
                <TableViewOutlined fontSize="small" className="text-green-600 !w-4" />
              </IconButton>
            </Tooltip>
            {/* <Tooltip title="Export CSV">
              <IconButton size="small" onClick={() => handleExport("csv")} className="border border-gray-300">
                <PictureAsPdfOutlined fontSize="small" className="text-red-500 !w-4" />
                <NoteAltOutlined fontSize="small" className="text-red-500 !w-4"/>
              </IconButton>
            </Tooltip> */}
            <Tooltip title="Export CSV">
              <IconButton size="small" onClick={() => handleExport("csv")} className="border border-gray-300">
                <FileDownloadOutlined fontSize="small" className="text-blue-500 !w-4" />
              </IconButton>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Filter Panel */}
      <div className="bg-white-50 border border-gray-200 rounded-lg p-4">
        <div className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Filters</div>
        <div className="flex flex-wrap items-end gap-3">
          {filterPanel}
          <Button
            onClick={onGenerate}
            disabled={generating}
            variant="contained"
            className="!bg-primary !p-2 !px-5"
            startIcon={generating
              ? <><CircularProgress size={14} /> </>
              : <><RefreshOutlined  className="text-gray-800"/> </>
            }
          >
            {generating ? 'Generating...':'Generate'}
          </Button>
        </div>
      </div>

      {/* Total count badge */}
      {/* {hasData && totalRecords !== undefined && (
        <div className="flex items-center justify-between px-1">
          <span className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-700">{totalRecords}</span> record{totalRecords !== 1 ? "s" : ""}
          </span>
          {exportConfig && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span>Export:</span>
              {(["excel", "pdf", "csv"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleExport(fmt)}
                  className="px-2 py-0.5 border border-gray-300 rounded hover:bg-gray-50 text-gray-600 font-medium uppercase"
                >
                  {fmt}
                </button>
              ))}
            </div>
          )}
        </div>
      )} */}

      {/* Report Content */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        {generating ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <CircularProgress />
            <div className="text-sm text-gray-500">Generating report...</div>
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileDownloadOutlined fontSize="large" />
            <div className="mt-2 text-sm">Set filters and click Generate to view the report</div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

/* ── Shared field components ── */

interface FilterFieldProps {
  label: string;
  children: ReactNode;
}

export function FilterField({ label, children }: FilterFieldProps) {
  return (
    <div className="flex flex-col gap-1 min-w-[140px]">
      <label className="text-xs text-gray-500">{label}</label>
      {children}
    </div>
  );
}

export const inputCls =
  "border border-gray-300 rounded px-3 py-[7px] text-sm w-full focus:outline-none focus:border-primary bg-white";
