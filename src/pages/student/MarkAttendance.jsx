import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { markAttendance } from '../../services/api';
import { SESSION_TYPES } from '../../utils/constants';
import CustomSelect from '../../components/CustomSelect';
import { Clock, CheckCircle2, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';

export default function MarkAttendance() {
  const { user } = useAuth();
  const [sessionType, setSessionType] = useState('Physical');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setError(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter the 6-character attendance code provided by your coach.');
      return;
    }

    if (cleanCode.length !== 6) {
      setError('Attendance code must be exactly 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const studentNum = user?.studentNumber || user?.studentID || '';
      const res = await markAttendance(studentNum, sessionType, cleanCode);
      if (res && res.success) {
        setResult(res);
        setCode('');
      } else {
        setError(res?.message || 'Invalid or expired attendance code. Please confirm with your coach.');
      }
    } catch (err) {
      setError('Failed to mark attendance. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-neutral">Mark Class Attendance</h1>
        <p className="text-sm text-brand-neutral-muted mt-1">
          Enter the daily 6-character session passcode announced by your coach.
        </p>
      </div>

      {/* Success Notification */}
      {result && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-brand-success space-y-2">
          <div className="flex items-center gap-2 font-bold text-base">
            <CheckCircle2 className="w-5 h-5 text-brand-primary" />
            <span>Attendance Successfully Recorded!</span>
          </div>
          <p className="text-xs">{result.message}</p>
          <div className="flex items-center gap-4 text-xs font-semibold pt-1 border-t border-blue-100">
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
            className="w-full btn-primary py-3 font-medium text-sm shadow-xs hover:shadow-sm"
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
    </div>
  );
}
