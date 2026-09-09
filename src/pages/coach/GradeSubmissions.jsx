import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPendingSubmissions, gradeTechnicalSubmission, gradeProfessionalSubmission } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CheckSquare, FileText, CheckCircle2, AlertCircle, ExternalLink, Download } from 'lucide-react';

export default function GradeSubmissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [grades, setGrades] = useState({}); // { [submissionID]: { score: 8, feedback: '' } }
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function loadSubs() {
      try {
        const res = await getPendingSubmissions();
        if (res && res.success) {
          setSubmissions(res.data);
          // Initialize grades form state
          const initial = {};
          res.data.forEach(s => {
            initial[s.submissionID] = {
              score: s.score !== null ? s.score : '',
              feedback: s.feedback || ''
            };
          });
          setGrades(initial);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSubs();
  }, []);

  const handleScoreChange = (subId, val) => {
    const num = Math.min(10, Math.max(0, Number(val)));
    setGrades(prev => ({
      ...prev,
      [subId]: { ...prev[subId], score: val === '' ? '' : num }
    }));
  };

  const handleFeedbackChange = (subId, val) => {
    setGrades(prev => ({
      ...prev,
      [subId]: { ...prev[subId], feedback: val }
    }));
  };

  const handleGradeSubmit = async (sub) => {
    setMessage(null);
    const gradeData = grades[sub.submissionID] || {};
    if (gradeData.score === '' || gradeData.score === undefined) {
      alert('Please enter a score between 0 and 10.');
      return;
    }

    setSavingId(sub.submissionID);
    try {
      const coachID = user?.coachID || user?.id || '';
      let res;
      if (sub.type === 'Technical') {
        res = await gradeTechnicalSubmission(sub.submissionID, Number(gradeData.score), gradeData.feedback, coachID);
      } else {
        res = await gradeProfessionalSubmission(sub.submissionID, Number(gradeData.score), gradeData.feedback, coachID);
      }

      if (res && res.success) {
        setMessage({ type: 'success', text: `Graded "${sub.assignmentTitle}" for ${sub.studentName}: ${gradeData.score}/10` });
        // Update local status
        setSubmissions(prev => prev.map(item =>
          item.submissionID === sub.submissionID
            ? { ...item, status: 'Graded', score: Number(gradeData.score), feedback: gradeData.feedback }
            : item
        ));
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to record grade.' });
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading student assignment submissions..." />;
  }

  const filtered = submissions.filter(s => {
    if (filterType === 'All') return true;
    return s.type === filterType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-neutral">Grade Submissions</h1>
          <p className="text-sm text-brand-neutral-muted mt-1">
            Review assignment files saved to Google Drive and submit scores (0-10) with qualitative feedback.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          {['All', 'Technical', 'Professional'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                filterType === type
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'bg-white text-brand-neutral border-gray-200 hover:bg-gray-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-blue-50 text-brand-success border border-blue-200'
              : 'bg-red-50 text-brand-error border border-brand-error/20'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-brand-primary" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Submissions List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="portal-card text-center py-12 text-brand-neutral-muted">
            <CheckSquare className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="font-semibold text-sm">No submissions matching current filter.</p>
          </div>
        ) : (
          filtered.map((sub) => {
            const currentGrade = grades[sub.submissionID] || {};
            const isGraded = sub.status === 'Graded';

            return (
              <div
                key={sub.submissionID}
                className={`portal-card border-l-4 transition-all ${
                  isGraded ? 'border-l-brand-success' : 'border-l-brand-secondary'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Info & File */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sub.type === 'Technical' ? 'badge-primary' : 'badge-secondary'
                      }`}>
                        {sub.type}
                      </span>
                      <span className="text-xs font-bold text-brand-neutral">
                        {sub.studentName} (Resident #{sub.studentNumber})
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-brand-neutral-muted">
                        Week {sub.weekNumber}, Day {sub.dayNumber} ({sub.tool})
                      </span>
                      {isGraded && (
                        <span className="badge-success text-[10px] ml-auto">
                          Score: {sub.score}/10
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-brand-neutral">{sub.assignmentTitle}</h3>

                    {/* Attached file row */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-brand-neutral-border text-xs">
                      <FileText className="w-3.5 h-3.5 text-brand-primary" />
                      <span className="font-mono font-medium text-brand-neutral truncate max-w-xs">
                        {sub.fileName}
                      </span>
                      <a
                        href={`#download-${sub.submissionID}`}
                        onClick={(e) => {
                          e.preventDefault();
                          alert(`Viewing/Downloading Drive file: ${sub.fileName}`);
                        }}
                        className="text-brand-primary hover:underline font-semibold ml-2 flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> View File
                      </a>
                    </div>
                  </div>

                  {/* Right: Score Form */}
                  <div className="w-full lg:w-80 bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-3">
                    <div>
                      <label className="form-label">
                        Score (0 to 10 points)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        placeholder="e.g. 8.5"
                        value={currentGrade.score ?? ''}
                        onChange={(e) => handleScoreChange(sub.submissionID, e.target.value)}
                        className="form-input text-center font-bold text-base py-1.5"
                      />
                    </div>

                    <div>
                      <label className="form-label">
                        Feedback / Recommendations
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g., Clean formula syntax and properly documented methodology."
                        value={currentGrade.feedback ?? ''}
                        onChange={(e) => handleFeedbackChange(sub.submissionID, e.target.value)}
                        className="form-input text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={savingId === sub.submissionID}
                      onClick={() => handleGradeSubmit(sub)}
                      className="w-full btn-primary py-2 text-xs font-bold"
                    >
                      {savingId === sub.submissionID ? 'Saving...' : isGraded ? 'Update Grade' : 'Submit Grade'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
