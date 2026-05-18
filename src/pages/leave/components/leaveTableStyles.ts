export const leaveTableContainerSx = {
  backgroundColor: "var(--bg-primary)",
  borderColor: "var(--border-color)",
};

export const leaveTableSx = {
  backgroundColor: "var(--bg-primary)",
  borderColor: "var(--border-color)",
};

export const leaveTableHeaderRowSx = {
  backgroundColor: "var(--bg-secondary)",
  "& .MuiTableCell-root": {
    borderColor: "var(--border-color)",
    color: "var(--text-primary)",
  },
};

export const leaveTableRowSx = {
  backgroundColor: "var(--bg-primary)",
  "& .MuiTableCell-root": {
    borderColor: "var(--border-color)",
  },
};

export const leaveTableBodyCellSx = {
  color: "var(--text-primary)",
  fontSize: "0.875rem",
};

export const leaveTableActionCellSx = {
  ...leaveTableBodyCellSx,
  textAlign: "center",
};

export const leaveTableLocationCellSx = {
  ...leaveTableBodyCellSx,
  maxWidth: 320,
};

export const leaveTableClassName = "border";
export const leaveTableHeaderCellClassName = "!font-semibold text-gray-800";
export const leaveTableActionHeaderCellClassName =
  "!font-semibold text-gray-800 text-center";
export const leaveTableBodyClassName = "bg-white";
