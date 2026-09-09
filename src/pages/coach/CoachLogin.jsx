import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Award, ArrowRight, AlertCircle, Sparkles, Shield } from 'lucide-react';

export default function CoachLogin() {
  const [coachNumber, setCoachNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginCoach } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!coachNumber.trim()) {
      setError('Please enter your 3-digit Coach Number (e.g. 001).');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your registered coach email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginCoach(coachNumber, email);
      if (res.success) {
        navigate('/coach/dashboard');
      } else {
        setError(res.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setError('Connection error. Please check network/deployment permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-secondary to-brand-secondary-dark p-6 text-white text-center relative">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs mx-auto flex items-center justify-center mb-3 text-white border border-white/20">
              <Award className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold tracking-normal text-white">Coach & Tutor Portal</h1>
            <p className="text-xs text-orange-100 mt-1">Grading & Evaluation Console · TSDP 2026</p>
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
                  Coach Number <span className="text-brand-error">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 001"
                  value={coachNumber}
                  onChange={(e) => setCoachNumber(e.target.value)}
                  className="form-input text-base font-mono"
                  required
                />
                <span className="text-[11px] text-brand-neutral-muted mt-1 block">
                  3-digit instructor identifier (e.g. 001 for TSDP2026-COA-001)
                </span>
              </div>

              <div>
                <label className="form-label">
                  Registered Email <span className="text-brand-error">*</span>
                </label>
                <input
                  type="email"
                  placeholder="coach@shamzbridge.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-secondary py-3 text-sm font-medium shadow-xs hover:shadow-sm transition-all"
              >
                {loading ? (
                  <span>Authenticating Coach...</span>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Enter Instructor Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            </form>

            {/* Links */}
            <div className="mt-8 pt-5 border-t border-slate-100 text-center text-xs space-y-2 text-brand-neutral-muted">
              <p>
                Are you a resident student?{' '}
                <Link to="/student/login" className="font-medium text-brand-primary hover:underline">
                  Resident Student Login
                </Link>
              </p>
              <p>
                System Administrator?{' '}
                <Link to="/admin/login" className="font-medium text-slate-700 hover:underline">
                  Admin Portal
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
