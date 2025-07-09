/**
 * API Contract Documentation for Ezzi Backend
 *
 * This file documents all API endpoints, request/response interfaces, and data types
 * used by the Ezzi application. Backend developers should implement
 * these exact interfaces to ensure compatibility with the client application.
 */

// =============================================================================
// ENUMS & TYPES
// =============================================================================

export enum ProgrammingLanguage {
  Python = 'python',
  JavaScript = 'javascript',
  TypeScript = 'typescript',
  Java = 'java',
  Go = 'golang',
  Cpp = 'cpp',
  Swift = 'swift',
  Kotlin = 'kotlin',
  Ruby = 'ruby',
  SQL = 'sql',
  R = 'r',
  PHP = 'php',
}

export enum UserLanguage {
  EN_US = 'en-US', // English (United States)
  ES_ES = 'es-ES', // Spanish (Spain)
  ES_MX = 'es-MX', // Spanish (Mexico)
  ES_AR = 'es-AR', // Spanish (Argentina)
  PT_PT = 'pt-PT', // Portuguese (Portugal)
  PT_BR = 'pt-BR', // Portuguese (Brazil)
  FR_FR = 'fr-FR', // French (France)
  FR_CA = 'fr-CA', // French (Canada)
  DE_DE = 'de-DE', // German (Germany)
  DE_AT = 'de-AT', // German (Austria)
  UK_UA = 'uk-UA', // Ukrainian (Ukraine)
  RU_RU = 'ru-RU', // Russian (Russia)
  ZH_CN = 'zh-CN', // Chinese (Simplified, China)
  ZH_TW = 'zh-TW', // Chinese (Traditional, Taiwan)
  JA_JP = 'ja-JP', // Japanese (Japan)
  KO_KR = 'ko-KR', // Korean (Korea)
  HI_IN = 'hi-IN', // Hindi (India)
  AR_SA = 'ar-SA', // Arabic (Saudi Arabia)
  AR_EG = 'ar-EG', // Arabic (Egypt)
}

export enum SubscriptionType {
  DAYS_10 = 'DAYS_10', // 10 days = 15 USD
  DAYS_30 = 'DAYS_30', // 30 days = 30 USD
  DAYS_90 = 'DAYS_90', // 90 days = 70 USD
}

export enum SubscriptionLevel {
  FREE = 'FREE',
  PRO = 'PRO',
}

// =============================================================================
// AUTHENTICATION TYPES
// =============================================================================

export interface AuthUser {
  email: string;
}

export interface AuthSession {
  access_token: string;
}

export interface AuthResponse {
  data: {
    user: AuthUser | null;
    session: AuthSession | null;
  };
  error: {
    name?: string;
    status?: number;
  } | null;
}

export interface AuthenticatedUser {
  user: {
    email: string;
  };
  subscription: {
    active_from: string | null;
    active_to: string | null;
    level: SubscriptionLevel;
    freeSolutions: number;
  };
  settings: {
    solutionLanguage: ProgrammingLanguage;
    userLanguage: UserLanguage;
  };
}

// =============================================================================
// SOLUTION PROCESSING TYPES
// =============================================================================

export interface SolveRequest {
  images: string[]; // Array of base64-encoded images
  language: string; // Programming language for solution
  locale: string; // User locale for response language
  isMock?: boolean; // Optional flag for mock responses
}

export interface SolveResponse {
  thoughts: string[]; // Array of thought processes
  code: string; // Generated code solution
  time_complexity: string; // Big O time complexity
  space_complexity: string; // Big O space complexity
  problem_statement: string; // Extracted problem statement
}

export interface DebugRequest {
  images: string[]; // Array of base64-encoded images
  language: string; // Programming language for debugging
  locale: string; // User locale for response language
  isMock?: boolean; // Optional flag for mock responses
}

export interface DebugResponse {
  code: string; // Debugged/improved code
  thoughts: string[]; // Array of debugging thoughts
  time_complexity: string; // Big O time complexity
  space_complexity: string; // Big O space complexity
}

// =============================================================================
// SETTINGS TYPES
// =============================================================================

export interface SettingsResponse {
  solutionLanguage: ProgrammingLanguage;
  userLanguage: UserLanguage;
}

export interface UserSettingsUpdateRequest {
  solutionLanguage: ProgrammingLanguage;
  userLanguage: UserLanguage;
}

// =============================================================================
// API ENDPOINTS DOCUMENTATION
// =============================================================================

/**
 * AUTH ENDPOINTS
 */

/**
 * POST /auth/login
 *
 * Login with email and password
 *
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 *
 * Response: AuthResponse
 *
 * Headers Required: None
 * Authentication: None
 */

/**
 * POST /auth/signup
 *
 * Sign up new user with email and password
 *
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123",
 *   "options": {
 *     "emailRedirectTo": "https://example.com/auth/callback"
 *   }
 * }
 *
 * Response: AuthResponse
 *
 * Headers Required: None
 * Authentication: None
 */

/**
 * GET /auth/user
 *
 * Get current authenticated user information
 *
 * Request Body: None
 *
 * Response: AuthenticatedUser
 *
 * Headers Required:
 * - Authorization: Bearer <token>
 *
 * Authentication: Required
 */

/**
 * USER SETTINGS ENDPOINTS
 */

/**
 * GET /user-settings
 *
 * Get current user's settings
 *
 * Request Body: None
 *
 * Response: SettingsResponse
 *
 * Headers Required:
 * - Authorization: Bearer <token>
 *
 * Authentication: Required
 */

/**
 * POST /user-settings
 *
 * Update user settings
 *
 * Request Body: UserSettingsUpdateRequest
 * {
 *   "solutionLanguage": "python",
 *   "userLanguage": "en-US"
 * }
 *
 * Response: 200 OK (no body expected)
 *
 * Headers Required:
 * - Authorization: Bearer <token>
 * - Content-Type: application/json
 *
 * Authentication: Required
 */

/**
 * SOLUTION PROCESSING ENDPOINTS
 */

/**
 * POST /solutions/solve
 *
 * Process screenshots to generate initial solution
 *
 * Request Body: SolveRequest
 * {
 *   "images": ["base64image1", "base64image2"],
 *   "language": "python",
 *   "locale": "en-US",
 *   "isMock": false
 * }
 *
 * Response: SolveResponse
 *
 * Headers Required:
 * - Authorization: Bearer <token>
 * - Content-Type: application/json
 */

/**
 * POST /solutions/debug
 *
 * Process additional screenshots to debug/improve existing solution
 *
 * Request Body: DebugRequest
 * {
 *   "images": ["base64image1", "base64image2"],
 *   "language": "python",
 *   "locale": "en-US",
 *   "isMock": false
 * }
 *
 * Response: DebugResponse
 *
 * Headers Required:
 * - Authorization: Bearer <token>
 * - Content-Type: application/json
 */

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Common HTTP Status Codes and Expected Responses:
 *
 * 200 OK - Request successful
 * 400 Bad Request - Invalid request data
 * 401 Unauthorized - Invalid or missing authentication token
 * 403 Forbidden - Valid token but insufficient permissions/subscription
 * 404 Not Found - Endpoint not found
 * 408 Request Timeout - Request took too long (> 5 minutes)
 * 500 Internal Server Error - Server error
 *
 * Error Response Format:
 * {
 *   "error": "Human readable error message",
 *   "code": "ERROR_CODE", // Optional
 *   "details": {} // Optional additional details
 * }
 */

// =============================================================================
// IMPLEMENTATION NOTES
// =============================================================================

/**
 * AUTHENTICATION:
 * - Uses Bearer token authentication
 * - Token should be included in Authorization header
 *
 * IMAGE PROCESSING:
 * - Images are sent as base64-encoded strings
 * - Multiple images can be processed in a single request
 * - Images typically contain screenshots of coding problems
 *
 * SUBSCRIPTION VALIDATION:
 * - Free tier users have limited solutions (freeSolutions count)
 * - PRO users have unlimited solutions during active subscription
 * - Check subscription level and remaining free solutions before processing
 *
 * LOCALIZATION:
 * - Response language is determined by 'locale' parameter
 * - Code solutions are in the specified 'language' parameter
 * - Thoughts and explanations are in the user's preferred locale
 *
 * MOCK MODE:
 * - When isMock=true, return predefined responses for testing
 * - Should not consume user's solution quota
 * - Useful for development and testing
 */

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    USER: '/auth/user',
  },
  SETTINGS: {
    GET: '/user-settings',
    UPDATE: '/user-settings',
  },
  SOLUTIONS: {
    SOLVE: '/solutions/solve',
    DEBUG: '/solutions/debug',
  },
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;

// =============================================================================
// ADDITIONAL TYPES
// =============================================================================

export interface Screenshot {
  path: string;
  preview: string;
}
