import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { handleTechnicalFileUpload, handleProfessionalFileUpload } from '../../services/api';
import FileUploader, { fileToBase64 } from '../../components/FileUploader';
import CustomSelect from '../../components/CustomSelect';
import { TOOLS_LIST } from '../../utils/constants';
import { Upload, CheckCircle2, AlertCircle, FileCheck } from 'lucide-react';

export default function SubmitAssignment() {
  const { user } = useAuth();
  const [assignmentType, setAssignmentType] = useState('Technical'); // 'Technical' | 'Professional'
  const [weekNumber, setWeekNumber] = useState(6);
  const [dayNumber, setDayNumber] = useState(1);
  const [toolOrTopic, setToolOrTopic] = useState('Excel');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessResult(null);

    if (!assignmentTitle.trim()) {
      setError('Please provide an Assignment Title.');
      return;
    }

    if (!selectedFile) {
      setError('Please select or drop a solution file to upload.');
      return;
    }

    setLoading(true);
    try {
      const studentNum = user?.studentNumber || user?.studentID || '';
      const assignmentID = `ASGN-W${weekNumber}D${dayNumber}-${Date.now()}`;
      const fileBase64 = await fileToBase64(selectedFile);

      let res;
      if (assignmentType === 'Technical') {
        res = await handleTechnicalFileUpload(
          studentNum,
          assignmentID,
          Number(weekNumber),
          Number(dayNumber),
          toolOrTopic,
          assignmentTitle,
          fileBase64,
          selectedFile.name
        );
      } else {
        res = await handleProfessionalFileUpload(
          studentNum,
          assignmentID,
          Number(weekNumber),
          Number(dayNumber),
          toolOrTopic,
          assignmentTitle,
          fileBase64,
          selectedFile.name
        );
      }

      if (res && res.success) {
        setSuccessResult(res);
        setAssignmentTitle('');
        setSelectedFile(null);
      } else {
        setError(res?.message || 'Failed to submit assignment. Please try again.');
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
      <div>
        <h1 className="text-2xl font-bold text-brand-neutral">Submit Assignment</h1>
        <p className="text-sm text-brand-neutral-muted mt-1">
          Upload your daily and weekly Technical or Professional class assignments for coach evaluation.
        </p>
      </div>

      {successResult && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-brand-success space-y-2">
          <div className="flex items-center gap-2 font-bold text-base">
            <CheckCircle2 className="w-5 h-5 text-brand-primary" />
            <span>Assignment Successfully Uploaded!</span>
          </div>
          <p className="text-xs">{successResult.message}</p>
          <p className="text-[11px] text-gray-500">Submission ID: {successResult.submissionID}</p>
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
          {/* Assignment Category Tabs */}
          <div>
            <label className="form-label">Assignment Category</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setAssignmentType('Technical');
                  setToolOrTopic('Excel');
                }}
                className={`py-2.5 px-4 rounded-lg font-bold text-sm border transition-all ${
                  assignmentType === 'Technical'
                    ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                    : 'bg-gray-50 text-brand-neutral border-gray-200 hover:bg-gray-100'
                }`}
              >
                Technical Assignment (10%)
              </button>

              <button
                type="button"
                onClick={() => {
                  setAssignmentType('Professional');
                  setToolOrTopic('Communication & Presentation');
                }}
                className={`py-2.5 px-4 rounded-lg font-bold text-sm border transition-all ${
                  assignmentType === 'Professional'
                    ? 'bg-brand-secondary text-white border-brand-secondary shadow-xs'
                    : 'bg-gray-50 text-brand-neutral border-gray-200 hover:bg-gray-100'
                }`}
              >
                Professional Assignment (5%)
              </button>
            </div>
          </div>

          {/* Week & Day selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Week Number</label>
              <CustomSelect
                value={weekNumber}
                onChange={(val) => setWeekNumber(Number(val))}
                options={Array.from({ length: 16 }, (_, i) => ({
                  value: i + 1,
                  label: `Week ${i + 1}`
                }))}
              />
            </div>

            <div>
              <label className="form-label">Day Number</label>
              <CustomSelect
                value={dayNumber}
                onChange={(val) => setDayNumber(Number(val))}
                options={[1, 2, 3, 4, 5].map((d) => ({
                  value: d,
                  label: `Day ${d}`
                }))}
              />
            </div>

            <div>
              <label className="form-label">
                {assignmentType === 'Technical' ? 'Software Tool' : 'Topic Track'}
              </label>
              {assignmentType === 'Technical' ? (
                <CustomSelect
                  value={toolOrTopic}
                  onChange={(val) => setToolOrTopic(val)}
                  options={TOOLS_LIST.map((t) => ({
                    value: t,
                    label: t
                  }))}
                />
              ) : (
                <input
                  type="text"
                  value={toolOrTopic}
                  onChange={(e) => setToolOrTopic(e.target.value)}
                  placeholder="e.g. Stakeholder Reports"
                  className="form-input"
                />
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="form-label">
              Assignment Title <span className="text-brand-error">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Week 6 Day 1: Advanced Nested Index-Match Analysis"
              value={assignmentTitle}
              onChange={(e) => setAssignmentTitle(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* File Upload Component */}
          <div>
            <label className="form-label">
              Attach Solution File (.xlsx, .pbix, .sql, .py, .pdf) <span className="text-brand-error">*</span>
            </label>
            <FileUploader
              multiple={false}
              onFilesSelected={(files) => setSelectedFile(files[0] || null)}
              helperText="Upload your completed solution spreadsheet, script, or documentation"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !selectedFile}
            className="w-full btn-primary py-3 font-bold text-sm shadow-md"
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <FileCheck className="w-4 h-4 animate-bounce" />
                Encoding Base64 & Uploading to Drive...
              </span>
            ) : (
              <span className="flex items-center gap-2 justify-center">
                <Upload className="w-4 h-4" />
                Submit Assignment to Coach
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
