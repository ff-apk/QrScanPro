interface PermissionModalProps {
  isVisible: boolean;
  onRequestPermission: () => void;
  onUseUploadOnly: () => void;
}

const PermissionModal = ({ isVisible, onRequestPermission, onUseUploadOnly }: PermissionModalProps) => {
  if (!isVisible) return null;

  return (
    <div className="modal fade show" 
         id="permissionModal" 
         style={{ display: isVisible ? 'block' : 'none' }}
         tabIndex={-1} 
         aria-labelledby="permissionModalLabel" 
         aria-modal="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-[#212121] text-white border border-[rgba(255,255,255,0.1)]">
          <div className="modal-header border-b border-[rgba(255,255,255,0.1)]">
            <h5 className="modal-title" id="permissionModalLabel">Camera Permission Required</h5>
          </div>
          <div className="modal-body">
            <p>This app needs access to your camera to scan QR codes. Please grant permission when prompted.</p>
            <div className="text-center my-4">
              <i className="bi bi-camera-video text-4xl text-[#0d6efd]"></i>
            </div>
          </div>
          <div className="modal-footer border-t border-[rgba(255,255,255,0.1)]">
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={onRequestPermission}
            >
              Allow Camera Access
            </button>
            <button 
              type="button" 
              className="btn btn-outline-light" 
              onClick={onUseUploadOnly}
            >
              Use Upload Only
            </button>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </div>
  );
};

export default PermissionModal;
