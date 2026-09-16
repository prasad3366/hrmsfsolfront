import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Input, Button } from '../ui/components';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import ForgotPasswordModal from './ForgotPasswordModal';
import LoginCinematic from './LoginCinematic';

const foodeezLogo = new URL('../../assets/foodeez.png', import.meta.url).href;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showCinematic, setShowCinematic] = useState(false);
  const [emailInteracted, setEmailInteracted] = useState(false);
  const [passwordInteracted, setPasswordInteracted] = useState(false);
  const cinematicCompletedRef = useRef(false);
  
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading && !showCinematic) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, navigate, showCinematic, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      if (!email || !password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      const result = await login(email, password);
      
      if (result.success) {
        cinematicCompletedRef.current = false;
        setShowCinematic(true);
      } else {
        setError(result.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleCinematicComplete = () => {
    if (cinematicCompletedRef.current) return;
    cinematicCompletedRef.current = true;
    navigate('/dashboard', { replace: true });
  };

  const togglePasswordVisibility = () => {
    setShowPassword((visible) => !visible);
  };

  return (
    <>
      <div
        className={`login-page min-h-screen font-sans overflow-x-hidden flex items-center justify-center relative z-10 px-4 py-8 transition-opacity duration-500 ${showCinematic ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        aria-hidden={showCinematic}
      >
        <div className="login-composition">
          <div className="login-vault-shell">
          <div className="login-vault-card relative rounded-[1.7rem] border-[10px] border-[#76502d] bg-[#151312] p-2 shadow-[inset_0_0_0_2px_#c08a45,inset_0_0_34px_rgba(0,0,0,0.9),0_24px_70px_rgba(0,0,0,0.7)]">
            <div className="pointer-events-none absolute inset-2 rounded-[1.1rem] border border-amber-200/30" />

            <div className="rounded-[1.05rem] border border-[#9b6a36] bg-gradient-to-b from-[#30241c] to-[#111111] px-6 py-7 shadow-[inset_0_0_28px_rgba(0,0,0,0.8)] sm:px-9">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-3 rounded-lg border border-amber-300/45 bg-[#18120d] px-4 py-2 shadow-[0_0_18px_rgba(245,158,11,0.12)]">
                  <img src={foodeezLogo} alt="FooDeeZ" className="h-10 w-auto brightness-150 sepia" />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/70">Treasure Gate</p>
                <h2 className="mt-2 text-2xl font-bold uppercase tracking-[0.18em] text-amber-100">Unlock the Gate</h2>
              </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    <div className="space-y-1">
                        <label htmlFor="login-email" className="ml-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/80">Email<span className="text-amber-300">*</span></label>
                        <div className="relative">
                            <Input 
                                id="login-email"
                                type="email" 
                                placeholder="authorized email"
                                value={email} 
                                onFocus={() => setEmailInteracted(true)}
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                className="h-11 rounded-lg border border-[#91652f] bg-black/50 pl-3 text-sm text-amber-50 placeholder:text-amber-100/35 focus:border-amber-300 focus:ring-2 focus:ring-amber-400/25"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="login-password" className="ml-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100/80">Passphrase<span className="text-amber-300">*</span></label>
                        <div className="relative">
                            <Input 
                                id="login-password"
                                type={showPassword ? "text" : "password"} 
                                placeholder="enter passphrase"
                                value={password} 
                                onFocus={() => setPasswordInteracted(true)}
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                                className="h-11 rounded-lg border border-[#91652f] bg-black/50 pl-3 pr-10 text-sm text-amber-50 placeholder:text-amber-100/35 focus:border-amber-300 focus:ring-2 focus:ring-amber-400/25"
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                aria-label={showPassword ? 'Hide passphrase' : 'Show passphrase'}
                                className="absolute right-3 top-2.5 rounded p-1 text-amber-200/60 hover:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className={`flex items-start gap-2 rounded-lg border p-3 text-xs font-medium animate-in fade-in ${
                          error.toLowerCase().includes('deactivated')
                            ? 'border-orange-400/40 bg-orange-950/70 text-orange-200'
                            : 'border-red-400/40 bg-red-950/70 text-red-200'
                        }`}>
                          {error.toLowerCase().includes('deactivated') && (
                            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                          )}
                          <div>{error}</div>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <label className="group flex cursor-pointer items-center">
                            <div className="relative flex items-center">
                                <input type="checkbox" className="peer sr-only" />
                                <div className="flex h-3.5 w-3.5 items-center justify-center rounded border border-amber-200/50 transition-all peer-checked:border-amber-300 peer-checked:bg-amber-400">
                                     <svg className="w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                            </div>
                            <span className="ml-2 text-xs text-amber-100/60 transition-colors group-hover:text-amber-50">Remember me</span>
                        </label>
                        <button 
                          type="button"
                          onClick={() => setIsForgotPasswordOpen(true)}
                          className="text-xs font-semibold text-amber-200 hover:text-amber-100 hover:underline"
                        >
                          Forgot password?
                        </button>
                    </div>

                    <Button 
                        type="submit" 
                      disabled={loading || showCinematic}
                        className="mt-2 h-12 w-full rounded-lg border border-amber-200/70 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 text-sm font-black uppercase tracking-[0.16em] text-[#21160b] shadow-[0_0_22px_rgba(245,158,11,0.22)] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? 'Verifying Gate Key...' : 'Unlock the Gate'}
                    </Button>
                </form>
            </div>
                  </div>
          </div>
        </div>
      </div>

    <LoginCinematic
      active
      vaultOpen={showCinematic}
      emailInteracted={emailInteracted}
      passwordInteracted={passwordInteracted}
      onComplete={handleCinematicComplete}
    />

    {/* Forgot Password Modal - Outside main container for proper z-index */}
    <ForgotPasswordModal 
      isOpen={isForgotPasswordOpen}
      onClose={() => setIsForgotPasswordOpen(false)}
      onSuccess={(message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
      }}
    />

    {/* Success Message Toast */}
    {successMessage && (
      <div className="fixed bottom-4 right-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium shadow-lg animate-in slide-in-from-bottom">
        {successMessage}
      </div>
    )}
    </>
  );
};

export default Login;