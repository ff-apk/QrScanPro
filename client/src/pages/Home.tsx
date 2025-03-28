import { useState, useEffect, ChangeEvent } from "react";
import { toast } from "sonner";
import CameraView from "@/components/QRScanner/CameraView";
import BottomMenu from "@/components/QRScanner/BottomMenu";
import PermissionModal from "@/components/QRScanner/PermissionModal";
import { initScanner, processQRCodeImage } from "@/lib/qrScanner";

export default function Home() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<string>("environment");
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (isCameraActive && !scanning) {
      setScanning(true);
      const scannerCleanup = initScanner(
        "camera-view",
        (result) => {
          handleSuccessfulScan(result);
        },
        (error) => {
          console.error("QR Scanner error:", error);
        }
      );

      return () => {
        scannerCleanup();
        setScanning(false);
      };
    }
  }, [isCameraActive, scanning]);

  const handleSuccessfulScan = (data: string) => {
    toast.success(`QR Code detected: ${data}`, {
      icon: <i className="bi bi-check-circle"></i>,
    });
  };

  const handleSwitchCamera = () => {
    if (!cameraPermissionGranted) {
      toast.error("Camera permission not granted", {
        icon: <i className="bi bi-exclamation-circle"></i>,
      });
      return;
    }

    setFacingMode(facingMode === "environment" ? "user" : "environment");
    toast.info(`Switched to ${facingMode === "environment" ? "front" : "back"} camera`, {
      icon: <i className="bi bi-info-circle"></i>,
    });
  };

  const handleTakePhoto = () => {
    toast.info("Opening device camera...", {
      icon: <i className="bi bi-camera"></i>,
    });
    // This would typically launch the native camera app
    // Since we can't directly access native camera from web, we rely on the file input
    document.getElementById("file-input")?.click();
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    toast.info("Processing image...", {
      icon: <i className="bi bi-image"></i>,
    });

    const reader = new FileReader();
    reader.onload = function(e) {
      if (e.target?.result) {
        const img = new Image();
        img.onload = function() {
          processQRCodeImage(img)
            .then(result => {
              if (result) {
                handleSuccessfulScan(result);
              } else {
                toast.error("No QR code detected", {
                  icon: <i className="bi bi-exclamation-circle"></i>,
                });
              }
            })
            .catch(error => {
              toast.error(`Error processing QR code: ${error.message}`, {
                icon: <i className="bi bi-exclamation-circle"></i>,
              });
            });
        };
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    event.target.value = "";
  };

  const requestCameraPermission = () => {
    setShowPermissionModal(false);
    setIsCameraActive(true);
    setCameraPermissionGranted(true);
    toast.info("Initializing camera...", {
      icon: <i className="bi bi-camera-video"></i>,
    });
  };

  const useUploadOnly = () => {
    setShowPermissionModal(false);
    toast.info("Upload mode enabled", {
      icon: <i className="bi bi-upload"></i>,
    });
  };

  const stopCamera = () => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      setCurrentStream(null);
      setIsCameraActive(false);
    }
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="bg-black min-h-screen">
      <CameraView 
        isActive={isCameraActive} 
        facingMode={facingMode}
        onScan={handleSuccessfulScan}
        setIsCameraActive={setIsCameraActive}
      />
      
      <BottomMenu 
        onSwitchCamera={handleSwitchCamera}
        onTakePhoto={handleTakePhoto}
        onFileUpload={handleFileUpload}
      />
      
      <PermissionModal 
        isVisible={showPermissionModal}
        onRequestPermission={requestCameraPermission}
        onUseUploadOnly={useUploadOnly}
      />
    </div>
  );
}
