import { useState, useCallback } from 'react';
import ApiService from '../services/api';
import { EmployeeSalary, AssignSalaryDto } from '../services/api';

export const useSalary = () => {
  const [salary, setSalary] = useState<EmployeeSalary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignSalary = useCallback(async (data: AssignSalaryDto) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ApiService.assignSalary(data);
      setSalary(result);
      return result;
    } catch (err) {
      let errorMessage = 'Failed to assign salary';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = (err as any).message;
      }
      
      console.error('Salary assignment error:', err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployeeSalaries = useCallback(async (employeeId: number) => {
    try {
      const result = await ApiService.getEmployeeSalaries(employeeId);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employee salaries';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const fetchEmployeeSalariesByCode = useCallback(async (empCode: string) => {
    try {
      const result = await ApiService.getEmployeeSalariesByCode(empCode);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employee salaries by code';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const fetchAllSalaries = useCallback(async () => {
    try {
      const result = await ApiService.getAllSalaries();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch all salaries';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    salary,
    loading,
    error,
    assignSalary,
    fetchEmployeeSalaries,
    fetchEmployeeSalariesByCode,
    fetchAllSalaries,
    clearError,
    setSalary,
  };
};
