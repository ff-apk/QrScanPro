import { Button } from "@/components/ui/button";

interface PermissionModalProps {
  isVisible: boolean;
  onRequestPermission: () => void;
  onUseUploadOnly: () => void;
}

const PermissionModal = ({ isVisible, onRequestPermission, onUseUploadOnly }: PermissionModalProps) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg max-w-md w-full overflow-hidden">
        <div className="p-5 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Camera Permission Required</h2>
        </div>
        
        <div className="p-6">
          <div className="flex justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          
          <p className="text-gray-300 text-center mb-6">
            This app needs access to your camera to scan QR codes. Please grant permission when prompted.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              className="flex-1"
              size="lg"
              onClick={onRequestPermission}
            >
              Allow Camera Access
            </Button>
            
            <Button 
              className="flex-1"
              variant="outline"
              size="lg"
              onClick={onUseUploadOnly}
            >
              Use Upload Only
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionModal;
