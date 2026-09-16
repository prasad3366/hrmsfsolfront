import React, { useState, useMemo } from 'react';
import { X, AlertCircle, FileText } from 'lucide-react';
import { Button, Input, Select } from '../../components/ui/components';
import { CreateLeaveDto, LeaveTypeOption } from '../../services/api';

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateLeaveDto) => Promise<void>;
  isSubmitting?: boolean;
  leaveTypes: LeaveTypeOption[];
}

export const calculateInclusiveLeaveDays = (
  start: string,
  end: string,
  duration: string,
): number => {
  if (!start || !end) return 0;
  if (duration === 'FULL_DAY' || duration === 'HALF_DAY_FIRST' || duration === 'HALF_DAY_SECOND') {
    const [startYear, startMonth, startDay] = start.split('-').map(Number);
    const [endYear, endMonth, endDay] = end.split('-').map(Number);
    const startDate = Date.UTC(startYear, startMonth - 1, startDay);
    const endDate = Date.UTC(endYear, endMonth - 1, endDay);
    const days = Math.floor((endDate - startDate) / 86400000) + 1;
    return duration === 'FULL_DAY' ? days : 0.5;
  }
  return 0;
};

const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting, leaveTypes }) => {
  const [formData, setFormData] = useState({
    leaveTypeId: 0,
    startDate: '',
    endDate: '',
    durationType: 'FULL_DAY' as 'FULL_DAY' | 'HALF_DAY_FIRST' | 'HALF_DAY_SECOND',
    reason: '',
    medicalCertificate: null as string | null,
    medicalCertificateFileName: '',
  });
  const [certificateError, setCertificateError] = useState('');

  const totalDays = useMemo(
    () => calculateInclusiveLeaveDays(formData.startDate, formData.endDate, formData.durationType),
    [formData.startDate, formData.endDate, formData.durationType]
  );

  const selectedLeaveType = leaveTypes.find((type) => type.id === formData.leaveTypeId);
  const requiresMedicalCertificate = Boolean(selectedLeaveType?.requiresMedical) && totalDays > 2;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCertificateError('');

    // Check if sick leave > 2 days and no certificate
    const totalDaysForSubmit = calculateInclusiveLeaveDays(formData.startDate, formData.endDate, formData.durationType);
    if (!selectedLeaveType) {
      setCertificateError('Please select a leave type');
      return;
    }
    if (selectedLeaveType?.requiresMedical && totalDaysForSubmit > 2 && !formData.medicalCertificate) {
      setCertificateError('Medical certificate is required for this leave type for more than 2 days');
      return;
    }

    try {
      await onSubmit({
        ...formData,
        medicalCertificate: formData.medicalCertificate,
        medicalCertificateFileName: formData.medicalCertificateFileName,
      });
      setFormData({
        leaveTypeId: 0,
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
      console.error('Failed to submit leave request', error);
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#022337]/45 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/70 bg-[#fffefa] shadow-[0_24px_80px_rgba(2,35,55,0.24)]">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#dce6e8] bg-[#f6faf9]/70 p-4 sm:p-6">
          <h2 className="text-xl font-bold text-[#073b5c] sm:text-2xl">Apply for leave</h2>
          <button
            onClick={onClose}
            aria-label="Close apply leave dialog"
            className="ml-2 flex-shrink-0 rounded-lg p-1.5 text-[#78909a] transition-colors hover:bg-[#edf3f5] hover:text-[#12354a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a3e]"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="leaveTypeId" className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
              <Select
                id="leaveTypeId"
                value={formData.leaveTypeId.toString()}
                onChange={(e) => setFormData({ ...formData, leaveTypeId: Number.parseInt(e.target.value, 10) })}
              >
                <option value="0" disabled>Select leave type</option>
                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="durationType" className="block text-sm font-medium text-slate-700 mb-2">Duration Type</label>
              <Select
                id="durationType"
                value={formData.durationType}
                onChange={(e) => setFormData({ ...formData, durationType: e.target.value as 'FULL_DAY' | 'HALF_DAY_FIRST' | 'HALF_DAY_SECOND' })}
              >
                <option value="FULL_DAY">Full Day</option>
                <option value="HALF_DAY_FIRST">Half Day (First Half)</option>
                <option value="HALF_DAY_SECOND">Half Day (Second Half)</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
            <textarea
              id="reason"
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
          <div className="flex flex-shrink-0 flex-col-reverse justify-end gap-3 border-t border-[#dce6e8] bg-[#f6faf9]/70 p-4 sm:flex-row sm:p-6">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="gold" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? 'Submitting...' : 'Apply leave'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeaveModal;
