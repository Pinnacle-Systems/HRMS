import type { MouseEventHandler } from "react";
import { Button, IconButton, MenuItem, Tooltip } from "@mui/material";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";

export type ApprovalActionBarProps = {
  onApprove?: () => void;
  onReject?: () => void;
  onClarify?: () => void;
  onClose?: () => void;
  approveLabel?: string;
  rejectLabel?: string;
  clarifyLabel?: string;
  closeLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: "small" | "medium";
  align?: "left" | "right";
  variant?: "buttons" | "icons" | "menu";
};

export default function ApprovalActionBar({
  onApprove,
  onReject,
  onClarify,
  onClose,
  approveLabel = "Approve",
  rejectLabel = "Reject",
  clarifyLabel = "Request Clarification",
  closeLabel = "Close",
  disabled = false,
  loading = false,
  size = "medium",
  align = "right",
  variant = "buttons",
}: ApprovalActionBarProps) {
  const isDisabled = disabled || loading;
  const justifyClass = align === "left" ? "justify-start" : "justify-end";

  if (variant === "icons") {
    return (
      <div className={`inline-flex items-center gap-1 ${justifyClass}`}>
        {onApprove && (
          <Tooltip title={approveLabel}>
            <span>
              <IconButton
                size={size}
                aria-label={approveLabel}
                disabled={isDisabled}
                onClick={onApprove as MouseEventHandler<HTMLButtonElement>}
              >
                <CheckCircleOutlineOutlinedIcon className="!w-4 !h-4 !text-green-600" />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {onReject && (
          <Tooltip title={rejectLabel}>
            <span>
              <IconButton
                size={size}
                aria-label={rejectLabel}
                disabled={isDisabled}
                onClick={onReject as MouseEventHandler<HTMLButtonElement>}
              >
                <CloseOutlinedIcon className="!w-4 !h-4 !text-red-600" />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {onClarify && (
          <Tooltip title={clarifyLabel}>
            <span>
              <IconButton
                size={size}
                aria-label={clarifyLabel}
                disabled={isDisabled}
                onClick={onClarify as MouseEventHandler<HTMLButtonElement>}
              >
                <HelpOutlineOutlinedIcon className="!w-4 !h-4 text-primary" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </div>
    );
  }

  if (variant === "menu") {
    return (
      <div>
        {onApprove && (
          // <MenuItem>
          //   <Tooltip title={approveLabel}>
          //     <span>
          //       <IconButton
          //         size={size}
          //         aria-label={approveLabel}
          //         disabled={isDisabled}
          //         onClick={onApprove as MouseEventHandler<HTMLButtonElement>}
          //       >
          //         <CheckCircleOutlineOutlinedIcon className="!w-4 !h-4 !text-green-600" />
          //         Approve
          //       </IconButton>
          //     </span>
          //   </Tooltip>
          // </MenuItem>
          <MenuItem
            onClick={() => onApprove()}
            className="hover:bg-amber-50 transition-colors"
          >
            <CheckCircleOutlineOutlinedIcon className="!w-4 !mr-2 !h-4 !text-green-600" />
            Approve
          </MenuItem>
        )}
        {onReject && (
          // <MenuItem>
          //   <Tooltip title={rejectLabel}>
          //     <span>
          //       <IconButton
          //         size={size}
          //         aria-label={rejectLabel}
          //         disabled={isDisabled}
          //         onClick={onReject as MouseEventHandler<HTMLButtonElement>}
          //       >
          //         <CloseOutlinedIcon className="!w-4 !h-4 !text-red-600" />
          //         Reject
          //       </IconButton>
          //     </span>
          //   </Tooltip>
          // </MenuItem>
          <MenuItem
            onClick={() => onReject()}
            className="hover:bg-amber-50 transition-colors"
          >
            <CloseOutlinedIcon className="!w-4 !mr-2 !h-4 !text-red-600" />
            Reject
          </MenuItem>
        )}
        {onClarify && (
          // <MenuItem>
          //   <Tooltip title={clarifyLabel}>
          //     <span>
          //       <IconButton
          //         size={size}
          //         aria-label={clarifyLabel}
          //         disabled={isDisabled}
          //         onClick={onClarify as MouseEventHandler<HTMLButtonElement>}
          //       >
          //         <HelpOutlineOutlinedIcon className="!w-4 !h-4 text-primary" />
          //         Request Clarification
          //       </IconButton>
          //     </span>
          //   </Tooltip>
          // </MenuItem>
          <MenuItem
            onClick={() => onClarify()}
            className="hover:bg-amber-50 transition-colors"
          >
            <HelpOutlineOutlinedIcon className="!w-4 !mr-2 !h-4 !text-primary" />
            Request Clarification
          </MenuItem>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${justifyClass}`}>
      {onClose && (
        <Button
          variant="outlined"
          size={size}
          disabled={isDisabled}
          className="!text-gray-800 !border-gray-300"
          onClick={onClose}
        >
          {closeLabel}
        </Button>
      )}
      {onClarify && (
        <Button
          variant="contained"
          className="!bg-primary"
          size={size}
          disabled={isDisabled}
          onClick={onClarify}
        >
          {clarifyLabel}
        </Button>
      )}
      {onReject && (
        <Button
          variant="contained"
          color="error"
          size={size}
          disabled={isDisabled}
          onClick={onReject}
        >
          {rejectLabel}
        </Button>
      )}
      {onApprove && (
        <Button
          variant="contained"
          size={size}
          disabled={isDisabled}
          // className="!bg-primary"
          color="success"
          onClick={onApprove}
        >
          {approveLabel}
        </Button>
      )}
      
    </div>
  );
}
