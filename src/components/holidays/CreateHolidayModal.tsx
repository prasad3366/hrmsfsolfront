import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button, Input } from '../../components/ui/components';

interface CreateHolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    date: string;
    description?: string;
    isOptional: boolean;
    location?: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

const CreateHolidayModal: React.FC<CreateHolidayModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    description: '',
    isOptional: false,
    location: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      setFormData({
        name: '',
        date: '',
        description: '',
        isOptional: false,
        location: '',
      });
      onClose();
    } catch (error) {
      // Error handling is managed by the hook
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Add Holiday</h2>
            <p className="text-blue-100 text-sm mt-1">Create a new company holiday</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 transition-colors p-2 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Holiday Name */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-900">
              Holiday Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Diwali, New Year, Christmas"
              required
              className="h-11 text-base"
            />
            <p className="text-xs text-slate-500">Enter the name of the holiday</p>
          </div>

          {/* Date */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-900">
              Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="h-11 text-base"
            />
            <p className="text-xs text-slate-500">Select the holiday date</p>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-900">
              Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add any notes or description about this holiday"
              rows={4}
              className="flex w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none"
            />
            <p className="text-xs text-slate-500">Provide additional context about the holiday</p>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-900">
              Location <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <Input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., All locations, Headquarters, Remote"
              className="h-11 text-base"
            />
            <p className="text-xs text-slate-500">Specify where this holiday applies</p>
          </div>

          {/* Optional Holiday Checkbox */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isOptional}
                onChange={(e) => setFormData({ ...formData, isOptional: e.target.checked })}
                className="w-5 h-5 border-2 border-blue-400 rounded bg-white cursor-pointer accent-blue-600"
              />
              <span className="ml-3 font-medium text-slate-900">Mark as Optional Holiday</span>
            </label>
            <p className="text-xs text-slate-600 mt-2 ml-8">
              Optional holidays are not mandatory for all employees
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 flex flex-col-reverse sm:flex-row gap-3 justify-end p-6 border-t border-slate-200 bg-slate-50">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isSubmitting} 
            className="w-full sm:w-auto h-11 font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              'Create Holiday'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateHolidayModal;
