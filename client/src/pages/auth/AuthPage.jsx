import { useState, useContext } from 'react';
import { ArrowRight, Lock, Mail, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { GetStartedModal } from '../../components/modals/GetStartedModal';
import { CardCustomizerModal } from '../../components/modals/CardCustomizerModal';
import { AuthContext } from '../../context/AuthContext';
import { saveUserProfile, getUserProfile, registerNewUser, verifyUserCredentials } from '../../services/userDataService';

export const AuthPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [isGetStartedOpen, setIsGetStartedOpen] = useState(false);
  const [isCardStudioOpen, setIsCardStudioOpen] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' or 'signup'

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [errorReason, setErrorReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setErrorReason('');

    if (!email.trim() || !password.trim()) return;
    if (mode === 'signup' && !name.trim()) return;

    if (mode === 'signup') {
      const regResult = registerNewUser({ name, email, password });
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
      setSuccessMsg(`Account successfully created for ${regResult.user.name}!`);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } else {
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
      setSuccessMsg(`Welcome back, ${authResult.user.name}!`);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#1A1A1A] font-sans-clean flex flex-col justify-between">
      <Navbar onOpenSignUp={() => setIsGetStartedOpen(true)} onOpenCardStudio={() => setIsCardStudioOpen(true)} />

      <main className="pt-28 pb-20 max-w-md mx-auto px-4 w-full">
        <div className="bg-white p-8 rounded-sm border border-[#1A1A1A]/15 shadow-2xl">
          {/* Mode Switch Tabs */}
          <div className="flex border-b border-[#1A1A1A]/10 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setErrorReason('');
                setName('');
                setEmail('');
                setPassword('');
              }}
              className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold font-mono transition-colors border-b-2 cursor-pointer ${
                mode === 'login' ? 'border-[#088fff] text-[#088fff]' : 'border-transparent text-[#1A1A1A]/40 hover:text-[#1A1A1A]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
                setErrorReason('');
                setName('');
                setEmail('');
                setPassword('');
              }}
              className={`flex-1 py-3 text-xs uppercase tracking-widest font-bold font-mono transition-colors border-b-2 cursor-pointer ${
                mode === 'signup' ? 'border-[#088fff] text-[#088fff]' : 'border-transparent text-[#1A1A1A]/40 hover:text-[#1A1A1A]'
              }`}
            >
              Create Account
            </button>
          </div>

          <h2 className="text-2xl font-editorial font-bold text-[#1A1A1A] mb-2 text-center">
            {mode === 'login' ? 'Welcome Back to Budget Buddy' : 'Begin Your Financial Journey'}
          </h2>
          <p className="text-xs text-[#1A1A1A]/60 text-center mb-6">
            {mode === 'login' ? 'Sign in to access your custom financial ledger and telemetry.' : 'Sign up in under 60 seconds.'}
          </p>

          {errorMsg && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-sm text-xs flex flex-col gap-2 animate-fadeIn">
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
                  }}
                  className="self-start text-[10px] font-bold uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-sm transition-colors cursor-pointer font-mono mt-1"
                >
                  Create Account Now (Sign Up)
                </button>
              )}
              {errorReason === 'already_exists' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setErrorReason('');
                  }}
                  className="self-start text-[10px] font-bold uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-sm transition-colors cursor-pointer font-mono mt-1"
                >
                  Sign In Instead
                </button>
              )}
            </div>
          )}

          {successMsg ? (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-sm text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-sm">{successMsg}</p>
              <p className="text-xs text-emerald-700">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#1A1A1A]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Priyansu Sekhar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#1A1A1A]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="user@budgetbuddy.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A]/60 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#1A1A1A]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#F9F8F5] border border-[#1A1A1A]/15 rounded-sm text-xs focus:outline-none focus:border-[#088fff]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1A1A1A] hover:bg-[#088fff] text-white py-3.5 rounded-sm font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>{mode === 'login' ? 'Sign In to Dashboard' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer onGetStarted={() => setIsGetStartedOpen(true)} />
      <GetStartedModal isOpen={isGetStartedOpen} onClose={() => setIsGetStartedOpen(false)} />
      <CardCustomizerModal isOpen={isCardStudioOpen} onClose={() => setIsCardStudioOpen(false)} />
    </div>
  );
};

export default AuthPage;
