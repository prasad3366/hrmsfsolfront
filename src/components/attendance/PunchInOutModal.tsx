import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../components/ui/components';
import { MapPin, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import ApiService from '../../services/api';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useNotifications } from '../../context/NotificationContext';

interface PunchInOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayRecord?: any;
  onSuccess: () => Promise<void>;
}

export const PunchInOutModal: React.FC<PunchInOutModalProps> = ({
  isOpen,
  onClose,
  todayRecord,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [localPunchedIn, setLocalPunchedIn] = useState<boolean | undefined>(undefined);
  const [localPunchedOut, setLocalPunchedOut] = useState<boolean | undefined>(undefined);

  const { requestLocation, isLoading: isGeoLoading, error: geoError } = useGeolocation();
  const { addNotification } = useNotifications();

  // ✅ FIXED LOGIC - Support both old AttendanceRecord and new TodayAttendanceStatus
  const hasPunchedIn =
    localPunchedIn !== undefined
      ? localPunchedIn
      : (todayRecord?.hasPunchedIn ?? !!todayRecord?.punchIn);

  const hasPunchedOut =
    localPunchedOut !== undefined
      ? localPunchedOut
      : (todayRecord?.hasPunchedOut ?? !!todayRecord?.punchOut);

  // ✅ Reset + refresh on open
  useEffect(() => {
    if (isOpen) {
      onSuccess(); // always fetch latest
    } else {
      setLocalPunchedIn(undefined);
      setLocalPunchedOut(undefined);
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  const handlePunchIn = async () => {
    try {
      setErrorMessage('');
      setSuccessMessage('');

      const coords = await requestLocation();
      if (!coords) {
        setErrorMessage(geoError?.message || 'Failed to get location');
        return;
      }

      setIsSubmitting(true);

      await ApiService.punchIn(coords.latitude, coords.longitude);

      // ✅ INSTANT UI SWITCH
      setLocalPunchedIn(true);
      setLocalPunchedOut(false);

      setSuccessMessage('Punched in successfully!');

      addNotification({
        type: 'punch_in',
        title: 'Punch In Recorded',
        message: `You punched in at ${new Date().toLocaleTimeString()}`,
      });

      // ✅ Refresh DB data
      await onSuccess();

      setTimeout(() => onClose(), 800);

    } catch (err: any) {
      console.error('punchIn error:', err);
      setErrorMessage(err.message || 'Punch in failed');

      if (err.message?.toLowerCase().includes('already')) {
        await onSuccess();
      }

    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePunchOut = async () => {
    try {
      setErrorMessage('');
      setSuccessMessage('');

      const coords = await requestLocation();
      if (!coords) {
        setErrorMessage(geoError?.message || 'Failed to get location');
        return;
      }

      setIsSubmitting(true);

      const res = await ApiService.punchOut(coords.latitude, coords.longitude);

      // ✅ INSTANT UI SWITCH
      setLocalPunchedOut(true);

      setSuccessMessage('Punched out successfully!');

      addNotification({
        type: 'punch_out',
        title: 'Punch Out Recorded',
        message: `You punched out at ${new Date().toLocaleTimeString()}`,
      });

      await onSuccess();

      setTimeout(() => onClose(), 800);

    } catch (err: any) {
      console.error('punchOut error:', err);
      setErrorMessage(err.message || 'Punch out failed');

      // 🔥 Force sync if mismatch
      await onSuccess();

    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
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
                {todayRecord?.punchInTime || todayRecord?.punchIn
                  ? new Date(
                      todayRecord.punchInTime || todayRecord.punchIn
                    ).toLocaleTimeString()
                  : 'Not yet'}
              </span>
            </div>

            {hasPunchedIn && (
              <div className="flex justify-between">
                <span>Punch Out:</span>
                <span>
                  {todayRecord?.punchOutTime || todayRecord?.punchOut
                    ? new Date(
                        todayRecord.punchOutTime || todayRecord.punchOut
                      ).toLocaleTimeString()
                    : 'Not yet'}
                </span>
              </div>
            )}
          </div>

          {/* INFO */}
          {hasPunchedIn && !hasPunchedOut && (
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
          {!hasPunchedIn ? (
            <Button onClick={handlePunchIn} disabled={isSubmitting || isGeoLoading}>
              {isSubmitting ? 'Processing...' : 'Punch In'}
            </Button>
          ) : !hasPunchedOut ? (
            <Button onClick={handlePunchOut} disabled={isSubmitting || isGeoLoading}>
              {isSubmitting ? 'Processing...' : 'Punch Out'}
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
  );
};