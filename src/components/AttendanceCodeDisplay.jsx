import React, { useState, useEffect } from 'react';
import { Copy, Check, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AttendanceCodeDisplay({
  code,
  weekNumber,
  dayNumber,
  sessionType,
  expiresInMinutes = 10,
  onRegenerate
}) {
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(expiresInMinutes * 60);

  useEffect(() => {
    setSecondsLeft(expiresInMinutes * 60);
  }, [code, expiresInMinutes]);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isExpired = secondsLeft === 0;

  return (
    <div className="portal-card bg-gradient-to-br from-white to-brand-primary-light/30 border-2 border-brand-primary/30 relative overflow-hidden">
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary text-white text-xs font-semibold tracking-wide uppercase">
          <span>Week {weekNumber} · Day {dayNumber}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
          <span>{sessionType} Session</span>
        </div>

        {/* Big Code Box */}
        <div className="relative group">
          <div className="bg-white border border-slate-200 rounded-2xl px-8 py-5 shadow-xs">
            <span className="font-mono text-4xl sm:text-5xl font-semibold tracking-widest text-brand-primary">
              {code || '------'}
            </span>
          </div>
          {code && (
            <button
              onClick={handleCopy}
              className="absolute -top-3 -right-3 p-2 bg-brand-secondary hover:bg-brand-secondary-dark text-white rounded-full shadow-xs transition-transform active:scale-95"
              title="Copy attendance code"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Copy Feedback */}
        {copied && (
          <p className="text-xs font-medium text-brand-success flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Code copied to clipboard! Share with students.
          </p>
        )}

        {/* Countdown Timer */}
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock className={`w-4 h-4 ${isExpired ? 'text-brand-error' : 'text-brand-secondary'}`} />
          {isExpired ? (
            <span className="text-brand-error font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Code Expired! Generate a new one.
            </span>
          ) : (
            <span className="text-slate-700">
              Valid for:{' '}
              <span className="text-brand-secondary font-mono font-semibold">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </span>
          )}
        </div>

        {/* Important note */}
        <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-3 text-left flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Important Attendance Rules:</span>
            <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-amber-800">
              <li>Students have exactly 10 minutes to submit this code.</li>
              <li>Submissions received before or at 9:30 AM are marked as <strong>Present</strong>.</li>
              <li>Submissions after 9:30 AM are automatically flagged as <strong>Late</strong>.</li>
            </ul>
          </div>
        </div>

        {/* Action Button */}
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Regenerate Code
          </button>
        )}
      </div>
    </div>
  );
}
