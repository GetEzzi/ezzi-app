import {
  DebugResponse,
  LeetCodeDebugResponse,
  LeetCodeSolveResponse,
  SolveResponse,
} from '../../shared/api';

export interface ProcessingResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProcessingParams {
  images: string[];
  isMock: boolean;
  signal: AbortSignal;
  headers: Record<string, string>;
}

export interface AppModeProcessor {
  processSolve(
    params: ProcessingParams,
  ): Promise<ProcessingResult<SolveResponse | LeetCodeSolveResponse>>;

  processDebug(
    params: ProcessingParams,
  ): Promise<ProcessingResult<DebugResponse | LeetCodeDebugResponse>>;
}
