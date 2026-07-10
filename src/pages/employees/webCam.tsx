import React, { useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import { CloseOutlined, CameraAlt, Refresh } from "@mui/icons-material";
import Webcam from "react-webcam";

interface WebcamCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (imageFile: File) => void;
  title?: string;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({
  open,
  onClose,
  onCapture,
  title = "Capture Profile Photo",
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const retake = useCallback(() => {
    setCapturedImage(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (capturedImage) {
      // Convert base64 to File
      const blob = dataURLToBlob(capturedImage);
      const file = new File([blob], "profile-photo.jpg", { type: "image/jpeg" });
      onCapture(file);
      setCapturedImage(null);
      onClose();
    }
  }, [capturedImage, onCapture, onClose]);

  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    setCapturedImage(null);
  }, []);

  const dataURLToBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const videoConstraints = {
    facingMode,
    width: { ideal: 1280 },
    height: { ideal: 720 },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e5e7eb",
          py: 2,
          px: 3,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseOutlined />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, position: "relative", bgcolor: "#000" }}>
        {!capturedImage ? (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "500px",
                objectFit: "cover",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 2,
              }}
            >
              <Button
                variant="contained"
                onClick={toggleCamera}
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
                  minWidth: "auto",
                  px: 2,
                }}
              >
                <Refresh sx={{ mr: 1 }} /> Flip
              </Button>
              <Button
                variant="contained"
                onClick={capture}
                sx={{
                  bgcolor: "white",
                  color: "black",
                  "&:hover": { bgcolor: "#f0f0f0" },
                  px: 4,
                }}
                startIcon={<CameraAlt />}
              >
                Capture
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                maxHeight: "500px",
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                bgcolor: "#f3f4f6",
                p: 2,
              }}
            >
              <img
                src={capturedImage}
                alt="Captured"
                style={{
                  maxWidth: "100%",
                  maxHeight: "400px",
                  objectFit: "contain",
                  borderRadius: 8,
                }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                p: 2,
                bgcolor: "#f9fafb",
              }}
            >
              <Button variant="outlined" onClick={retake}>
                Retake
              </Button>
              <Button
                variant="contained"
                onClick={handleConfirm}
                sx={{ bgcolor: "var(--color-primary)", "&:hover": { opacity: 0.9 } }}
              >
                Confirm & Upload
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};