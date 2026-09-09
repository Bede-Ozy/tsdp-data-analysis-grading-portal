import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, ArrowRight, AlertCircle, Sparkles, Award, ShieldCheck } from 'lucide-react';

export default function StudentLogin() {
  const [studentNumber, setStudentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginStudent } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!studentNumber.trim()) {
      setError('Please enter your 3-digit Student Number (e.g., 001).');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginStudent(studentNumber, email);
      if (res.success) {
        navigate('/student/dashboard');
      } else {
        setError(res.message || 'Login failed. Please check your details.');
      }
    } catch (err) {
      setError('Network error connecting to portal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Portal card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-brand-primary to-brand-primary-dark p-6 text-white text-center relative">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs mx-auto flex items-center justify-center mb-3 text-white border border-white/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold tracking-normal text-white">Resident Student Portal</h1>
            <p className="text-xs text-blue-100 mt-1">ITF-NECA TSDP Data Analytics Cohort 2026</p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Role Switcher Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200/80 text-xs font-medium">
              <Link
                to="/student/login"
                className="flex-1 py-2 text-center rounded-lg bg-white text-brand-primary font-semibold shadow-xs flex items-center justify-center gap-1.5"
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
                className="flex-1 py-2 text-center rounded-lg text-slate-500 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
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
                  Student Number <span className="text-brand-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 001"
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  className="form-input text-base font-mono"
                  autoComplete="username"
                  required
                />
                <span className="text-[11px] text-brand-neutral-muted mt-1 block">
                  3-digit resident ID (e.g. 001 for TSDP2026-RES-001)
                </span>
              </div>

              <div>
                <label className="form-label">
                  Registered Email <span className="text-brand-error">*</span>
                </label>
                <input
                  type="email"
                  placeholder="student@shamzbridge.com"
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
                className="w-full btn-primary py-3 text-sm font-medium shadow-xs hover:shadow-sm transition-all"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Access Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            </form>

            {/* Switch Portal Links */}
            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-brand-neutral-muted">
              <Link to="/coach/login" className="font-medium text-brand-secondary-dark hover:underline flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-brand-secondary" />
                <span>Coach Portal</span>
              </Link>
              <span className="text-slate-300">·</span>
              <Link to="/admin/login" className="font-medium text-slate-700 hover:text-slate-900 hover:underline flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-800" />
                <span>Admin Login</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
