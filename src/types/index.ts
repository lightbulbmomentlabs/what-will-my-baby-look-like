/**
 * Type definitions for the baby prediction app
 */

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  label: 'you' | 'partner';
  name?: string;
  isProcessed?: boolean;
  hasFace?: boolean;
  croppedFile?: File;
  croppedPreview?: string;
}

export interface GenerationParams {
  parent1Image: string;
  parent2Image: string;
  similarity: number; // 0-100 percentage
  age: number; // 1-5 years
  gender: 'male' | 'female' | 'random';
  yourName?: string;
  partnerName?: string;
}

export interface GenerationResult {
  id: string;
  imageUrl: string;
  generatedAt: Date;
  params: GenerationParams;
}

export interface GenerationProgress {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100 percentage
  message?: string;
  error?: string;
}

export interface AnalyticsEvent {
  event: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  metadata?: Record<string, unknown>;
}

export type AgeOption = {
  value: number;
  label: string;
};

export type SharePlatform = 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'copy';

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  unit?: '%' | 'px';
}

export interface ImageUploadError {
  type: 'size' | 'format' | 'face' | 'processing' | 'network';
  message: string;
  file?: File;
}

export interface ImageProcessingState {
  isLoading: boolean;
  progress: number;
  stage: 'uploading' | 'converting' | 'compressing' | 'detecting' | 'complete' | 'error';
  error?: string;
}