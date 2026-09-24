import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getStudentPendingAssignments,
  handleModuleProjectUpload
} from '../../services/api';
import FileUploader, { filesToBase64Array } from '../../components/FileUploader';
import CustomSelect from '../../components/CustomSelect';
import { MODULES } from '../../utils/constants';
import {
  FolderArchive,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileStack,
  X,
  ArrowRight,
  ExternalLink,
  Layers,
  Lock,
  PlusCircle,
  Inbox
} from 'lucide-react';

export default function SubmitModuleProject() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedMonth = searchParams.get('month');

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'overdue' | 'submitted'
  const [assignmentsData, setAssignmentsData] = useState({
    pending: [],
    overdue: [],
    submitted: []
  });
  const [loadingPending, setLoadingPending] = useState(true);

  // Active Selected Project for submission
  const [selectedProject, setSelectedProject] = useState(null);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Form State
  const [selectedMonth, setSelectedMonth] = useState(Number(preselectedMonth) || 1);
  const [projectTitle, setProjectTitle] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState(null);

  const studentNum = user?.studentNumber || user?.studentID || '';
  const studentID = user?.studentID || (user?.studentNumber ? `TSDP2026-RES-${String(user.studentNumber).padStart(3, '0')}` : '');

  const activeModule = MODULES.find(m => m.month === Number(selectedMonth)) || MODULES[0];

  // Helper to identify ModuleProject items
  const isModuleProject = useCallback((item) => {
    if (!item) return false;
    if (item.type === 'ModuleProject') return true;
    const cat = String(item.category || item.assignmentType || '').toLowerCase();
    return cat === 'moduleproject' || cat === 'module project' || cat === 'project';
  }, []);

  const loadModuleProjects = useCallback(async () => {
    if (!studentID && !studentNum) {
      setLoadingPending(false);
      return;
    }
    setLoadingPending(true);
    try {
      const res = await getStudentPendingAssignments(studentID || studentNum).catch(() => null);

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

      // Merge local storage module project submissions
      try {
        const localMods = JSON.parse(localStorage.getItem('tsdp_module_project_submissions') || '[]');
        localMods.forEach(m => {
          if (m.studentID === studentID || m.studentID === studentNum) {
            const alreadyInSubmitted = sList.some(
              s => isModuleProject(s) && Number(s.monthNumber) === Number(m.monthNumber)
            );
            if (!alreadyInSubmitted) {
              sList.push({
                assignmentID: m.projectID,
                title: m.projectTitle,
                tool: m.tool,
                monthNumber: m.monthNumber,
                type: 'ModuleProject',
                submittedAt: m.submittedAt,
                files: m.files || [],
                fileURL: m.files?.[0]?.url || ''
              });
            }
          }
        });
      } catch (e) {
        console.warn('Could not read cached submissions', e);
      }

      setAssignmentsData({
        pending: pList,
        overdue: oList,
        submitted: sList
      });

      // If preselectedMonth provided, look for it in pending
      if (preselectedMonth) {
        const match = pList.find(p => isModuleProject(p) && Number(p.monthNumber) === Number(preselectedMonth));
        if (match) {
          setSelectedProject(match);
          setSelectedMonth(Number(preselectedMonth));
          setProjectTitle(match.title || match.assignmentTitle || '');
          setActiveTab('pending');
        } else {
          // Open custom submission for this month
          setSelectedMonth(Number(preselectedMonth));
          setIsCustomMode(true);
        }
      }
    } catch (err) {
      console.error('Error loading module projects:', err);
    } finally {
      setLoadingPending(false);
    }
  }, [studentID, studentNum, preselectedMonth, isModuleProject]);

  useEffect(() => {
    loadModuleProjects();
  }, [loadModuleProjects]);

  // Filtered by type === "ModuleProject"
  const projectPending = assignmentsData.pending.filter(isModuleProject);
  const projectOverdue = assignmentsData.overdue.filter(isModuleProject);
  const projectSubmitted = assignmentsData.submitted.filter(isModuleProject);

  // Countdown badge helper
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

  const handleSelectToSubmit = (proj) => {
    setSelectedProject(proj);
    setIsCustomMode(false);
    const mNum = Number(proj.monthNumber) || 1;
    setSelectedMonth(mNum);
    setProjectTitle(proj.title || proj.assignmentTitle || `Month ${mNum} ${proj.tool || activeModule.tool} Project`);
    setFiles([]);
    setError(null);
    setTimeout(() => {
      document.getElementById('project-upload-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleOpenCustomSubmit = (mNum = 1) => {
    setSelectedProject(null);
    setIsCustomMode(true);
    setSelectedMonth(mNum);
    const mod = MODULES.find(m => m.month === Number(mNum)) || MODULES[0];
    setProjectTitle(`Month ${mNum} ${mod.tool} Business Performance Analysis`);
    setFiles([]);
    setError(null);
    setTimeout(() => {
      document.getElementById('project-upload-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!projectTitle.trim()) {
      setError('Please provide your Project Title.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!files || files.length === 0) {
      setError('Please attach at least one project deliverable file (up to 5 files allowed).');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);
    if (totalBytes > 40 * 1024 * 1024) {
      setError(`Total upload exceeds 40 MB (${(totalBytes / (1024 * 1024)).toFixed(1)} MB selected). Please reduce file sizes or compress files before submitting.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      const filesArray = await filesToBase64Array(files);

      const res = await handleModuleProjectUpload(
        studentNum,
        Number(selectedMonth),
        activeModule.tool,
        projectTitle.trim(),
        filesArray
      );

      if (res && res.success !== false) {
        // Cache submission locally so it persists and reflects immediately on portal
        try {
          const raw = localStorage.getItem('tsdp_module_project_submissions');
          const existing = raw ? JSON.parse(raw) : [];
          const newEntry = {
            projectID: res.projectID || `PROJ-${Date.now()}`,
            studentID: studentID || studentNum,
            monthNumber: Number(selectedMonth),
            tool: activeModule.tool,
            projectTitle: projectTitle.trim(),
            submittedAt: new Date().toISOString(),
            files: files.map(f => ({ name: f.name, url: res.fileURL || '' }))
          };
          const filtered = existing.filter(
            e => !(e.studentID === newEntry.studentID && (Number(e.monthNumber) === Number(selectedMonth) || e.tool === activeModule.tool))
          );
          filtered.push(newEntry);
          localStorage.setItem('tsdp_module_project_submissions', JSON.stringify(filtered));
        } catch (e) {
          console.warn('Could not cache module submission', e);
        }

        setResult(res);
        setShowSuccessModal(true);
        setSelectedProject(null);
        setIsCustomMode(false);
        setProjectTitle('');
        setFiles([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Refresh module project data
        await loadModuleProjects();
      } else {
        setError(res?.message || 'Failed to submit module project package.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
      setError('Error converting and uploading project bundle to Google Drive. Please try again.');
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
          <h1 className="text-2xl font-bold text-brand-neutral">Submit Monthly Module Project</h1>
          <p className="text-sm text-brand-neutral-muted mt-1">
            Module projects contribute <strong>20%</strong> to your final grading score. You may upload up to 5 files per module.
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
      {result && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-base text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Project Package Successfully Submitted!</span>
          </div>
          <p className="text-xs text-emerald-700">
            {result.message || 'Your project files have been uploaded to Google Drive and logged for grading.'}
          </p>
          {result.submissionID && (
            <p className="text-[11px] font-mono text-emerald-600">
              Submission Reference: {result.submissionID}
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

      {/* 3-Tab Filter Card */}
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
                {projectPending.length}
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
                projectOverdue.length > 0 ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {projectOverdue.length}
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
                {projectSubmitted.length}
              </span>
            </button>
          </div>

          {/* Direct Curriculum Submission Button */}
          <button
            type="button"
            onClick={() => handleOpenCustomSubmit(selectedMonth || 1)}
            className="text-xs text-brand-primary hover:text-brand-primary-dark font-semibold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Submit Curriculum Module Project</span>
          </button>
        </div>

        {/* Tab Content */}
        {loadingPending ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2 animate-pulse">
            <Layers className="w-6 h-6 text-slate-300 mx-auto animate-spin" />
            <p>Loading module project deliverables...</p>
          </div>
        ) : (
          <div>
            {/* TAB 1: PENDING */}
            {activeTab === 'pending' && (
              <div className="space-y-3">
                {projectPending.length === 0 ? (
                  <div className="py-12 text-center text-xs text-brand-neutral-muted space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner ring-4 ring-emerald-50/50">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="text-emerald-800 font-bold text-sm">
                      No pending assignments — you're all caught up!
                    </p>
                    <p className="text-slate-500 text-xs max-w-md mx-auto">
                      All scheduled module projects have been submitted. If you wish to submit an open module project, click below.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenCustomSubmit(1)}
                      className="btn-secondary text-xs px-4 py-2 inline-flex items-center gap-1.5 mt-2"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-brand-primary" />
                      <span>Submit Module Project Deliverables</span>
                    </button>
                  </div>
                ) : (
                  projectPending.map((asgn, idx) => {
                    const asgnID = asgn.assignmentID || asgn.id;
                    const monthNum = asgn.monthNumber || 1;
                    const tool = asgn.tool || MODULES.find(m => m.month === Number(monthNum))?.tool || 'Excel';
                    const title = asgn.title || asgn.assignmentTitle || `Month ${monthNum} Project - ${tool}`;
                    const deadline = getDeadlineInfo(asgn.dueDate);
                    const isSelected = selectedProject && (selectedProject.assignmentID || selectedProject.id) === asgnID;

                    return (
                      <div
                        key={asgnID || idx}
                        className={`p-4 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-purple-50/50 border-purple-400 ring-2 ring-purple-200 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                                📁 Module Project (Month {monthNum})
                              </span>
                              <span className="px-2 py-0.5 rounded bg-white text-slate-700 font-medium text-[10px] border border-slate-200">
                                {tool}
                              </span>
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
                                ? 'bg-purple-700 text-white shadow-xs'
                                : 'btn-primary'
                            }`}
                          >
                            <span>{isSelected ? 'Selected Below' : 'Submit Now'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
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
                {projectOverdue.length === 0 ? (
                  <div className="py-12 text-center text-xs text-brand-neutral-muted space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner ring-4 ring-emerald-50/50">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="text-emerald-800 font-bold text-sm">
                      No overdue assignments — great job staying on track!
                    </p>
                    <p className="text-slate-500 text-xs">
                      All your module projects are on schedule without any overdue deadlines.
                    </p>
                  </div>
                ) : (
                  projectOverdue.map((asgn, idx) => {
                    const asgnID = asgn.assignmentID || asgn.id;
                    const monthNum = asgn.monthNumber || 1;
                    const tool = asgn.tool || 'Excel';
                    const title = asgn.title || asgn.assignmentTitle || `Month ${monthNum} Project`;

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
                                Month {monthNum} ({tool})
                              </span>
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
                {projectSubmitted.length === 0 ? (
                  <div className="py-12 text-center text-xs text-brand-neutral-muted space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Inbox className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-700 font-bold text-sm">
                      No submissions yet.
                    </p>
                    <p className="text-slate-500 text-xs">
                      Module project bundles you submit will be displayed here for grading review.
                    </p>
                  </div>
                ) : (
                  projectSubmitted.map((asgn, idx) => {
                    const asgnID = asgn.assignmentID || asgn.id;
                    const monthNum = asgn.monthNumber || 1;
                    const tool = asgn.tool || 'Excel';
                    const title = asgn.title || asgn.projectTitle || asgn.assignmentTitle || `Month ${monthNum} Project`;

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
                                Month {monthNum} ({tool})
                              </span>
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

                            {Array.isArray(asgn.files) && asgn.files.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {asgn.files.map((f, fi) => (
                                  <span key={fi} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-mono">
                                    {f.name || `File ${fi + 1}`}
                                  </span>
                                ))}
                              </div>
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
                          ) : asgn.projectID ? (
                            <span className="text-[11px] font-mono text-slate-400 self-start sm:self-auto">
                              {asgn.projectID}
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

      {/* Submission Upload Section */}
      {(selectedProject || isCustomMode) && (
        <div id="project-upload-section" className="portal-card space-y-5 scroll-mt-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FolderArchive className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-800">
                {selectedProject
                  ? `Submit Module Project: ${selectedProject.title || selectedProject.assignmentTitle}`
                  : `Submit Month ${selectedMonth} (${activeModule.tool}) Module Project`}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedProject(null);
                setIsCustomMode(false);
              }}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Custom Month Selector Buttons */}
            <div>
              <label className="form-label">Select Curriculum Module & Month</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MODULES.map((m) => {
                  const isSelected = Number(selectedMonth) === Number(m.month);
                  return (
                    <button
                      key={m.month}
                      type="button"
                      onClick={() => {
                        setSelectedMonth(m.month);
                        if (isCustomMode) {
                          setProjectTitle(`Month ${m.month} ${m.tool} Business Performance Analysis`);
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                          : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100/80'
                      }`}
                    >
                      <span className="text-[10px] block font-semibold uppercase opacity-80">
                        Month {m.month}
                      </span>
                      <span className="text-sm font-bold block">{m.tool}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-brand-neutral-muted mt-2">
                Curriculum Focus: <span className="font-semibold text-slate-800">{activeModule.title}</span>
              </p>
            </div>

            {/* Project Title */}
            <div>
              <label className="form-label">
                Project Title <span className="text-brand-error">*</span>
              </label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder={`e.g. Month ${selectedMonth} ${activeModule.tool} Performance Analytics`}
                className="form-input"
                required
              />
            </div>

            {/* Multi-File Upload Component */}
            <div>
              <div className="flex items-center justify-between">
                <label className="form-label">
                  Attach Project Deliverables (Up to 5 files, Max 40 MB total) <span className="text-brand-error">*</span>
                </label>
                {files.length > 0 && (
                  <span className={`text-xs font-semibold ${
                    files.reduce((s, f) => s + (f.size || 0), 0) > 40 * 1024 * 1024
                      ? 'text-brand-error'
                      : 'text-purple-700'
                  }`}>
                    Total: {(files.reduce((s, f) => s + (f.size || 0), 0) / (1024 * 1024)).toFixed(2)} MB / 40 MB
                  </span>
                )}
              </div>
              <FileUploader
                multiple={true}
                maxFiles={5}
                maxSizeMB={40}
                maxTotalSizeMB={40}
                onFilesSelected={(selected) => {
                  setError(null);
                  if (!selected || selected.length === 0) {
                    setFiles([]);
                    return;
                  }
                  const total = selected.reduce((sum, f) => sum + (f.size || 0), 0);
                  if (total > 40 * 1024 * 1024) {
                    setError(`Total upload exceeds 40 MB (${(total / (1024 * 1024)).toFixed(1)} MB selected). Please remove some files or compress them.`);
                    return;
                  }
                  setFiles(selected);
                }}
                helperText="Upload your workbook, SQL/Python scripts, dashboard (.pbix), slides or PDF summary (Total max 40 MB)"
              />
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || files.length === 0}
                className="btn-primary px-7 py-2.5 text-sm font-semibold flex items-center gap-2 shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-purple-700 hover:bg-purple-800"
              >
                {loading ? (
                  <>
                    <FileStack className="w-4 h-4 animate-bounce" />
                    <span>Bundling {files.length} Files to Drive...</span>
                  </>
                ) : (
                  <>
                    <FolderArchive className="w-4 h-4" />
                    <span>Submit Module {selectedMonth} Project Package</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Celebration Success Pop-up Modal */}
      {showSuccessModal && result && (
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
                Module Project Submitted!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Your Month {selectedMonth} ({activeModule.tool}) project files have been securely bundled and uploaded to Google Drive.
              </p>
            </div>

            {result.submissionID && (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Submission Reference</span>
                <p className="font-mono text-xs font-semibold text-brand-primary">
                  {result.submissionID}
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
                Submit Another Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
