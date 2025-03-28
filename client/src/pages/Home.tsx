import { useState, useEffect, useRef, ChangeEvent } from "react";
import { toast } from "sonner";
import CameraView from "@/components/QRScanner/CameraView";
import BottomMenu from "@/components/QRScanner/BottomMenu";
import PermissionModal from "@/components/QRScanner/PermissionModal";
import { processQRCodeImage } from "@/lib/qrScanner";
import { Html5Qrcode } from "html5-qrcode";

export default function Home() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<string>("environment");
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(true);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [scannerInitialized, setScannerInitialized] = useState(false);

  // Initialize QR scanner when camera is active
  useEffect(() => {
    if (isCameraActive && !scannerInitialized) {
      try {
        const qrScanner = new Html5Qrcode("camera-view");
        setScanner(qrScanner);
        
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: window.innerWidth / window.innerHeight,
          disableFlip: false
        };
        
        qrScanner.start(
          { facingMode },
          config,
          (decodedText) => {
            handleSuccessfulScan(decodedText);
          },
          (errorMessage) => {
            // QR code not found is expected, don't show error
            if (!errorMessage.includes("No QR code found")) {
              console.error("QR Scanner error:", errorMessage);
            }
          }
        )
        .then(() => {
          setScannerInitialized(true);
          setCurrentStream(scannerGetCurrentStream());
          toast.success("Camera initialized", {
            description: "QR scanner is ready to use"
          });
        })
        .catch((err) => {
          console.error("Error starting scanner:", err);
          toast.error("Scanner error", {
            description: "Failed to initialize QR scanner. Please try again."
          });
        });
      } catch (error) {
        console.error("Error initializing scanner:", error);
      }
      
      return () => {
        if (scanner) {
          scanner.stop()
            .then(() => {
              setScannerInitialized(false);
              console.log("Scanner stopped");
            })
            .catch((err) => {
              console.error("Error stopping scanner:", err);
            });
        }
      };
    }
  }, [isCameraActive, scannerInitialized, facingMode]);

  // Helper function to get the current MediaStream from scanner
  const scannerGetCurrentStream = (): MediaStream | null => {
    const videoElement = document.getElementById("camera-view") as HTMLVideoElement;
    if (videoElement && videoElement.srcObject instanceof MediaStream) {
      return videoElement.srcObject;
    }
    return null;
  };

  // Track last scan time to prevent multiple notifications for same code
  const lastScanTimeRef = useRef<number>(0);
  
  const handleSuccessfulScan = (data: string) => {
    // Only alert about QR codes every 3 seconds to prevent spam
    const now = Date.now();
    if (!lastScanTimeRef.current || now - lastScanTimeRef.current > 3000) {
      lastScanTimeRef.current = now;
      
      toast.success("QR Code Detected", {
        description: data,
        action: {
          label: "Copy",
          onClick: () => {
            navigator.clipboard.writeText(data);
            toast.info("Copied to clipboard");
          }
        }
      });
      
      // Pause scanning for a moment to let user see the result
      if (scanner && scannerInitialized) {
        scanner.pause();
        setTimeout(() => {
          scanner.resume();
        }, 1500);
      }
    }
  };

  const handleSwitchCamera = () => {
    if (!cameraPermissionGranted) {
      toast.error("Camera permission not granted", {
        description: "Please allow camera access first",
      });
      return;
    }

    // Stop current scanner
    if (scanner && scannerInitialized) {
      scanner.stop().then(() => {
        setScannerInitialized(false);
        setFacingMode(facingMode === "environment" ? "user" : "environment");
        
        toast.info(`Switched to ${facingMode === "environment" ? "front" : "back"} camera`);
        
        // Wait a moment before restarting with new camera
        setTimeout(() => {
          setIsCameraActive(true);
        }, 500);
      }).catch(error => {
        console.error("Error stopping camera:", error);
        toast.error("Failed to switch camera");
      });
    }
  };

  const handleTakePhoto = () => {
    toast.info("Opening file selector", {
      description: "Select a photo containing a QR code"
    });
    document.getElementById("file-input")?.click();
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    toast.loading("Processing image...");

    const reader = new FileReader();
    reader.onload = function(e) {
      if (e.target?.result) {
        const img = new Image();
        img.onload = function() {
          processQRCodeImage(img)
            .then(result => {
              toast.dismiss();
              if (result) {
                handleSuccessfulScan(result);
              } else {
                toast.error("No QR code detected", {
                  description: "Try uploading a clearer image"
                });
              }
            })
            .catch(error => {
              toast.dismiss();
              toast.error("Error processing QR code", {
                description: error.message
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
    setCameraPermissionGranted(true);
    
    toast.loading("Requesting camera access...");
    
    // Request camera permissions
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        toast.dismiss();
        // Stop the temporary stream immediately
        stream.getTracks().forEach(track => track.stop());
        setIsCameraActive(true);
        toast.success("Camera access granted");
      })
      .catch((error) => {
        toast.dismiss();
        console.error("Error accessing camera:", error);
        toast.error("Camera access denied", {
          description: "You can still upload QR code images manually"
        });
      });
  };

  const useUploadOnly = () => {
    setShowPermissionModal(false);
    toast.info("Upload mode enabled", {
      description: "You can upload QR code images to scan"
    });
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scanner && scannerInitialized) {
        scanner.stop().catch(console.error);
      }
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [scanner, scannerInitialized, currentStream]);

  return (
    <div className="bg-black min-h-screen">
      {/* Main camera view */}
      <CameraView 
        isActive={isCameraActive} 
        facingMode={facingMode}
        onScan={handleSuccessfulScan}
        setIsCameraActive={setIsCameraActive}
      />
      
      {/* Bottom menu with camera controls */}
      <BottomMenu 
        onSwitchCamera={handleSwitchCamera}
        onTakePhoto={handleTakePhoto}
        onFileUpload={handleFileUpload}
      />
      
      {/* Permission modal */}
      <PermissionModal 
        isVisible={showPermissionModal}
        onRequestPermission={requestCameraPermission}
        onUseUploadOnly={useUploadOnly}
      />
      
      {/* Hidden element for HTML5 QR Code scanner */}
      <div id="temp-qr-scanner" className="hidden"></div>
    </div>
  );
}
