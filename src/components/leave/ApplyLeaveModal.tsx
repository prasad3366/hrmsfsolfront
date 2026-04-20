import React, { useState, useMemo } from 'react';
import { X, AlertCircle, FileText } from 'lucide-react';
import { Button, Input } from '../../components/ui/components';
import { CreateLeaveDto } from '../../services/api';

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateLeaveDto) => Promise<void>;
  isSubmitting?: boolean;
}

const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  if (!isOpen) return null;
  const [formData, setFormData] = useState({
    leaveTypeId: 1,
    startDate: '',
    endDate: '',
    durationType: 'FULL_DAY' as 'FULL_DAY' | 'HALF_DAY_FIRST' | 'HALF_DAY_SECOND',
    reason: '',
    medicalCertificate: null as string | null,
    medicalCertificateFileName: '',
  });
  const [certificateError, setCertificateError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCertificateError('');

    // Check if sick leave > 2 days and no certificate
    const totalDays = calculateDays(formData.startDate, formData.endDate, formData.durationType);
    if (formData.leaveTypeId === 2 && totalDays > 2 && !formData.medicalCertificate) {
      setCertificateError('Medical certificate is required for sick leave more than 2 days');
      return;
    }

    try {
      await onSubmit({
        ...formData,
        medicalCertificate: formData.medicalCertificate,
        medicalCertificateFileName: formData.medicalCertificateFileName,
      });
      setFormData({
        leaveTypeId: 1,
        startDate: '',
        endDate: '',
        durationType: 'FULL_DAY',
        reason: '',
        medicalCertificate: null,
        medicalCertificateFileName: '',
      });
      setCertificateError('');
      onClose();
    } catch (error) {
      // Error handling is managed by the hook
    }
  };

  const calculateDays = (start: string, end: string, duration: string): number => {
    if (!start || !end) return 0;
    if (duration === 'FULL_DAY' || duration === 'HALF_DAY_FIRST' || duration === 'HALF_DAY_SECOND') {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diff = endDate.getTime() - startDate.getTime();
      const days = Math.floor(diff / 86400000) + 1;
      return duration === 'FULL_DAY' ? days : 0.5;
    }
    return 0;
  };

  const totalDays = useMemo(() => calculateDays(formData.startDate, formData.endDate, formData.durationType), 
    [formData.startDate, formData.endDate, formData.durationType]
  );

  const requiresMedicalCertificate = formData.leaveTypeId === 2 && totalDays > 2;

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setCertificateError('File size must be less than 5MB');
      return;
    }

    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setCertificateError('Only PDF, JPG, JPEG, and PNG files are allowed');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        medicalCertificate: base64,
        medicalCertificateFileName: file.name,
      }));
      setCertificateError('');
    };
    reader.onerror = () => {
      setCertificateError('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">Apply for Leave</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors flex-shrink-0 ml-2"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
              <select
                value={formData.leaveTypeId.toString()}
                onChange={(e) => setFormData({ ...formData, leaveTypeId: parseInt(e.target.value) })}
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              >
                <option value="1">Casual Leave</option>
                <option value="2">Sick Leave</option>
                <option value="3">Maternity Leave</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Duration Type</label>
              <select
                value={formData.durationType}
                onChange={(e) => setFormData({ ...formData, durationType: e.target.value as 'FULL_DAY' | 'HALF_DAY_FIRST' | 'HALF_DAY_SECOND' })}
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              >
                <option value="FULL_DAY">Full Day</option>
                <option value="HALF_DAY_FIRST">Half Day (First Half)</option>
                <option value="HALF_DAY_SECOND">Half Day (Second Half)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Please provide a reason for your leave request"
              rows={5}
              required
              className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none"
            />
          </div>

          {/* Medical Certificate Section */}
          {requiresMedicalCertificate && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-900">Medical Certificate Required</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Sick leave for more than 2 days requires a medical certificate.
                  </p>
                </div>
              </div>

              <div className="border-2 border-dashed border-amber-300 rounded-lg p-6 text-center cursor-pointer hover:bg-amber-100/50 transition">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleCertificateUpload}
                  className="hidden"
                  id="medical-certificate"
                />
                <label htmlFor="medical-certificate" className="cursor-pointer block">
                  <FileText className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-900">
                    {formData.medicalCertificateFileName || 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">PDF, JPG, JPEG, PNG up to 5MB</p>
                </label>
              </div>

              {formData.medicalCertificate && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded flex items-center gap-2">
                  <span className="text-sm font-medium text-emerald-700">✓ {formData.medicalCertificateFileName}</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, medicalCertificate: null, medicalCertificateFileName: '' })}
                    className="ml-auto text-emerald-600 hover:text-emerald-800 text-xs font-medium"
                  >
                    Remove
                  </button>
                </div>
              )}

              {certificateError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {certificateError}
                </div>
              )}
            </div>
          )}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex-shrink-0">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? 'Submitting...' : 'Apply Leave'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeaveModal;
