import { useState, useCallback } from 'react';
import api, { Holiday, CreateHolidayDto, UpdateHolidayDto } from '../services/api';

export const useHolidays = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [myHolidays, setMyHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create holiday
  const createHoliday = useCallback(async (holiday: CreateHolidayDto) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const newHoliday = await api.createHoliday(holiday);
      setHolidays((prev) => [...prev, newHoliday]);
      setSuccess('Holiday created successfully');
      return newHoliday;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create holiday';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Update holiday
  const updateHoliday = useCallback(async (id: number, holiday: UpdateHolidayDto) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const updatedHoliday = await api.updateHoliday(id, holiday);
      setHolidays((prev) =>
        prev.map((h) => (h.id === id ? updatedHoliday : h))
      );
      setSuccess('Holiday updated successfully');
      return updatedHoliday;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update holiday';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Delete holiday
  const deleteHoliday = useCallback(async (id: number) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await api.deleteHoliday(id);
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      setSuccess('Holiday deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete holiday';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Fetch holidays by year
  const fetchHolidaysByYear = useCallback(async (year: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getHolidaysByYear(year);
      setHolidays(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch holidays';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch my holidays
  const fetchMyHolidays = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getMyHolidays();
      setMyHolidays(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch your holidays';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    holidays,
    myHolidays,
    isLoading,
    isSubmitting,
    error,
    success,

    // Actions
    createHoliday,
    updateHoliday,
    deleteHoliday,
    fetchHolidaysByYear,
    fetchMyHolidays,
  };
};
