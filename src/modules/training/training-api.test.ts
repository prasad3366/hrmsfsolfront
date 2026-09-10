import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);
vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'test-token'), removeItem: vi.fn(), setItem: vi.fn() });

const { default: api } = await import('../../services/api');

describe('training API methods', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ id: 1, status: 'IN_PROGRESS' }), { status: 200 })));
  });

  it('uses the training endpoints for program and enrollment actions', async () => {
    await api.getTrainingPrograms();
    await api.createTrainingProgram({ title: 'Leadership', description: '', trainer: 'Ada', department: 'HR', startDate: '2026-09-10', endDate: '2026-09-11' });
    await api.updateTrainingProgram(2, { title: 'Advanced Leadership' });
    await api.deleteTrainingProgram(2);
    await api.enrollEmployees({ trainingProgramId: 2, employeeIds: [7, 8] });
    await api.updateEnrollmentStatus(9, { status: 'COMPLETED' });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'http://localhost:3000/api/training/programs',
      'http://localhost:3000/api/training/programs',
      'http://localhost:3000/api/training/programs/2',
      'http://localhost:3000/api/training/programs/2',
      'http://localhost:3000/api/training/enroll',
      'http://localhost:3000/api/training/enrollments/9',
    ]);
    expect(fetchMock.mock.calls[2][1]).toEqual(expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ title: 'Advanced Leadership' }) }));
    expect(fetchMock.mock.calls[4][1]).toEqual(expect.objectContaining({ method: 'POST', body: JSON.stringify({ trainingProgramId: 2, employeeIds: [7, 8] }) }));
  });
});