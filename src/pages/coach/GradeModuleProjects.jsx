import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllStudents, bulkGradeModuleProjects, getPendingModuleProjects } from '../../services/api';
import { MODULES } from '../../utils/constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Save,
  Check,
  ExternalLink,
  FileText,
  Clock,
  Filter,
  X,
  FolderArchive,
  Download,
  Eye
} from 'lucide-react';

const STORAGE_KEY = 'tsdp_module_project_submissions';

// Helper to check if a project submission matches the current month or tool
const matchesToolOrMonth = (p, monthNum, toolName) => {
  if (!p) return false;
  const pTool = p.tool ? String(p.tool).trim().toLowerCase() : '';
  const expectedTool = toolName ? String(toolName).trim().toLowerCase() : '';

  if (pTool && expectedTool && pTool === expectedTool) {
    return true;
  }

  if (p.monthNumber !== undefined && Number(p.monthNumber) === Number(monthNum)) {
    return true;
  }

  return false;
};

export default function GradeModuleProjects() {
  const { user } = useAuth();
  const coachID = user?.coachID || user?.id || user?.email || 'COACH-01';

  const [students, setStudents] = useState([]);
  const [allProjects, setAllProjects] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [grades, setGrades] = useState({}); // { [studentID]: { score: 85, feedback: '' } }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('All'); // 'All' | 'Submitted' | 'Ungraded'
  const [successResult, setSuccessResult] = useState(null);
  const [errorResult, setErrorResult] = useState(null);

  // Modal to inspect multiple submitted files
  const [selectedSubmissionFiles, setSelectedSubmissionFiles] = useState(null);

  const activeModule = MODULES.find(m => m.month === Number(selectedMonth)) || MODULES[0];

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsRes, projectsRes] = await Promise.all([
        getAllStudents().catch(() => ({ success: false, data: [] })),
        getPendingModuleProjects().catch(() => ({ success: false, data: [] }))
      ]);

      const stdList = Array.isArray(studentsRes) ? studentsRes : (studentsRes?.data || studentsRes?.students || []);
      const pendingList = Array.isArray(projectsRes) ? projectsRes : (projectsRes?.data || []);

      // Load existing cached submissions so graded projects persist
      let storedList = [];
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        storedList = raw ? JSON.parse(raw) : [];
      } catch (e) {
        storedList = [];
      }

      // Merge stored projects with newly fetched pending projects
      const mergedMap = new Map();
      storedList.forEach(item => {
        if (!item || !item.studentID) return;
        const key = `${String(item.studentID).trim().toLowerCase()}_${item.tool || item.monthNumber || 'mod'}`;
        mergedMap.set(key, item);
      });

      pendingList.forEach(item => {
        if (!item || !item.studentID) return;
        const key = `${String(item.studentID).trim().toLowerCase()}_${item.tool || item.monthNumber || 'mod'}`;
        const existing = mergedMap.get(key);
        mergedMap.set(key, {
          ...existing,
          ...item,
          status: existing?.status === 'Graded' ? 'Graded' : (item.status || 'Submitted'),
          score: existing?.score ?? item.score,
          feedback: existing?.feedback ?? item.feedback
        });
      });

      const combinedList = Array.from(mergedMap.values());
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(combinedList));
      } catch (e) {
        console.warn('Could not cache submissions to localStorage', e);
      }

      setStudents(stdList);
      setAllProjects(combinedList);

      // Auto-switch to the tool tab that has submissions if current tab has none
      const currentTabSubs = combinedList.filter(p => matchesToolOrMonth(p, selectedMonth, activeModule.tool));
      if (currentTabSubs.length === 0 && combinedList.length > 0) {
        const firstWithSubs = combinedList.find(p => p && (p.monthNumber || p.tool));
        if (firstWithSubs) {
          const matchedMonth = firstWithSubs.monthNumber
            ? Number(firstWithSubs.monthNumber)
            : (MODULES.find(m => m.tool.toLowerCase() === String(firstWithSubs.tool).toLowerCase())?.month || 1);
          setSelectedMonth(matchedMonth);
        }
      }

      // Populate initial grades
      const initial = {};
      stdList.forEach(s => {
        const targetId = String(s.studentID).trim().toLowerCase();
        const sub = combinedList.find(p =>
          p && p.studentID &&
          String(p.studentID).trim().toLowerCase() === targetId &&
          matchesToolOrMonth(p, selectedMonth, activeModule.tool)
        );

        initial[s.studentID] = {
          score: sub?.score !== undefined && sub?.score !== null ? sub.score : (s.moduleScore ?? ''),
          feedback: sub?.feedback || ''
        };
      });
      setGrades(initial);
    } catch (err) {
      console.error('Failed to load module project data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Whenever selectedMonth or allProjects change, re-populate existing grades for that month
  useEffect(() => {
    if (students.length > 0) {
      setGrades(prev => {
        const next = { ...prev };
        students.forEach(s => {
          const targetId = String(s.studentID).trim().toLowerCase();
          const sub = allProjects.find(p =>
            p && p.studentID &&
            String(p.studentID).trim().toLowerCase() === targetId &&
            matchesToolOrMonth(p, selectedMonth, activeModule.tool)
          );
          if (sub && sub.score !== undefined && sub.score !== null && sub.score !== '') {
            next[s.studentID] = {
              score: sub.score,
              feedback: sub.feedback || next[s.studentID]?.feedback || ''
            };
          }
        });
        return next;
      });
    }
  }, [selectedMonth, allProjects]);

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

  // Helper to open files modal for a specific student's submission
  const openFilesModal = (files, student, submission) => {
    const studentDisplayName = student?.name || `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || student?.studentID;
    setSelectedSubmissionFiles({
      studentID: student?.studentID || submission?.studentID,
      studentName: studentDisplayName,
      projectTitle: submission?.projectTitle || `${activeModule.tool} Project Solution`,
      submittedAt: submission?.submittedAt,
      files: files || submission?.files || []
    });
  };

  // Helper to find submission record for a student in the currently selected month or tool
  const getStudentSubmission = (student) => {
    if (!student || !student.studentID) return undefined;
    const targetId = String(student.studentID).trim().toLowerCase();
    return allProjects.find(p =>
      p && p.studentID &&
      String(p.studentID).trim().toLowerCase() === targetId &&
      matchesToolOrMonth(p, selectedMonth, activeModule.tool)
    );
  };

  const handleBulkSubmit = async () => {
    setErrorResult(null);
    setSuccessResult(null);
    setSubmitting(true);

    try {
      const eligibleStudents = students.filter(s => Boolean(getStudentSubmission(s)));

      if (eligibleStudents.length === 0) {
        setErrorResult(`No submitted projects found to grade for Month ${selectedMonth} (${activeModule.tool}).`);
        setSubmitting(false);
        return;
      }

      const scoresArray = eligibleStudents.map(s => ({
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

      if (res && res.success !== false) {
        // PERSIST the graded status and score so the submission NEVER reverts to "Not submitted"
        const updatedAll = allProjects.map(p => {
          const matchedScore = scoresArray.find(sc =>
            String(sc.studentID).trim().toLowerCase() === String(p.studentID).trim().toLowerCase() &&
            matchesToolOrMonth(p, selectedMonth, activeModule.tool)
          );
          if (matchedScore) {
            return {
              ...p,
              status: 'Graded',
              score: matchedScore.score,
              feedback: matchedScore.feedback,
              gradedAt: new Date().toISOString()
            };
          }
          return p;
        });

        setAllProjects(updatedAll);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAll));
        } catch (e) {
          console.warn('Could not save to localStorage', e);
        }

        setSuccessResult(res.message || `Successfully recorded ${activeModule.tool} scores for ${scoresArray.length} submitted resident(s)!`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorResult(res?.message || 'Failed to submit bulk grades.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
      setErrorResult('Network error saving bulk grades.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter roster
  const filteredStudents = students.filter(student => {
    const sub = getStudentSubmission(student);
    const hasScore = grades[student.studentID]?.score !== '' && grades[student.studentID]?.score !== undefined;

    if (filter === 'Submitted') return Boolean(sub);
    if (filter === 'Ungraded') return Boolean(sub) && (!hasScore || sub.status !== 'Graded');
    return true;
  });

  // Month Statistics
  const monthSubmissionsCount = students.filter(s => Boolean(getStudentSubmission(s))).length;
  const monthGradedCount = students.filter(s => {
    const sub = getStudentSubmission(s);
    return Boolean(sub) && (sub.status === 'Graded' || (grades[s.studentID]?.score !== '' && grades[s.studentID]?.score !== undefined));
  }).length;

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading resident roster and submitted project deliverables..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-brand-neutral">Grade Module Projects</h1>
            <span className="badge-primary text-xs">20% Cohort Weight</span>
          </div>
          <p className="text-sm text-brand-neutral-muted mt-1">
            Review student project packages saved to Google Drive, verify deliverables, and enter final scores (0-100 pts).
          </p>
        </div>

        <button
          type="button"
          onClick={handleBulkSubmit}
          disabled={submitting}
          className="btn-primary py-2.5 px-5 font-bold shadow-sm self-start sm:self-auto flex items-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving Scores...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save All Month {selectedMonth} Grades</span>
            </>
          )}
        </button>
      </div>

      {/* Month & Tool Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MODULES.map((m) => {
          const subsCountForTab = students.filter(s => {
            const targetId = s.studentID ? String(s.studentID).trim().toLowerCase() : '';
            return allProjects.some(p =>
              p && p.studentID &&
              String(p.studentID).trim().toLowerCase() === targetId &&
              matchesToolOrMonth(p, m.month, m.tool)
            );
          }).length;

          return (
            <button
              key={m.month}
              type="button"
              onClick={() => {
                setSelectedMonth(m.month);
                setSuccessResult(null);
                setErrorResult(null);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                selectedMonth === m.month
                  ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                  : 'bg-white text-brand-neutral border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold opacity-80 block tracking-wider">Month {m.month}</span>
                {subsCountForTab > 0 ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedMonth === m.month ? 'bg-white text-brand-primary' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {subsCountForTab} submitted
                  </span>
                ) : (
                  <span className={`w-2 h-2 rounded-full ${selectedMonth === m.month ? 'bg-white' : 'bg-slate-300'}`} />
                )}
              </div>
              <span className="text-sm font-bold block mt-0.5">{m.tool} Project</span>
            </button>
          );
        })}
      </div>

      {/* KPI Cards for Selected Month */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="portal-card p-3.5">
          <span className="text-[10px] font-semibold uppercase text-slate-400">Curriculum Tool</span>
          <p className="text-base font-bold text-slate-900 mt-0.5">{activeModule.tool}</p>
        </div>
        <div className="portal-card p-3.5">
          <span className="text-[10px] font-semibold uppercase text-slate-400">Students Submitted</span>
          <p className="text-base font-bold text-brand-primary mt-0.5">
            {monthSubmissionsCount} <span className="text-xs font-normal text-slate-500">/ {students.length} Residents</span>
          </p>
        </div>
        <div className="portal-card p-3.5">
          <span className="text-[10px] font-semibold uppercase text-slate-400">Scores Recorded</span>
          <p className="text-base font-bold text-emerald-600 mt-0.5">
            {monthGradedCount} <span className="text-xs font-normal text-slate-500">/ {monthSubmissionsCount} Submitted</span>
          </p>
        </div>
        <div className="portal-card p-3.5">
          <span className="text-[10px] font-semibold uppercase text-slate-400">Grading Scale</span>
          <p className="text-base font-bold text-slate-900 mt-0.5">0 – 100 Pts</p>
        </div>
      </div>

      {/* Notifications */}
      {successResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center justify-between gap-2 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span>{successResult}</span>
          </div>
          <button type="button" onClick={() => setSuccessResult(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {errorResult && (
        <div className="p-4 bg-red-50 border border-brand-error/20 rounded-xl text-brand-error flex items-center justify-between gap-2 text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorResult}</span>
          </div>
          <button type="button" onClick={() => setErrorResult(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Roster & Deliverables Table */}
      <div className="portal-card space-y-4 p-0 overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-800">
              Evaluating: <span className="text-brand-primary">{activeModule.title}</span>
            </span>
            <span className="text-xs text-slate-400 ml-2">({filteredStudents.length} residents shown)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium mr-1">Show:</span>
            {['All', 'Submitted', 'Ungraded'].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  filter === f
                    ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200/80 text-[11px] uppercase text-slate-400 font-semibold">
                <th className="py-3 px-4 w-28">Resident ID</th>
                <th className="py-3 px-4 min-w-[160px]">Student Name</th>
                <th className="py-3 px-4 min-w-[220px]">Project Deliverables & Drive Files</th>
                <th className="py-3 px-4 w-28 text-center">Score (0-100)</th>
                <th className="py-3 px-4 min-w-[200px]">Coach Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 text-xs font-medium">
                    No resident students match the selected filter ({filter}).
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const sGrade = grades[student.studentID] || { score: '', feedback: '' };
                  const studentDisplayName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.studentNumber || student.studentID;
                  const sub = getStudentSubmission(student);
                  const hasSubmitted = Boolean(sub);

                  return (
                    <tr key={student.studentID} className="hover:bg-slate-50/60 transition-colors">
                      {/* ID */}
                      <td className="py-3 px-4 font-mono font-bold text-xs text-brand-primary">
                        {student.studentID || `#${student.studentNumber}`}
                      </td>

                      {/* Name & Class Group */}
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div>{studentDisplayName}</div>
                        {student.classGroup && (
                          <span className="text-[11px] font-normal text-slate-400 block">{student.classGroup}</span>
                        )}
                      </td>

                      {/* Deliverables & VIEW SUBMISSION BUTTON */}
                      <td className="py-3 px-4">
                        {hasSubmitted ? (
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Submitted ({sub.files?.length || 1} {sub.files?.length === 1 ? 'file' : 'files'})</span>
                              </span>
                              {sub.status === 'Graded' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  Graded: {grades[student.studentID]?.score ?? sub.score}/100
                                </span>
                              )}
                              {sub.submittedAt && (
                                <span className="text-[10px] text-slate-400">
                                  {new Date(sub.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <p className="font-medium text-slate-800 text-xs line-clamp-1 flex-1">
                                {sub.projectTitle || `${activeModule.tool} Project Solution`}
                              </p>

                              {/* View Submission Action Button (Eye Icon) */}
                              <button
                                type="button"
                                onClick={() => openFilesModal(sub.files, student, sub)}
                                className="p-1.5 rounded-lg bg-blue-50 text-brand-primary border border-blue-200 hover:bg-blue-100 hover:text-brand-primary-dark transition-colors inline-flex items-center justify-center shrink-0 shadow-2xs cursor-pointer"
                                title="View submitted files"
                                aria-label="View submitted files"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
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

                      {/* Score Input (0-100) — DISABLED IF NO SUBMISSION */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="—"
                          disabled={!hasSubmitted}
                          value={sGrade.score}
                          onChange={(e) => handleScoreChange(student.studentID, e.target.value)}
                          className={`w-20 text-center font-bold text-sm py-1 px-2 rounded-lg border transition-all ${
                            hasSubmitted
                              ? 'border-slate-300 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary focus:outline-none bg-white text-slate-900'
                              : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                          }`}
                          title={!hasSubmitted ? 'Grading disabled: No submission yet' : 'Enter score (0-100)'}
                        />
                      </td>

                      {/* Coach Feedback Input — DISABLED IF NO SUBMISSION */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder={hasSubmitted ? "Feedback on methodology, queries, or dashboard quality..." : "Awaiting resident submission..."}
                          disabled={!hasSubmitted}
                          value={sGrade.feedback}
                          onChange={(e) => handleFeedbackChange(student.studentID, e.target.value)}
                          className={`w-full text-xs py-1 px-2.5 rounded-lg border transition-all ${
                            hasSubmitted
                              ? 'border-slate-300 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary focus:outline-none bg-white text-slate-900'
                              : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer save */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Click save to push all entered Month {selectedMonth} grades to Google Sheets.
          </span>
          <button
            type="button"
            onClick={handleBulkSubmit}
            disabled={submitting}
            className="btn-primary py-2 px-5 font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {submitting ? 'Saving All...' : `Save Month ${selectedMonth} Grades`}
          </button>
        </div>
      </div>

      {/* ================= MODAL: MULTIPLE SUBMISSION FILES ================= */}
      {selectedSubmissionFiles && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge-primary text-[10px]">Module {selectedMonth} Deliverables</span>
                  <span className="font-mono text-xs font-bold text-brand-primary">
                    {selectedSubmissionFiles.studentID}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedSubmissionFiles.studentName || selectedSubmissionFiles.studentID}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedSubmissionFiles.projectTitle || 'Submitted Project Package'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmissionFiles(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Uploaded Files in Google Drive ({selectedSubmissionFiles.files?.length || 0}):
              </span>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedSubmissionFiles.files && selectedSubmissionFiles.files.length > 0 ? (
                  selectedSubmissionFiles.files.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-4 h-4 text-brand-primary flex-shrink-0" />
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {file.name || `Deliverable File ${idx + 1}`}
                        </span>
                      </div>

                      {file.url ? (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary-dark transition-colors flex items-center gap-1 flex-shrink-0 shadow-xs"
                        >
                          <span>Open in Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No URL</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic p-3">No file records attached.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSubmissionFiles(null)}
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
