import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Input, Button } from '../ui/components';
import { Eye, EyeOff } from 'lucide-react';
import ForgotPasswordModal from './ForgotPasswordModal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Brand Colors - Purple Theme (matching login button)
  const BRAND_PURPLE = '#5D2B90';
  const BRAND_DARK_PURPLE = '#4A1F6B';
  const BRAND_LIGHT_PURPLE = '#7C4CAE';

  // Character Images
  const LOGIN_CHAR_IMG = "https://png.pngtree.com/png-clipart/20250126/original/pngtree-professional-3d-businessman-character-design-in-formal-suit-png-image_20341392.png";

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
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        setError(result.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 font-sans overflow-x-hidden flex flex-col relative">
      
      {/* Styles for Wave Animation */}
      <style>{`
        .parallax > use {
          animation: move-forever 25s cubic-bezier(.55,.5,.45,.5) infinite;
        }
        .parallax > use:nth-child(1) {
          animation-delay: -2s;
          animation-duration: 7s;
        }
        .parallax > use:nth-child(2) {
          animation-delay: -3s;
          animation-duration: 10s;
        }
        .parallax > use:nth-child(3) {
          animation-delay: -4s;
          animation-duration: 13s;
        }
        .parallax > use:nth-child(4) {
          animation-delay: -5s;
          animation-duration: 20s;
        }
        @keyframes move-forever {
          0% {
           transform: translate3d(-90px,0,0);
          }
          100% { 
            transform: translate3d(85px,0,0);
          }
        }
      `}</style>

      {/* 1. Background Section with Curve */}
      <div className="absolute top-0 left-0 right-0 h-[50vh] z-0 transition-all duration-700 ease-in-out overflow-hidden">
        {/* Background Gradient */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${BRAND_PURPLE} 0%, ${BRAND_LIGHT_PURPLE} 50%, ${BRAND_DARK_PURPLE} 100%)` }}
        >
          {/* Decorative floating shapes */}
          <div className="absolute top-10 left-[10%] w-20 h-20 bg-purple-200/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-20 right-[10%] w-32 h-32 bg-violet-200/15 rounded-full blur-3xl"></div>
        </div>

        {/* Animated Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0 w-full z-10 leading-[0]">
            <svg 
                className="w-full h-[15vh] min-h-[100px] max-h-[160px]" 
                viewBox="0 24 150 28" 
                preserveAspectRatio="none" 
                shapeRendering="auto"
            >
                <defs>
                    <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
                </defs>
                <g className="parallax">
                    <use href="#gentle-wave" x="48" y="0" fill="rgba(248, 250, 252, 0.7)" />
                    <use href="#gentle-wave" x="48" y="3" fill="rgba(248, 250, 252, 0.5)" />
                    <use href="#gentle-wave" x="48" y="5" fill="rgba(248, 250, 252, 0.3)" />
                    <use href="#gentle-wave" x="48" y="7" fill="#F8FAFC" />
                </g>
            </svg>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        
        {/* Flex container for Card and Character */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-center w-full max-w-4xl gap-0">
            
            {/* Auth Card - Moved to BACK (z-20) */}
            <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-6 w-full max-w-[360px] relative z-20">
                
                {/* Header */}
                <div className="flex flex-col items-center mb-5">
                     <img 
                        src="/foodeez-logo.png"
                        alt="FooDeeZ Logo" 
                        className="h-20 w-auto mb-15" 
                    />
                    <h2 className="text-2xl font-bold text-slate-800 text-center tracking-tight">
                        Login
                    </h2>
                    <p className="text-slate-400 text-xs mt-1 text-center font-medium">
                      
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 ml-1">Email<span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Input 
                                type="email" 
                                placeholder="admin@example.com"
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                className="h-10 pl-3 rounded-xl bg-slate-50 border-slate-200 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 ml-1">Password<span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••••••"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                                className="h-10 pl-3 pr-8 rounded-xl bg-slate-50 border-slate-200 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-2 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-medium text-center animate-in fade-in">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center cursor-pointer group">
                            <div className="relative flex items-center">
                                <input type="checkbox" className="peer sr-only" />
                                <div className="w-3.5 h-3.5 border border-slate-300 rounded peer-checked:bg-[#5D2B90] peer-checked:border-[#5D2B90] transition-all flex items-center justify-center">
                                     <svg className="w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                            </div>
                            <span className="ml-2 text-xs text-slate-500 group-hover:text-slate-700 transition-colors">Remember me</span>
                        </label>
                        <button 
                          type="button"
                          onClick={() => setIsForgotPasswordOpen(true)}
                          className="text-xs font-semibold hover:underline text-[#5D2B90]"
                        >
                          Forgot password?
                        </button>
                    </div>

                    <Button 
                        type="submit" 
                        disabled={loading}
                        className="w-full h-10 text-sm font-bold rounded-lg shadow-md hover:shadow-lg transform transition-all active:scale-[0.98] mt-2 text-white"
                        style={{ backgroundColor: '#5D2B90' }}
                    >
                        {loading ? 'Processing...' : 'Login'}
                    </Button>
                </form>
            </div>

            {/* 3D Character Illustration */}
            <div className="hidden md:block w-[250px] lg:w-[300px] relative z-30 flex-shrink-0 p-0 md:-ml-24">
                 <img 
                    src={LOGIN_CHAR_IMG} 
                    alt="3D Character" 
                    className="w-full h-auto object-contain drop-shadow-2xl animate-in fade-in zoom-in duration-300 block"
                />
            </div>

        </div>
      </div>

    </div>

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