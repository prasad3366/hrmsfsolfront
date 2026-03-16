import React, { useState } from 'react';
import { X, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '../ui/components';
import api from '../../services/api';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);

  if (!isOpen) return null;

  const handleRequestOtp = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await api.forgotPassword(email);
      setOtpRequested(true);
      if (onSuccess) onSuccess(response.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !otp || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await api.forgotPassword(email, newPassword, otp);
      setSuccess(true);

      if (onSuccess) {
        onSuccess(response.message);
      }

      setTimeout(() => {
        setEmail('');
        setNewPassword('');
        setConfirmPassword('');
        setOtp('');
        setSuccess(false);
        setOtpRequested(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail('');
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
      setError('');
      setSuccess(false);
      setOtpRequested(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-slate-900">
            Reset Password
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center animate-in scale-in">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Password Reset Successfully</h3>
                <p className="text-sm text-slate-600">Your password has been updated. Please login with your new password.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={loading || otpRequested}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 disabled:bg-slate-50 disabled:opacity-50 transition-all"
                />
              </div>

              {otpRequested && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      OTP<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP"
                      disabled={loading}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 disabled:bg-slate-50 disabled:opacity-50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      New Password<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        disabled={loading}
                        className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg bg-white text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 disabled:bg-slate-50 disabled:opacity-50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1 disabled:opacity-50"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Confirm Password<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        disabled={loading}
                        className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg bg-white text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 disabled:bg-slate-50 disabled:opacity-50 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1 disabled:opacity-50"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {!otpRequested && (
                <Button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading || !email}
                  className="w-full"
                >
                  Request OTP
                </Button>
              )}

              {otpRequested && (
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  Reset Password
                </Button>
              )}

              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
