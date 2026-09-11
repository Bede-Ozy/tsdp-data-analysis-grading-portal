import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { markAttendance } from '../../services/api';
import { SESSION_TYPES } from '../../utils/constants';
import CustomSelect from '../../components/CustomSelect';
import { Clock, CheckCircle2, AlertCircle, Sparkles, HelpCircle, X, ArrowRight } from 'lucide-react';

export default function MarkAttendance() {
  const { user } = useAuth();
  const [sessionType, setSessionType] = useState('Physical');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setError(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter the 6-character attendance code provided by your coach.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (cleanCode.length !== 6) {
      setError('Attendance code must be exactly 6 characters long.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      const studentNum = user?.studentNumber || user?.studentID || '';
      const res = await markAttendance(studentNum, sessionType, cleanCode);
      if (res && res.success) {
        setResult(res);
        setShowSuccessModal(true);
        setCode('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(res?.message || 'Invalid or expired attendance code. Please confirm with your coach.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError('Failed to mark attendance. Please check network connection.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-neutral">Mark Class Attendance</h1>
          <p className="text-sm text-brand-neutral-muted mt-1">
            Enter the daily 6-character session passcode announced by your coach.
          </p>
        </div>
        <Link
          to="/student/dashboard"
          className="btn-secondary text-xs self-start sm:self-auto flex items-center gap-1.5"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Success Notification */}
      {result && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-base text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Attendance Successfully Recorded!</span>
          </div>
          <p className="text-xs text-emerald-700">{result.message}</p>
          <div className="flex items-center gap-4 text-xs font-semibold pt-1 border-t border-emerald-100">
            <span>Status: <strong className="text-brand-primary uppercase">{result.status}</strong></span>
            <span>Recorded at: {result.timestamp}</span>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 bg-red-50 border border-brand-error/20 rounded-xl text-brand-error flex items-start gap-2.5 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Attendance Form */}
      <div className="portal-card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Resident identifier */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between text-xs">
            <span className="text-brand-neutral-muted">Logging attendance for:</span>
            <span className="font-mono font-bold text-brand-neutral">
              {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Resident'} {user?.studentID ? `(${user.studentID})` : (user?.studentNumber ? `(ID: ${user.studentNumber})` : '')}
            </span>
          </div>

          {/* Session Type */}
          <div>
            <label className="form-label">Select Session Type</label>
            <CustomSelect
              value={sessionType}
              onChange={(val) => setSessionType(val)}
              options={SESSION_TYPES.map((type) => ({
                value: type,
                label: `${type} Session`
              }))}
            />
          </div>

          {/* 6-digit Code Input */}
          <div>
            <label className="form-label">
              6-Character Attendance Passcode <span className="text-brand-error">*</span>
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. 7K9P2X"
              className="form-input text-center text-2xl font-mono font-semibold tracking-widest uppercase placeholder:text-gray-300 py-3"
              autoFocus
            />
            <p className="text-[11px] text-brand-neutral-muted mt-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brand-secondary" />
              Codes are active for only 10 minutes once announced.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || code.trim().length === 0}
            className="w-full btn-primary py-3 font-medium text-sm shadow-xs hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Validating Passcode...' : 'Confirm & Mark Attendance'}
          </button>
        </form>
      </div>

      {/* Rules Card */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
        <h4 className="font-bold flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-amber-600" />
          TSDP 2026 Attendance Guidelines
        </h4>
        <ul className="list-disc list-inside space-y-1 text-amber-800">
          <li><strong>Punctuality:</strong> Marking attendance before or at 9:30 AM registers as <strong>Present</strong>.</li>
          <li><strong>Lateness:</strong> Marking attendance after 9:30 AM is recorded as <strong>Late</strong>.</li>
          <li><strong>Weighting:</strong> Attendance & Punctuality contributes <strong>10%</strong> to your final program grade.</li>
        </ul>
      </div>

      {/* Celebration Success Pop-up Modal */}
      {showSuccessModal && result && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 text-center space-y-5 animate-scale-up relative">
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Attendance Recorded!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Your presence for today's <strong className="text-brand-primary">{sessionType} Session</strong> has been successfully marked as <strong className="uppercase text-emerald-700">{result.status || 'Present'}</strong>.
              </p>
            </div>

            {result.timestamp && (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Timestamp</span>
                <p className="font-mono text-xs font-semibold text-slate-700">
                  {result.timestamp}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <Link
                to="/student/dashboard"
                className="w-full sm:w-auto btn-primary py-2.5 px-5 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Return to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full sm:w-auto btn-secondary py-2.5 px-5 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
