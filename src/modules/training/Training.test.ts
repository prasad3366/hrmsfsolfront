import { describe, expect, it } from 'vitest';
import { buildTrainingProgramCreatePayload, canEnrollDuringProgramCreation } from './Training';

describe('training program creation enrollment flow', () => {
  it.each(['HR', 'SUPER_ADMIN'])('allows %s to select employees during creation', (role) => {
    expect(canEnrollDuringProgramCreation(role)).toBe(true);
  });

  it('keeps program creation unavailable to EMPLOYEE', () => {
    expect(canEnrollDuringProgramCreation('EMPLOYEE')).toBe(false);
  });

  it('includes selected employee IDs in the existing create payload', () => {
    expect(buildTrainingProgramCreatePayload({
      title: 'Leadership',
      description: '',
      trainer: 'Ada',
      department: 'HR',
      startDate: '2026-09-10',
      endDate: '2026-09-11',
    }, [7, 8, 7])).toEqual({
      title: 'Leadership',
      description: '',
      trainer: 'Ada',
      department: 'HR',
      startDate: '2026-09-10',
      endDate: '2026-09-11',
      employeeIds: [7, 8],
    });
  });

  it('omits enrollment data when no employees are selected', () => {
    expect(buildTrainingProgramCreatePayload({
      title: 'Leadership',
      description: '',
      trainer: 'Ada',
      department: 'HR',
      startDate: '2026-09-10',
      endDate: '2026-09-11',
    }, [])).not.toHaveProperty('employeeIds');
  });
});
