import { describe, expect, it } from 'vitest';
import { getAssetActions } from './asset-actions';

describe('asset lifecycle actions', () => {
  it('shows Assign for AVAILABLE assets', () => {
    expect(getAssetActions({ status: 'AVAILABLE', assignedTo: null })).toEqual(['assign']);
  });

  it('shows Reassign and Return for assigned assets', () => {
    expect(getAssetActions({ status: 'ASSIGNED', assignedTo: 700 })).toEqual([
      'reassign',
      'return',
    ]);
  });

  it('shows no lifecycle actions for legacy RETURNED assets', () => {
    expect(getAssetActions({ status: 'RETURNED', assignedTo: null })).toEqual([]);
  });
});