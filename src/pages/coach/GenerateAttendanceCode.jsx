import React, { useState } from 'react';
import { generateAttendanceCode } from '../../services/api';
import { SESSION_TYPES } from '../../utils/constants';
import AttendanceCodeDisplay from '../../components/AttendanceCodeDisplay';
import CustomSelect from '../../components/CustomSelect';
import { QrCode, Sparkles, AlertCircle } from 'lucide-react';

export default function GenerateAttendanceCode() {
  const [weekNumber, setWeekNumber] = useState(6);
  const [dayNumber, setDayNumber] = useState(1);
  const [sessionType, setSessionType] = useState('Physical');
  const [generatedData, setGeneratedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async (e) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await generateAttendanceCode(Number(weekNumber), Number(dayNumber), sessionType);
      if (res && res.success) {
        setGeneratedData({
          code: res.code,
          weekNumber: Number(weekNumber),
          dayNumber: Number(dayNumber),
          sessionType: sessionType,
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-neutral">Generate Attendance Passcode</h1>
        <p className="text-sm text-brand-neutral-muted mt-1">
          Create a time-limited 6-character code for students to record their class presence.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-brand-error/20 rounded-xl text-brand-error flex items-start gap-2 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Generation Form */}
      <div className="portal-card">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-secondary py-3 font-bold text-sm shadow-md"
          >
            {loading ? (
              <span>Generating Secure Code...</span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <QrCode className="w-4 h-4" />
                Generate 6-Character Passcode
              </span>
            )}
          </button>
        </form>
      </div>

      {/* Code Display Component */}
      {generatedData && (
        <AttendanceCodeDisplay
          code={generatedData.code}
          weekNumber={generatedData.weekNumber}
          dayNumber={generatedData.dayNumber}
          sessionType={generatedData.sessionType}
          expiresInMinutes={generatedData.expiresInMinutes}
          onRegenerate={handleGenerate}
        />
      )}
    </div>
  );
}
