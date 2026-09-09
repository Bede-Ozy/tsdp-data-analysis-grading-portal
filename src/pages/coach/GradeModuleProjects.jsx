import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllStudents, bulkGradeModuleProjects } from '../../services/api';
import { MODULES } from '../../utils/constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Database, CheckCircle2, AlertCircle, Save, Check } from 'lucide-react';

export default function GradeModuleProjects() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [grades, setGrades] = useState({}); // { [studentID]: { score: 85, feedback: '' } }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [errorResult, setErrorResult] = useState(null);

  const activeModule = MODULES.find(m => m.month === Number(selectedMonth)) || MODULES[0];

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getAllStudents();
        const list = Array.isArray(res) ? res : (res?.data || res?.students || []);
        if (list.length > 0) {
          setStudents(list);
          const initial = {};
          list.forEach(s => {
            initial[s.studentID] = {
              score: s.moduleScore ?? '',
              feedback: ''
            };
          });
          setGrades(initial);
        }
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleScoreChange = (studentID, val) => {
    const num = val === '' ? '' : Math.min(100, Math.max(0, Number(val)));
    setGrades(prev => ({
      ...prev,
      [studentID]: { ...prev[studentID], score: num }
    }));
  };

  const handleFeedbackChange = (studentID, val) => {
    setGrades(prev => ({
      ...prev,
      [studentID]: { ...prev[studentID], feedback: val }
    }));
  };

  const handleBulkSubmit = async () => {
    setErrorResult(null);
    setSuccessResult(null);
    setSubmitting(true);

    try {
      const coachID = user?.coachID || user?.id || '';
      const scoresArray = students.map(s => ({
        studentID: s.studentID,
        studentNumber: s.studentNumber,
        score: grades[s.studentID]?.score !== '' && grades[s.studentID]?.score !== undefined ? Number(grades[s.studentID].score) : 0,
        feedback: grades[s.studentID]?.feedback || ''
      }));

      const res = await bulkGradeModuleProjects(
        Number(selectedMonth),
        activeModule.tool,
        scoresArray,
        coachID
      );

      if (res && res.success) {
        setSuccessResult(res.message || `Successfully recorded Month ${selectedMonth} scores for ${scoresArray.length} residents!`);
      } else {
        setErrorResult(res?.message || 'Failed to submit bulk grades.');
      }
    } catch (err) {
      console.error(err);
      setErrorResult('Network error saving bulk grades.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading resident roster for bulk evaluation..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-neutral">Bulk Grade Module Projects</h1>
          <p className="text-sm text-brand-neutral-muted mt-1">
            Grade all enrolled residents on monthly project deliverables (20% final weight, 0-100 points).
          </p>
        </div>

        <button
          type="button"
          onClick={handleBulkSubmit}
          disabled={submitting}
          className="btn-secondary py-2.5 px-5 font-bold shadow-md self-start sm:self-auto"
        >
          {submitting ? 'Saving All Scores...' : (
            <span className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save All Module {selectedMonth} Grades
            </span>
          )}
        </button>
      </div>

      {/* Month & Tool Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MODULES.map((m) => (
          <button
            key={m.month}
            type="button"
            onClick={() => setSelectedMonth(m.month)}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedMonth === m.month
                ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                : 'bg-white text-brand-neutral border-brand-neutral-border hover:bg-gray-50'
            }`}
          >
            <span className="text-[10px] uppercase font-medium opacity-80 block">Month {m.month}</span>
            <span className="text-sm font-semibold block">{m.tool} Project</span>
          </button>
        ))}
      </div>

      {successResult && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-brand-success flex items-start gap-2.5 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-brand-primary" />
          <span>{successResult}</span>
        </div>
      )}

      {errorResult && (
        <div className="p-4 bg-red-50 border border-brand-error/20 rounded-xl text-brand-error flex items-start gap-2 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorResult}</span>
        </div>
      )}

      {/* Bulk Roster Table */}
      <div className="bg-white rounded-xl border border-brand-neutral-border shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50/70 border-b border-brand-neutral-border flex items-center justify-between">
          <span className="text-xs font-bold text-brand-neutral">
            Evaluating: <span className="text-brand-primary">{activeModule.title}</span> ({students.length} Residents)
          </span>
          <span className="text-xs text-brand-neutral-muted">Scores scale: 0 - 100</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-100/70 border-b border-brand-neutral-border text-xs uppercase text-brand-neutral-muted font-bold">
                <th className="py-3 px-4 w-16">#ID</th>
                <th className="py-3 px-4">Resident Student</th>
                <th className="py-3 px-4 w-32 text-center">Score (0-100)</th>
                <th className="py-3 px-4">Coach Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-brand-neutral-muted text-sm font-medium">
                    No resident students found in database.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const sGrade = grades[student.studentID] || { score: '', feedback: '' };
                  const studentDisplayName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.studentNumber || student.studentID;
                  return (
                    <tr key={student.studentID} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-xs text-brand-primary">
                        {student.studentNumber || student.studentID}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-brand-neutral">
                        {studentDisplayName}
                        {student.classGroup && (
                          <span className="text-xs font-normal text-gray-400 block">{student.classGroup}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="—"
                          value={sGrade.score}
                          onChange={(e) => handleScoreChange(student.studentID, e.target.value)}
                          className="w-20 text-center font-bold text-sm py-1 px-2 rounded-lg border border-brand-neutral-border focus:ring-2 focus:ring-brand-primary focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          placeholder="Feedback on project deliverable..."
                          value={sGrade.feedback}
                          onChange={(e) => handleFeedbackChange(student.studentID, e.target.value)}
                          className="w-full text-xs py-1 px-2.5 rounded-lg border border-brand-neutral-border focus:ring-2 focus:ring-brand-primary focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-gray-50 border-t border-brand-neutral-border flex justify-end">
          <button
            type="button"
            onClick={handleBulkSubmit}
            disabled={submitting}
            className="btn-secondary py-2.5 px-6 font-bold shadow-md"
          >
            {submitting ? 'Submitting...' : 'Save & Update All Scores'}
          </button>
        </div>
      </div>
    </div>
  );
}
