import { useEffect, useRef, useState } from "react";

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
            height: { ideal: window.innerHeight }
          },
          audio: false
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
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
  }, [isActive, facingMode, setIsCameraActive]);

  const handleRetryCamera = () => {
    setIsLoading(true);
    setShowNoCameraOverlay(false);
    setIsCameraActive(true);
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
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] text-center">
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Initializing camera...</p>
        </div>
      )}
      
      {/* No camera overlay */}
      {showNoCameraOverlay && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4 z-10">
          <i className="bi bi-camera-video-off text-6xl mb-4 text-red-500"></i>
          <h2 className="text-xl font-bold mb-2">Camera not available</h2>
          <p className="text-center mb-4">Please upload a QR code image or try enabling camera access.</p>
          <button 
            onClick={handleRetryCamera}
            className="btn btn-primary mb-2"
          >
            <i className="bi bi-camera me-2"></i>Try Again
          </button>
          <label htmlFor="file-input" className="btn btn-outline-light">
            <i className="bi bi-upload me-2"></i>Upload QR Image
          </label>
        </div>
      )}
    </div>
  );
};

export default CameraView;
