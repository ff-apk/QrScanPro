import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CameraViewProps {
  isActive: boolean;
  facingMode: string;
  onScan: (data: string) => void;
  setIsCameraActive: (active: boolean) => void;
}

const CameraView = ({ isActive, facingMode, onScan, setIsCameraActive }: CameraViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNoCameraOverlay, setShowNoCameraOverlay] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [zoomLevel, setZoomLevel] = useState("1x");
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [hasTorch, setHasTorch] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const initCamera = async () => {
      if (!isActive) return;

      try {
        setIsLoading(true);
        setShowNoCameraOverlay(false);

        if (videoRef.current && videoRef.current.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
        }

        const constraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: window.innerWidth },
            height: { ideal: window.innerHeight },
            zoom: zoomLevel === "1x" ? 1 : zoomLevel === "2x" ? 2 : 5
          },
          audio: false
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Check if torch is available (handle browser differences)
        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities() as any;
        setHasTorch(capabilities?.torch === true);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        setCurrentStream(stream);
        setIsCameraActive(true);
        
        // Reset torch state when camera is initialized
        setTorchEnabled(false);
      } catch (error) {
        console.error('Error accessing camera:', error);
        toast.error("Camera access failed", {
          description: "Please check your camera permissions and try again.",
        });
        setShowNoCameraOverlay(true);
        setIsCameraActive(false);
      } finally {
        setIsLoading(false);
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive, facingMode, setIsCameraActive, zoomLevel]);

  const handleRetryCamera = () => {
    setIsLoading(true);
    setShowNoCameraOverlay(false);
    setIsCameraActive(true);
  };

  const toggleTorch = async () => {
    if (!currentStream) return;
    
    try {
      const videoTrack = currentStream.getVideoTracks()[0];
      if (!videoTrack) return;
      
      const newTorchState = !torchEnabled;
      
      // Use type assertion to avoid TypeScript errors
      const constraints = {
        advanced: [{ torch: newTorchState } as any]
      };
      
      await videoTrack.applyConstraints(constraints);
      
      setTorchEnabled(newTorchState);
      toast.info(`Torch ${newTorchState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling torch:', error);
      toast.error("Failed to toggle torch", {
        description: "Your device may not support this feature.",
      });
    }
  };

  const handleZoomChange = (level: string) => {
    setZoomLevel(level);
    toast.info(`Zoom set to ${level}`);
  };

  return (
    <div className="w-full h-screen overflow-hidden relative">
      <video 
        id="camera-view" 
        ref={videoRef} 
        autoPlay 
        playsInline
        onCanPlay={() => setIsLoading(false)}
      ></video>
      
      <div className="scanner-overlay">
        <div className="scanner-line"></div>
      </div>
      
      {/* Camera controls - only show when camera is active and not loading */}
      {isActive && !isLoading && !showNoCameraOverlay && (
        <div className="camera-controls fixed bottom-24 left-0 right-0 flex justify-center items-center gap-4 z-10 p-3">
          <div className="glassmorphism rounded-full p-2 flex items-center gap-2">
            {hasTorch && (
              <Button
                variant={torchEnabled ? "default" : "outline"}
                size="icon"
                className="rounded-full"
                onClick={toggleTorch}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={torchEnabled ? 2 : 1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </Button>
            )}
            
            <div className="zoom-controls flex items-center gap-1">
              {["1x", "2x", "5x"].map((level) => (
                <Button
                  key={level}
                  variant={zoomLevel === level ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => handleZoomChange(level)}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] text-center text-white">
          <svg className="animate-spin h-10 w-10 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-medium">Initializing camera...</p>
        </div>
      )}
      
      {/* No camera overlay */}
      {showNoCameraOverlay && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4 z-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold mb-2 text-white">Camera not available</h2>
          <p className="text-center mb-4 text-gray-300">Please upload a QR code image or try enabling camera access.</p>
          <Button 
            onClick={handleRetryCamera}
            className="mb-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
            Try Again
          </Button>
          <label htmlFor="file-input" className="cursor-pointer">
            <div className="flex items-center justify-center p-2 rounded-md bg-transparent border border-white text-white hover:bg-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload QR Image
            </div>
          </label>
        </div>
      )}
    </div>
  );
};

export default CameraView;
