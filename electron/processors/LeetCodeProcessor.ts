import axios, { AxiosResponse } from 'axios';
import { API_BASE_URL } from '../../shared/constants';
import {
  API_ENDPOINTS,
  LeetCodeDebugRequest,
  LeetCodeDebugResponse,
  LeetCodeSolveRequest,
  LeetCodeSolveResponse,
} from '../../shared/api';
import {
  AppModeProcessor,
  ProcessingParams,
  ProcessingResult,
} from './AppModeProcessor';

export class LeetCodeProcessor implements AppModeProcessor {
  async processSolve(
    params: ProcessingParams,
  ): Promise<ProcessingResult<LeetCodeSolveResponse>> {
    try {
      const { images, language, isMock, locale, signal, headers } = params;

      const extractResponse = await axios.post<
        LeetCodeSolveRequest,
        AxiosResponse<LeetCodeSolveResponse>
      >(
        `${API_BASE_URL}${API_ENDPOINTS.LEETCODE.SOLVE}`,
        {
          images,
          language,
          isMock,
          locale,
        },
        {
          signal,
          timeout: 300000,
          headers,
        },
      );

      return { success: true, data: extractResponse.data };
    } catch (error: any) {
      if (axios.isCancel(error)) {
        return {
          success: false,
          error: 'Processing was canceled by the user.',
        };
      }

      console.error('LeetCode API Error Details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      if (error.response?.status === 401) {
        return {
          success: false,
          error:
            'Your session or subscription has expired. Please sign in again.',
        };
      }

      if (error.response?.status === 402) {
        return {
          success: false,
          error:
            'You have used up your free solutions. Please upgrade to continue.',
        };
      }

      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  async processDebug(
    params: ProcessingParams,
  ): Promise<ProcessingResult<LeetCodeDebugResponse>> {
    try {
      const { images, language, isMock, locale, signal, headers } = params;

      const response = await axios.post<
        LeetCodeDebugRequest,
        AxiosResponse<LeetCodeDebugResponse>
      >(
        `${API_BASE_URL}${API_ENDPOINTS.LEETCODE.DEBUG}`,
        { images, language, isMock, locale },
        {
          signal,
          timeout: 300000,
          headers,
        },
      );

      return { success: true, data: response.data };
    } catch (error: any) {
      if (axios.isCancel(error)) {
        return {
          success: false,
          error: 'Processing was canceled by the user.',
        };
      }

      console.error('LeetCode Debug API Error Details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      if (error.response?.status === 401) {
        return {
          success: false,
          error:
            'Your session or subscription has expired. Please sign in again.',
        };
      }

      if (error.response?.status === 402) {
        return {
          success: false,
          error:
            'You have used up your free solutions. Please upgrade to continue.',
        };
      }

      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }
}
