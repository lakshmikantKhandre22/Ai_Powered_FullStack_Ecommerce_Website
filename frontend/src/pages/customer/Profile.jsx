import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { User, Mail, ShieldAlert, Award, Camera, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateUserProfile } from '../../redux/slices/authSlice.js';

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');

  // Initial avatar picks list for rapid premium selections
  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop'
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user) {
      setName(user.name);
      setAvatar(user.avatar);
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a display name!');
      return;
    }

    try {
      await dispatch(updateUserProfile({ name, avatar })).unwrap();
      toast.success('Your profile settings saved successfully! 💾');
    } catch (err) {
      toast.error(err || 'Failed to update profile settings.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
      <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Left Side: Avatar selector layout */}
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="relative group">
            <img
              src={avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256'}
              alt="avatar"
              className="w-36 h-36 rounded-3xl object-cover border-4 border-slate-100 group-hover:scale-102 transition duration-300"
            />
            <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-display font-bold text-base text-darkSlate-900">{user?.name}</h3>
            <span className="text-slate-400 text-xs font-semibold uppercase">{user?.role}</span>
          </div>

          {/* Quick presets select */}
          <div className="space-y-2 w-full">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Choose Avatar Preset</span>
            <div className="flex justify-center space-x-2.5">
              {presetAvatars.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setAvatar(url)}
                  className={`w-10 h-10 rounded-xl overflow-hidden relative border-2 transition ${
                    avatar === url ? 'border-primary scale-105' : 'border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <img src={url} alt="preset" className="w-full h-full object-cover" />
                  {avatar === url && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center text-white">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Input form fields */}
        <div className="md:col-span-2 space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-xl font-display font-bold text-darkSlate-900 leading-none">Account Settings</h2>
            <p className="text-slate-400 text-xs mt-1.5">Manage your display details and security credentials.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                <User className="h-3 w-3 text-slate-400" />
                <span>Display Name</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Full Name"
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                <Mail className="h-3 w-3 text-slate-400" />
                <span>Registered Email</span>
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="input-field bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 leading-relaxed font-semibold italic">
                Registered email addresses cannot be altered for session security policies.
              </span>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary py-3 px-8 shadow-sm flex items-center space-x-2"
              >
                <span>{loading ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
