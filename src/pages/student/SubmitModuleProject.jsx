import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { handleModuleProjectUpload } from '../../services/api';
import FileUploader, { filesToBase64Array } from '../../components/FileUploader';
import { MODULES } from '../../utils/constants';
import { FolderArchive, CheckCircle2, AlertCircle, FileStack, X, ArrowRight, Sparkles } from 'lucide-react';

export default function SubmitModuleProject() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [projectTitle, setProjectTitle] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState(null);

  const activeModule = MODULES.find(m => m.month === Number(selectedMonth)) || MODULES[0];

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
      setError('Please attach at least one project file (up to 5 files allowed).');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      const studentNum = user?.studentNumber || user?.studentID || '';
      const filesArray = await filesToBase64Array(files);

      const res = await handleModuleProjectUpload(
        studentNum,
        Number(selectedMonth),
        activeModule.tool,
        projectTitle,
        filesArray
      );

      if (res && res.success !== false) {
        setResult(res);
        setShowSuccessModal(true);
        setProjectTitle('');
        setFiles([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(res?.message || 'Failed to submit module project.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
      setError('Error converting and uploading project bundle to Drive. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-neutral">Submit Monthly Module Project</h1>
          <p className="text-sm text-brand-neutral-muted mt-1">
            Module projects contribute <strong>20%</strong> to your final grading score. You may upload up to 5 project files (dataset, queries, dashboard, slides).
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

      {result && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-base text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Project Package Successfully Submitted!</span>
          </div>
          <p className="text-xs text-emerald-700">{result.message}</p>
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
          {/* Module Selector */}
          <div>
            <label className="form-label">Select Month & Curriculum Module</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MODULES.map((m) => (
                <button
                  key={m.month}
                  type="button"
                  onClick={() => setSelectedMonth(m.month)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedMonth === m.month
                      ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                      : 'bg-gray-50 text-brand-neutral border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-[10px] block font-medium uppercase opacity-80">Month {m.month}</span>
                  <span className="text-sm font-semibold block">{m.tool}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-brand-neutral-muted mt-2">
              Focus: <span className="font-semibold text-brand-neutral">{activeModule.title}</span>
            </p>
          </div>

          {/* Project Title */}
          <div>
            <label className="form-label">
              Project Title <span className="text-brand-error">*</span>
            </label>
            <input
              type="text"
              placeholder={`e.g., Comprehensive ${activeModule.tool} Business Performance Analysis`}
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* Multi-File Upload Component */}
          <div>
            <label className="form-label">
              Attach Project Deliverables (Up to 5 files) <span className="text-brand-error">*</span>
            </label>
            <FileUploader
              multiple={true}
              maxFiles={5}
              maxSizeMB={30}
              onFilesSelected={(selected) => setFiles(selected)}
              helperText="Upload your workbook, scripts (.sql/.py), PDF executive summary or slide decks"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || files.length === 0}
            className="w-full btn-secondary py-3 font-bold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <FileStack className="w-4 h-4 animate-bounce" />
                Bundling {files.length} Files to Google Drive...
              </span>
            ) : (
              <span className="flex items-center gap-2 justify-center">
                <FolderArchive className="w-4 h-4" />
                Submit Module {selectedMonth} Project Bundle
              </span>
            )}
          </button>
        </form>
      </div>

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
                Submit Another Deliverable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
