/**
 * Process a QR code from an image using the HTML5-QRCode library
 * This serves as a fallback method that doesn't require @zxing libraries
 * 
 * @param imageElement Image element containing the QR code
 * @returns Promise that resolves to the QR code data or null if none found
 */
export const processQRCodeImage = async (imageElement: HTMLImageElement): Promise<string | null> => {
  try {
    // Import the library dynamically to avoid TypeScript errors
    const { Html5Qrcode } = await import("html5-qrcode");
    
    // Create a canvas to get the image data
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Could not create canvas context');
    }
    
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    
    // Get data URL from canvas
    const dataUrl = canvas.toDataURL('image/png');
    
    // Create a temporary scanner instance
    const scanner = new Html5Qrcode("temp-qr-scanner");
    
    // Scan the image for QR code
    try {
      const result = await scanner.scanFileV2(
        new File([dataUrlToBlob(dataUrl)], "qr-image.png", { type: "image/png" })
      );
      
      return result.decodedText;
    } catch (error) {
      console.error("Error scanning QR code:", error);
      return null;
    }
  } catch (error) {
    console.error("Error processing QR code image:", error);
    return null;
  }
};

/**
 * Convert a data URL to a Blob object
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}
