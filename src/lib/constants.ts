/**
 * Application constants and configuration
 */

export const APP_CONFIG = {
  name: 'AI Baby Generator - What Will My Baby Look Like?',
  description:
    'AI baby generator uses your photos to predict what your baby will look like. Upload photos instantly to see your future baby with our scientifically accurate baby face generator. Try your first generation free!',
  url: 'https://whatwillmybabylooklike.com',
  ogImage: 'https://whatwillmybabylooklike.com/wwmbll-feat-image.jpg',
  keywords: [
    'AI baby generator',
    'baby face generator',
    'what will my baby look like',
    'baby prediction',
    'upload photos to see future baby',
    'see what my baby will look like',
    'baby face prediction',
    'future baby predictor',
    'baby maker app',
    'genetics baby predictor',
    'machine learning baby prediction',
    'baby appearance predictor',
    'family planning',
    'AI image generation',
    'neural network baby generator',
    'scientifically accurate baby predictor',
    'instant baby prediction',
    'realistic baby generator',
    'genetic trait calculator',
  ],
} as const;

export const IMAGE_CONSTRAINTS = {
  maxSize: 10 * 1024 * 1024, // 10MB
  acceptedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  outputDimensions: {
    width: 1080,
    height: 1920,
  },
} as const;

export const AGE_OPTIONS = [
  { value: 1, label: '1 year old' },
  { value: 2, label: '2 years old' },
  { value: 3, label: '3 years old' },
  { value: 4, label: '4 years old' },
  { value: 5, label: '5 years old' },
] as const;

export const GENDER_OPTIONS = [
  { value: 'random', label: 'Random' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
] as const;

export const SIMILARITY_CONFIG = {
  min: 0,
  max: 100,
  default: 50,
  step: 1,
} as const;

export const GENERATION_CONFIG = {
  maxDuration: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 2000, // 2 seconds
} as const;

export const SHARE_PLATFORMS = {
  facebook: {
    name: 'Facebook',
    icon: 'Facebook',
    color: '#1877F2',
  },
  instagram: {
    name: 'Instagram',
    icon: 'Instagram',
    color: '#E4405F',
  },
  twitter: {
    name: 'Twitter',
    icon: 'Twitter',
    color: '#1DA1F2',
  },
  tiktok: {
    name: 'TikTok',
    icon: 'Music',
    color: '#000000',
  },
  copy: {
    name: 'Copy Link',
    icon: 'Copy',
    color: '#6B7280',
  },
} as const;

export const LOCAL_STORAGE_KEYS = {
  sessionId: 'baby_predictor_session',
  lastGeneration: 'baby_predictor_last_generation',
  preferences: 'baby_predictor_preferences',
} as const;

export const ANIMATION_DURATIONS = {
  fast: 200,
  normal: 300,
  slow: 500,
} as const;