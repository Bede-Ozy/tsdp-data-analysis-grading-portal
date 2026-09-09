import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { recordClassActivity, getAllStudents } from '../../services/api';
import { TOOLS_LIST } from '../../utils/constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomSelect from '../../components/CustomSelect';
import { MessageSquare, CheckCircle2, AlertCircle, PlusCircle } from 'lucide-react';

export default function RecordClassActivity() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [weekNumber, setWeekNumber] = useState(6);
  const [dayNumber, setDayNumber] = useState(1);
  const [classType, setClassType] = useState('Technical');
  const [tool, setTool] = useState('SQL');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityType, setActivityType] = useState('Live Question'); // Live Question | Google Form | Group Exercise
  const [selectedStudent, setSelectedStudent] = useState('');
  const [score, setScore] = useState(5);
  const [maxScore, setMaxScore] = useState(5);
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function loadStudentsList() {
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
    loadStudentsList();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!activityTitle.trim()) {
      setErrorMsg('Please enter an Activity Title.');
      return;
    }

    if (!selectedStudent) {
      setErrorMsg('Please select a student.');
      return;
    }

    setSaving(true);
    try {
      const coachID = user?.coachID || user?.id || '';
      const res = await recordClassActivity(
        Number(weekNumber),
        Number(dayNumber),
        classType,
        tool,
        activityTitle,
        activityType,
        selectedStudent,
        Number(score),
        Number(maxScore),
        notes,
        coachID
      );

      if (res && res.success) {
        setSuccessMsg(res.message);
        setActivityTitle('');
        setNotes('');
      } else {
        setErrorMsg(res?.message || 'Failed to record class activity.');
      }
    } catch (err) {
      setErrorMsg('Network error recording activity.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading resident roster..." />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-neutral">Record Class Activity</h1>
        <p className="text-sm text-brand-neutral-muted mt-1">
          Award points for in-class participation, live answering, Google Form pop quizzes, and group exercises (5% weight).
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-brand-success flex items-start gap-2.5 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-brand-primary" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-brand-error/20 rounded-xl text-brand-error flex items-start gap-2 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="portal-card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
              <label className="form-label">Class Track</label>
              <CustomSelect
                value={classType}
                onChange={(val) => setClassType(val)}
                options={[
                  { value: 'Technical', label: 'Technical Class' },
                  { value: 'Professional', label: 'Professional Development' }
                ]}
              />
            </div>

            <div>
              <label className="form-label">Tool / Focus</label>
              <CustomSelect
                value={tool}
                onChange={(val) => setTool(val)}
                options={[
                  ...TOOLS_LIST.map((t) => ({ value: t, label: t })),
                  { value: 'SoftSkills', label: 'Soft Skills' }
                ]}
              />
            </div>
          </div>

          {/* Activity Type & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Activity Type</label>
              <CustomSelect
                value={activityType}
                onChange={(val) => setActivityType(val)}
                options={[
                  { value: 'Live Question', label: 'Live Question / Verbal Answer' },
                  { value: 'Google Form', label: 'Google Form Pop Quiz' },
                  { value: 'Group Exercise', label: 'Class Group Exercise' }
                ]}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="form-label">
                Activity Title <span className="text-brand-error">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Live Query Demonstration: Self-JOIN syntax"
                value={activityTitle}
                onChange={(e) => setActivityTitle(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Student selection & Score */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">
                Select Resident Student <span className="text-brand-error">*</span>
              </label>
              <CustomSelect
                value={selectedStudent}
                onChange={(val) => setSelectedStudent(val)}
                placeholder="Choose resident student..."
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
              <label className="form-label">
                Points Awarded (Max {maxScore})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={maxScore}
                  step="0.5"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="form-input text-center font-bold text-base"
                />
                <span className="text-sm font-bold text-gray-400">/ {maxScore}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="form-label">Coach Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g., Quick and accurate response explaining indexing tradeoffs."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full btn-primary py-3 font-bold text-sm shadow-md"
          >
            {saving ? 'Recording Activity...' : 'Save Activity Score to Gradebook'}
          </button>
        </form>
      </div>
    </div>
  );
}
