import { ChangeEvent } from "react";

interface BottomMenuProps {
  onSwitchCamera: () => void;
  onTakePhoto: () => void;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}

const BottomMenu = ({ onSwitchCamera, onTakePhoto, onFileUpload }: BottomMenuProps) => {
  return (
    <div className="glassmorphism fixed bottom-0 left-0 right-0 p-4 z-20">
      <div className="container">
        <div className="row align-items-center justify-content-between">
          <div className="col-auto">
            <button 
              id="switch-camera" 
              className="btn btn-lg text-white p-2"
              onClick={onSwitchCamera}
            >
              <i className="bi bi-arrow-repeat fs-4"></i>
            </button>
          </div>
          <div className="col-auto">
            <button 
              id="take-photo" 
              className="btn btn-lg btn-primary rounded-circle p-3"
              onClick={onTakePhoto}
            >
              <i className="bi bi-camera fs-3"></i>
            </button>
          </div>
          <div className="col-auto">
            <label htmlFor="file-input" className="btn btn-lg text-white p-2 mb-0">
              <i className="bi bi-upload fs-4"></i>
            </label>
            <input 
              type="file" 
              id="file-input" 
              accept="image/*" 
              className="d-none"
              onChange={onFileUpload}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomMenu;
