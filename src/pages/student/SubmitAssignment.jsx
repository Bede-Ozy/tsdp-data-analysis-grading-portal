import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getStudentPendingAssignments,
  handleTechnicalFileUpload,
  handleProfessionalFileUpload
} from '../../services/api';
import FileUploader, { fileToBase64 } from '../../components/FileUploader';
import { TOOLS_LIST } from '../../utils/constants';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  FileText,
  Lock,
  ChevronDown,
  Info,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function SubmitAssignment() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedID = searchParams.get('assignmentID');

  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [selectedAssignmentID, setSelectedAssignmentID] = useState(preselectedID || '');

  // Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [error, setError] = useState(null);

  // Manual fallback state if student needs to submit custom work
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualType, setManualType] = useState('Technical');
  const [manualTool, setManualTool] = useState('Excel');
  const [manualWeek, setManualWeek] = useState(6);
  const [manualDay, setManualDay] = useState(1);

  const studentNum = user?.studentNumber || user?.studentID || '';
  const studentID = user?.studentID || (user?.studentNumber ? `TSDP2026-RES-${String(user.studentNumber).padStart(3, '0')}` : '');

  // Fetch pending assignments
  useEffect(() => {
    async function loadPending() {
      if (!studentID && !studentNum) {
        setLoadingPending(false);
        return;
      }
      setLoadingPending(true);
      try {
        const res = await getStudentPendingAssignments(studentID || studentNum);
        if (res && res.success !== false) {
          const list = Array.isArray(res) ? res : (res.data || res.assignments || []);
          setPendingAssignments(list);

          // If preselected ID from query params exists and is found
          if (preselectedID && list.some(a => (a.assignmentID || a.id) === preselectedID)) {
            setSelectedAssignmentID(preselectedID);
          } else if (list.length > 0 && !selectedAssignmentID) {
            setSelectedAssignmentID(list[0].assignmentID || list[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading pending assignments:', err);
      } finally {
        setLoadingPending(false);
      }
    }
    loadPending();
  }, [studentID, studentNum, preselectedID]);

  // Find currently active selected assignment object
  const activeAssignment = pendingAssignments.find(
    a => (a.assignmentID || a.id) === selectedAssignmentID
  );

  // Calculate deadline status and countdown
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
        color: 'bg-red-100 text-red-800 border-red-200'
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
        label: `Due in ${diffDays} days`,
        color: 'bg-orange-50 text-brand-secondary-dark border-orange-200'
      };
    }
    return {
      isPast: false,
      label: `Due in ${diffDays} days`,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  };

  const deadlineInfo = activeAssignment?.dueDate ? getDeadlineInfo(activeAssignment.dueDate) : null;
  const isDeadlineLocked = !isManualMode && deadlineInfo?.isPast;

  // Allowed file types string for FileUploader
  const allowedExtensions = activeAssignment?.allowedFileTypes || '.xlsx, .pdf, .sql, .pbix, .py, .ipynb, .docx, .zip';
  const maxFiles = activeAssignment?.maxFilesAllowed || 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessResult(null);

    if (isDeadlineLocked) {
      setError('The submission deadline for this assignment has passed and is locked.');
      return;
    }

    if (!selectedFile) {
      setError('Please select or drop your solution file to upload.');
      return;
    }

    if (isManualMode && !manualTitle.trim()) {
      setError('Please provide an assignment title.');
      return;
    }

    setLoading(true);
    try {
      const fileBase64 = await fileToBase64(selectedFile);

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
      } else if (activeAssignment) {
        asgnID = activeAssignment.assignmentID || activeAssignment.id;
        asgnType = activeAssignment.category || 'Technical';
        asgnTool = activeAssignment.tool || (asgnType === 'Technical' ? 'Excel' : 'SoftSkills');
        asgnWeek = activeAssignment.weekNumber || 6;
        asgnDay = activeAssignment.dayNumber || 1;
        asgnTitle = activeAssignment.title || activeAssignment.assignmentTitle || 'Class Assignment';
      } else {
        setError('Please select an active assignment or toggle manual mode.');
        setLoading(false);
        return;
      }

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
        setSelectedFile(null);
        if (isManualMode) setManualTitle('');
      } else {
        setError(res?.message || 'Failed to submit assignment. Please verify file size and connection.');
      }
    } catch (err) {
      console.error(err);
      setError('Error uploading file to Drive. Please check file size and connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-neutral">Submit Assignment</h1>
          <p className="text-sm text-brand-neutral-muted mt-1">
            Select an assigned syllabus deliverable, review requirements, and submit your solution file.
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

      {/* Success Notification */}
      {successResult && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-base text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Assignment Successfully Uploaded!</span>
          </div>
          <p className="text-xs text-emerald-700">{successResult.message || 'Your submission has been recorded in Google Drive for grading.'}</p>
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

      {/* Main Submission Card */}
      <div className="portal-card space-y-6">
        {/* Toggle between Active Assigned & Manual Entry */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {isManualMode ? 'Manual Submission Entry' : 'Select Pending Assignment'}
          </span>
          <button
            type="button"
            onClick={() => setIsManualMode(!isManualMode)}
            className="text-xs text-brand-primary hover:text-brand-primary-dark font-medium underline underline-offset-2"
          >
            {isManualMode ? '← Switch to Assigned Deliverables' : 'Custom / Unlisted Submission?'}
          </button>
        </div>

        {/* Dropdown Selection Flow */}
        {!isManualMode ? (
          <div className="space-y-4">
            <div>
              <label className="form-label">Choose Assigned Deliverable</label>
              {loadingPending ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 animate-pulse">
                  Loading pending syllabus assignments...
                </div>
              ) : pendingAssignments.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                  <p className="text-xs text-slate-600 font-medium">
                    No pending assignments found assigned to your student ID.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsManualMode(true)}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    Submit as Manual Assignment
                  </button>
                </div>
              ) : (
                <select
                  value={selectedAssignmentID}
                  onChange={(e) => setSelectedAssignmentID(e.target.value)}
                  className="form-input text-xs font-medium"
                >
                  {pendingAssignments.map((a) => {
                    const id = a.assignmentID || a.id;
                    const cat = a.category || 'Technical';
                    const tool = a.tool ? `[${a.tool}]` : '';
                    return (
                      <option key={id} value={id}>
                        {cat} {tool} {a.title || a.assignmentTitle} {a.dueDate ? `— Due: ${new Date(a.dueDate).toLocaleDateString()}` : ''}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Active Assignment Brief & Metadata */}
            {activeAssignment && (
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      activeAssignment.category === 'Technical'
                        ? 'bg-blue-50 text-brand-primary border-blue-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      {activeAssignment.category || 'Technical'}
                    </span>
                    {activeAssignment.tool && (
                      <span className="px-2 py-0.5 rounded bg-white text-slate-700 font-medium text-[10px] border border-slate-200">
                        {activeAssignment.tool}
                      </span>
                    )}
                    <span className="font-mono text-[11px] text-slate-400">
                      {activeAssignment.assignmentID || activeAssignment.id}
                    </span>
                  </div>

                  {/* Deadline Countdown Badge */}
                  {deadlineInfo && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${deadlineInfo.color}`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{deadlineInfo.label}</span>
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-900">
                  {activeAssignment.title || activeAssignment.assignmentTitle}
                </h3>

                {/* Description */}
                {activeAssignment.description && (
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400">Instructions:</span>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap mt-0.5 leading-relaxed">
                      {activeAssignment.description}
                    </p>
                  </div>
                )}

                {/* Deliverables */}
                {activeAssignment.deliverables && (
                  <div>
                    <span className="text-[11px] uppercase font-bold text-slate-400">Expected Deliverables:</span>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap mt-0.5 leading-relaxed">
                      {activeAssignment.deliverables}
                    </p>
                  </div>
                )}

                {/* File Restrictions */}
                <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Allowed Formats:</span>
                    <div className="flex flex-wrap gap-1">
                      {allowedExtensions.split(',').map((ext, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-white font-mono text-[10px] text-slate-600 border border-slate-200">
                          {ext.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span className="text-slate-500">
                    Max Files: <strong className="text-slate-800">{maxFiles}</strong>
                  </span>
                </div>

                {/* Downloadable Materials Section */}
                {activeAssignment.materials && Array.isArray(activeAssignment.materials) && activeAssignment.materials.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 space-y-2">
                    <span className="text-[11px] uppercase font-bold text-slate-400">Download Starter Materials:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeAssignment.materials.map((mat, i) => (
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
          </div>
        ) : (
          /* Manual Mode Fallback Form */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Category</label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value)}
                  className="form-input"
                >
                  <option value="Technical">Technical</option>
                  <option value="Professional">Professional</option>
                </select>
              </div>

              <div>
                <label className="form-label">Tool / Domain</label>
                <select
                  value={manualTool}
                  onChange={(e) => setManualTool(e.target.value)}
                  className="form-input"
                >
                  {TOOLS_LIST.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="SoftSkills">SoftSkills</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Week (1–16)</label>
                <select
                  value={manualWeek}
                  onChange={(e) => setManualWeek(e.target.value)}
                  className="form-input"
                >
                  {Array.from({ length: 16 }, (_, i) => i + 1).map(w => (
                    <option key={w} value={w}>Week {w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Day (1–5)</label>
                <select
                  value={manualDay}
                  onChange={(e) => setManualDay(e.target.value)}
                  className="form-input"
                >
                  {[1, 2, 3, 4, 5].map(d => (
                    <option key={d} value={d}>Day {d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Assignment Title *</label>
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="e.g. Week 6 Day 1 SQL Window Functions Drill"
                className="form-input"
                required
              />
            </div>
          </div>
        )}

        {/* Deadline Overdue Warning Banner */}
        {isDeadlineLocked && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-800">
            <Lock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-red-900">Submission Locked: Deadline Passed</h4>
              <p>
                The due date for this assignment has elapsed. The portal no longer accepts submissions for this task.
                Please contact your cohort coach if you need an extension.
              </p>
            </div>
          </div>
        )}

        {/* File Upload Zone */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="form-label">Upload Your Solution File *</label>
            <div className={isDeadlineLocked ? 'opacity-40 pointer-events-none select-none' : ''}>
              <FileUploader
                onFilesSelected={(files) => setSelectedFile(files[0] || null)}
                multiple={false}
                maxFiles={maxFiles}
                acceptedFormats={allowedExtensions}
                helperText="Upload your completed solution (.xlsx, .sql, .pbix, .py, .pdf, etc.)"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || isDeadlineLocked || !selectedFile}
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
    </div>
  );
}
