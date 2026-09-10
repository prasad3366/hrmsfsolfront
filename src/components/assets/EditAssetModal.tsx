import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '../ui/components';
import type { Asset } from '../../services/api';

interface EditAssetModalProps {
  asset: Asset | null;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string }) => Promise<void>;
}

export const EditAssetModal = ({ asset, isLoading, onClose, onSubmit }: EditAssetModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(asset?.name ?? '');
    setDescription(asset?.description ?? '');
    setError(null);
  }, [asset]);

  if (!asset) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Asset name is required');
      return;
    }
    try {
      await onSubmit({ name: name.trim(), description });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to update asset');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <CardTitle>Edit Asset</CardTitle>
          <button type="button" onClick={onClose} aria-label="Close edit asset dialog" className="text-slate-500 hover:text-slate-700">
            <X size={20} />
          </button>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
            <div>
              <label htmlFor="editAssetName" className="block text-sm font-medium text-slate-700 mb-1">Asset Name *</label>
              <Input id="editAssetName" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div>
              <label htmlFor="editAssetDescription" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea id="editAssetDescription" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none" />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isLoading}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
