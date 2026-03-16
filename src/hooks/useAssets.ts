import { useCallback, useState } from 'react';
import ApiService, { Asset, AssignAssetDto } from '../services/api';

export const useAssets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ApiService.getAllAssets();
      setAssets(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch assets';
      setError(message);
      console.error('Fetch assets error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAsset = useCallback(async (assetData: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const newAsset = await ApiService.createAsset(assetData);
      setAssets((prev) => [...prev, newAsset]);
      return newAsset;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create asset';
      setError(message);
      console.error('Create asset error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const assignAsset = useCallback(async (assignment: AssignAssetDto) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await ApiService.assignAsset(assignment);
      // Refresh assets to update status
      await fetchAssets();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign asset';
      setError(message);
      console.error('Assign asset error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAssets]);

  const returnAsset = useCallback(async (assetId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await ApiService.returnAsset(assetId);
      // Refresh assets to update status
      await fetchAssets();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to return asset';
      setError(message);
      console.error('Return asset error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAssets]);

  return {
    assets,
    isLoading,
    error,
    fetchAssets,
    createAsset,
    assignAsset,
    returnAsset,
  };
};
