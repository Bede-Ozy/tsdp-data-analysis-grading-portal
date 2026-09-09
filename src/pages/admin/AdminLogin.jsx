import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ArrowRight, AlertCircle, GraduationCap, Award } from 'lucide-react';

export default function AdminLogin() {
  const [adminNumber, setAdminNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!adminNumber.trim()) {
      setError('Please enter your Admin Number (e.g., 002).');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginAdmin(adminNumber, email);
      if (res.success) {
        // Routing logic:
        // response.role === 'Admin' or response.isAdmin === true -> /admin/dashboard
        // response.role === 'Technical' or 'Professional' -> /coach/dashboard
        if (res.isAdmin || res.role === 'admin' || res.target === '/admin/dashboard') {
          navigate('/admin/dashboard');
        } else {
          navigate('/coach/dashboard');
        }
      } else {
        setError(res.message || 'Invalid Administrator credentials. Please verify your Admin Number and Email in COACHES_MASTER.');
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
          {/* Header Banner */}
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
                  Admin Number <span className="text-brand-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 002"
                  value={adminNumber}
                  onChange={(e) => setAdminNumber(e.target.value)}
                  className="form-input text-base font-mono"
                  autoComplete="username"
                  required
                />
                <span className="text-[11px] text-brand-neutral-muted mt-1 block">
                  3-digit Admin ID (e.g. 002 for TSDP2026-ADM-002)
                </span>
              </div>

              <div>
                <label className="form-label">
                  Admin Email <span className="text-brand-error">*</span>
                </label>
                <input
                  type="email"
                  placeholder="admin@shamzbridge.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  autoComplete="email"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-sm font-medium shadow-xs hover:shadow-sm transition-all bg-slate-900 hover:bg-slate-800"
              >
                {loading ? (
                  <span>Verifying Administrator Access...</span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Sign In as Administrator</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>

            {/* Switch Portal Links */}
            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-brand-neutral-muted">
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
