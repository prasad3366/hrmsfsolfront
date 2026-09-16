import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../components/ui/components';
import { MapPin } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useNotifications } from '../../context/NotificationContext';
import { TodayAttendanceStatus } from '../../services/api';

interface PunchInOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
  todayRecord?: TodayAttendanceStatus;
  onPunchIn: (latitude?: number, longitude?: number) => Promise<void>;
  onPunchOut: (latitude?: number, longitude?: number) => Promise<void>;
  onSuccess: () => Promise<void>;
}

export const PunchInOutModal: React.FC<PunchInOutModalProps> = ({
  isOpen,
  onClose,
  anchorRef,
  todayRecord,
  onPunchIn,
  onPunchOut,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [localPunchedIn, setLocalPunchedIn] = useState<boolean | undefined>(undefined);
  const [localPunchedOut, setLocalPunchedOut] = useState<boolean | undefined>(undefined);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);

  const { requestLocation, isLoading: isGeoLoading, error: geoError } = useGeolocation();
  const { addNotification } = useNotifications();

  const isLeaveDay = (todayRecord?.status ?? '').toUpperCase() === 'LEAVE';

  const hasPunchedIn =
    localPunchedIn === undefined
      ? todayRecord?.status === 'IN_PROGRESS' || todayRecord?.status === 'COMPLETED'
      : localPunchedIn;

  const hasPunchedOut =
    localPunchedOut === undefined
      ? todayRecord?.status === 'COMPLETED'
      : localPunchedOut;

  let punchButtonLabel = 'Punch In';
  if (isLeaveDay) {
    punchButtonLabel = 'Leave';
  } else if (hasPunchedIn) {
    punchButtonLabel = hasPunchedOut ? 'Completed' : 'Punch Out';
  }

  // Action handler defined later

  // ✅ Reset on close only (avoid immediate refresh on open to prevent flicker)
  useEffect(() => {
    if (!isOpen) {
      setLocalPunchedIn(undefined);
      setLocalPunchedOut(undefined);
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !anchorRef?.current || !popoverRef.current) return;

    const updatePosition = () => {
      const anchor = anchorRef.current;
      const popover = popoverRef.current;
      if (!anchor || !popover) return;

      const anchorRect = anchor.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const viewportPadding = 12;
      const gap = 10;
      const spaceAbove = anchorRect.top - viewportPadding;
      const spaceBelow = window.innerHeight - anchorRect.bottom - viewportPadding;
      const openBelow = spaceBelow >= popoverRect.height || spaceBelow >= spaceAbove;
      const top = openBelow
        ? Math.min(anchorRect.bottom + gap, window.innerHeight - popoverRect.height - viewportPadding)
        : Math.max(viewportPadding, anchorRect.top - popoverRect.height - gap);
      const left = Math.min(
        Math.max(viewportPadding, anchorRect.right - popoverRect.width),
        window.innerWidth - popoverRect.width - viewportPadding,
      );

      setPopoverPosition({ top: Math.max(viewportPadding, top), left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef, isOpen]);

  const handlePunchIn = async () => {
    if (isSubmitting || isGeoLoading) return;

    setIsSubmitting(true);
    try {
      setErrorMessage('');
      setSuccessMessage('');

      const coords = await requestLocation();
      if (coords == null) {
        setErrorMessage(geoError?.message || 'Failed to get location');
        return;
      }

      await onPunchIn(coords.latitude, coords.longitude);

      // ✅ INSTANT UI SWITCH
      setLocalPunchedIn(true);
      setLocalPunchedOut(false);

      setSuccessMessage('Punched in successfully!');

      addNotification({
        type: 'punch_in',
        title: 'Punch In Recorded',
        message: `You punched in at ${new Date().toLocaleTimeString()}`,
      });

      await onSuccess();

      // ✅ Close modal quickly to prevent flickering
      setTimeout(() => onClose(), 600);

    } catch (err: any) {
      console.error('punchIn error:', err);
      setErrorMessage(err.message || 'Punch in failed');

    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePunchOut = async () => {
    if (isSubmitting || isGeoLoading) return;

    setIsSubmitting(true);
    try {
      setErrorMessage('');
      setSuccessMessage('');

      const coords = await requestLocation();
      if (coords == null) {
        setErrorMessage(geoError?.message || 'Failed to get location');
        return;
      }

      await onPunchOut(coords.latitude, coords.longitude);

      // ✅ INSTANT UI SWITCH
      setLocalPunchedOut(true);

      setSuccessMessage('Punched out successfully!');

      addNotification({
        type: 'punch_out',
        title: 'Punch Out Recorded',
        message: `You punched out at ${new Date().toLocaleTimeString()}`,
      });

      await onSuccess();

      // ✅ Close modal quickly to prevent flickering
      setTimeout(() => onClose(), 600);

    } catch (err: any) {
      console.error('punchOut error:', err);
      setErrorMessage(err.message || 'Punch out failed');

    } finally {
      setIsSubmitting(false);
    }
  };

  let actionHandler: (() => Promise<void>) | undefined = handlePunchIn;
  if (isLeaveDay) {
    actionHandler = undefined;
  } else if (hasPunchedIn) {
    actionHandler = hasPunchedOut ? undefined : handlePunchOut;
  }

  if (isOpen === false) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <div
        ref={popoverRef}
        className="pointer-events-auto absolute w-[min(24rem,calc(100vw-1.5rem))] max-h-[calc(100vh-1.5rem)] overflow-y-auto"
        style={anchorRef ? { top: popoverPosition.top, left: popoverPosition.left } : undefined}
      >
      <Card className="w-full shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin size={20} /> Attendance Punch
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* STATUS */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Punch In:</span>
              <span>
                {todayRecord?.punchInTime
                  ? new Date(
                      todayRecord.punchInTime
                    ).toLocaleTimeString()
                  : 'Not yet'}
              </span>
            </div>

            {hasPunchedIn && (
              <div className="flex justify-between">
                <span>Punch Out:</span>
                <span>
                  {todayRecord?.punchOutTime
                    ? new Date(todayRecord.punchOutTime).toLocaleTimeString()
                    : 'Not yet'}
                </span>
              </div>
            )}
          </div>

          {/* INFO */}
          {hasPunchedIn && hasPunchedOut === false && (
            <div className="p-3 bg-blue-100 text-blue-700 rounded">
              You are currently punched in. Click "Punch Out".
            </div>
          )}

          {/* ERROR */}
          {errorMessage && (
            <div className="p-3 bg-red-100 text-red-700 rounded">
              {errorMessage}
            </div>
          )}

          {/* SUCCESS */}
          {successMessage && (
            <div className="p-3 bg-green-100 text-green-700 rounded">
              {successMessage}
            </div>
          )}

          {/* BUTTONS */}
          {actionHandler ? (
            <Button onClick={actionHandler} disabled={isSubmitting || isGeoLoading}>
              {isSubmitting ? 'Processing...' : punchButtonLabel}
            </Button>
          ) : (
            <div className="text-green-600 text-center font-semibold">
              ✓ Already completed
            </div>
          )}

          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

        </CardContent>
      </Card>
      </div>
    </div>
  );
};