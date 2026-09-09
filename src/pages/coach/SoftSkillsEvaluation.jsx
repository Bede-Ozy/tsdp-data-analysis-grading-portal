import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { recordSoftSkillsEvaluation, getAllStudents } from '../../services/api';
import { SOFT_SKILLS_CRITERIA } from '../../utils/constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomSelect from '../../components/CustomSelect';
import { Smile, CheckCircle2, AlertCircle, Award } from 'lucide-react';

export default function SoftSkillsEvaluation() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState('');
  const [weekNumber, setWeekNumber] = useState(1);
  const [scores, setScores] = useState({
    communication: '',
    teamwork: '',
    leadership: '',
    professionalism: '',
    problemSolving: '',
    emotionalIntelligence: '',
  });
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStudents() {
      try {
        const res = await getAllStudents();
        const list = Array.isArray(res) ? res : (res?.data || res?.students || []);
        if (list.length > 0) {
          setStudents(list);
          setSelectedStudent(list[0].studentID);
        }
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, []);

  const handleScoreChange = (key, val) => {
    const num = val === '' ? '' : Math.min(5, Math.max(1, Number(val)));
    setScores(prev => ({ ...prev, [key]: num }));
  };

  const validScores = Object.values(scores).filter(v => v !== '' && !isNaN(Number(v)));
  const totalPoints = validScores.reduce((a, b) => a + Number(b), 0);
  const percentage = validScores.length > 0 ? ((totalPoints / 30) * 100).toFixed(0) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!selectedStudent) {
      setError('Please select a student.');
      return;
    }

    setSaving(true);
    try {
      const coachID = user?.coachID || user?.id || '';
      const res = await recordSoftSkillsEvaluation(
        selectedStudent,
        Number(weekNumber),
        scores.communication !== '' ? Number(scores.communication) : 0,
        scores.teamwork !== '' ? Number(scores.teamwork) : 0,
        scores.leadership !== '' ? Number(scores.leadership) : 0,
        scores.professionalism !== '' ? Number(scores.professionalism) : 0,
        scores.problemSolving !== '' ? Number(scores.problemSolving) : 0,
        scores.emotionalIntelligence !== '' ? Number(scores.emotionalIntelligence) : 0,
        comments,
        coachID
      );

      if (res && res.success) {
        setResult(res);
        setComments('');
      } else {
        setError(res?.message || 'Failed to save soft skills evaluation.');
      }
    } catch (err) {
      setError('Connection error saving soft skills evaluation.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading resident roster..." />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-neutral">Soft Skills & Behavioral Evaluation</h1>
        <p className="text-sm text-brand-neutral-muted mt-1">
          Soft skills assessment contributes <strong>10%</strong> to each resident's final program grade.
        </p>
      </div>

      {result && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-brand-success space-y-1">
          <div className="flex items-center gap-2 font-bold text-base">
            <CheckCircle2 className="w-5 h-5 text-brand-primary" />
            <span>Soft Skills Evaluation Successfully Recorded!</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Select Resident Student</label>
              <CustomSelect
                value={selectedStudent}
                onChange={(val) => setSelectedStudent(val)}
                placeholder="Select resident student..."
                searchable={true}
                emptyMessage="No resident students found in database"
                options={students.map((s) => ({
                  value: s.studentID,
                  label: `${s.studentNumber || s.studentID} - ${s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim()}`,
                  sublabel: s.classGroup || null
                }))}
              />
            </div>

            <div>
              <label className="form-label">Evaluation Week</label>
              <CustomSelect
                value={weekNumber}
                onChange={(val) => setWeekNumber(Number(val))}
                options={Array.from({ length: 16 }, (_, i) => ({ value: i + 1, label: `Week ${i + 1}` }))}
              />
            </div>
          </div>

          {/* 6 Criteria Scoring Grid */}
          <div className="space-y-3 pt-2">
            <label className="form-label">Evaluation Rubrics (1 to 5 Points Each)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SOFT_SKILLS_CRITERIA.map((crit) => (
                <div key={crit.key} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand-neutral max-w-[170px]">
                    {crit.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.5"
                      placeholder="—"
                      value={scores[crit.key] ?? ''}
                      onChange={(e) => handleScoreChange(crit.key, e.target.value)}
                      className="w-14 text-center font-bold text-sm py-1 border border-brand-neutral-border rounded-lg"
                    />
                    <span className="text-xs text-gray-400">/ 5</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Score Bar */}
          <div className="flex items-center justify-between p-3.5 bg-brand-primary-light/60 rounded-xl border border-brand-primary/20">
            <span className="text-xs font-medium text-slate-700">Total Aggregate Score:</span>
            <span className="text-lg font-semibold text-brand-primary font-mono">
              {percentage !== null ? `${totalPoints} / 30 points (${percentage}%)` : '— / 30 points'}
            </span>
          </div>

          {/* Comments */}
          <div>
            <label className="form-label">Qualitative Comments & Behavioral Notes</label>
            <textarea
              rows={3}
              placeholder="e.g., Active team player, receptive to critical code feedback, demonstrates great initiative during group assignments."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="form-input text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full btn-secondary py-3 font-bold text-sm shadow-md"
          >
            {saving ? 'Saving Evaluation...' : 'Save Soft Skills Evaluation'}
          </button>
        </form>
      </div>
    </div>
  );
}
