import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '../../components/ui/components';
import ApiService from '../../services/api';

interface AssignAssetModalProps {
  isOpen: boolean;
  assetId?: number;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (data: { assetId: number; employeeId: number }) => Promise<void>;
}

export const AssignAssetModal = ({ isOpen, assetId, isLoading, onClose, onSubmit }: AssignAssetModalProps) => {
  const [employeeId, setEmployeeId] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && employees.length === 0) {
      setLoadingEmployees(true);
      ApiService.getAllEmployees()
        .then((data) => setEmployees(data || []))
        .catch((err) => console.error('Failed to load employees:', err))
        .finally(() => setLoadingEmployees(false));
    }
  }, [isOpen, employees.length]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!employeeId || !assetId) {
      setError('Please select an employee');
      return;
    }

    try {
      await onSubmit({ assetId, employeeId: Number(employeeId) });
      setEmployeeId('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign asset');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <CardTitle>Assign Asset</CardTitle>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X size={20} />
          </button>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Employee *</label>
              {loadingEmployees ? (
                <div className="p-3 text-sm text-slate-500">Loading employees...</div>
              ) : (
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id || emp.user?.id} value={emp.id || emp.user?.id}>
                      {emp.firstName ? `${emp.firstName} ${emp.lastName}` : emp.name} ({emp.user?.email || emp.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading || loadingEmployees}>
                {isLoading ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
