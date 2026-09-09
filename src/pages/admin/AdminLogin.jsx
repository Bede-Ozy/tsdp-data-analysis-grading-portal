import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

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
          <div className="bg-gradient-to-r from-brand-primary to-brand-success p-6 text-white text-center relative">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs mx-auto flex items-center justify-center mb-3 text-white border border-white/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold tracking-normal text-white">System Administrator</h1>
            <p className="text-xs text-blue-100 mt-1">TSDP Program Management Console</p>
          </div>

          <div className="p-6 sm:p-8">
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
                className="w-full btn-primary py-3 text-sm font-medium shadow-xs hover:shadow-sm transition-all"
              >
                {loading ? 'Verifying Admin Access...' : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Enter Admin Control</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs space-y-1 text-brand-neutral-muted">
              <p>
                Student Resident?{' '}
                <Link to="/student/login" className="font-medium text-brand-primary hover:underline">
                  Resident Login
                </Link>
              </p>
              <p>
                Instructor?{' '}
                <Link to="/coach/login" className="font-medium text-brand-secondary-dark hover:underline">
                  Coach Portal
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
