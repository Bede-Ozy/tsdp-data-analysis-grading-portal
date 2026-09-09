import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { gradeGroupPresentation, recordIndividualPresentation, getAllStudents } from '../../services/api';
import { PRESENTATION_RUBRICS } from '../../utils/constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomSelect from '../../components/CustomSelect';
import { Users, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react';

export default function GradeGroupPresentations() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Group Details State
  const [weekNumber, setWeekNumber] = useState(1);
  const [dayNumber, setDayNumber] = useState(1);
  const [group, setGroup] = useState('Group 1');
  const [topic, setTopic] = useState('');
  const [readiness, setReadiness] = useState('');
  const [slideQuality, setSlideQuality] = useState('');
  const [presentationQuality, setPresentationQuality] = useState('');
  const [answersScore, setAnswersScore] = useState('');
  const [feedback, setFeedback] = useState('');

  // Individual Q&A Responses
  const [individualRecords, setIndividualRecords] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getAllStudents();
        const list = Array.isArray(res) ? res : (res?.data || res?.students || []);
        if (list.length > 0) {
          setStudents(list);
        }
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const addIndividualRow = () => {
    setIndividualRecords(prev => [
      ...prev,
      {
        studentID: students[0]?.studentID || '',
        questionAsked: '',
        responseScore: 4,
        comments: ''
      }
    ]);
  };

  const removeIndividualRow = (idx) => {
    setIndividualRecords(prev => prev.filter((_, i) => i !== idx));
  };

  const updateIndividualRow = (idx, field, val) => {
    setIndividualRecords(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!topic.trim()) {
      setError('Please provide the presentation topic.');
      return;
    }

    setSubmitting(true);
    try {
      const coachID = user?.coachID || user?.id || '';

      // 1. Grade group presentation
      const groupRes = await gradeGroupPresentation(
        Number(weekNumber),
        Number(dayNumber),
        group,
        topic,
        readiness !== '' ? Number(readiness) : 0,
        slideQuality !== '' ? Number(slideQuality) : 0,
        presentationQuality !== '' ? Number(presentationQuality) : 0,
        answersScore !== '' ? Number(answersScore) : 0,
        feedback,
        coachID
      );

      // 2. Record individual responses if any
      if (individualRecords.length > 0) {
        for (const ind of individualRecords) {
          if (ind.studentID) {
            await recordIndividualPresentation(
              groupRes.presentationID || `PRES-${Date.now()}`,
              ind.studentID,
              ind.questionAsked,
              Number(ind.responseScore),
              ind.comments,
              coachID
            );
          }
        }
      }

      setResult({
        success: true,
        message: `Successfully graded ${group} on "${topic}". Rubric Average: ${groupRes.averageScore || groupRubricAverage}/5. Saved ${individualRecords.length} individual Q&A scores.`
      });
      setTopic('');
      setFeedback('');
      setIndividualRecords([]);
    } catch (err) {
      console.error(err);
      setError('Error saving presentation grades.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading presentation grading console..." />;
  }

  const validRubricScores = [readiness, slideQuality, presentationQuality, answersScore].filter(s => s !== '' && !isNaN(Number(s)));
  const groupRubricAverage = validRubricScores.length > 0
    ? (validRubricScores.reduce((a, b) => a + Number(b), 0) / validRubricScores.length).toFixed(1)
    : '—';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-neutral">Grade Group Presentations</h1>
        <p className="text-sm text-brand-neutral-muted mt-1">
          Daily and weekly cohort presentations carry <strong>10%</strong> of the total grade. Score both collective group delivery and individual responses.
        </p>
      </div>

      {result && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-brand-success flex items-start gap-2.5 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-brand-primary" />
          <span>{result.message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-brand-error/20 rounded-xl text-brand-error flex items-start gap-2 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Group Rubric */}
        <div className="portal-card space-y-5">
          <h2 className="text-base font-bold text-brand-neutral border-b border-brand-neutral-border pb-3 flex items-center justify-between">
            <span>Group Presentation Evaluation</span>
            <span className="badge-primary font-mono text-xs">Average: {groupRubricAverage} / 5.0</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Week</label>
              <CustomSelect
                value={weekNumber}
                onChange={(val) => setWeekNumber(Number(val))}
                options={Array.from({ length: 16 }, (_, i) => ({ value: i + 1, label: `Week ${i + 1}` }))}
              />
            </div>

            <div>
              <label className="form-label">Day</label>
              <CustomSelect
                value={dayNumber}
                onChange={(val) => setDayNumber(Number(val))}
                options={[1, 2, 3, 4, 5].map((d) => ({ value: d, label: `Day ${d}` }))}
              />
            </div>

            <div>
              <label className="form-label">Class Group</label>
              <CustomSelect
                value={group}
                onChange={(val) => setGroup(val)}
                options={['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5'].map((g) => ({ value: g, label: g }))}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Presentation Topic / Project <span className="text-brand-error">*</span></label>
            <input
              type="text"
              placeholder="e.g. Exploratory Data Analysis & Customer Segmentation Insights"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* 4 Rubric Sliders / Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <label className="form-label">
                Readiness & Coordination (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.5"
                placeholder="1-5"
                value={readiness}
                onChange={(e) => setReadiness(e.target.value === '' ? '' : Math.min(5, Math.max(1, Number(e.target.value))))}
                className="form-input font-bold"
              />
            </div>

            <div>
              <label className="form-label">
                Slide Quality & Visuals (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.5"
                placeholder="1-5"
                value={slideQuality}
                onChange={(e) => setSlideQuality(e.target.value === '' ? '' : Math.min(5, Math.max(1, Number(e.target.value))))}
                className="form-input font-bold"
              />
            </div>

            <div>
              <label className="form-label">
                Presentation Quality & Delivery (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.5"
                placeholder="1-5"
                value={presentationQuality}
                onChange={(e) => setPresentationQuality(e.target.value === '' ? '' : Math.min(5, Math.max(1, Number(e.target.value))))}
                className="form-input font-bold"
              />
            </div>

            <div>
              <label className="form-label">
                Answering Questions & Defense (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.5"
                placeholder="1-5"
                value={answersScore}
                onChange={(e) => setAnswersScore(e.target.value === '' ? '' : Math.min(5, Math.max(1, Number(e.target.value))))}
                className="form-input font-bold"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Group Feedback</label>
            <textarea
              rows={2}
              placeholder="e.g. Excellent slide visuals and clear transition between presenters."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="form-input text-xs"
            />
          </div>
        </div>

        {/* Section 2: Individual Student Q&A Responses */}
        <div className="portal-card space-y-4">
          <div className="flex items-center justify-between border-b border-brand-neutral-border pb-3">
            <div>
              <h3 className="text-base font-bold text-brand-neutral">Individual Q&A Scoring (Optional)</h3>
              <p className="text-xs text-brand-neutral-muted">Record specific questions and scores for individual resident defense</p>
            </div>
            <button
              type="button"
              onClick={addIndividualRow}
              className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Student Response
            </button>
          </div>

          {individualRecords.length === 0 ? (
            <p className="text-xs text-brand-neutral-muted italic text-center py-4">
              No individual student questions logged. Click "Add Student Response" to record individual defense scores.
            </p>
          ) : (
            <div className="space-y-3">
              {individualRecords.map((ind, idx) => (
                <div key={idx} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-neutral">Student #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeIndividualRow(idx)}
                      className="text-gray-400 hover:text-brand-error"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="form-label">Resident Student</label>
                      <CustomSelect
                        value={ind.studentID}
                        onChange={(val) => updateIndividualRow(idx, 'studentID', val)}
                        placeholder="Choose resident student..."
                        searchable={true}
                        emptyMessage="No resident students available"
                        options={students.map((s) => ({
                          value: s.studentID,
                          label: `${s.studentNumber || s.studentID} - ${s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim()}`,
                          sublabel: s.classGroup || null
                        }))}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-brand-neutral mb-1">Response Score (1-5)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        step="0.5"
                        value={ind.responseScore}
                        onChange={(e) => updateIndividualRow(idx, 'responseScore', Math.min(5, Math.max(1, Number(e.target.value))))}
                        className="form-input text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Question asked to student..."
                      value={ind.questionAsked}
                      onChange={(e) => updateIndividualRow(idx, 'questionAsked', e.target.value)}
                      className="form-input text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Coach comments on response..."
                      value={ind.comments}
                      onChange={(e) => updateIndividualRow(idx, 'comments', e.target.value)}
                      className="form-input text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full btn-secondary py-3 font-bold text-sm shadow-md"
        >
          {submitting ? 'Saving All Presentation Scores...' : 'Submit Complete Presentation Evaluation'}
        </button>
      </form>
    </div>
  );
}
