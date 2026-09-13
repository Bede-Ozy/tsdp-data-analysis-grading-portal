import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getStudentPendingAssignments,
  getActiveAssignments,
  handleTechnicalFileUpload,
  handleProfessionalFileUpload
} from '../../services/api';
import FileUploader, { fileToBase64 } from '../../components/FileUploader';
import CustomSelect from '../../components/CustomSelect';
import { TOOLS_LIST } from '../../utils/constants';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  FileText,
  Lock,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  X,
  Sparkles,
  Inbox,
  AlertTriangle,
  FolderCheck,
  RotateCcw
} from 'lucide-react';

export default function SubmitAssignment() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedID = searchParams.get('assignmentID');

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'overdue' | 'submitted'
  const [assignmentsData, setAssignmentsData] = useState({
    pending: [],
    overdue: [],
    submitted: []
  });
  const [loadingPending, setLoadingPending] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState(null);

  // Manual fallback state
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualType, setManualType] = useState('Technical');
  const [manualTool, setManualTool] = useState('Excel');
  const [manualWeek, setManualWeek] = useState(6);
  const [manualDay, setManualDay] = useState(1);

  const studentNum = user?.studentNumber || user?.studentID || '';
  const studentID = user?.studentID || (user?.studentNumber ? `TSDP2026-RES-${String(user.studentNumber).padStart(3, '0')}` : '');

  // Filter helper: strict match for type === "Assignment", excluding ModuleProject
  const isAssignment = useCallback((item) => {
    if (!item) return false;
    if (item.type === 'Assignment') return true;
    if (item.type === 'ModuleProject') return false;
    const cat = String(item.category || '').toLowerCase();
    return cat !== 'moduleproject' && cat !== 'module project';
  }, []);

  const loadAssignments = useCallback(async () => {
    if (!studentID && !studentNum) {
      setLoadingPending(false);
      return;
    }
    setLoadingPending(true);
    try {
      const [res, activeRes] = await Promise.all([
        getStudentPendingAssignments(studentID || studentNum).catch(() => null),
        getActiveAssignments().catch(() => [])
      ]);

      let pList = [];
      let oList = [];
      let sList = [];

      if (res && res.success !== false) {
        const root = res.data && (res.data.pending || res.data.overdue || res.data.submitted) ? res.data : res;
        if (Array.isArray(root.pending)) pList = [...root.pending];
        if (Array.isArray(root.overdue)) oList = [...root.overdue];
        if (Array.isArray(root.submitted)) sList = [...root.submitted];

        // Fallback for flat array response
        if (Array.isArray(root) && pList.length === 0) {
          pList = [...root];
        }
      }

      // Merge active syllabus assignments if not closed and not in existing lists
      const submittedIds = new Set(sList.map(s => String(s.assignmentID || s.id || '').trim().toLowerCase()));
      if (Array.isArray(activeRes) && activeRes.length > 0) {
        activeRes.forEach(act => {
          const actId = String(act.assignmentID || act.id || '').trim().toLowerCase();
          const isClosed = String(act.status || '').toLowerCase() === 'closed' || act.isClosed;
          const isSubmitted = submittedIds.has(actId);
          const alreadyInLists = pList.some(p => String(p.assignmentID || p.id || '').trim().toLowerCase() === actId) ||
                                 oList.some(o => String(o.assignmentID || o.id || '').trim().toLowerCase() === actId);

          if (!isClosed && !isSubmitted && !alreadyInLists && isAssignment(act)) {
            const due = act.dueDate ? new Date(act.dueDate) : null;
            if (due && due < new Date()) {
              oList.push(act);
            } else {
              pList.push(act);
            }
          }
        });
      }

      setAssignmentsData({
        pending: pList,
        overdue: oList,
        submitted: sList
      });

      // Handle preselected assignment from URL
      if (preselectedID) {
        const matchPending = pList.find(a => (a.assignmentID || a.id) === preselectedID);
        if (matchPending) {
          setSelectedAssignment(matchPending);
          setActiveTab('pending');
        } else {
          const matchOverdue = oList.find(a => (a.assignmentID || a.id) === preselectedID);
          if (matchOverdue) {
            setActiveTab('overdue');
          } else {
            const matchSubmitted = sList.find(a => (a.assignmentID || a.id) === preselectedID);
            if (matchSubmitted) {
              setActiveTab('submitted');
            }
          }
        }
      }
    } catch (err) {
      console.error('Error loading assignments:', err);
    } finally {
      setLoadingPending(false);
    }
  }, [studentID, studentNum, preselectedID, isAssignment]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // Filtered by type === "Assignment"
  const assignmentPending = assignmentsData.pending.filter(isAssignment);
  const assignmentOverdue = assignmentsData.overdue.filter(isAssignment);
  const assignmentSubmitted = assignmentsData.submitted.filter(isAssignment);

  // Calculate deadline countdown badge
  const getDeadlineInfo = (dueDateStr) => {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffMs = due - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isPast = diffMs < 0;

    if (isPast) {
      return {
        isPast: true,
        label: 'Deadline Passed',
        color: 'bg-red-50 text-red-700 border-red-200'
      };
    }
    if (diffDays <= 1) {
      return {
        isPast: false,
        label: 'Due Today',
        color: 'bg-red-50 text-red-700 border-red-200 animate-pulse'
      };
    }
    if (diffDays <= 6) {
      return {
        isPast: false,
        label: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`,
        color: 'bg-orange-50 text-brand-secondary-dark border-orange-200'
      };
    }
    return {
      isPast: false,
      label: `Due in ${diffDays} days`,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  };

  const handleSelectToSubmit = (asgn) => {
    setSelectedAssignment(asgn);
    setIsManualMode(false);
    setSelectedFile(null);
    setError(null);
    setTimeout(() => {
      document.getElementById('submission-form-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessResult(null);

    if (!selectedFile) {
      setError('Please select or drop your solution file to upload.');
      return;
    }

    if (isManualMode && !manualTitle.trim()) {
      setError('Please provide an assignment title.');
      return;
    }

    if (!isManualMode && !selectedAssignment) {
      setError('Please select an assignment from the pending list.');
      return;
    }

    setLoading(true);
    try {
      let asgnID = '';
      let asgnType = '';
      let asgnTool = '';
      let asgnWeek = 6;
      let asgnDay = 1;
      let asgnTitle = '';

      if (isManualMode) {
        asgnType = manualType;
        asgnTool = manualTool;
        asgnWeek = Number(manualWeek);
        asgnDay = Number(manualDay);
        asgnTitle = manualTitle.trim();
        asgnID = `ASGN-W${asgnWeek}D${asgnDay}-${Date.now()}`;
      } else {
        asgnID = selectedAssignment.assignmentID || selectedAssignment.id;
        asgnType = selectedAssignment.category || 'Technical';
        asgnTool = selectedAssignment.tool || (asgnType === 'Technical' ? 'Excel' : 'SoftSkills');
        asgnWeek = selectedAssignment.weekNumber || 6;
        asgnDay = selectedAssignment.dayNumber || 1;
        asgnTitle = selectedAssignment.title || selectedAssignment.assignmentTitle || 'Class Assignment';
      }

      const fileBase64 = await fileToBase64(selectedFile);
      let res;
      if (asgnType.toLowerCase() === 'technical') {
        res = await handleTechnicalFileUpload(
          studentNum,
          asgnID,
          Number(asgnWeek),
          Number(asgnDay),
          asgnTool,
          asgnTitle,
          fileBase64,
          selectedFile.name
        );
      } else {
        res = await handleProfessionalFileUpload(
          studentNum,
          asgnID,
          Number(asgnWeek),
          Number(asgnDay),
          asgnTool,
          asgnTitle,
          fileBase64,
          selectedFile.name
        );
      }

      if (res && res.success !== false) {
        setSuccessResult(res);
        setShowSuccessModal(true);
        setSelectedFile(null);
        setSelectedAssignment(null);
        if (isManualMode) setManualTitle('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Refresh assignments list so the newly submitted task appears in Submitted tab
        await loadAssignments();
      } else {
        setError(res?.message || 'Failed to submit assignment. Please verify file size and connection.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
      setError('Error uploading file to Google Drive. Please check file size and connection.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-neutral">Submit Assignment</h1>
          <p className="text-sm text-brand-neutral-muted mt-1">
            Review pending syllabus assignments, track deadlines, and submit your solution files.
          </p>
        </div>
        <Link
          to="/student/dashboard"
          className="btn-secondary text-xs self-start sm:self-auto flex items-center gap-1.5"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Success Notification Banner */}
      {successResult && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-base text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Assignment Successfully Uploaded!</span>
          </div>
          <p className="text-xs text-emerald-700">
            {successResult.message || 'Your submission has been recorded in Google Drive for grading.'}
          </p>
          {successResult.submissionID && (
            <p className="text-[11px] font-mono text-emerald-600">
              Submission Reference: {successResult.submissionID}
            </p>
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-brand-error/20 rounded-xl text-brand-error flex items-start gap-2 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* 3-Tab Filter View */}
      <div className="portal-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'pending'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Pending</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                {assignmentPending.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('overdue')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'overdue'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Overdue</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                assignmentOverdue.length > 0 ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {assignmentOverdue.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('submitted')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'submitted'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Submitted</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {assignmentSubmitted.length}
              </span>
            </button>
          </div>

          {/* Toggle Manual Mode */}
          <button
            type="button"
            onClick={() => {
              setIsManualMode(!isManualMode);
              setSelectedAssignment(null);
            }}
            className="text-xs text-brand-primary hover:text-brand-primary-dark font-semibold underline underline-offset-2 self-start sm:self-auto"
          >
            {isManualMode ? '← Back to Assigned Deliverables' : 'Custom / Unlisted Submission?'}
          </button>
        </div>

        {/* Tab Content */}
        {loadingPending ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2 animate-pulse">
            <Layers className="w-6 h-6 text-slate-300 mx-auto animate-spin" />
            <p>Loading assignments from grading portal...</p>
          </div>
        ) : isManualMode ? (
          /* Manual Mode Fallback */
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                Manual / Unlisted Assignment Mode
              </span>
              <span className="text-[11px] text-slate-500">
                Submit extra drills or unlisted classroom tasks
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="form-label">Category</label>
                <CustomSelect
                  options={[
                    { value: 'Technical', label: 'Technical' },
                    { value: 'Professional', label: 'Professional' }
                  ]}
                  value={manualType}
                  onChange={(val) => setManualType(val)}
                />
              </div>

              <div>
                <label className="form-label">Tool / Domain</label>
                <CustomSelect
                  options={[
                    ...TOOLS_LIST.map(t => ({ value: t, label: t })),
                    { value: 'SoftSkills', label: 'SoftSkills' }
                  ]}
                  value={manualTool}
                  onChange={(val) => setManualTool(val)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Week (1–16)</label>
                <CustomSelect
                  options={Array.from({ length: 16 }, (_, i) => ({
                    value: i + 1,
                    label: `Week ${i + 1}`
                  }))}
                  value={manualWeek}
                  onChange={(val) => setManualWeek(val)}
                />
              </div>

              <div>
                <label className="form-label">Day (1–5)</label>
                <CustomSelect
                  options={[1, 2, 3, 4, 5].map(d => ({
                    value: d,
                    label: `Day ${d}`
                  }))}
                  value={manualDay}
                  onChange={(val) => setManualDay(val)}
                />
              </div>
            </div>

            <div>
              <label className="form-label">
                Assignment Title <span className="text-brand-error">*</span>
              </label>
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="e.g. Week 6 Day 1 SQL Subqueries and CTEs"
                className="form-input"
                required
              />
            </div>
          </div>
        ) : (
          <div>
            {/* TAB 1: PENDING */}
            {activeTab === 'pending' && (
              <div className="space-y-3">
                {assignmentPending.length === 0 ? (
                  <div className="py-12 text-center text-xs text-brand-neutral-muted space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner ring-4 ring-emerald-50/50">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="text-emerald-800 font-bold text-sm">
                      No pending assignments — you're all caught up!
                    </p>
                    <p className="text-slate-500 text-xs">
                      All your current assignments have been completed and submitted.
                    </p>
                  </div>
                ) : (
                  assignmentPending.map((asgn, idx) => {
                    const asgnID = asgn.assignmentID || asgn.id;
                    const title = asgn.title || asgn.assignmentTitle || 'Class Assignment';
                    const tool = asgn.tool || (asgn.category === 'Technical' ? 'Excel' : 'SoftSkills');
                    const deadline = getDeadlineInfo(asgn.dueDate);
                    const isSelected = selectedAssignment && (selectedAssignment.assignmentID || selectedAssignment.id) === asgnID;

                    return (
                      <div
                        key={asgnID || idx}
                        className={`p-4 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-blue-50/50 border-brand-primary ring-2 ring-brand-primary/20 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-blue-100 text-brand-primary text-[10px] font-bold">
                                📝 {asgn.category || 'Assignment'} {asgn.weekNumber ? `(W${asgn.weekNumber}D${asgn.dayNumber || 1})` : ''}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-white text-slate-700 font-medium text-[10px] border border-slate-200">
                                {tool}
                              </span>
                              {asgn.maxScore && (
                                <span className="text-[10px] font-semibold text-slate-500">
                                  {asgn.maxScore} pts
                                </span>
                              )}
                              {/* Pending / Countdown Badge */}
                              {deadline ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${deadline.color}`}>
                                  <Clock className="w-3 h-3" />
                                  <span>{deadline.label}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-amber-50 text-amber-800 border-amber-200">
                                  <Clock className="w-3 h-3" />
                                  <span>Pending</span>
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm font-bold text-slate-900">
                              {title}
                            </h3>

                            {asgn.dueDate && (
                              <p className="text-[11px] text-slate-500">
                                Due date: {new Date(asgn.dueDate).toLocaleDateString(undefined, {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectToSubmit(asgn)}
                            className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto flex-shrink-0 transition-all ${
                              isSelected
                                ? 'bg-brand-primary text-white shadow-xs'
                                : 'btn-primary'
                            }`}
                          >
                            <span>{isSelected ? 'Selected Below' : 'Submit Now'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: OVERDUE */}
            {activeTab === 'overdue' && (
              <div className="space-y-3">
                {assignmentOverdue.length === 0 ? (
                  <div className="py-12 text-center text-xs text-brand-neutral-muted space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner ring-4 ring-emerald-50/50">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="text-emerald-800 font-bold text-sm">
                      No overdue assignments — great job staying on track!
                    </p>
                    <p className="text-slate-500 text-xs">
                      You have zero missed deadlines. Keep up the great pace!
                    </p>
                  </div>
                ) : (
                  assignmentOverdue.map((asgn, idx) => {
                    const asgnID = asgn.assignmentID || asgn.id;
                    const title = asgn.title || asgn.assignmentTitle || 'Class Assignment';
                    const tool = asgn.tool || (asgn.category === 'Technical' ? 'Excel' : 'SoftSkills');

                    return (
                      <div
                        key={asgnID || idx}
                        className="p-4 rounded-xl border bg-red-50/50 border-red-200/90 text-red-900 space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                Overdue
                              </span>
                              <span className="px-2 py-0.5 rounded bg-white text-slate-700 font-medium text-[10px] border border-red-200">
                                {tool}
                              </span>
                              {asgn.weekNumber && (
                                <span className="text-[10px] font-semibold text-slate-600">
                                  Week {asgn.weekNumber} Day {asgn.dayNumber || 1}
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm font-bold text-slate-900">
                              {title}
                            </h3>

                            {asgn.dueDate && (
                              <p className="text-[11px] text-red-700 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3 text-red-600" />
                                <span>
                                  Deadline passed on {new Date(asgn.dueDate).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled
                            className="btn-secondary py-1.5 px-3.5 text-xs opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200 flex items-center gap-1.5 self-start sm:self-auto flex-shrink-0"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Submission Closed</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 3: SUBMITTED */}
            {activeTab === 'submitted' && (
              <div className="space-y-3">
                {assignmentSubmitted.length === 0 ? (
                  <div className="py-12 text-center text-xs text-brand-neutral-muted space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Inbox className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-700 font-bold text-sm">
                      No submissions yet.
                    </p>
                    <p className="text-slate-500 text-xs">
                      Assignments you submit will appear here along with their grading status.
                    </p>
                  </div>
                ) : (
                  assignmentSubmitted.map((asgn, idx) => {
                    const asgnID = asgn.assignmentID || asgn.id;
                    const title = asgn.title || asgn.assignmentTitle || 'Class Assignment';
                    const tool = asgn.tool || (asgn.category === 'Technical' ? 'Excel' : 'SoftSkills');

                    return (
                      <div
                        key={asgnID || idx}
                        className="p-4 rounded-xl border bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/60 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Submitted ✅
                              </span>
                              <span className="px-2 py-0.5 rounded bg-white text-slate-700 font-medium text-[10px] border border-slate-200">
                                {tool}
                              </span>
                              {asgn.weekNumber && (
                                <span className="text-[10px] font-semibold text-slate-500">
                                  Week {asgn.weekNumber} Day {asgn.dayNumber || 1}
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm font-bold text-slate-900">
                              {title}
                            </h3>

                            {asgn.submittedAt && (
                              <p className="text-[11px] text-slate-500">
                                Submitted: {new Date(asgn.submittedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>

                          {asgn.fileURL ? (
                            <a
                              href={asgn.fileURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-secondary py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 text-brand-primary border-brand-primary/30 self-start sm:self-auto flex-shrink-0"
                            >
                              <span>View Submission</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : asgn.fileName ? (
                            <span className="text-xs text-slate-500 font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                              {asgn.fileName}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submission Upload Card */}
      {(selectedAssignment || isManualMode) && (
        <div id="submission-form-section" className="portal-card space-y-5 scroll-mt-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-brand-primary" />
              <h2 className="text-sm font-bold text-slate-800">
                {isManualMode
                  ? 'Submit Custom / Manual Assignment'
                  : `Submit Solution: ${selectedAssignment?.title || selectedAssignment?.assignmentTitle}`}
              </h2>
            </div>
            {!isManualMode && (
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                Cancel / Change
              </button>
            )}
          </div>

          {/* Assignment Brief (if selected) */}
          {selectedAssignment && !isManualMode && (
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-brand-primary border border-blue-200">
                  {selectedAssignment.category || 'Technical'}
                </span>
                <span className="px-2 py-0.5 rounded bg-white text-slate-700 font-medium text-[10px] border border-slate-200">
                  {selectedAssignment.tool || 'Excel'}
                </span>
                {selectedAssignment.assignmentID && (
                  <span className="font-mono text-[11px] text-slate-400">
                    {selectedAssignment.assignmentID}
                  </span>
                )}
              </div>

              {selectedAssignment.description && (
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400">Instructions:</span>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap mt-0.5 leading-relaxed">
                    {selectedAssignment.description}
                  </p>
                </div>
              )}

              {selectedAssignment.deliverables && (
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400">Expected Deliverables:</span>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap mt-0.5 leading-relaxed">
                    {selectedAssignment.deliverables}
                  </p>
                </div>
              )}

              {/* Downloadable Materials Section */}
              {selectedAssignment.materials && Array.isArray(selectedAssignment.materials) && selectedAssignment.materials.length > 0 && (
                <div className="pt-2 border-t border-slate-200/60 space-y-2">
                  <span className="text-[11px] uppercase font-bold text-slate-400">Download Starter Materials:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedAssignment.materials.map((mat, i) => (
                      <a
                        key={i}
                        href={mat.url || mat.downloadUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs text-brand-primary hover:border-brand-primary transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" />
                          <span className="font-semibold truncate">{mat.name || `Material ${i + 1}`}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File Upload Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">
                Upload Your Solution File <span className="text-brand-error">*</span>
              </label>
              <FileUploader
                onFilesSelected={(files) => setSelectedFile(files[0] || null)}
                multiple={false}
                maxFiles={1}
                acceptedFormats={selectedAssignment?.allowedFileTypes || '.xlsx, .pdf, .sql, .pbix, .py, .docx, .zip'}
                helperText="Upload your completed solution (.xlsx, .sql, .pbix, .py, .pdf, etc.)"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || !selectedFile}
                className="btn-primary px-7 py-2.5 text-sm font-semibold flex items-center gap-2 shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading to Drive...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Submit Assignment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Celebration Success Pop-up Modal */}
      {showSuccessModal && successResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 text-center space-y-5 animate-scale-up relative">
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Submission Successful!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {successResult.message || 'Your assignment solution has been securely uploaded to Google Drive and logged for instructor grading.'}
              </p>
            </div>

            {successResult.submissionID && (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Submission Reference</span>
                <p className="font-mono text-xs font-semibold text-brand-primary">
                  {successResult.submissionID}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <Link
                to="/student/dashboard"
                className="w-full sm:w-auto btn-primary py-2.5 px-5 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Return to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full sm:w-auto btn-secondary py-2.5 px-5 text-xs font-semibold"
              >
                Submit Another File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
