import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  IconButton,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { CloseOutlined, CameraAlt, Refresh, ErrorOutlined } from "@mui/icons-material";
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    if (open) {
      getDevices();
    }
  }, [open]);

  const getDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      
      if (videoDevices.length === 0) {
        setError("No camera found. Please connect a camera.");
      } else {
        setError(null);
      }
    } catch (err) {
      setError("Unable to access camera. Please check permissions.");
      console.error("Error getting devices:", err);
    }
    setLoading(false);
  };

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setError(null);
      } else {
        setError("Failed to capture image. Please try again.");
      }
    }
  }, [webcamRef]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setError(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (capturedImage) {
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
    setError(null);
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

  const handleUserMedia = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  const handleUserMediaError = useCallback((err: string | DOMException) => {
    setLoading(false);
    const errorMessage = typeof err === 'string' ? err : err.message;
    console.error("Webcam error:", errorMessage);
    
    if (errorMessage.includes('Permission denied')) {
      setError('Camera access denied. Please allow camera permissions in your browser settings.');
    } else if (errorMessage.includes('Not found')) {
      setError('No camera found. Please connect a camera and refresh.');
    } else if (errorMessage.includes('NotAllowedError')) {
      setError('Camera access blocked. Please check browser permissions.');
    } else if (errorMessage.includes('NotReadableError')) {
      setError('Camera is in use by another application. Please close other apps using the camera.');
    } else {
      setError(`Camera error: ${errorMessage}`);
    }
  }, []);

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
      {/* FIX: Use Typography with proper variant and component */}
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
        <Typography 
          variant="h6" 
          component="span" // Changed from default "h2" to "span" to avoid hierarchy issues
          sx={{ fontWeight: 600 }}
        >
          {title}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseOutlined className="text-gray-800"/>
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, position: "relative", bgcolor: "#000", minHeight: "300px" }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <ErrorOutlined sx={{ fontSize: 48, color: 'error.main' }} />
            <Alert severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
            <Button 
              variant="contained" 
              onClick={() => {
                setLoading(true);
                setError(null);
                getDevices();
              }}
            >
              Retry
            </Button>
          </Box>
        ) : !capturedImage ? (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleUserMediaError}
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
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {devices.length > 1 && (
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
              )}
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