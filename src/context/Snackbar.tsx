import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import {
  Snackbar,
  Alert,
  CircularProgress,
  Backdrop,
  DialogContentText,
  DialogContent,
  DialogActions,
  Button,
  DialogTitle,
  Dialog,
} from "@mui/material";

interface UIState {
  snackbar: {
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  };
  spinner: boolean;
  confirmDialog: {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  };
}

interface UIContextType {
  state: UIState;
  showSnackbar: (
    message: string,
    severity: UIState["snackbar"]["severity"],
  ) => void;
  hideSnackbar: () => void;
  showSpinner: () => void;
  hideSpinner: () => void;
  showConfirmDialog: (options: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }) => void;
  hideConfirmDialog: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within UIProvider");
  }
  return context;
};

interface UIProviderProps {
  children: ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const [state, setState] = useState<UIState>({
    snackbar: {
      open: false,
      message: "",
      severity: "success",
    },
    spinner: false,
    confirmDialog: {
      open: false,
      title: "",
      message: "",
      onConfirm: () => {},
      confirmText: "Confirm",
      cancelText: "Cancel",
    },
  });

  const showSnackbar = (
    message: string,
    severity: UIState["snackbar"]["severity"],
  ) => {
    setState((prev) => ({
      ...prev,
      snackbar: { open: true, message, severity },
    }));
  };

  const hideSnackbar = () => {
    setState((prev) => ({
      ...prev,
      snackbar: { ...prev.snackbar, open: false },
    }));
  };

  const showSpinner = () => {
    setState((prev) => ({ ...prev, spinner: true }));
  };

  const hideSpinner = () => {
    setState((prev) => ({ ...prev, spinner: false }));
  };

  const showConfirmDialog = (options: {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }) => {
    setState((prev) => ({
      ...prev,
      confirmDialog: {
        open: true,
        title: options.title,
        message: options.message,
        onConfirm: options.onConfirm,
        onCancel: options.onCancel,
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
      },
    }));
  };

  const hideConfirmDialog = () => {
    setState((prev) => ({
      ...prev,
      confirmDialog: { ...prev.confirmDialog, open: false },
    }));
  };

  const handleConfirm = () => {
    state.confirmDialog.onConfirm();
    hideConfirmDialog();
  };

  const handleCancel = () => {
    if (state.confirmDialog.onCancel) {
      state.confirmDialog.onCancel();
    }
    hideConfirmDialog();
  };

  return (
    <UIContext.Provider
      value={{
        state,
        showSnackbar,
        hideSnackbar,
        showSpinner,
        hideSpinner,
        showConfirmDialog,
        hideConfirmDialog,
      }}
    >
      {children}

      {/* Global Snackbar */}
      <Snackbar
        open={state.snackbar.open}
        autoHideDuration={2000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={hideSnackbar}
          severity={state.snackbar.severity}
          variant="filled"
        >
          {state.snackbar.message}
        </Alert>
      </Snackbar>

      {/* Global Spinner */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={state.spinner}
      >
        <CircularProgress color="secondary" enableTrackSlot size={40} aria-label="Loading…" />
      </Backdrop>

      {/* Global Confirmation Dialog */}
      <Dialog open={state.confirmDialog.open} onClose={handleCancel}>
        <DialogTitle
          id="confirm-dialog-title"
          className="!border-b !text-gray-800 !border-gray-300 !text-[14px] !p-[15px] !font-semibold"
        >
          {state.confirmDialog.title}
        </DialogTitle>
        <DialogContent className="!p-2">
          <DialogContentText
            id="confirm-dialog-description"
            className="!text-[14px] !p-2 !text-gray-600"
          >
            {state.confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ padding: "16px 24px", gap: "12px" }}>
          <Button
            onClick={handleCancel}
            variant="outlined"
            sx={{
              textTransform: "none",
              borderColor: "#cbd5e1",
              color: "var(--text-primary)",
            }}
          >
            {state.confirmDialog.cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            sx={{
              textTransform: "none",
              backgroundColor: "#ef4444",
              "&:hover": {
                backgroundColor: "#dc2626",
              },
            }}
            autoFocus
          >
            {state.confirmDialog.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </UIContext.Provider>
  );
};
