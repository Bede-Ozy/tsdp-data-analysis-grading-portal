import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gradeCapstoneSprint } from '../../services/api';
import { CAPSTONE_GROUPS } from '../../utils/constants';
import CustomSelect from '../../components/CustomSelect';
import { Flag, CheckCircle2, AlertCircle, Award } from 'lucide-react';

export default function GradeCapstoneSprints() {
  const { user } = useAuth();
  const [capstoneGroup, setCapstoneGroup] = useState(CAPSTONE_GROUPS[0]?.id || '');
  const [sprintNumber, setSprintNumber] = useState(1);
  const [presentationScore, setPresentationScore] = useState(''); // 0-20
  const [technicalScore, setTechnicalScore] = useState(''); // 0-20
  const [progressScore, setProgressScore] = useState(''); // 0-10
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const hasAnyScore = presentationScore !== '' || technicalScore !== '' || progressScore !== '';
  const totalSprintScore = Number(presentationScore || 0) + Number(technicalScore || 0) + Number(progressScore || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setError(null);

    setLoading(true);
    try {
      const coachName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.coachID || 'Coach';
      const res = await gradeCapstoneSprint(
        capstoneGroup,
        Number(sprintNumber),
        presentationScore !== '' ? Number(presentationScore) : 0,
        technicalScore !== '' ? Number(technicalScore) : 0,
        progressScore !== '' ? Number(progressScore) : 0,
        feedback,
        coachName
      );

      if (res && res.success) {
        setResult(res);
      } else {
        setError(res?.message || 'Failed to submit capstone sprint grades.');
      }
    } catch (err) {
      setError('Network error saving capstone score.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-neutral">Grade Capstone Sprint</h1>
        <p className="text-sm text-brand-neutral-muted mt-1">
          Capstone projects represent <strong>25%</strong> of the final certification grade. Evaluate bi-weekly sprints.
        </p>
      </div>

      {result && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-brand-success space-y-1">
          <div className="flex items-center gap-2 font-bold text-base">
            <CheckCircle2 className="w-5 h-5 text-brand-primary" />
            <span>Sprint Evaluation Successfully Saved!</span>
          </div>
          <p className="text-xs">{result.message}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-brand-error/20 rounded-xl text-brand-error flex items-start gap-2 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="portal-card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Capstone Group Selection */}
          <div>
            <label className="form-label">Select Capstone Group</label>
            <div className="space-y-2">
              {CAPSTONE_GROUPS.map((grp) => (
                <label
                  key={grp.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    capstoneGroup === grp.id
                      ? 'border-brand-primary bg-brand-primary-light/50 font-semibold'
                      : 'border-brand-neutral-border hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="capstoneGroup"
                    value={grp.id}
                    checked={capstoneGroup === grp.id}
                    onChange={(e) => setCapstoneGroup(e.target.value)}
                    className="text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-sm text-brand-neutral">{grp.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sprint Number */}
          <div>
            <label className="form-label">Sprint Number</label>
            <CustomSelect
              value={sprintNumber}
              onChange={(val) => setSprintNumber(Number(val))}
              options={[1, 2, 3, 4, 5, 6].map((s) => ({
                value: s,
                label: `Sprint ${s} Review`
              }))}
            />
          </div>

          {/* Rubric scores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <label className="form-label">
                Presentation (Max 20)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                placeholder="0-20"
                value={presentationScore}
                onChange={(e) => setPresentationScore(e.target.value === '' ? '' : Math.min(20, Math.max(0, Number(e.target.value))))}
                className="form-input text-center font-bold text-lg py-2"
                required
              />
            </div>

            <div>
              <label className="form-label">
                Technical (Max 20)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                placeholder="0-20"
                value={technicalScore}
                onChange={(e) => setTechnicalScore(e.target.value === '' ? '' : Math.min(20, Math.max(0, Number(e.target.value))))}
                className="form-input text-center font-bold text-lg py-2"
                required
              />
            </div>

            <div>
              <label className="form-label">
                Progress (Max 10)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                placeholder="0-10"
                value={progressScore}
                onChange={(e) => setProgressScore(e.target.value === '' ? '' : Math.min(10, Math.max(0, Number(e.target.value))))}
                className="form-input text-center font-bold text-lg py-2"
                required
              />
            </div>
          </div>

          {/* Total Sprint Score Indicator */}
          <div className="flex items-center justify-between p-3.5 bg-brand-primary-light/60 rounded-xl border border-brand-primary/20">
            <span className="text-xs font-medium text-slate-700">Total Sprint Score:</span>
            <span className="text-lg font-semibold text-brand-primary font-mono">
              {hasAnyScore ? `${totalSprintScore} / 50 points (${(totalSprintScore * 2)}%)` : '— / 50 points'}
            </span>
          </div>

          {/* Feedback */}
          <div>
            <label className="form-label">Instructor Sprint Feedback</label>
            <textarea
              rows={3}
              placeholder="e.g., Outstanding pipeline architecture. Recommend refining the executive dashboard layout before Sprint 3."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="form-input text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 font-bold text-sm shadow-md"
          >
            {loading ? 'Submitting Evaluation...' : 'Save Capstone Sprint Grade'}
          </button>
        </form>
      </div>
    </div>
  );
}
