import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, LogIn, ArrowRight, UserPlus, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginUser, clearAuthErrors } from '../../redux/slices/authSlice.js';
import { syncCartDB } from '../../redux/slices/cartSlice.js';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const { isAuthenticated, error, loading } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Redirect to previously target or home if authenticated
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      // MASTER CLASS: If user logged in and has guest cart items locally, sync them with database!
      const guestCart = localStorage.getItem('guestCart');
      if (guestCart) {
        try {
          const parsed = JSON.parse(guestCart);
          if (parsed && parsed.length > 0) {
            const syncPayload = parsed.map(item => ({
              productId: item.productId._id,
              quantity: item.quantity
            }));
            dispatch(syncCartDB(syncPayload));
            toast.success('Your local guest cart merged with database cart! 🛒');
          }
        } catch (err) {
          console.error('Guest cart parsing failed', err);
        }
      }
      navigate(from, { replace: true });
    }

    return () => {
      dispatch(clearAuthErrors());
    };
  }, [isAuthenticated, navigate, from, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please enter both email and password!');
      return;
    }

    try {
      await dispatch(loginUser(formData)).unwrap();
      toast.success('Logged in successfully! Welcome to ShopSphere 🎉');
    } catch (err) {
      toast.error(err || 'Failed to authenticate.');
    }
  };

  return (
    <div className="max-w-md mx-auto pt-12 pb-20 px-4">
      <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-md space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-display font-black text-darkSlate-900 tracking-tight">Welcome Back</h2>
          <p className="text-slate-400 text-xs">Enter your credentials to regain access to your dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1">
                <Lock className="h-3 w-3" />
                <span>Password</span>
              </label>
              <a href="#" className="text-[10px] text-primary hover:underline font-semibold leading-none">
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center space-x-2 py-3.5 group shadow-blue-500/10 mt-2"
          >
            <span>{loading ? 'Logging in...' : 'Sign In'}</span>
            <LogIn className="h-4 w-4" />
          </button>
        </form>

        <div className="border-t border-slate-100 my-4"></div>

        <div className="text-center text-xs text-slate-400 font-semibold space-y-3">
          <p>
            <span>New to ShopSphere? </span>
            <Link to="/register" className="text-primary hover:underline font-bold">
              Create an Account
            </Link>
          </p>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-left space-y-1 text-[10px] text-slate-400 leading-normal font-normal">
            <span className="font-bold text-darkSlate-800 uppercase block mb-1">Sandbox Credentials:</span>
            <p>Admin: <span className="font-mono text-darkSlate-900">admin@shopsphere.com</span> / <span className="font-mono text-darkSlate-900">admin123</span></p>
            <p>Customer: <span className="font-mono text-darkSlate-900">user@shopsphere.com</span> / <span className="font-mono text-darkSlate-900">user123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
