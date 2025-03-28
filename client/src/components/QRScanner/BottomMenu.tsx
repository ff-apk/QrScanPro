import { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";

interface BottomMenuProps {
  onSwitchCamera: () => void;
  onTakePhoto: () => void;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}

const BottomMenu = ({ onSwitchCamera, onTakePhoto, onFileUpload }: BottomMenuProps) => {
  return (
    <div className="glassmorphism fixed bottom-0 left-0 right-0 p-4 z-20">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <Button
          id="switch-camera"
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full text-white hover:bg-white/10"
          onClick={onSwitchCamera}
          aria-label="Switch camera"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </Button>
        
        <Button
          id="take-photo"
          variant="default"
          size="icon"
          className="h-16 w-16 rounded-full bg-primary shadow-lg hover:bg-primary/90 text-white"
          onClick={onTakePhoto}
          aria-label="Take photo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Button>
        
        <div>
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full text-white hover:bg-white/10 cursor-pointer"
            aria-label="Upload image"
            type="button"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </Button>
          <input 
            type="file" 
            id="file-input" 
            accept="image/*" 
            className="hidden"
            onChange={onFileUpload}
          />
        </div>
      </div>
    </div>
  );
};

export default BottomMenu;
