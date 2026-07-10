import React, { useState } from 'react';
import { Dialog, Button, Input, Label } from '../../components/ui/components';
import ApiService from '../../services/api';

interface ExportAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportAttendanceModal: React.FC<ExportAttendanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await ApiService.exportAttendance(month, year);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export attendance report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="p-6 max-w-md w-full bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-1 text-slate-900">Export Attendance CSV</h2>
        <p className="text-xs text-slate-500 mb-4">
          Download employee code, name, total days, present days and leave days for a month.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold text-sm">Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="export-month" className="block text-sm font-medium text-slate-700 mb-1">
                Month
              </Label>
              <select
                id="export-month"
                value={month}
                onChange={(e) => setMonth(Number.parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2024, m - 1).toLocaleString('default', { month: 'short' })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="export-year" className="block text-sm font-medium text-slate-700 mb-1">
                Year
              </Label>
              <Input
                id="export-year"
                type="number"
                value={year}
                onChange={(e) => setYear(Number.parseInt(e.target.value, 10))}
                required
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setError(null); onClose(); }}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
              {loading ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
};
