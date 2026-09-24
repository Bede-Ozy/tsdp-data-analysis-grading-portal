import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gradeCapstoneSprint, getAllCapstoneGroups } from '../../services/api';
import CustomSelect from '../../components/CustomSelect';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function GradeCapstoneSprints() {
  const { user } = useAuth();
  const [capstoneGroups, setCapstoneGroups] = useState([]);
  const [selectedGroupID, setSelectedGroupID] = useState('');
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [sprintNumber, setSprintNumber] = useState(1);
  const [presentationScore, setPresentationScore] = useState(''); // 0-20
  const [technicalScore, setTechnicalScore] = useState(''); // 0-20
  const [progressScore, setProgressScore] = useState(''); // 0-10
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const loadCapstoneGroups = useCallback(async () => {
    setLoadingGroups(true);
    setError(null);
    try {
      const res = await getAllCapstoneGroups();
      let list = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (res && res.success !== false) {
        list = Array.isArray(res.data)
          ? res.data
          : (Array.isArray(res.capstoneGroups) ? res.capstoneGroups : (Array.isArray(res.groups) ? res.groups : []));
      }

      const parsed = list.map((g, idx) => {
        const id = g.capstoneGroupID || g.groupID || g.id || `CAP-${idx + 1}`;
        const name = g.capstoneGroupName || g.groupName || g.name || g.title || `Capstone Group ${idx + 1}`;
        const membersFrom = Array.isArray(g.classGroups)
          ? g.classGroups.join(' + ')
          : (g.membersFrom || g.classGroups || '');
        return {
          id: String(id).trim(),
          name: String(name).trim(),
          subteams: membersFrom,
          projectTitle: g.projectTitle || g.title || ''
        };
      });

      setCapstoneGroups(parsed);
      if (parsed.length > 0) {
        setSelectedGroupID((prev) => (prev && parsed.some((p) => p.id === prev) ? prev : parsed[0].id));
      }
    } catch (err) {
      console.error('Error fetching capstone groups:', err);
      setError('Failed to load capstone groups from backend. Please refresh.');
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  useEffect(() => {
    loadCapstoneGroups();
  }, [loadCapstoneGroups]);

  const selectedGroup = capstoneGroups.find((g) => g.id === selectedGroupID);

  const hasAnyScore = presentationScore !== '' || technicalScore !== '' || progressScore !== '';
  const totalSprintScore = Number(presentationScore || 0) + Number(technicalScore || 0) + Number(progressScore || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setError(null);

    if (!selectedGroupID) {
      setError('Please select a capstone group.');
      return;
    }

    setLoading(true);
    try {
      const coachName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.coachID || 'Coach';
      const res = await gradeCapstoneSprint(
        selectedGroupID,
        Number(sprintNumber),
        presentationScore !== '' ? Number(presentationScore) : 0,
        technicalScore !== '' ? Number(technicalScore) : 0,
        progressScore !== '' ? Number(progressScore) : 0,
        feedback,
        coachName
      );

      if (res && res.success !== false) {
        setResult(res);
        setPresentationScore('');
        setTechnicalScore('');
        setProgressScore('');
        setFeedback('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(res?.message || 'Failed to submit capstone sprint grades.');
      }
    } catch (err) {
      setError('Network error saving capstone score. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-neutral">Grade Capstone Sprint</h1>
          <p className="text-sm text-brand-neutral-muted mt-1">
            Capstone projects represent <strong>25%</strong> of the final certification grade. Evaluate bi-weekly sprints.
          </p>
        </div>
      </div>

      {result && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
          <div className="flex items-center gap-2 font-bold text-base text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Sprint Evaluation Successfully Saved!</span>
          </div>
          <p className="text-xs text-emerald-700">{result.message || 'Capstone sprint grade recorded.'}</p>
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="form-label mb-0">Capstone Group</label>
              <button
                type="button"
                onClick={loadCapstoneGroups}
                disabled={loadingGroups}
                className="text-[11px] text-brand-primary hover:text-brand-primary-dark font-medium flex items-center gap-1"
                title="Refresh capstone groups from server"
              >
                <RefreshCw className={`w-3 h-3 ${loadingGroups ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingGroups ? (
              <div className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 animate-pulse flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                <span>Loading capstone groups...</span>
              </div>
            ) : capstoneGroups.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                <span>No capstone groups found in backend.</span>
                <button
                  type="button"
                  onClick={loadCapstoneGroups}
                  className="btn-secondary py-1 px-2.5 text-[11px]"
                >
                  Retry
                </button>
              </div>
            ) : (
              <CustomSelect
                value={selectedGroupID}
                onChange={(val) => setSelectedGroupID(val)}
                options={capstoneGroups.map((grp) => ({
                  value: grp.id,
                  label: grp.name
                }))}
                placeholder="Select Capstone Group..."
              />
            )}

            {/* Selected Capstone Group Details Card */}
            {selectedGroup && (
              <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-800">{selectedGroup.name}</span>
                  {selectedGroup.subteams && (
                    <p className="text-slate-500">
                      Cohort Teams: <span className="font-medium text-slate-700">{selectedGroup.subteams}</span>
                    </p>
                  )}
                  {selectedGroup.projectTitle && (
                    <p className="text-slate-500 truncate max-w-sm">
                      Project: <span className="font-medium text-slate-700">{selectedGroup.projectTitle}</span>
                    </p>
                  )}
                </div>
                <span className="font-mono text-[11px] text-brand-primary bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs flex-shrink-0 ml-2">
                  {selectedGroup.id}
                </span>
              </div>
            )}
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
            disabled={loading || loadingGroups || capstoneGroups.length === 0}
            className="w-full btn-primary py-3 font-bold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting Evaluation...' : 'Save Capstone Sprint Grade'}
          </button>
        </form>
      </div>
    </div>
  );
}
