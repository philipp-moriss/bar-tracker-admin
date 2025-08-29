import { TFunction } from 'i18next';
import * as z from 'zod';

/**
 * Общие схемы валидации для переиспользования
 */
export const commonValidations = {
  /**
   * Обязательное строковое поле
   */
  requiredString: (t: (key: string) => string) => 
    z.string().min(1, t('common.required')),
  
  /**
   * Email валидация
   */
  email: (t: (key: string) => string) => 
    z.string().email('Invalid email format').min(1, t('common.required')),
  
  /**
   * Пароль с минимальной длиной
   */
  password: (minLength: number = 6) => 
    z.string().min(minLength, `Password must be at least ${minLength} characters`),
  
  /**
   * Опциональная строка
   */
  optionalString: () => z.string().optional().default(''),
  
  /**
   * Файл с ограничением размера
   */
  file: (maxSizeMB: number = 1) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return z.custom<File | null>((file) => {
      if (!file) return false;
      if (!(file instanceof File)) return false;
      return file.size <= maxSizeBytes;
    }, {
      message: `File size must be less than ${maxSizeMB}MB`
    }).refine((file) => file !== null, {
      message: 'File is required'
    });
  },
  
  /**
   * Опциональный файл
   */
  optionalFile: (maxSizeMB: number = 1) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return z.custom<File | null>((file) => {
      if (!file) return true; // Опциональный
      if (!(file instanceof File)) return false;
      return file.size <= maxSizeBytes;
    }, {
      message: `File size must be less than ${maxSizeMB}MB`
    }).nullable();
  }
};

/**
 * Утилита для создания схемы формы с общими паттернами
 */
export const createFormSchema = <T extends Record<string, z.ZodTypeAny>>(
  fields: T,
  _t: (key: string) => string
) => {
  return z.object(fields);
};

/**
 * Стандартные обработчики ошибок для форм
 */
export const formErrorHandlers = {
  /**
   * Обработка API ошибок
   */
  handleApiError: (
    error: unknown,
    form: { setError: (field: string | number, error: { message: string }) => void },
    _t: TFunction,
    fieldName: string | number = 'root'
  ) => {
    const apiError = error as { 
      response?: { 
        status?: number; 
        data?: { message?: string } 
      }; 
      message?: string 
    };
    
    let errorMessage = 'An error occurred';
    
    if (apiError?.response?.data?.message) {
      errorMessage = apiError.response.data.message;
    } else if (apiError?.message) {
      errorMessage = apiError.message;
    }
    
    form.setError(fieldName, {
      message: errorMessage
    });
  },

  /**
   * Обработка ошибок размера файла
   */
  handleFileSizeError: (
    error: unknown,
    form: { setError: (field: string | number, error: { message: string }) => void },
    _t: TFunction,
    maxSizeMB: number = 1
  ) => {
    const apiError = error as { 
      response?: { 
        status?: number; 
        data?: { message?: string } 
      }; 
      message?: string 
    };
    
    // Проверяем на ошибку размера файла
    if (
      apiError?.response?.status === 413 || 
      (typeof apiError?.response?.data?.message === 'string' && 
       apiError.response.data.message.toLowerCase().includes('file'))
    ) {
      form.setError('file', {
        message: `File size must be less than ${maxSizeMB}MB`
      });
    } else {
      formErrorHandlers.handleApiError(error, form, _t);
    }
  }
};

/**
 * Стандартные конфигурации для форм
 */
export const standardFormConfig = {
  mode: 'onChange' as const,
  reValidateMode: 'onChange' as const
};

/**
 * Стандартные значения по умолчанию для разных типов форм
 */
export const defaultFormValues = {
  auth: {
    login: {
      email: '',
      password: ''
    },
    register: {
      name: '',
      email: '',
      password: ''
    }
  },
  contact: {
    name: '',
    description: '',
    label: '',
    link: '',
    phone: ''
  },
  image: {
    name: '',
    file: null as File | null
  }
};

/**
 * Типы для стандартных форм
 */
export type LoginFormData = typeof defaultFormValues.auth.login;
export type RegisterFormData = typeof defaultFormValues.auth.register;
export type ContactFormData = typeof defaultFormValues.contact;
export type ImageFormData = typeof defaultFormValues.image; 