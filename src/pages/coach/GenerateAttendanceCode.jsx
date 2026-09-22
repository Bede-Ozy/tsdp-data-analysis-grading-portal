import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { generateAttendanceCode, markAllPresent } from '../../services/api';
import { SESSION_TYPES } from '../../utils/constants';
import AttendanceCodeDisplay from '../../components/AttendanceCodeDisplay';
import CustomSelect from '../../components/CustomSelect';
import { QrCode, AlertCircle, CheckCircle2, Users, Sun, Sunset } from 'lucide-react';

export default function GenerateAttendanceCode() {
  const { user } = useAuth();
  const coachID = user?.coachID || user?.id || user?.name || 'COACH';

  const [weekNumber, setWeekNumber] = useState(6);
  const [dayNumber, setDayNumber] = useState(1);
  const [sessionType, setSessionType] = useState('Physical');
  const [sessionPeriod, setSessionPeriod] = useState('Morning'); // 'Morning' | 'Afternoon'
  const [generatedData, setGeneratedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [markAllNotice, setMarkAllNotice] = useState(null);

  const handleGenerate = async (e) => {
    e?.preventDefault();
    setError(null);
    setMarkAllNotice(null);
    setLoading(true);

    try {
      const res = await generateAttendanceCode(Number(weekNumber), Number(dayNumber), sessionType, sessionPeriod);
      if (res && res.success) {
        setGeneratedData({
          code: res.code,
          weekNumber: Number(weekNumber),
          dayNumber: Number(dayNumber),
          sessionType: sessionType,
          sessionPeriod: sessionPeriod,
          expiresInMinutes: res.expiresInMinutes || 10,
        });
      } else {
        setError(res?.message || 'Failed to generate attendance code.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error generating attendance passcode.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllPresent = async () => {
    const confirmMsg = `Are you sure you want to mark ALL enrolled students as PRESENT for Week ${weekNumber}, Day ${dayNumber} (${sessionPeriod} ${sessionType} Session)?`;
    if (!window.confirm(confirmMsg)) return;

    setMarkAllLoading(true);
    setMarkAllNotice(null);
    setError(null);

    try {
      const res = await markAllPresent(Number(weekNumber), Number(dayNumber), sessionType, sessionPeriod, coachID);
      if (res && res.success !== false) {
        setMarkAllNotice({
          type: 'success',
          text: res?.message || `All active students marked present for Week ${weekNumber} Day ${dayNumber} (${sessionPeriod} ${sessionType}).`
        });
      } else {
        setError(res?.message || 'Failed to mark all students present.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error while marking all students present.');
    } finally {
      setMarkAllLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-neutral">Generate Attendance Passcode</h1>
        <p className="text-sm text-brand-neutral-muted mt-1">
          Create a time-limited 6-character code for students to record their class presence for morning and afternoon sessions.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-brand-error/20 rounded-xl text-brand-error flex items-start gap-2 text-xs font-medium animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {markAllNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-2 text-xs font-medium animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>{markAllNotice.text}</span>
        </div>
      )}

      {/* Generation Form */}
      <div className="portal-card">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="form-label">Cohort Week</label>
              <CustomSelect
                value={weekNumber}
                onChange={(val) => setWeekNumber(Number(val))}
                options={Array.from({ length: 16 }, (_, i) => ({
                  value: i + 1,
                  label: `Week ${i + 1}`
                }))}
              />
            </div>

            <div>
              <label className="form-label">Class Day</label>
              <CustomSelect
                value={dayNumber}
                onChange={(val) => setDayNumber(Number(val))}
                options={[1, 2, 3, 4, 5].map((d) => ({
                  value: d,
                  label: `Day ${d}`
                }))}
              />
            </div>

            <div>
              <label className="form-label">Session Mode</label>
              <CustomSelect
                value={sessionType}
                onChange={(val) => setSessionType(val)}
                options={SESSION_TYPES.map((t) => ({
                  value: t,
                  label: `${t} Session`
                }))}
              />
            </div>

            <div>
              <label className="form-label flex items-center gap-1.5">
                {sessionPeriod === 'Morning' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Sunset className="w-3.5 h-3.5 text-orange-500" />}
                <span>Session Period</span>
              </label>
              <CustomSelect
                value={sessionPeriod}
                onChange={(val) => setSessionPeriod(val)}
                options={[
                  { value: 'Morning', label: 'Morning' },
                  { value: 'Afternoon', label: 'Afternoon' }
                ]}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || markAllLoading}
              className="flex-1 btn-secondary py-3 font-bold text-sm shadow-md"
            >
              {loading ? (
                <span>Generating Secure Code...</span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <QrCode className="w-4 h-4" />
                  Generate Passcode ({sessionPeriod})
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleMarkAllPresent}
              disabled={loading || markAllLoading}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
              title="Quickly record all students present without passcode"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>{markAllLoading ? 'Marking All...' : 'Mark All Present'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Code Display Component */}
      {generatedData && (
        <AttendanceCodeDisplay
          code={generatedData.code}
          weekNumber={generatedData.weekNumber}
          dayNumber={generatedData.dayNumber}
          sessionType={generatedData.sessionType}
          sessionPeriod={generatedData.sessionPeriod}
          expiresInMinutes={generatedData.expiresInMinutes}
          onRegenerate={handleGenerate}
        />
      )}
    </div>
  );
}
