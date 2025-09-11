/**
 * Image watermarking utilities for baby generation results
 * Adds subtle branding to generated images
 */

export interface WatermarkOptions {
  text?: string;
  fontSize?: number;
  opacity?: number;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  color?: string;
  fontFamily?: string;
  margin?: number;
}

/**
 * Add watermark to an image URL and return a new blob URL
 */
export async function addWatermarkToImage(
  imageUrl: string,
  options: WatermarkOptions = {}
): Promise<string> {
  const {
    text = 'WhatWillMyBabyLookLike.com',
    fontSize = 24,
    opacity = 0.7,
    position = 'bottom-right',
    color = '#ffffff',
    fontFamily = 'Arial, sans-serif',
    margin = 20,
  } = options;

  try {
    // Create a new image element
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // Load the image
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Set canvas dimensions to match image
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the original image
    ctx.drawImage(img, 0, 0);

    // Setup watermark styling
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = getTextAlign(position);
    ctx.textBaseline = 'bottom';

    // Add subtle shadow for better readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    // Calculate watermark position
    const { x, y } = getWatermarkPosition(
      canvas.width,
      canvas.height,
      position,
      margin
    );

    // Draw the watermark text
    ctx.fillText(text, x, y);

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve(url);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/jpeg', 0.95);
    });

  } catch (error) {
    console.error('Watermarking failed:', error);
    // Return original image URL if watermarking fails
    return imageUrl;
  }
}

/**
 * Get text alignment based on position
 */
function getTextAlign(position: string): CanvasTextAlign {
  switch (position) {
    case 'bottom-left':
      return 'left';
    case 'bottom-center':
      return 'center';
    case 'bottom-right':
    default:
      return 'right';
  }
}

/**
 * Calculate watermark position coordinates
 */
function getWatermarkPosition(
  canvasWidth: number,
  canvasHeight: number,
  position: string,
  margin: number
): { x: number; y: number } {
  const y = canvasHeight - margin;

  switch (position) {
    case 'bottom-left':
      return { x: margin, y };
    case 'bottom-center':
      return { x: canvasWidth / 2, y };
    case 'bottom-right':
    default:
      return { x: canvasWidth - margin, y };
  }
}

/**
 * Add a logo watermark instead of text (for premium branding)
 */
export async function addLogoWatermarkToImage(
  imageUrl: string,
  logoUrl: string,
  options: {
    size?: number;
    opacity?: number;
    position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
    margin?: number;
  } = {}
): Promise<string> {
  const {
    size = 0, // 0 means calculate from image width (50%)
    opacity = 0.8,
    position = 'bottom-right',
    margin = 20,
  } = options;

  try {
    // Load both images
    const [img, logo] = await Promise.all([
      loadImage(imageUrl),
      loadImage(logoUrl),
    ]);

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Set canvas dimensions
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the original image
    ctx.drawImage(img, 0, 0);

    // Calculate logo dimensions - 50% of image width if size is 0
    const logoWidth = size === 0 ? img.width * 0.5 : size;
    const logoHeight = (logo.height / logo.width) * logoWidth;
    
    const { x, y } = getLogoPosition(
      canvas.width,
      canvas.height,
      logoWidth,
      logoHeight,
      position,
      margin
    );

    // Draw logo with opacity
    ctx.globalAlpha = opacity;
    ctx.drawImage(logo, x, y, logoWidth, logoHeight);

    // Convert to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve(url);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/jpeg', 0.95);
    });

  } catch (error) {
    console.error('Logo watermarking failed:', error);
    return imageUrl;
  }
}

/**
 * Load image as Promise
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Calculate logo position coordinates
 */
function getLogoPosition(
  canvasWidth: number,
  canvasHeight: number,
  logoWidth: number,
  logoHeight: number,
  position: string,
  margin: number
): { x: number; y: number } {
  const y = canvasHeight - logoHeight - margin;

  switch (position) {
    case 'bottom-left':
      return { x: margin, y };
    case 'bottom-center':
      return { x: (canvasWidth - logoWidth) / 2, y };
    case 'bottom-right':
    default:
      return { x: canvasWidth - logoWidth - margin, y };
  }
}

/**
 * Create a watermarked version of the generated baby image
 * This is the main function to be used in the generation process
 */
export async function watermarkBabyImage(
  imageUrl: string,
  babyName?: string
): Promise<string> {
  // Use logo watermark with custom specifications
  return addLogoWatermarkToImage(imageUrl, '/images/watermark.png', {
    size: 0, // Will be calculated as 50% of image width
    opacity: 0.8,
    position: 'bottom-left',
    margin: 50,
  });
}

/**
 * Batch watermark multiple images (for future use)
 */
export async function watermarkMultipleImages(
  imageUrls: string[],
  options: WatermarkOptions = {}
): Promise<string[]> {
  const watermarkPromises = imageUrls.map(url => 
    addWatermarkToImage(url, options)
  );
  
  return Promise.all(watermarkPromises);
}