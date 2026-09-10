import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);
vi.stubGlobal('localStorage', { getItem: vi.fn(() => 'test-token'), removeItem: vi.fn(), setItem: vi.fn() });

const { default: api } = await import('../../services/api');

describe('recruitment API methods', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ id: 1, status: 'APPLIED' }), { status: 200 })));
  });

  it('targets the recruitment jobs, candidates, and interview endpoints', async () => {
    await api.getJobs();
    await api.createJob({ title: 'Engineer', department: 'Technology', requirements: 'React', description: 'Build products', openings: 2 });
    await api.getCandidates(7);
    await api.createCandidate({ name: 'Ada Lovelace', email: 'ada@example.com', phone: '555-0100', jobPostingId: 7 });
    await api.updateCandidateStatus(4, 'SCREENING');
    await api.scheduleInterview({ candidateId: 4, scheduledAt: '2026-09-07T10:00', interviewer: 'Grace Hopper' });
    await api.submitInterviewFeedback(12, { feedback: 'Strong technical reasoning' });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'http://localhost:3000/api/recruitment/jobs',
      'http://localhost:3000/api/recruitment/jobs',
      'http://localhost:3000/api/recruitment/candidates?jobPostingId=7',
      'http://localhost:3000/api/recruitment/candidates',
      'http://localhost:3000/api/recruitment/candidates/4/status',
      'http://localhost:3000/api/recruitment/interviews',
      'http://localhost:3000/api/recruitment/interviews/12/feedback',
    ]);
    expect(fetchMock.mock.calls[4][1]).toEqual(expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'SCREENING' }) }));
    expect(fetchMock.mock.calls[6][1]).toEqual(expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ feedback: 'Strong technical reasoning' }) }));
  });

  it('normalizes null job and candidate responses to empty arrays', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('null', { status: 200 }))
      .mockResolvedValueOnce(new Response('null', { status: 200 }));

    await expect(api.getJobs()).resolves.toEqual([]);
    await expect(api.getCandidates()).resolves.toEqual([]);
  });

  it('posts job creation through the authenticated singleton helper', async () => {
    await api.createJob({ title: 'Engineer', department: 'Technology', requirements: '', description: '', openings: 2 });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/recruitment/jobs',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Engineer', department: 'Technology', requirements: '', description: '', openings: 2 }),
      }),
    );
  });

  it('preserves the backend message on job creation errors', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Openings must be a positive integer' }), { status: 400 }));

    await expect(api.createJob({ title: 'Engineer', department: 'Technology', requirements: '', description: '', openings: 1 }))
      .rejects.toMatchObject({ message: 'Openings must be a positive integer', response: { data: { message: 'Openings must be a positive integer' } } });
  });

  it('deletes a job posting through the recruitment endpoint', async () => {
    await api.deleteJob(9);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/recruitment/jobs/9',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('updates jobs and deletes candidates through recruitment endpoints', async () => {
    await api.updateJob(9, { title: 'Principal Engineer', openings: 3 });
    await api.deleteCandidate(21);

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/api/recruitment/jobs/9');
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ title: 'Principal Engineer', openings: 3 }),
    }));
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:3000/api/recruitment/candidates/21');
    expect(fetchMock.mock.calls[1][1]).toEqual(expect.objectContaining({ method: 'DELETE' }));
  });
});