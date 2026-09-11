import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createAssignment, notifyStudentsOfAssignment } from '../../services/api';
import { filesToBase64Array } from '../../components/FileUploader';
import { TOOLS_LIST } from '../../utils/constants';
import {
  FilePlus,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
  Send,
  ArrowRight,
  FileText,
  X,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export default function CreateAssignment() {
  const { user } = useAuth();
  const coachID = user?.coachID || user?.id || user?.studentID || user?.name || 'COACH';

  // Form State
  const [type, setType] = useState('Assignment'); // 'Assignment' | 'ModuleProject'
  const [category, setCategory] = useState('Technical'); // 'Technical' | 'Professional'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [tool, setTool] = useState('Excel');
  const [weekNumber, setWeekNumber] = useState(6);
  const [dayNumber, setDayNumber] = useState(1);
  const [monthNumber, setMonthNumber] = useState(1);
  const [maxScore, setMaxScore] = useState(10);
  const [allowedFileTypes, setAllowedFileTypes] = useState('.xlsx,.pdf,.sql,.pbix,.py');
  const [maxFilesAllowed, setMaxFilesAllowed] = useState(1);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Materials Upload (max 3 files)
  const [materialsFiles, setMaterialsFiles] = useState([]);

  // Status & Notification
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdAssignmentID, setCreatedAssignmentID] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(null);

  const handleMaterialFileChange = (e) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    if (materialsFiles.length + selected.length > 3) {
      setError('You can upload a maximum of 3 starter materials.');
      return;
    }
    setError(null);
    setMaterialsFiles(prev => [...prev, ...selected].slice(0, 3));
  };

  const removeMaterial = (index) => {
    setMaterialsFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide an assignment title.');
      return;
    }
    if (!dueDate) {
      setError('Please select a due date & deadline.');
      return;
    }

    setLoading(true);
    try {
      // Convert materials to base64 array
      let materialsArray = [];
      if (materialsFiles.length > 0) {
        materialsArray = await filesToBase64Array(materialsFiles);
      }

      const activeTool = category === 'Technical' ? tool : 'SoftSkills';
      const activeWeek = type === 'Assignment' ? Number(weekNumber) : null;
      const activeDay = type === 'Assignment' ? Number(dayNumber) : null;
      const activeMonth = type === 'ModuleProject' ? Number(monthNumber) : null;

      const res = await createAssignment(
        type,
        category,
        title.trim(),
        description.trim(),
        deliverables.trim(),
        activeTool,
        activeWeek,
        activeDay,
        activeMonth,
        Number(maxScore) || 10,
        allowedFileTypes.trim(),
        Number(maxFilesAllowed) || 1,
        dueDate,
        notes.trim(),
        materialsArray,
        coachID
      );

      if (res && res.success !== false) {
        const generatedID = res.assignmentID || res.data?.assignmentID || `ASGN-${Date.now()}`;
        setCreatedAssignmentID(generatedID);
        setShowSuccessToast(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(res?.message || 'Failed to create assignment. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Error connecting to portal backend. Please check network.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyStudents = async () => {
    if (!createdAssignmentID) return;
    setNotifying(true);
    try {
      const res = await notifyStudentsOfAssignment(createdAssignmentID);
      if (res && res.success !== false) {
        setNotificationStatus('Notification broadcast triggered to student emails!');
      } else {
        setNotificationStatus(res?.message || 'Email notifications queued.');
      }
    } catch (err) {
      console.error(err);
      setNotificationStatus('Unable to reach email service, but assignment remains active.');
    } finally {
      setNotifying(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDeliverables('');
    setDueDate('');
    setNotes('');
    setMaterialsFiles([]);
    setCreatedAssignmentID(null);
    setShowSuccessToast(false);
    setNotificationStatus(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      {/* Floating Success Toast / Pop-up Badge */}
      {showSuccessToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 animate-bounce-in max-w-sm w-full bg-white border-2 border-emerald-400 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Task Created Successfully!</span>
              <span className="text-xs">🎉</span>
            </h4>
            <p className="text-xs text-slate-600">
              ID: <strong className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{createdAssignmentID}</strong>
            </p>
            <div className="flex items-center gap-3 pt-1 text-xs">
              <button
                type="button"
                onClick={handleNotifyStudents}
                disabled={notifying || notificationStatus}
                className="font-bold text-brand-primary hover:underline"
              >
                {notifying ? 'Sending...' : 'Email Students'}
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={() => setShowSuccessToast(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSuccessToast(false)}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-brand-neutral">Create Assignment & Project</h1>
            <span className="badge-primary text-xs">Instructor</span>
          </div>
          <p className="text-sm text-brand-neutral-muted mt-1">
            Publish class assignments or module projects with downloadable materials, deadlines, and submission rules.
          </p>
        </div>
        <Link
          to="/coach/manage-assignments"
          className="btn-secondary text-xs self-start sm:self-auto flex items-center gap-2"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Manage Existing</span>
        </Link>
      </div>

      {/* Success Notification Banner */}
      {createdAssignmentID && (
        <div className="portal-card bg-emerald-50/90 border-2 border-emerald-300 p-6 space-y-4 shadow-sm animate-pulse-subtle">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-emerald-900">Assignment Successfully Created!</h3>
              <p className="text-xs text-emerald-700">
                Assignment ID: <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">{createdAssignmentID}</strong>
              </p>
              <p className="text-xs text-emerald-600">
                Students can now view this assignment in their dashboard and submit solutions before the deadline.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleNotifyStudents}
              disabled={notifying || notificationStatus}
              className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{notifying ? 'Sending Notifications...' : 'Send Notification Emails to Students'}</span>
            </button>

            <Link
              to="/coach/manage-assignments"
              className="btn-secondary py-2 px-4 text-xs font-semibold flex items-center gap-2"
            >
              <span>View in Assignment Roster</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1"
            >
              + Create Another Assignment
            </button>
          </div>

          {notificationStatus && (
            <p className="text-xs font-medium text-emerald-800 bg-white/70 p-2.5 rounded-lg border border-emerald-200">
              {notificationStatus}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-brand-error/20 rounded-xl text-brand-error flex items-start gap-2 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Creation Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Type & Scope */}
        <div className="portal-card space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">1. Assignment Classification</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="form-label">Deliverable Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="form-input"
              >
                <option value="Assignment">Daily / Weekly Assignment</option>
                <option value="ModuleProject">Monthly Module Project</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="form-label">Curriculum Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-input"
              >
                <option value="Technical">Technical (Excel, SQL, PowerBI, Python)</option>
                <option value="Professional">Professional (Soft Skills, Presentation, Report)</option>
              </select>
            </div>
          </div>

          {/* Dynamic Timing Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            {type === 'Assignment' ? (
              <>
                <div>
                  <label className="form-label">Week Number (1–16)</label>
                  <select
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(e.target.value)}
                    className="form-input"
                  >
                    {Array.from({ length: 16 }, (_, i) => i + 1).map(w => (
                      <option key={w} value={w}>Week {w}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Day Number (1–5)</label>
                  <select
                    value={dayNumber}
                    onChange={(e) => setDayNumber(e.target.value)}
                    className="form-input"
                  >
                    {[1, 2, 3, 4, 5].map(d => (
                      <option key={d} value={d}>Day {d}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div>
                <label className="form-label">Month Number (1–4)</label>
                <select
                  value={monthNumber}
                  onChange={(e) => setMonthNumber(e.target.value)}
                  className="form-input"
                >
                  {[1, 2, 3, 4].map(m => (
                    <option key={m} value={m}>Month {m}</option>
                  ))}
                </select>
              </div>
            )}

            {category === 'Technical' && (
              <div>
                <label className="form-label">Analytics Tool</label>
                <select
                  value={tool}
                  onChange={(e) => setTool(e.target.value)}
                  className="form-input"
                >
                  {TOOLS_LIST.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="SoftSkills">SoftSkills</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Title, Description & Deliverables */}
        <div className="portal-card space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">2. Content & Deliverables</h2>

          <div>
            <label className="form-label">Assignment Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sales Funnel Pivot Table & Customer Cohort Analysis"
              className="form-input"
              required
            />
          </div>

          <div>
            <label className="form-label">Detailed Description / Instructions</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the background scenario, problem statement, and requirements..."
              className="form-input resize-y"
            />
          </div>

          <div>
            <label className="form-label">Expected Deliverables</label>
            <textarea
              rows={3}
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              placeholder="e.g. 1. Cleaned Excel workbook (.xlsx), 2. Brief executive summary slides (.pdf)"
              className="form-input resize-y"
            />
          </div>
        </div>

        {/* Section 3: Deadlines, Rules & Restrictions */}
        <div className="portal-card space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">3. Deadlines & Submission Constraints</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-secondary" />
                <span>Due Date & Time *</span>
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="form-input"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">Past deadlines will be locked for submissions</p>
            </div>

            <div>
              <label className="form-label">Max Score (Points)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Max Files Allowed</label>
              <select
                value={maxFilesAllowed}
                onChange={(e) => setMaxFilesAllowed(Number(e.target.value))}
                className="form-input"
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'file' : 'files'}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="form-label">Allowed File Extensions</label>
              <input
                type="text"
                value={allowedFileTypes}
                onChange={(e) => setAllowedFileTypes(e.target.value)}
                placeholder=".xlsx, .pdf, .sql, .pbix, .py"
                className="form-input font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">Comma-separated list (e.g. .xlsx,.pdf,.sql)</p>
            </div>

            <div>
              <label className="form-label">Coach Notes / Assessment Hints (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal scoring tips or student reminders"
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Starter Materials Upload (Datasets, Briefs, Templates) */}
        <div className="portal-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">4. Starter Materials / Datasets</h2>
            <div className="flex items-center gap-1 text-xs text-brand-neutral-muted" title="Materials are files students can download (brief, starter files, datasets)">
              <HelpCircle className="w-3.5 h-3.5 text-brand-primary" />
              <span>Info</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-brand-primary-dark flex items-start gap-2">
            <Info className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
            <p>
              Upload up to <strong>3 starter files</strong> (such as problem datasets, starter workbooks, or rubrics).
              Students can download these directly from their assignment page.
            </p>
          </div>

          {materialsFiles.length < 3 && (
            <div>
              <label className="border-2 border-dashed border-slate-200 hover:border-brand-primary rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-white">
                <UploadCloud className="w-6 h-6 text-brand-primary mb-1" />
                <span className="text-xs font-semibold text-slate-700">Choose Starter File</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Excel, CSV, PDF, Zip (Max 3 files)</span>
                <input
                  type="file"
                  onChange={handleMaterialFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {materialsFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600">Attached Materials ({materialsFiles.length}/3):</p>
              <div className="space-y-1.5">
                {materialsFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-brand-primary flex-shrink-0" />
                      <span className="font-medium text-slate-700 truncate">{file.name}</span>
                      <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMaterial(idx)}
                      className="text-slate-400 hover:text-red-600 p-1"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/coach/manage-assignments"
            className="btn-secondary px-5 py-2.5 text-sm"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-7 py-2.5 text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Publishing Assignment...</span>
              </>
            ) : (
              <>
                <FilePlus className="w-4 h-4" />
                <span>Publish Assignment</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
