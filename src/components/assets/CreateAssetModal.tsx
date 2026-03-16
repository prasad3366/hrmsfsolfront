import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '../../components/ui/components';
import { MOCK_EMPLOYEES } from '../../mock-data';

interface CreateAssetModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const CreateAssetModal = ({ isOpen, isLoading, onClose, onSubmit }: CreateAssetModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    assetTag: '',
    type: '',
    brand: '',
    model: '',
    purchaseDate: '',
    assignedTo: '',
  });
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.assetTag || !formData.type) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const payload = { ...formData } as any;
      // If purchaseDate is empty, remove it to avoid sending empty string
      if (!payload.purchaseDate) {
        delete payload.purchaseDate;
      }

      await onSubmit(payload);
      setFormData({ name: '', assetTag: '', type: '', brand: '', model: '', purchaseDate: '' });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <CardTitle>Create New Asset</CardTitle>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Asset Name *</label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Dell Laptop"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Asset Tag *</label>
              <Input
                type="text"
                name="assetTag"
                value={formData.assetTag}
                onChange={handleChange}
                placeholder="e.g., AST-001"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Type</option>
                <option value="LAPTOP">Laptop</option>
                <option value="DESKTOP">Desktop</option>
                <option value="MONITOR">Monitor</option>
                <option value="KEYBOARD">Keyboard</option>
                <option value="MOUSE">Mouse</option>
                <option value="PHONE">Phone</option>
                <option value="TABLET">Tablet</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
              <Input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g., Dell"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
              <Input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="e.g., XPS 13"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Date</label>
              <Input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className="w-full"
              />
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
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Asset'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
