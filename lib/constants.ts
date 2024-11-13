// API and Endpoint Configuration
// export const PHX_HTTP_PROTOCOL = process.env.PHX_HTTP_PROTOCOL || 'http://';  
// export const PHX_ENDPOINT = process.env.PHX_ENDPOINT || 'localhost:4000';  
// export const PHX_WS_PROTOCOL = process.env.PHX_WS_PROTOCOL || 'ws://';  // Default to 'http' if not set
export const PHX_HTTP_PROTOCOL = process.env.NEXT_PUBLIC_HTTP_PROTOCOL || 'https://';  // Default to 'http' if not set
export const PHX_WS_PROTOCOL = process.env.NEXT_PUBLIC_WS_PROTOCOL || 'wss://';  // Default to 'http' if not set
export const PHX_ENDPOINT = process.env.NEXT_PUBLIC_ENDPOINT 

// Cookie Names
export const PHX_COOKIE = process.env.NEXT_PUBLIC_COOKIE || 'next-cookie';  // Could make this environment-dependent if necessary

// Other Constants
export const API_VERSION = process.env.API_VERSION || 'v1';
export const DEFAULT_LANGUAGE = process.env.DEFAULT_LANGUAGE || 'en';

// Timeouts (in milliseconds)
export const API_TIMEOUT = 30000;  // No need for environment variables here, unless you want to customize per environment

// Feature Flags
export const ENABLE_FEATURE_X = process.env.ENABLE_FEATURE_X === 'true';
export const ENABLE_FEATURE_Y = process.env.ENABLE_FEATURE_Y === 'false';

// Environment-specific constants (using environment variables)
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const DEBUG_MODE = !IS_PRODUCTION;

// Pagination
export const DEFAULT_PAGE_SIZE = Number(process.env.DEFAULT_PAGE_SIZE) || 20;
export const MAX_PAGE_SIZE = Number(process.env.MAX_PAGE_SIZE) || 100;

// File upload
export const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;  // Default to 5MB if not set
export const ALLOWED_FILE_TYPES = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,application/pdf').split(',');

// Routes
