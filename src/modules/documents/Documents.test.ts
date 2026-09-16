import { describe, expect, it } from 'vitest';
import { canUploadDocuments, getDocumentTargetEmployeeId, isManagementDocumentRole } from './Documents';

describe('Documents employee selection', () => {
  it.each(['HR', 'CEO', 'SUPER_ADMIN'])('allows %s to target the selected employee', (role) => {
    expect(isManagementDocumentRole(role)).toBe(true);
    expect(getDocumentTargetEmployeeId(role, 42, undefined)).toBe(42);
  });

  it.each(['IT_MANAGER', 'SALES_MANAGER', 'FINANCE_MANAGER'])('does not classify %s as a document manager', (role) => {
    expect(isManagementDocumentRole(role)).toBe(false);
  });

  it('keeps employees scoped to their authenticated employee identity', () => {
    expect(getDocumentTargetEmployeeId('EMPLOYEE', 99, 7)).toBe(7);
    expect(getDocumentTargetEmployeeId('EMPLOYEE', undefined, 7)).toBe(7);
    expect(getDocumentTargetEmployeeId('EMPLOYEE', 99, undefined)).toBeUndefined();
  });

  it('requires management users to select an employee', () => {
    expect(getDocumentTargetEmployeeId('HR', undefined, undefined)).toBeUndefined();
  });

  it('hides upload UI for employees while preserving their document target', () => {
    expect(canUploadDocuments('EMPLOYEE')).toBe(false);
    expect(getDocumentTargetEmployeeId('EMPLOYEE', 99, 7)).toBe(7);
  });

  it.each(['HR', 'CEO', 'SUPER_ADMIN'])('keeps upload UI enabled for %s', (role) => {
    expect(canUploadDocuments(role)).toBe(true);
  });

  it('does not alter document viewing role behavior', () => {
    expect(isManagementDocumentRole('HR')).toBe(true);
    expect(isManagementDocumentRole('SUPER_ADMIN')).toBe(true);
    expect(isManagementDocumentRole('EMPLOYEE')).toBe(false);
  });
});