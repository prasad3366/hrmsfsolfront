import { useState, useCallback } from 'react';
import ApiService from '../services/api';
import { Payroll, RunPayrollDto, PayrollAdjustment } from '../services/api';

export const usePayroll = () => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [currentPayroll, setCurrentPayroll] = useState<Payroll | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runPayroll = useCallback(async (data: RunPayrollDto) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ApiService.runPayroll(data);
      setCurrentPayroll(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run payroll';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addPayrollAdjustment = useCallback(
    async (
      payrollId: number,
      name: string,
      type: 'ALLOWANCE' | 'DEDUCTION',
      amount: number
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await ApiService.addPayrollAdjustment(payrollId, name, type, amount);
        
        // Update current payroll if it matches
        if (currentPayroll && currentPayroll.id === payrollId) {
          if (!currentPayroll.others) {
            currentPayroll.others = [];
          }
          currentPayroll.others.push(result);
          setCurrentPayroll({ ...currentPayroll });
        }
        
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add adjustment';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentPayroll]
  );

  const fetchPayroll = useCallback(async (employeeId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ApiService.getPayroll(employeeId);
      setPayrolls(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payroll';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    payrolls,
    currentPayroll,
    loading,
    error,
    runPayroll,
    addPayrollAdjustment,
    fetchPayroll,
    clearError,
    setCurrentPayroll,
  };
};
