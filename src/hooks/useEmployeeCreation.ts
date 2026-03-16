import { useState } from 'react';
import ApiService, { CreateEmployeeDto, CreateEmployeeResponse } from '../services/api';

export interface UseEmployeeCreationReturn {
  isLoading: boolean;
  error: string | null;
  success: CreateEmployeeResponse | null;
  createEmployee: (employee: CreateEmployeeDto) => Promise<CreateEmployeeResponse | null>;
  reset: () => void;
}

/**
 * Hook for managing employee creation with loading and error states
 */
export const useEmployeeCreation = (): UseEmployeeCreationReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<CreateEmployeeResponse | null>(null);

  const createEmployee = async (employee: CreateEmployeeDto): Promise<CreateEmployeeResponse | null> => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await ApiService.createEmployee(employee);
      setSuccess(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create employee';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setSuccess(null);
  };

  return {
    isLoading,
    error,
    success,
    createEmployee,
    reset,
  };
};
