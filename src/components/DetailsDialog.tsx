import type { ReactNode } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";

export type DetailsDialogProps = {
  open: boolean;
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
};

export default function DetailsDialog({
  open,
  title,
  subtitle,
  onClose,
  actions,
  children,
  maxWidth = "md",
  fullWidth = true,
}: DetailsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth={fullWidth}>
      <div className="flex items-center justify-between p-2 border-b border-gray-300">
        <div className="text-gray-800 ml-4">
          <div className="text-[12px]">{title}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
        </div>
        <IconButton onClick={onClose}>
          <CloseOutlinedIcon className="!text-gray-800"/>
        </IconButton>
      </div>
      <DialogContent className="!p-4">{children}</DialogContent>
      {actions && (
        <DialogActions className="!p-4 !border-t !border-gray-300">
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
}
