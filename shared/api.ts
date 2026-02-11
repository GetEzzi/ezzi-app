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

export enum AppMode {
  LIVE_INTERVIEW = 'live-interview',
  LEETCODE_SOLVER = 'leetcode-solver',
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
  isMock?: boolean; // Optional flag for mock responses
  readableVarNames?: boolean;
}

export interface SolveResponse {
  thoughts: string[]; // Array of thought processes
  code: string; // Generated code solution
  time_complexity: string; // Big O time complexity
  space_complexity: string; // Big O space complexity
  problem_statement: string; // Extracted problem statement
  conversationId: string;
}

export interface DebugRequest {
  images: string[]; // Array of base64-encoded images
  isMock?: boolean; // Optional flag for mock responses
  readableVarNames?: boolean;
}

export interface DebugResponse {
  code: string; // Debugged/improved code
  thoughts: string[]; // Array of debugging thoughts
  time_complexity: string; // Big O time complexity
  space_complexity: string; // Big O space complexity
  conversationId: string;
}

// =============================================================================
// LEETCODE PROCESSING TYPES
// =============================================================================

export interface LeetCodeSolveRequest {
  images: string[]; // Array of base64-encoded images
  isMock?: boolean; // Optional flag for mock responses
  readableVarNames?: boolean;
}

export interface LeetCodeSolveResponse {
  code: string; // Generated code solution
  conversationId: string; // Conversation ID for context continuity
}

export interface LeetCodeDebugRequest {
  images: string[]; // Array of base64-encoded images
  conversationId: string; // Required conversation ID from previous solve request
  isMock?: boolean; // Optional flag for mock responses
  readableVarNames?: boolean;
}

export interface LeetCodeDebugResponse {
  code: string; // Debugged/improved code
  conversationId: string;
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
 * - Free tier users cannot generate solutions
 * - Paid subscriptions have unlimited solutions during the active period
 * - Check subscription level before processing requests
 *
 * LOCALIZATION:
 * - Response language and code solutions are handled by backend
 * - User language and solution language preferences are managed via settings
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
  LEETCODE: {
    SOLVE: '/solutions/leetcode/solve',
    DEBUG: '/solutions/leetcode/debug',
  },
} as const;

// =============================================================================
// ADDITIONAL TYPES
// =============================================================================

export interface Screenshot {
  path: string;
  preview: string;
}
