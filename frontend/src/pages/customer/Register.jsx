import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { User, Mail, Lock, UserPlus, ShieldCheck, KeyRound, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { registerUser, verifyOtp, clearAuthErrors, resetRegistrationState } from '../../redux/slices/authSlice.js';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, error, loading, registrationSuccess, registrationEmail } = useSelector((state) => state.auth);

  // Sign up state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState(''); // Developer helper display

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
    return () => {
      dispatch(clearAuthErrors());
      dispatch(resetRegistrationState());
    };
  }, [isAuthenticated, navigate, dispatch]);

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password } = formData;
    if (!name || !email || !password) {
      toast.error('Please fill in all registration fields!');
      return;
    }

    try {
      const res = await dispatch(registerUser(formData)).unwrap();
      toast.success(res.message || 'Verification OTP sent!');
      // Developer assist: Store the simulated OTP in state so we can show it!
      if (res.otp) {
        setDevOtp(res.otp);
        setOtpCode(res.otp); // prefill for ultimate convenience
      }
    } catch (err) {
      toast.error(err || 'Registration failed.');
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Please enter a 6-digit numeric OTP code.');
      return;
    }

    try {
      await dispatch(
        verifyOtp({
          email: registrationEmail,
          otp: otpCode
        })
      ).unwrap();
      toast.success('Account verified and logged in successfully! Welcome 🎉');
    } catch (err) {
      toast.error(err || 'Invalid or expired OTP code.');
    }
  };

  return (
    <div className="max-w-md mx-auto pt-12 pb-20 px-4">
      <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-md space-y-6">
        
        {/* ================= VIEW 1: SIGNUP FORM ================= */}
        {!registrationSuccess ? (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display font-black text-darkSlate-900 tracking-tight">Create Account</h2>
              <p className="text-slate-400 text-xs text-center">Join ShopSphere to explore and purchase premium curation.</p>
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="John Doe"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1">
                  <Mail className="h-3 w-3" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  placeholder="john@example.com"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1">
                  <Lock className="h-3 w-3" />
                  <span>Secure Password</span>
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                  placeholder="Min 6 characters"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center space-x-2 py-3.5 group shadow-blue-500/10 mt-2"
              >
                <span>{loading ? 'Generating account...' : 'Create Account'}</span>
                <UserPlus className="h-4 w-4" />
              </button>
            </form>

            <div className="border-t border-slate-100 my-4"></div>

            <p className="text-center text-xs text-slate-400 font-semibold">
              <span>Already registered? </span>
              <Link to="/login" className="text-primary hover:underline font-bold">
                Sign In
              </Link>
            </p>
          </>
        ) : (
          /* ================= VIEW 2: OTP VERIFICATION SCREEN ================= */
          <>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-display font-black text-darkSlate-900 tracking-tight">Verify Your Account</h2>
              <p className="text-slate-400 text-xs text-center">
                We've simulated a verification code to <span className="font-semibold text-darkSlate-900">{registrationEmail}</span>.
              </p>
            </div>

            <form onSubmit={handleOtpVerify} className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1">
                  <KeyRound className="h-3 w-3" />
                  <span>Enter 6-Digit OTP</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength="6"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full text-center border border-slate-200 focus:border-primary text-xl font-display font-bold py-3.5 rounded-xl outline-none focus:ring-4 focus:ring-blue-100/50 placeholder:text-slate-200 tracking-[0.25em]"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center space-x-2 py-3.5 group shadow-blue-500/10"
              >
                <span>{loading ? 'Activating account...' : 'Verify & Login'}</span>
                <ShieldCheck className="h-4.5 w-4.5" />
              </button>
            </form>

            {/* Developer Simulated OTP Box Assist */}
            {devOtp && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2 text-center text-xs font-semibold text-slate-500 shadow-sm animate-pulse">
                <span className="text-[10px] font-black text-primary uppercase tracking-wider block">Sandbox Assist</span>
                <p>Simulated OTP sent is: <span className="font-mono text-darkSlate-900 text-sm font-bold bg-white px-2.5 py-1 rounded-md border border-slate-200/80 shadow-xs">{devOtp}</span></p>
              </div>
            )}

            <div className="border-t border-slate-100 my-4"></div>

            <button
              onClick={() => dispatch(resetRegistrationState())}
              className="w-full flex items-center justify-center space-x-1 text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Signup form</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
