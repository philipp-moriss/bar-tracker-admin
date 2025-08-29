import axios from 'axios';

/**
 * Обрабатывает ошибки API и возвращает сообщение об ошибке
 */
export const handleApiError = (error: unknown, fallbackMessage: string): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallbackMessage;
  }
  return (error as Error)?.message || fallbackMessage;
};

/**
 * Проверяет, является ли ошибка Axios ошибкой
 */
export const isAxiosError = (error: unknown): boolean => {
  return axios.isAxiosError(error);
};

/**
 * Получает статус код ошибки
 */
export const getErrorStatus = (error: unknown): number | undefined => {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
};

/**
 * Получает данные ответа с ошибкой
 */
export const getErrorData = (error: unknown): unknown => {
  if (axios.isAxiosError(error)) {
    return error.response?.data;
  }
  return null;
}; 