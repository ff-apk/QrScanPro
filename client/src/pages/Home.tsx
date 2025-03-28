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
  const [showPermissionModal, setShowPermissionModal] = useState(false); // Start false, we'll check first
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [scannerInitialized, setScannerInitialized] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true); // For initial permission check

  // Initialize QR scanner when camera is active
  useEffect(() => {
    if (isCameraActive && !scannerInitialized) {
      let qrScanner: Html5Qrcode;
      
      try {
        // First, cleanup any existing scanner instance
        if (scanner) {
          try {
            scanner.stop().catch(err => console.error("Error stopping existing scanner:", err));
            setScanner(null);
          } catch (e) {
            console.error("Error cleaning up scanner:", e);
          }
        }
        
        // Create new scanner instance
        const qrScannerElement = document.getElementById("camera-view");
        if (!qrScannerElement) {
          console.error("Camera element not found");
          return;
        }
        
        // Check if there's already a scanner initialized
        try {
          qrScanner = new Html5Qrcode("camera-view");
          setScanner(qrScanner);
        } catch (e) {
          console.error("Error creating scanner:", e);
          return;
        }
        
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: window.innerWidth / window.innerHeight,
          disableFlip: false
        };
        
        // Start scanning
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
          setScannerInitialized(false); // Make sure we reset this
          toast.error("Scanner error", {
            description: "Failed to initialize QR scanner. Please try again."
          });
        });
      } catch (error) {
        console.error("Error in scanner setup:", error);
        setScannerInitialized(false);
        toast.error("Scanner error", {
          description: "Failed to set up QR scanner. Please try again."
        });
      }
    }
    
    // Cleanup function
    return () => {
      if (isCameraActive && scanner && scannerInitialized) {
        try {
          scanner.stop()
            .then(() => {
              setScannerInitialized(false);
              console.log("Scanner stopped");
            })
            .catch((err) => {
              console.error("Error stopping scanner:", err);
            });
        } catch (e) {
          console.error("Error in scanner cleanup:", e);
        }
      }
    };
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

    // Determine which camera we're switching to
    const newFacingMode = facingMode === "environment" ? "user" : "environment";
    const cameraLabel = newFacingMode === "environment" ? "back" : "front";
    
    toast.loading(`Switching to ${cameraLabel} camera...`);
    
    // First stop any existing camera
    if (isCameraActive) {
      // Completely deactivate the camera first
      setIsCameraActive(false);
      
      // If scanner exists, stop it
      if (scanner && scannerInitialized) {
        try {
          scanner.stop().catch(console.error);
          setScannerInitialized(false);
        } catch (err) {
          console.error("Error stopping scanner:", err);
        }
      }
      
      // Close all camera tracks
      if (currentStream) {
        try {
          currentStream.getTracks().forEach(track => track.stop());
          setCurrentStream(null);
        } catch (err) {
          console.error("Error stopping streams:", err);
        }
      }
    }
    
    // Set the new facing mode
    setFacingMode(newFacingMode);
    
    // Wait a moment before reactivating the camera
    setTimeout(() => {
      toast.dismiss();
      toast.success(`Switched to ${cameraLabel} camera`);
      setIsCameraActive(true);
    }, 500);
  };

  const handleTakePhoto = () => {
    // Check if we have camera permission
    if (!cameraPermissionGranted) {
      toast.error("Camera permission not granted", {
        description: "Please allow camera access first"
      });
      return;
    }

    // Create a new file input that specifically accepts camera captures
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // Use setAttribute for non-standard attributes
    input.setAttribute('capture', 'environment'); // This prompts the native camera app
    
    // Set up the change handler
    input.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        
        toast.loading("Processing image from camera...");
        
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
                      description: "Try taking a clearer photo"
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
      }
    };
    
    // Trigger the file input
    input.click();
    
    toast.info("Opening camera", {
      description: "Take a photo of the QR code"
    });
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

  // Check camera permission on component mount
  useEffect(() => {
    // Check if camera permissions are already granted
    const checkCameraPermission = async () => {
      try {
        // Check if permission state is available
        if (navigator.permissions && navigator.permissions.query) {
          // Try to query for camera permission state
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
          
          if (permissionStatus.state === 'granted') {
            // Camera permission already granted
            setCameraPermissionGranted(true);
            setIsCameraActive(true);
            setShowPermissionModal(false);
          } else if (permissionStatus.state === 'prompt') {
            // User hasn't made a decision yet, show the modal
            setShowPermissionModal(true);
          } else {
            // Permission denied previously
            setShowPermissionModal(true);
          }
        } else {
          // Permissions API not supported, try getUserMedia directly
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // If we get here, permission is granted
            stream.getTracks().forEach(track => track.stop()); // Stop the stream right away
            setCameraPermissionGranted(true);
            setIsCameraActive(true);
            setShowPermissionModal(false);
          } catch (error) {
            // Permission denied or error
            setShowPermissionModal(true);
          }
        }
      } catch (error) {
        console.error("Error checking camera permission:", error);
        setShowPermissionModal(true);
      } finally {
        setCheckingPermissions(false);
      }
    };

    checkCameraPermission();
  }, []);

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
