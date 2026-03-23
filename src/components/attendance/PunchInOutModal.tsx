import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../components/ui/components';
import { MapPin, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import ApiService from '../../services/api';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useNotifications } from '../../context/NotificationContext';

interface PunchInOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayRecord?: any;
  onSuccess: () => void;
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

  const hasPunchedIn = localPunchedIn ?? todayRecord?.punchIn;
  const hasPunchedOut = localPunchedOut ?? todayRecord?.punchOut;

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
      try {
        const res = await ApiService.punchIn(coords.latitude, coords.longitude);
        console.debug('punchIn response:', res);
        setSuccessMessage('Punched in successfully!');
        
        // Add notification
        const punchInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        addNotification({
          type: 'punch_in',
          title: 'Punch In Recorded',
          message: `You punched in at ${punchInTime}`,
        });
        
        // Update local state immediately for UI
        setLocalPunchedIn(true);
        
        // refresh parent immediately so UI updates
        try {
          await onSuccess();
        } catch (e) {
          // ignore
        }
        setTimeout(() => {
          onClose();
        }, 800);
      } catch (err) {
        console.error('punchIn error:', err);
        throw err;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Punch in failed';
      setErrorMessage(msg);

      // If the API indicates the user is already punched in, refresh the parent data
      // so the modal can show the "Punch Out" action instead.
      if (msg.toLowerCase().includes('already')) {
        try {
          await onSuccess();
        } catch (e) {
          // ignore refresh errors
        }
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
      try {
        const res = await ApiService.punchOut(coords.latitude, coords.longitude);
        console.debug('punchOut response:', res);
        setSuccessMessage('Punched out successfully!');
        
        // Add notification
        const punchOutTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const totalHours = res.totalHours ? res.totalHours.toFixed(2) : '0';
        addNotification({
          type: 'punch_out',
          title: 'Punch Out Recorded',
          message: `You punched out at ${punchOutTime}. Total hours: ${totalHours}h`,
        });
        
        // Update local state immediately for UI
        setLocalPunchedOut(true);
        
        // refresh parent immediately so UI updates
        try {
          await onSuccess();
        } catch (e) {
          // ignore
        }
        setTimeout(() => {
          onClose();
        }, 800);
      } catch (err) {
        console.error('punchOut error:', err);
        throw err;
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Punch out failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    // Reset local states when modal closes
    if (localPunchedIn !== undefined || localPunchedOut !== undefined) {
      setLocalPunchedIn(undefined);
      setLocalPunchedOut(undefined);
    }
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin size={20} /> Attendance Punch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Display */}
          <div className="p-4 bg-slate-50 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Punch In:</span>
              <span className={`text-sm font-semibold ${hasPunchedIn ? 'text-emerald-600' : 'text-slate-400'}`}>
                {hasPunchedIn ? new Date(hasPunchedIn).toLocaleTimeString() : 'Not yet'}
              </span>
            </div>
            {hasPunchedIn && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Punch Out:</span>
                <span className={`text-sm font-semibold ${hasPunchedOut ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {hasPunchedOut ? new Date(hasPunchedOut).toLocaleTimeString() : 'Not yet'}
                </span>
              </div>
            )}
            {hasPunchedIn && todayRecord?.totalHours && (
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-sm text-slate-600">Total Hours:</span>
                <span className="text-sm font-semibold text-blue-600">{todayRecord.totalHours.toFixed(2)}h</span>
              </div>
            )}
          </div>

          {hasPunchedIn && !hasPunchedOut && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              You are currently punched in. Click "Punch Out" when you're done with your shift.
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-700">{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
              <CheckCircle size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-emerald-700">{successMessage}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3 pt-4">
            {!hasPunchedIn ? (
              <Button
                onClick={handlePunchIn}
                disabled={isSubmitting || isGeoLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting || isGeoLoading ? (
                  <Loader size={18} className="animate-spin mr-2" />
                ) : (
                  <MapPin size={18} className="mr-2" />
                )}
                {isSubmitting ? 'Processing...' : 'Punch In'}
              </Button>
            ) : !hasPunchedOut ? (
              <Button
                onClick={handlePunchOut}
                disabled={isSubmitting || isGeoLoading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isSubmitting || isGeoLoading ? (
                  <Loader size={18} className="animate-spin mr-2" />
                ) : (
                  <MapPin size={18} className="mr-2" />
                )}
                {isSubmitting ? 'Processing...' : 'Punch Out'}
              </Button>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                <p className="text-sm font-semibold text-emerald-700">✓ Already punched out today</p>
              </div>
            )}

            <Button variant="outline" onClick={onClose} className="w-full" disabled={isSubmitting || isGeoLoading}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
