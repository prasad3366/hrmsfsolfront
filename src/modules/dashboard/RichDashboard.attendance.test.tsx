import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DashboardAttendanceAction } from './RichDashboard';

describe('DashboardAttendanceAction', () => {
  const baseProps = {
    isLoading: false,
    isGeoLoading: false,
    error: null,
    actionError: null,
    onPunchIn: vi.fn(),
    onPunchOut: vi.fn(),
  };

  beforeEach(() => {
    cleanup();
    baseProps.onPunchIn.mockReset();
    baseProps.onPunchOut.mockReset();
  });

  it('shows Check In and calls the existing punch-in action', () => {
    render(<DashboardAttendanceAction {...baseProps} state="NOT_CHECKED_IN" />);

    fireEvent.click(screen.getByRole('button', { name: 'Check In' }));

    expect(baseProps.onPunchIn).toHaveBeenCalledTimes(1);
    expect(baseProps.onPunchOut).not.toHaveBeenCalled();
  });

  it('shows Check Out and calls the existing punch-out action', () => {
    render(<DashboardAttendanceAction {...baseProps} state="IN_PROGRESS" />);

    fireEvent.click(screen.getByRole('button', { name: 'Check Out' }));

    expect(baseProps.onPunchOut).toHaveBeenCalledTimes(1);
    expect(baseProps.onPunchIn).not.toHaveBeenCalled();
  });

  it.each(['COMPLETED', 'LEAVE'] as const)('blocks another punch in %s state', (state) => {
    render(<DashboardAttendanceAction {...baseProps} state={state} />);

    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(baseProps.onPunchIn).not.toHaveBeenCalled();
    expect(baseProps.onPunchOut).not.toHaveBeenCalled();
  });

  it('blocks duplicate clicks while attendance mutation is loading', () => {
    render(<DashboardAttendanceAction {...baseProps} state="NOT_CHECKED_IN" isLoading />);

    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(baseProps.onPunchIn).not.toHaveBeenCalled();
  });
});
