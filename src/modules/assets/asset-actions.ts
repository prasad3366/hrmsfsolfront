import type { Asset } from '../../services/api';

export type AssetAction = 'assign' | 'reassign' | 'return';

export const getAssetActions = (
  asset: Pick<Asset, 'status' | 'assignedTo'>,
): AssetAction[] => {
  if (asset.status === 'RETURNED') {
    return [];
  }

  if (asset.status === 'AVAILABLE') {
    return ['assign'];
  }

  if (asset.status === 'ASSIGNED' && asset.assignedTo != null) {
    return ['reassign', 'return'];
  }

  return [];
};