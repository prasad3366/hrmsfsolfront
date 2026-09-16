import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import LoginCinematic from './LoginCinematic';
import { VIDEO_SEGMENTS } from './LoginCinematic';

describe('LoginCinematic', () => {
  it('does not render before authentication succeeds', () => {
    expect(renderToStaticMarkup(<LoginCinematic active={false} vaultOpen={false} emailInteracted={false} passwordInteracted={false} onComplete={vi.fn()} />)).toBe('');
  });

  it('renders the required muted fullscreen video before authentication', () => {
    const markup = renderToStaticMarkup(<LoginCinematic active vaultOpen={false} emailInteracted={false} passwordInteracted={false} onComplete={vi.fn()} />);

    expect(markup).toContain('src="/vault-login.mp4"');
    expect(markup).toContain('muted');
    expect(markup).toContain('playsInline');
    expect(markup).toContain('object-cover');
  });

  it('keeps measured login and opening segments explicit', () => {
    expect(VIDEO_SEGMENTS.loginLoop.end).toBe(4.6);
    expect(VIDEO_SEGMENTS.hammer).toEqual({ start: 0.7, end: 2.3 });
    expect(VIDEO_SEGMENTS.rifle).toEqual({ start: 2.6, end: 4.6 });
    expect(VIDEO_SEGMENTS.vaultOpening.start).toBe(4.8);
  });
});