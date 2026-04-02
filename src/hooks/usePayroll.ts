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

        if (currentPayroll && currentPayroll.id === payrollId) {
          const updatedPayroll = {
            ...currentPayroll,
            others: [...(currentPayroll.others || []), result],
            grossSalary: (result as any).grossSalary ?? currentPayroll.grossSalary,
            deductions: (result as any).deductions ?? currentPayroll.deductions,
            netSalary: (result as any).netSalary ?? currentPayroll.netSalary,
          };
          setCurrentPayroll(updatedPayroll);
          setPayrolls((prev) => prev.map((p) => (p.id === payrollId ? { ...p, ...updatedPayroll } : p)));
        }

        if (currentPayroll?.employeeId) {
          await fetchPayroll(currentPayroll.employeeId);
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
    [currentPayroll, fetchPayroll]
  );

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
