import { useState, useContext, useEffect } from 'react';
import { X, ArrowRight, CheckCircle2, Sparkles, User, Mail, Lock, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AuthContext } from '../../context/AuthContext';
import { saveUserProfile, getUserProfile, registerNewUser, verifyUserCredentials } from '../../services/userDataService';

export const GetStartedModal = ({ isOpen, onClose, onSuccess, initialMode = 'signup' }) => {
  const { login } = useContext(AuthContext);

  const [mode, setMode] = useState(initialMode); // 'signup' or 'login'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorReason, setErrorReason] = useState(''); // 'not_found' | 'already_exists' | 'invalid_password'

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setIsSubmitting(false);
      setErrorMsg('');
      setErrorReason('');
      setFullName('');
      setEmail('');
      setPassword('');
      setMode(initialMode || 'signup');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setErrorReason('');

    if (!email.trim() || !password.trim()) return;
    if (mode === 'signup' && !fullName.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      if (mode === 'signup') {
        // New User Registration Verification
        const regResult = registerNewUser({ name: fullName, email, password });
        if (!regResult.success) {
          setErrorMsg(regResult.message);
          setErrorReason('already_exists');
          return;
        }

        const currentProfile = getUserProfile();
        const updatedProfile = {
          ...currentProfile,
          name: regResult.user.name,
          email: regResult.user.email,
          planTier: 'Pro Member'
        };

        saveUserProfile(updatedProfile);
        login(updatedProfile);
        setIsSuccess(true);
        if (onSuccess) onSuccess(regResult.user.name);
      } else {
        // Old User Existence Verification
        const authResult = verifyUserCredentials({ email, password });
        if (!authResult.success) {
          setErrorMsg(authResult.message);
          setErrorReason(authResult.reason);
          return; // User CANNOT sign in if account does not exist!
        }

        const currentProfile = getUserProfile();
        const updatedProfile = {
          ...currentProfile,
          name: authResult.user.name,
          email: authResult.user.email,
          planTier: 'Pro Member'
        };

        saveUserProfile(updatedProfile);
        login(updatedProfile);
        setIsSuccess(true);
        if (onSuccess) onSuccess(authResult.user.name);
      }

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {
        // Fallback if confetti unavailable
      }
    }, 500);
  };

  const handleCloseModal = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <div
      onClick={handleCloseModal}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/80 backdrop-blur-sm animate-fadeIn"
    >
      <div
        className="bg-[#F9F8F5] border border-[#1A1A1A]/20 text-[#1A1A1A] w-full max-w-md rounded-sm p-8 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleCloseModal}
          className="absolute top-6 right-6 w-8 h-8 rounded-sm bg-[#1A1A1A]/5 hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-[#F9F8F5] flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {!isSuccess ? (
          <div>
            {/* Mode Selector Tabs (Sign Up vs Sign In) */}
            <div className="flex border-b border-[#1A1A1A]/15 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg('');
                  setErrorReason('');
                  setFullName('');
                  setEmail('');
                  setPassword('');
                }}
                className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold font-mono transition-colors border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
                  mode === 'signup'
                    ? 'border-[#088fff] text-[#088fff]'
                    : 'border-transparent text-[#1A1A1A]/40 hover:text-[#1A1A1A]'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>New User (Sign Up)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setErrorReason('');
                  setFullName('');
                  setEmail('');
                  setPassword('');
                }}
                className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold font-mono transition-colors border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
                  mode === 'login'
                    ? 'border-[#088fff] text-[#088fff]'
                    : 'border-transparent text-[#1A1A1A]/40 hover:text-[#1A1A1A]'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Old User (Sign In)</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[#088fff] text-[10px] font-bold uppercase tracking-[0.25em] mb-2 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{mode === 'signup' ? 'Create New Profile' : 'Access Existing Profile'}</span>
            </div>

            <h3 className="text-2xl font-medium font-editorial mb-1">
              {mode === 'signup' ? 'Sign Up For Budget Buddy' : 'Welcome Back! Sign In'}
            </h3>
            <p className="text-xs text-[#1A1A1A]/70 mb-4 font-sans-clean leading-relaxed">
              {mode === 'signup'
                ? 'Create your account to manage income, expenses, and automated month-end reports.'
                : 'Enter your credentials to restore your custom financial ledger and telemetry.'}
            </p>

            {errorMsg && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-sm text-xs font-sans-clean flex flex-col gap-2 animate-fadeIn">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
                {errorReason === 'not_found' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg('');
                      setErrorReason('');
                      setFullName('');
                      setEmail('');
                      setPassword('');
                    }}
                    className="self-start text-[10px] font-bold uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-sm transition-colors cursor-pointer font-mono mt-1"
                  >
                    Click Here to Create Account (Sign Up)
                  </button>
                )}
                {errorReason === 'already_exists' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                      setErrorReason('');
                      setFullName('');
                      setEmail('');
                      setPassword('');
                    }}
                    className="self-start text-[10px] font-bold uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-sm transition-colors cursor-pointer font-mono mt-1"
                  >
                    Click Here to Sign In Instead
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-[10px] font-bold text-[#1A1A1A]/70 uppercase tracking-widest mb-1.5 font-mono">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#1A1A1A]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Priyansu Sekhar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white border border-[#1A1A1A]/20 focus:border-[#088fff] rounded-sm pl-9 pr-4 py-3 text-sm text-[#1A1A1A] placeholder-[#1A1A1A]/40 focus:outline-none font-sans-clean"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-[#1A1A1A]/70 uppercase tracking-widest mb-1.5 font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#1A1A1A]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="user@budgetbuddy.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-[#1A1A1A]/20 focus:border-[#088fff] rounded-sm pl-9 pr-4 py-3 text-sm text-[#1A1A1A] placeholder-[#1A1A1A]/40 focus:outline-none font-sans-clean"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#1A1A1A]/70 uppercase tracking-widest mb-1.5 font-mono">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#1A1A1A]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-[#1A1A1A]/20 focus:border-[#088fff] rounded-sm pl-9 pr-4 py-3 text-sm text-[#1A1A1A] placeholder-[#1A1A1A]/40 focus:outline-none font-sans-clean"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1A1A1A] hover:bg-[#088fff] text-[#F9F8F5] font-bold text-[11px] uppercase tracking-[0.2em] py-4 rounded-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>{mode === 'signup' ? 'Complete Registration' : 'Sign In Now'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Toggle Mode Footer Link */}
            <div className="mt-6 pt-4 border-t border-[#1A1A1A]/10 text-center text-xs font-mono">
              {mode === 'signup' ? (
                <span className="text-[#1A1A1A]/60">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                      setErrorReason('');
                      setFullName('');
                      setEmail('');
                      setPassword('');
                    }}
                    className="text-[#088fff] font-bold underline cursor-pointer"
                  >
                    Sign In here
                  </button>
                </span>
              ) : (
                <span className="text-[#1A1A1A]/60">
                  Need a new account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg('');
                      setErrorReason('');
                      setFullName('');
                      setEmail('');
                      setPassword('');
                    }}
                    className="text-[#088fff] font-bold underline cursor-pointer"
                  >
                    Create Account here
                  </button>
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-3xl font-medium font-editorial mb-2">
              {mode === 'signup' ? 'Welcome to Budget Buddy!' : 'Signed In Successfully!'}
            </h3>
            <p className="text-xs text-[#1A1A1A]/70 mb-6 max-w-sm mx-auto font-sans-clean leading-relaxed">
              Your profile is active as <strong className="text-[#1A1A1A]">{email}</strong>. You can now manage transactions, budgets, and month-end email reports.
            </p>

            <button
              onClick={handleCloseModal}
              className="w-full bg-[#1A1A1A] hover:bg-[#088fff] text-[#F9F8F5] font-bold text-[11px] uppercase tracking-[0.2em] py-4 rounded-sm shadow-md transition-all cursor-pointer"
            >
              Continue to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GetStartedModal;
