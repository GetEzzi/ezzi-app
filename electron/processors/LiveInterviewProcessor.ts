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
      const { images, language, isMock, locale, signal, headers } = params;

      const extractResponse = await axios.post<
        SolveRequest,
        AxiosResponse<SolveResponse>
      >(
        `${API_BASE_URL}${API_ENDPOINTS.SOLUTIONS.SOLVE}`,
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

      console.error('API Error Details:', {
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
  ): Promise<ProcessingResult<DebugResponse>> {
    try {
      const { images, language, isMock, locale, signal, headers } = params;

      const response = await axios.post<
        DebugRequest,
        AxiosResponse<DebugResponse>
      >(
        `${API_BASE_URL}${API_ENDPOINTS.SOLUTIONS.DEBUG}`,
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

      console.error('Debug API Error Details:', {
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
