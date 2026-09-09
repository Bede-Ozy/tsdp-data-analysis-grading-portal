import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Utility: Convert a single file to Base64 (without data URL prefix)
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Utility: Convert multiple files into an array of { name, content } objects
 */
export async function filesToBase64Array(files) {
  const base64Array = [];
  for (const file of files) {
    const base64 = await fileToBase64(file);
    base64Array.push({
      name: file.name,
      content: base64
    });
  }
  return base64Array;
}

export default function FileUploader({
  onFilesSelected,
  multiple = false,
  maxFiles = 5,
  maxSizeMB = 25,
  acceptedFormats = ".xlsx, .xls, .csv, .sql, .pbix, .py, .ipynb, .pdf, .docx, .zip",
  helperText = "Drag and drop your assignment or project files here, or browse"
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFiles = (filesList) => {
    setError(null);
    const files = Array.from(filesList);

    if (!multiple && files.length > 1) {
      setError("Please select only one file for this assignment.");
      return;
    }

    if (multiple && (selectedFiles.length + files.length) > maxFiles) {
      setError(`You can upload a maximum of ${maxFiles} files.`);
      return;
    }

    // Size validation
    for (const f of files) {
      if (f.size > maxSizeMB * 1024 * 1024) {
        setError(`File "${f.name}" exceeds the ${maxSizeMB}MB size limit.`);
        return;
      }
    }

    const updated = multiple ? [...selectedFiles, ...files] : files;
    setSelectedFiles(updated);
    if (onFilesSelected) {
      onFilesSelected(updated);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    if (onFilesSelected) {
      onFilesSelected(updated);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full space-y-3">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-brand-primary bg-brand-primary-light/50 scale-[1.005]'
            : 'border-brand-neutral-border hover:border-brand-primary hover:bg-gray-50/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={acceptedFormats}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-brand-primary-light flex items-center justify-center text-brand-primary">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-neutral">
              Click to upload <span className="font-normal text-brand-neutral-muted">or drag & drop</span>
            </p>
            <p className="text-xs text-brand-neutral-muted mt-1">{helperText}</p>
          </div>
          <p className="text-[11px] text-gray-400">
            Supported: Excel, SQL, PowerBI, Python, PDF (Max {maxSizeMB}MB {multiple ? `· Up to ${maxFiles} files` : ''})
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-brand-error/20 rounded-lg text-brand-error text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-brand-neutral uppercase tracking-wider">
            Selected {multiple ? `Files (${selectedFiles.length}/${maxFiles})` : 'File'}
          </p>
          <div className="space-y-1.5">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-gray-50 border border-brand-neutral-border rounded-lg text-sm"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <File className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  <span className="font-medium text-brand-neutral truncate max-w-xs">{file.name}</span>
                  <span className="text-xs text-brand-neutral-muted">({formatFileSize(file.size)})</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="text-gray-400 hover:text-brand-error transition-colors p-1"
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
  );
}
