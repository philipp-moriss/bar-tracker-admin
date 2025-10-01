import axios from 'axios';

/**
 * Handles API errors and returns error message
 */
export const handleApiError = (error: unknown, fallbackMessage: string): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallbackMessage;
  }
  return (error as Error)?.message || fallbackMessage;
};

/**
 * Checks if error is Axios error
 */
export const isAxiosError = (error: unknown): boolean => {
  return axios.isAxiosError(error);
};

/**
 * Gets error status code
 */
export const getErrorStatus = (error: unknown): number | undefined => {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
};

/**
 * Gets response data with error
 */
export const getErrorData = (error: unknown): unknown => {
  if (axios.isAxiosError(error)) {
    return error.response?.data;
  }
  return null;
}; 