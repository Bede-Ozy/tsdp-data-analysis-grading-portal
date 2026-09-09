import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { handleModuleProjectUpload } from '../../services/api';
import FileUploader, { filesToBase64Array } from '../../components/FileUploader';
import { MODULES } from '../../utils/constants';
import { FolderArchive, CheckCircle2, AlertCircle, FileStack } from 'lucide-react';

export default function SubmitModuleProject() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [projectTitle, setProjectTitle] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const activeModule = MODULES.find(m => m.month === Number(selectedMonth)) || MODULES[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!projectTitle.trim()) {
      setError('Please provide your Project Title.');
      return;
    }

    if (!files || files.length === 0) {
      setError('Please attach at least one project file (up to 5 files allowed).');
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

      if (res && res.success) {
        setResult(res);
        setProjectTitle('');
        setFiles([]);
      } else {
        setError(res?.message || 'Failed to submit module project.');
      }
    } catch (err) {
      console.error(err);
      setError('Error converting and uploading project bundle to Drive. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-neutral">Submit Monthly Module Project</h1>
        <p className="text-sm text-brand-neutral-muted mt-1">
          Module projects contribute <strong>20%</strong> to your final grading score. You may upload up to 5 project files (dataset, queries, dashboard, slides).
        </p>
      </div>

      {result && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-brand-success space-y-2">
          <div className="flex items-center gap-2 font-bold text-base">
            <CheckCircle2 className="w-5 h-5 text-brand-primary" />
            <span>Project Package Successfully Submitted!</span>
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
            className="w-full btn-secondary py-3 font-bold text-sm shadow-md"
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
    </div>
  );
}
