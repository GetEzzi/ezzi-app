import axios, { AxiosResponse } from 'axios';
import { API_BASE_URL } from '../../shared/constants';
import {
  API_ENDPOINTS,
  DebugRequest,
  DebugResponse,
  SolveRequest,
  SolveResponse,
} from '../../shared/api';
import {
  AppModeProcessor,
  ProcessingParams,
  ProcessingResult,
} from './AppModeProcessor';

export class LiveInterviewProcessor implements AppModeProcessor {
  async processSolve(
    params: ProcessingParams,
  ): Promise<ProcessingResult<SolveResponse>> {
    try {
      const { images, isMock, signal, headers } = params;

      const extractResponse = await axios.post<
        SolveRequest,
        AxiosResponse<SolveResponse>
      >(
        `${API_BASE_URL}${API_ENDPOINTS.SOLUTIONS.SOLVE}`,
        {
          images,
          isMock,
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
      console.error('API Error Details:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });

      if (axiosError.response?.status === 401) {
        return {
          success: false,
          error:
            'Your session or subscription has expired. Please sign in again.',
        };
      }

      if (axiosError.response?.status === 402) {
        return {
          success: false,
          error:
            'You have used up your free solutions. Please upgrade to continue.',
        };
      }

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      };
    }
  }

  async processDebug(
    params: ProcessingParams,
  ): Promise<ProcessingResult<DebugResponse>> {
    try {
      const { images, isMock, signal, headers } = params;

      const response = await axios.post<
        DebugRequest,
        AxiosResponse<DebugResponse>
      >(
        `${API_BASE_URL}${API_ENDPOINTS.SOLUTIONS.DEBUG}`,
        { images, isMock },
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
      console.error('Debug API Error Details:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });

      if (axiosError.response?.status === 401) {
        return {
          success: false,
          error:
            'Your session or subscription has expired. Please sign in again.',
        };
      }

      if (axiosError.response?.status === 402) {
        return {
          success: false,
          error:
            'You have used up your free solutions. Please upgrade to continue.',
        };
      }

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      };
    }
  }
}
