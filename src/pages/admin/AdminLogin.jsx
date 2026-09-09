import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ArrowRight, AlertCircle, Sparkles, GraduationCap, Award } from 'lucide-react';

export default function AdminLogin() {
  const [adminKey, setAdminKey] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!adminKey.trim()) {
      setError('Please enter your Administrator Access Key.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginAdmin(adminKey, email);
      if (res.success) {
        navigate('/admin/dashboard');
      } else {
        setError(res.message || 'Invalid Administrator credentials.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-primary p-6 text-white text-center relative">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs mx-auto flex items-center justify-center mb-3 text-white border border-white/20">
              <ShieldCheck className="w-6 h-6 text-brand-secondary" />
            </div>
            <h1 className="text-xl font-semibold tracking-normal text-white">System Administrator</h1>
            <p className="text-xs text-slate-300 mt-1">TSDP Program Management Console</p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Role Switcher Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200/80 text-xs font-medium">
              <Link
                to="/student/login"
                className="flex-1 py-2 text-center rounded-lg text-slate-500 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student</span>
              </Link>
              <Link
                to="/coach/login"
                className="flex-1 py-2 text-center rounded-lg text-slate-500 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Coach</span>
              </Link>
              <Link
                to="/admin/login"
                className="flex-1 py-2 text-center rounded-lg bg-white text-slate-900 font-semibold shadow-xs flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                <span>Admin</span>
              </Link>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-brand-error/20 rounded-xl text-brand-error text-xs font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">
                  Administrator Access Key <span className="text-brand-error">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter administrator key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="form-input text-base"
                  required
                />
              </div>

              <div>
                <label className="form-label">Admin Email</label>
                <input
                  type="email"
                  placeholder="admin@shamzbridge.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-sm font-medium shadow-xs hover:shadow-sm transition-all bg-slate-900 hover:bg-slate-800"
              >
                {loading ? 'Verifying Admin Access...' : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Enter Admin Control</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>

            {/* Quick Fill Testing Credentials */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Demo Testing Credentials
                </span>
                <span className="text-[10px] text-slate-400">Click to fill</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAdminKey('ADMIN-2026');
                  setEmail('admin@shamzbridge.com');
                  setError('');
                }}
                className="w-full py-2 px-3 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200/60 font-mono transition-colors text-left flex items-center justify-between"
              >
                <span className="font-semibold text-slate-900">ADMIN-2026</span>
                <span className="text-slate-500 text-[11px]">admin@shamzbridge.com</span>
              </button>
            </div>

            {/* Switch Portal Links */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-brand-neutral-muted">
              <Link to="/student/login" className="font-medium text-brand-primary hover:underline flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student Login</span>
              </Link>
              <span className="text-slate-300">·</span>
              <Link to="/coach/login" className="font-medium text-brand-secondary-dark hover:underline flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Coach Portal</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
