import imageCompression from 'browser-image-compression';
import * as faceapi from 'face-api.js';

// Dynamic HEIC import for all devices
type HEIC2AnyFunction = (options: {
  blob: Blob;
  toType: string;
  quality: number;
}) => Promise<Blob>;

let heic2any: HEIC2AnyFunction | null = null;

export async function loadHEICConverter() {
  if (!heic2any) {
    try {
      const heicModule = await import('heic2any');
      heic2any = heicModule.default as HEIC2AnyFunction;
    } catch (error) {
      console.warn('HEIC2Any library not available:', error);
    }
  }
}

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

/**
 * Initialize face-api.js models
 */
export async function loadFaceDetectionModels() {
  if (typeof window === 'undefined') return;

  const MODEL_URL = '/models'; // We'll need to add model files to public/models
  
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
  } catch (error) {
    console.error('Failed to load face detection models:', error);
    // Fallback: continue without face detection
  }
}

/**
 * Convert HEIC file to JPEG (all devices)
 */
export async function convertHEICToJPEG(file: File): Promise<File> {
  // Check if file is HEIC/HEIF by extension since MIME type might not be set correctly
  const isHEIC = /\.(heic|heif)$/i.test(file.name) || 
                 file.type.includes('heic') || 
                 file.type.includes('heif');

  if (!isHEIC) {
    return file;
  }

  // Try to load the HEIC converter
  if (!heic2any) {
    await loadHEICConverter();
  }

  if (!heic2any) {
    console.warn('HEIC conversion library not available, skipping conversion');
    throw new Error('HEIC conversion not available. Please convert your HEIC file to JPG or PNG using your device\'s photo app and try uploading again.');
  }

  try {
    console.log('Converting HEIC file:', file.name, 'Size:', file.size);
    
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8,
    });

    const convertedFile = new File(
      [convertedBlob as Blob], 
      file.name.replace(/\.(heic|heif)$/i, '.jpg'), 
      {
        type: 'image/jpeg',
        lastModified: Date.now(),
      }
    );

    console.log('HEIC conversion successful:', convertedFile.name, 'New size:', convertedFile.size);
    return convertedFile;
    
  } catch (error) {
    console.error('HEIC conversion failed:', error);
    throw new Error('Failed to convert HEIC image. Please try uploading a JPG or PNG file instead.');
  }
}

/**
 * Compress image for optimal performance
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1, // 1MB max
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    quality: 0.8,
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Image compression failed:', error);
    return file; // Return original if compression fails
  }
}

/**
 * Detect faces in an image
 */
export async function detectFaces(imageElement: HTMLImageElement): Promise<boolean> {
  if (typeof window === 'undefined') return true; // Skip on server

  try {
    const detections = await faceapi
      .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    return detections.length > 0;
  } catch (error) {
    console.error('Face detection failed:', error);
    return true; // Continue without face detection if it fails
  }
}

/**
 * Create an image element from file for processing
 */
export function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Convert cropped canvas to file
 */
export function canvasToFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  quality: number = 0.8,
): Promise<File> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          resolve(file);
        }
      },
      'image/jpeg',
      quality,
    );
  });
}

/**
 * Resize image maintaining aspect ratio
 */
export function resizeImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 1200,
  quality: number = 0.8,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, { type: 'image/jpeg' });
            resolve(resizedFile);
          } else {
            reject(new Error('Failed to resize image'));
          }
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => reject(new Error('Failed to load image for resizing'));
    img.src = URL.createObjectURL(file);
  });
}