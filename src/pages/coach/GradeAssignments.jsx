import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getPendingSubmissions,
  gradeTechnicalSubmission,
  gradeProfessionalSubmission,
  getAllStudents
} from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomSelect from '../../components/CustomSelect';
import { TOOLS_LIST } from '../../utils/constants';
import {
  CheckSquare,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  User,
  Calendar,
  Sparkles
} from 'lucide-react';

export default function GradeAssignments() {
  const { user } = useAuth();
  const coachID = user?.coachID || user?.id || user?.email || 'COACH-01';

  // Submissions State
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'queue'
  const [filterType, setFilterType] = useState('All'); // 'All' | 'Technical' | 'Professional'
  const [rosterFilter, setRosterFilter] = useState('All'); // 'All' | 'Submitted' | 'Ungraded'
  const [search, setSearch] = useState('');
  const [grades, setGrades] = useState({}); // { [submissionID]: { score: 8.5, feedback: '' } }
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [selectedSubmissionModal, setSelectedSubmissionModal] = useState(null);

  // Student Roster State
  const [students, setStudents] = useState([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [subsRes, studentsRes] = await Promise.all([
          getPendingSubmissions().catch(() => ({ success: false, data: [] })),
          getAllStudents().catch(() => ({ success: false, data: [] }))
        ]);

        if (subsRes && subsRes.success !== false) {
          const list = Array.isArray(subsRes) ? subsRes : (subsRes.data || []);
          setSubmissions(list);

          const initial = {};
          list.forEach(s => {
            initial[s.submissionID] = {
              score: s.score !== null && s.score !== undefined ? s.score : '',
              feedback: s.feedback || ''
            };
          });
          setGrades(initial);
        }

        if (studentsRes && studentsRes.success !== false) {
          const stdList = Array.isArray(studentsRes) ? studentsRes : (studentsRes.data || studentsRes.students || []);
          setStudents(stdList);
        }
      } catch (err) {
        console.error('Error loading submissions data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleScoreChange = (subId, val) => {
    const num = val === '' ? '' : Math.min(10, Math.max(0, Number(val)));
    setGrades(prev => ({
      ...prev,
      [subId]: { ...prev[subId], score: num }
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
      const category = sub.category || sub.type || 'Technical';
      let res;
      if (category.toLowerCase() === 'technical') {
        res = await gradeTechnicalSubmission(sub.submissionID, Number(gradeData.score), gradeData.feedback, coachID);
      } else {
        res = await gradeProfessionalSubmission(sub.submissionID, Number(gradeData.score), gradeData.feedback, coachID);
      }

      if (res && res.success !== false) {
        setMessage({
          type: 'success',
          text: `Graded "${sub.title || sub.assignmentTitle}" for ${sub.studentName || sub.studentID}: ${gradeData.score}/10 pts`
        });
        setSubmissions(prev => prev.map(item =>
          item.submissionID === sub.submissionID
            ? { ...item, status: 'Graded', score: Number(gradeData.score), feedback: gradeData.feedback }
            : item
        ));
      } else {
        setMessage({ type: 'error', text: res?.message || 'Failed to record grade.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to record grade. Check connection.' });
    } finally {
      setSavingId(null);
    }
  };



  if (loading) {
    return <LoadingSpinner size="lg" text="Loading assignment submissions & resident roster..." />;
  }

  // Helper to find all submissions for a student (filtered by category if selected)
  const getStudentAssignmentSubmissions = (student) => {
    if (!student || !student.studentID) return [];
    const targetId = String(student.studentID).trim().toLowerCase();
    return submissions.filter(s =>
      s && s.studentID &&
      String(s.studentID).trim().toLowerCase() === targetId &&
      (filterType === 'All' || (s.category || s.type || 'Technical').toLowerCase() === filterType.toLowerCase())
    );
  };

  // Filter roster for the table view
  const filteredRosterStudents = students.filter(student => {
    const studentSubs = getStudentAssignmentSubmissions(student);
    const sub = studentSubs[0];
    const hasSubmitted = Boolean(sub);
    const hasScore = sub && grades[sub.submissionID]?.score !== '' && grades[sub.submissionID]?.score !== undefined;

    const q = search.toLowerCase();
    const name = (student.name || `${student.firstName || ''} ${student.lastName || ''}`).toLowerCase();
    const id = (student.studentID || '').toLowerCase();
    const matchesSearch = !search || name.includes(q) || id.includes(q);

    if (!matchesSearch) return false;
    if (rosterFilter === 'Submitted') return hasSubmitted;
    if (rosterFilter === 'Ungraded') return hasSubmitted && !hasScore;
    return true;
  });

  const filteredSubmissions = submissions.filter(s => {
    const cat = (s.category || s.type || 'Technical').toLowerCase();
    const matchesType = filterType === 'All' || cat === filterType.toLowerCase();

    const title = (s.title || s.assignmentTitle || '').toLowerCase();
    const name = (s.studentName || s.studentID || '').toLowerCase();
    const id = (s.submissionID || '').toLowerCase();
    const matchesSearch = title.includes(search.toLowerCase()) || name.includes(search.toLowerCase()) || id.includes(search.toLowerCase());

    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-brand-neutral">Grade Assignments</h1>
            <span className="badge-primary text-xs">Instructor Evaluation</span>
          </div>
          <p className="text-sm text-brand-neutral-muted mt-1">
            Review assignment files saved to Google Drive, verify student solutions, or record direct scores.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'roster'
                ? 'bg-white text-brand-primary shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student Roster ({students.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'queue'
                ? 'bg-white text-brand-primary shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Submissions Queue ({submissions.length})
          </button>

        </div>
      </div>

      {/* Global Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between gap-2 shadow-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-brand-error border border-brand-error/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: STUDENT ROSTER TABLE */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="portal-card p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search resident name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-xs py-1.5 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-primary w-full"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium">Category:</span>
                {['All', 'Technical', 'Professional'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                      filterType === type
                        ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium">Show:</span>
                {['All', 'Submitted', 'Ungraded'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setRosterFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                      rosterFilter === f
                        ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="portal-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200/80 text-[11px] uppercase text-slate-400 font-semibold">
                    <th className="py-3 px-4 w-28">Resident ID</th>
                    <th className="py-3 px-4 min-w-[160px]">Student Name</th>
                    <th className="py-3 px-4 min-w-[220px]">Assignment Deliverable & Drive File</th>
                    <th className="py-3 px-4 w-28 text-center">Score (0-10)</th>
                    <th className="py-3 px-4 min-w-[180px]">Coach Feedback</th>
                    <th className="py-3 px-4 w-24 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRosterStudents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400 text-xs font-medium">
                        No residents match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRosterStudents.map((student) => {
                      const studentSubs = getStudentAssignmentSubmissions(student);
                      const submission = studentSubs[0];
                      const hasSubmitted = Boolean(submission);
                      const studentDisplayName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.studentID;
                      const sGrade = submission ? (grades[submission.submissionID] || { score: '', feedback: '' }) : { score: '', feedback: '' };

                      return (
                        <tr key={student.studentID} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-xs text-brand-primary">
                            {student.studentID}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            <div>{studentDisplayName}</div>
                            {student.classGroup && (
                              <span className="text-[11px] font-normal text-slate-400 block">{student.classGroup}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {hasSubmitted ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Submitted ({studentSubs.length} {studentSubs.length === 1 ? 'file' : 'files'})</span>
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                    (submission.category || submission.type || 'Technical') === 'Technical'
                                      ? 'bg-blue-50 text-brand-primary border-blue-200'
                                      : 'bg-purple-50 text-purple-700 border-purple-200'
                                  }`}>
                                    {submission.category || submission.type || 'Technical'}
                                  </span>
                                </div>
                                <p className="font-medium text-slate-800 text-xs line-clamp-1">
                                  {submission.title || submission.assignmentTitle || 'Assignment Solution'}
                                </p>
                                <div className="pt-0.5 flex items-center gap-2">
                                  {submission.fileURL ? (
                                    <a
                                      href={submission.fileURL}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-brand-primary border border-blue-200 hover:bg-blue-100 font-semibold text-xs transition-colors"
                                      title="Open submitted file in Google Drive"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      <span>View Submission</span>
                                    </a>
                                  ) : (
                                    <span className="text-xs text-slate-400 italic">Direct Entry</span>
                                  )}
                                  {studentSubs.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedSubmissionModal({ student, submissions: studentSubs })}
                                      className="text-xs text-brand-primary hover:underline font-medium"
                                    >
                                      +{studentSubs.length - 1} more
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                  No submission yet
                                </span>
                                <p className="text-[11px] text-slate-400">Grading disabled until submitted.</p>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              placeholder="—"
                              disabled={!hasSubmitted}
                              value={sGrade.score}
                              onChange={(e) => handleScoreChange(submission.submissionID, e.target.value)}
                              className={`w-20 text-center font-bold text-sm py-1 px-2 rounded-lg border transition-all ${
                                hasSubmitted
                                  ? 'border-slate-300 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary focus:outline-none bg-white text-slate-900'
                                  : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                              }`}
                              title={!hasSubmitted ? 'Grading disabled: No submission yet' : 'Enter score (0-10)'}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder={hasSubmitted ? "Feedback on formulas, queries, analysis..." : "Awaiting resident submission..."}
                              disabled={!hasSubmitted}
                              value={sGrade.feedback}
                              onChange={(e) => handleFeedbackChange(submission.submissionID, e.target.value)}
                              className={`w-full text-xs py-1 px-2.5 rounded-lg border transition-all ${
                                hasSubmitted
                                  ? 'border-slate-300 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary focus:outline-none bg-white text-slate-900'
                                  : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                              }`}
                            />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              disabled={!hasSubmitted || savingId === submission?.submissionID}
                              onClick={() => handleGradeSubmit(submission)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                                hasSubmitted
                                  ? 'bg-brand-primary text-white hover:bg-brand-primary-dark cursor-pointer'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                              }`}
                            >
                              {savingId === submission?.submissionID ? 'Saving...' : 'Save Grade'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBMISSIONS QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="portal-card p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student, task title, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-xs py-1.5 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-primary w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Category:</span>
              {['All', 'Technical', 'Professional'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                    filterType === type
                      ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Submissions List */}
          {filteredSubmissions.length === 0 ? (
            <div className="portal-card text-center py-12 text-brand-neutral-muted space-y-2">
              <CheckSquare className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-semibold text-sm text-slate-700">No pending assignment submissions found.</p>
              <p className="text-xs text-slate-400">All submitted syllabus deliverables have been graded or match no filter.</p>
            </div>
          ) : (
            filteredSubmissions.map((sub) => {
              const currentGrade = grades[sub.submissionID] || {};
              const isGraded = sub.status === 'Graded';
              const category = sub.category || sub.type || 'Technical';
              const fileLink = sub.fileURL || sub.driveUrl || sub.downloadUrl;

              return (
                <div
                  key={sub.submissionID}
                  className={`portal-card border-l-4 transition-all ${
                    isGraded ? 'border-l-emerald-500' : 'border-l-brand-secondary'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                    {/* Left: Metadata & File Preview Link */}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          category === 'Technical'
                            ? 'bg-blue-50 text-brand-primary border-blue-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {category}
                        </span>

                        <span className="text-xs font-bold text-slate-900">
                          {(() => {
                            const matchedStudent = students.find(st =>
                              st && st.studentID && sub && sub.studentID &&
                              String(st.studentID).trim().toLowerCase() === String(sub.studentID).trim().toLowerCase()
                            );
                            return matchedStudent ? (matchedStudent.name || `${matchedStudent.firstName || ''} ${matchedStudent.lastName || ''}`.trim() || matchedStudent.studentID) : (sub.studentName || sub.studentID);
                          })()}
                        </span>

                        {sub.studentNumber && (
                          <span className="text-xs font-mono text-slate-400">
                            (Resident #{sub.studentNumber})
                          </span>
                        )}

                        <span className="text-xs text-slate-300">·</span>

                        <span className="text-xs text-slate-500 font-medium">
                          {sub.weekNumber ? `Week ${sub.weekNumber}` : ''}{sub.dayNumber ? `, Day ${sub.dayNumber}` : ''} {sub.tool && `(${sub.tool})`}
                        </span>

                        {isGraded && (
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ml-auto">
                            Graded: {sub.score}/10 pts
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900">
                        {sub.title || sub.assignmentTitle || 'Class Assignment'}
                      </h3>

                      {/* Submitted Deliverable File Row with Live Drive Link */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                          <FileText className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
                          <span className="font-mono text-slate-700 truncate max-w-xs">
                            {sub.fileName || 'Solution File'}
                          </span>
                          {sub.fileType && (
                            <span className="text-[10px] uppercase font-bold text-slate-400">
                              {sub.fileType}
                            </span>
                          )}
                        </div>

                        {fileLink ? (
                          <a
                            href={fileLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-brand-primary border border-blue-200 hover:bg-blue-100 font-semibold text-xs transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View / Download File</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            Direct Entry (No file attachment)
                          </span>
                        )}

                        {sub.submittedAt && (
                          <span className="text-[11px] text-slate-400 ml-auto">
                            Submitted: {new Date(sub.submittedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Score Form */}
                    <div className="w-full lg:w-80 bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="form-label mb-0">Score (0 to 10 points)</label>
                          <span className="text-[10px] font-bold text-slate-400">Scale: 10 pts max</span>
                        </div>
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
                        <label className="form-label">Coach Feedback</label>
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
                        className="w-full btn-primary py-2 text-xs font-bold shadow-xs hover:shadow transition-all disabled:opacity-50"
                      >
                        {savingId === sub.submissionID ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Saving Grade...</span>
                          </span>
                        ) : isGraded ? (
                          'Update Grade'
                        ) : (
                          'Submit Grade'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}



      {/* ================= MODAL: MULTIPLE ASSIGNMENT SUBMISSIONS ================= */}
      {selectedSubmissionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge-primary text-[10px]">Assignment Deliverables</span>
                  <span className="font-mono text-xs font-bold text-brand-primary">
                    {selectedSubmissionModal.student?.studentID}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedSubmissionModal.student?.name || `${selectedSubmissionModal.student?.firstName || ''} ${selectedSubmissionModal.student?.lastName || ''}`.trim() || selectedSubmissionModal.student?.studentID}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedSubmissionModal.submissions?.length || 0} Submitted Deliverables
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmissionModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {selectedSubmissionModal.submissions?.map((sub) => (
                <div key={sub.submissionID} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">{sub.title || sub.assignmentTitle || 'Assignment Task'}</span>
                    <span className="badge-primary text-[10px]">{sub.category || sub.type || 'Technical'}</span>
                  </div>
                  {sub.fileName && (
                    <div className="text-[11px] text-slate-600 font-mono truncate">{sub.fileName}</div>
                  )}
                  {sub.fileURL && (
                    <a
                      href={sub.fileURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:underline pt-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Google Drive</span>
                    </a>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSubmissionModal(null)}
                className="btn-secondary px-4 py-1.5 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
