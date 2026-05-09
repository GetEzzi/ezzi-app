import axios, { type AxiosResponse } from 'axios';
import {
  API_ENDPOINTS,
  type LeetCodeDebugRequest,
  type LeetCodeDebugResponse,
  type LeetCodeSolveRequest,
  type LeetCodeSolveResponse,
} from '../../shared/api';
import { API_BASE_URL } from '../../shared/constants';
import type { AppModeProcessor, ProcessingParams, ProcessingResult } from './AppModeProcessor';

export class LeetCodeProcessor implements AppModeProcessor {
  async processSolve(params: ProcessingParams): Promise<ProcessingResult<LeetCodeSolveResponse>> {
    try {
      const { images, isMock, readableVarNames, signal, headers } = params;

      const extractResponse = await axios.post<
        LeetCodeSolveRequest,
        AxiosResponse<LeetCodeSolveResponse>
      >(
        `${API_BASE_URL}${API_ENDPOINTS.LEETCODE.SOLVE}`,
        {
          images,
          isMock,
          readableVarNames,
        },
        {
          signal,
          timeout: 300000,
          headers,
        },
      );

      return { success: true, data: extractResponse.data };
    } catch (error: unknown) {
      if (axios.isCancel(error)) {
        return {
          success: false,
          error: 'Processing was canceled by the user.',
        };
      }

      const axiosError = error as {
        response?: { status?: number; data?: unknown };
        message?: string;
      };
      console.error('LeetCode API Error Details:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });

      if (axiosError.response?.status === 401) {
        return {
          success: false,
          error: 'Your session or subscription has expired. Please sign in again.',
        };
      }

      if (axiosError.response?.status === 402) {
        return {
          success: false,
          error: 'Upgrade to Pro to generate solutions. Visit getezzi.com to upgrade your plan.',
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  async processDebug(params: ProcessingParams): Promise<ProcessingResult<LeetCodeDebugResponse>> {
    try {
      const { images, isMock, readableVarNames, signal, headers, conversationId } = params;

      if (!conversationId) {
        return {
          success: false,
          error: 'Conversation ID is required for debug requests. Please solve a problem first.',
        };
      }

      const response = await axios.post<LeetCodeDebugRequest, AxiosResponse<LeetCodeDebugResponse>>(
        `${API_BASE_URL}${API_ENDPOINTS.LEETCODE.DEBUG}`,
        { images, conversationId, isMock, readableVarNames },
        {
          signal,
          timeout: 300000,
          headers,
        },
      );

      return { success: true, data: response.data };
    } catch (error: unknown) {
      if (axios.isCancel(error)) {
        return {
          success: false,
          error: 'Processing was canceled by the user.',
        };
      }

      const axiosError = error as {
        response?: { status?: number; data?: unknown };
        message?: string;
      };
      console.error('LeetCode Debug API Error Details:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });

      if (axiosError.response?.status === 401) {
        return {
          success: false,
          error: 'Your session or subscription has expired. Please sign in again.',
        };
      }

      if (axiosError.response?.status === 402) {
        return {
          success: false,
          error: 'Upgrade to Pro to generate solutions. Visit getezzi.com to upgrade your plan.',
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }
}
