import React, { useEffect, useRef } from 'react';

interface LoginCinematicProps {
  active: boolean;
  vaultOpen: boolean;
  emailInteracted: boolean;
  passwordInteracted: boolean;
  onComplete: () => void;
}

export const VIDEO_SEGMENTS = {
  loginLoop: { start: 0, end: 4.6 },
  hammer: { start: 0.7, end: 2.3 },
  rifle: { start: 2.6, end: 4.6 },
  vaultOpening: { start: 4.8 },
} as const;

const LoginCinematic: React.FC<LoginCinematicProps> = ({
  active,
  vaultOpen,
  emailInteracted,
  passwordInteracted,
  onComplete,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const completedRef = useRef(false);
  const videoFailedRef = useRef(false);
  const emailTriggeredRef = useRef(false);
  const passwordTriggeredRef = useRef(false);
  const completeRef = useRef(onComplete);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!active) return;

    if (!vaultOpen) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || videoFailedRef.current) {
      finish();
      return;
    }

    const video = videoRef.current;
    if (!video) {
      finish();
      return;
    }

    video.currentTime = VIDEO_SEGMENTS.vaultOpening.start;
    const playPromise = video.play();
    playPromise?.catch(finish);
  }, [active, vaultOpen]);

  useEffect(() => {
    if (!active || vaultOpen) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const video = videoRef.current;
    if (!video) return;

    const playPromise = video.play();
    playPromise?.catch(() => {
      videoFailedRef.current = true;
    });
  }, [active, vaultOpen]);

  useEffect(() => {
    if (!active || vaultOpen || !emailInteracted || emailTriggeredRef.current) return;

    const video = videoRef.current;
    if (!video) return;

    emailTriggeredRef.current = true;
    video.currentTime = VIDEO_SEGMENTS.hammer.start;
    video.play().catch(() => {
      videoFailedRef.current = true;
    });
  }, [active, emailInteracted, vaultOpen]);

  useEffect(() => {
    if (!active || vaultOpen || !passwordInteracted || passwordTriggeredRef.current) return;

    const video = videoRef.current;
    if (!video) return;

    passwordTriggeredRef.current = true;
    video.currentTime = VIDEO_SEGMENTS.rifle.start;
    video.play().catch(() => {
      videoFailedRef.current = true;
    });
  }, [active, passwordInteracted, vaultOpen]);

  useEffect(() => {
    return () => {
      videoRef.current?.pause();
    };
  }, []);

  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    completeRef.current();
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || vaultOpen || video.currentTime < VIDEO_SEGMENTS.loginLoop.end) return;

    video.currentTime = VIDEO_SEGMENTS.loginLoop.start;
    video.play().catch(() => {
      videoFailedRef.current = true;
    });
  };

  const handleEnded = () => {
    const video = videoRef.current;
    if (!video) {
      finish();
      return;
    }

    if (vaultOpen) {
      finish();
      return;
    }

    video.currentTime = VIDEO_SEGMENTS.loginLoop.start;
    video.play().catch(() => {
      videoFailedRef.current = true;
    });
  };

  const handleError = () => {
    if (vaultOpen) {
      finish();
      return;
    }

    videoFailedRef.current = true;
  };

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black" role="presentation">
      <video
        ref={videoRef}
        src="/vault-login.mp4"
        className="h-full w-full object-cover"
        autoPlay
        muted
        playsInline
        controls={false}
        preload="auto"
        aria-hidden="true"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
      />
      <div className="absolute inset-0 bg-slate-950/60" />
    </div>
  );
};

export default LoginCinematic;