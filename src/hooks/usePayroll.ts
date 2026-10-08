import { useState, useCallback } from 'react';
import ApiService, { Payroll, RunPayrollDto } from '../services/api';

export const usePayroll = (role?: string) => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [currentPayroll, setCurrentPayroll] = useState<Payroll | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canViewOrganizationPayroll = ['SUPER_ADMIN', 'CEO', 'HR'].includes(String(role ?? '').toUpperCase());

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

  const recalculatePayroll = useCallback(async (payrollId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ApiService.recalculatePayroll(payrollId);
      setCurrentPayroll(result);
      setPayrolls((previous) => previous.map((payroll) => (
        payroll.id === payrollId ? result : payroll
      )));
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to recalculate payroll';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPayroll = useCallback(async (_employeeId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = canViewOrganizationPayroll
        ? await ApiService.getPayroll()
        : await ApiService.getMyPayroll();
      setPayrolls(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payroll';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [canViewOrganizationPayroll]);

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

        if (currentPayroll?.id === payrollId) {
          const updatedPayroll = {
            ...currentPayroll,
            others: [...(currentPayroll.others || []), result],
            grossSalary: (result as any)?.grossSalary ?? currentPayroll.grossSalary,
            deductions: (result as any)?.deductions ?? currentPayroll.deductions,
            netSalary: (result as any)?.netSalary ?? currentPayroll.netSalary,
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

  const generatePayslip = useCallback(async (data: RunPayrollDto) => {
    setLoading(true);
    setError(null);
    try {
      await ApiService.generatePayslip(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate payslip';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* Correction actions report failures to the caller instead of the
     page-level error, so the payroll list stays visible */
  const previewRecalculation = useCallback(
    (payrollId: number) => ApiService.previewPayrollRecalculation(payrollId),
    [],
  );

  const reopenPayroll = useCallback(async (payrollId: number, reason: string) => {
    const result = await ApiService.reopenPayroll(payrollId, reason);
    setPayrolls((previous) => previous.map((payroll) => (
      payroll.id === payrollId ? { ...payroll, ...result } : payroll
    )));
    return result;
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
    recalculatePayroll,
    previewRecalculation,
    reopenPayroll,
    addPayrollAdjustment,
    fetchPayroll,
    generatePayslip,
    clearError,
    setCurrentPayroll,
  };
};
