import { BrowserQRCodeReader } from '@zxing/browser';
import { BinaryBitmap, HybridBinarizer, RGBLuminanceSource, Result, NotFoundException } from '@zxing/library';

let qrCodeReader: BrowserQRCodeReader | null = null;
let codeReaderControls: { stop: () => Promise<void> } | null = null;

/**
 * Initialize the QR code scanner
 * @param videoElementId ID of the video element to use
 * @param onResult Callback function when a QR code is detected
 * @param onError Callback function when an error occurs
 * @returns Cleanup function
 */
export const initScanner = (
  videoElementId: string, 
  onResult: (result: string) => void,
  onError: (error: Error) => void
): (() => void) => {
  try {
    // If we already have a scanner running, stop it
    if (codeReaderControls) {
      codeReaderControls.stop().catch(console.error);
    }

    qrCodeReader = new BrowserQRCodeReader();
    
    const videoElement = document.getElementById(videoElementId) as HTMLVideoElement;
    if (!videoElement) {
      onError(new Error("Video element not found"));
      return () => {};
    }

    // Start the scanner
    qrCodeReader.decodeFromVideoElement(videoElement).then((result: Result) => {
      onResult(result.getText());
    }).catch((error: Error) => {
      // Not finding a QR code is an expected error, not a true error condition
      if (!(error instanceof NotFoundException)) {
        onError(error);
      }
    });

    // Start continuous scanning
    qrCodeReader.decodeFromVideoElementContinuously(
      videoElement,
      (result: Result) => {
        if (result) {
          onResult(result.getText());
        }
      }
    ).then(controls => {
      codeReaderControls = controls;
    }).catch(onError);

    return () => {
      if (codeReaderControls) {
        codeReaderControls.stop().catch(console.error);
        codeReaderControls = null;
      }
      qrCodeReader = null;
    };
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Unknown error initializing scanner'));
    return () => {};
  }
};

/**
 * Process a QR code from an image
 * @param imageElement Image element containing the QR code
 * @returns Promise that resolves to the QR code data or null if none found
 */
export const processQRCodeImage = async (imageElement: HTMLImageElement): Promise<string | null> => {
  try {
    const reader = new BrowserQRCodeReader();
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Could not create canvas context');
    }
    
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const luminanceSource = new RGBLuminanceSource(
      imageData.data, 
      imageData.width, 
      imageData.height
    );
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
    
    const result = reader.decode(binaryBitmap);
    return result.getText();
  } catch (error) {
    if (error instanceof NotFoundException) {
      // No QR code found in the image
      return null;
    }
    throw error;
  }
};
