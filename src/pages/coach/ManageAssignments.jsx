import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getActiveAssignments, notifyStudentsOfAssignment, closeAssignment } from '../../services/api';
import { TableSkeleton } from '../../components/SkeletonLoader';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Send,
  Lock,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  ExternalLink,
  Download,
  Clock,
  X,
  CheckCircle2,
  FileBox
} from 'lucide-react';

export default function ManageAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All'); // 'All' | 'Technical' | 'Professional'
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Closed'

  // Modal View State
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Action Loading States
  const [notifyingId, setNotifyingId] = useState(null);
  const [closingId, setClosingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getActiveAssignments();
      if (res && res.success !== false) {
        const list = Array.isArray(res) ? res : (res.data || res.assignments || []);
        setAssignments(list);
      } else {
        setError(res?.message || 'Unable to load assignments roster.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error loading assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNotify = async (assignmentID) => {
    setNotifyingId(assignmentID);
    setActionSuccess(null);
    try {
      const res = await notifyStudentsOfAssignment(assignmentID);
      if (res && res.success !== false) {
        setActionSuccess(`Notification emails sent for assignment ${assignmentID}`);
      } else {
        setError(res?.message || 'Could not send notifications.');
      }
    } catch (err) {
      console.error(err);
      setError('Error triggering student notification emails.');
    } finally {
      setNotifyingId(null);
    }
  };

  const handleClose = async (assignmentID) => {
    if (!window.confirm(`Are you sure you want to close assignment ${assignmentID}? Submissions will be locked.`)) {
      return;
    }
    setClosingId(assignmentID);
    setActionSuccess(null);
    try {
      const res = await closeAssignment(assignmentID);
      if (res && res.success !== false) {
        setActionSuccess(`Assignment ${assignmentID} has been closed.`);
        // Update state locally
        setAssignments(prev =>
          prev.map(a => (a.assignmentID === assignmentID || a.id === assignmentID ? { ...a, status: 'Closed' } : a))
        );
        if (selectedAssignment?.assignmentID === assignmentID) {
          setSelectedAssignment(prev => ({ ...prev, status: 'Closed' }));
        }
      } else {
        setError(res?.message || 'Could not close assignment.');
      }
    } catch (err) {
      console.error(err);
      setError('Error closing assignment.');
    } finally {
      setClosingId(null);
    }
  };

  // Filter assignments
  const filteredAssignments = assignments.filter((a) => {
    const title = (a.title || a.assignmentTitle || '').toLowerCase();
    const tool = (a.tool || '').toLowerCase();
    const id = (a.assignmentID || a.id || '').toLowerCase();
    const matchesSearch = title.includes(search.toLowerCase()) || tool.includes(search.toLowerCase()) || id.includes(search.toLowerCase());

    const cat = a.category || 'Technical';
    const matchesCategory = categoryFilter === 'All' || cat.toLowerCase() === categoryFilter.toLowerCase();

    const status = a.status || (a.isClosed ? 'Closed' : 'Active');
    const matchesStatus = statusFilter === 'All' || status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-brand-neutral">Manage Assignments & Projects</h1>
            <span className="badge-primary text-xs">Instructor Operations</span>
          </div>
          <p className="text-sm text-brand-neutral-muted mt-1">
            Monitor active syllabus assignments, trigger email announcements, or close completed deadlines.
          </p>
        </div>

        <Link
          to="/coach/create-assignment"
          className="btn-primary py-2.5 px-4 text-xs font-semibold self-start sm:self-auto flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Assignment</span>
        </Link>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-brand-error/20 rounded-xl text-brand-error flex items-start gap-2 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table Card */}
      <div className="portal-card space-y-4">
        {/* Controls Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, tool, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs py-2 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-primary w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Category:</span>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-primary"
            >
              <option value="All">All Categories</option>
              <option value="Technical">Technical</option>
              <option value="Professional">Professional</option>
            </select>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-primary"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Assignments Table */}
        {loading ? (
          <TableSkeleton rows={6} />
        ) : (
          <div className="overflow-x-auto">
            {filteredAssignments.length === 0 ? (
              <div className="py-12 text-center text-xs text-brand-neutral-muted space-y-2">
                <FileBox className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No assignments found matching your search or filters.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 text-slate-400 uppercase font-semibold">
                    <th className="py-2.5 px-3">Title & Classification</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Tool</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-center">Submissions</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssignments.map((asgn, idx) => {
                    const id = asgn.assignmentID || asgn.id || `ASGN-${idx}`;
                    const status = asgn.status || (asgn.isClosed ? 'Closed' : 'Active');
                    const isClosed = status.toLowerCase() === 'closed';
                    const category = asgn.category || 'Technical';
                    const submissionsCount = asgn.totalSubmissions ?? asgn.submissionsCount ?? '—';

                    return (
                      <tr key={id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 line-clamp-1">
                            {asgn.title || asgn.assignmentTitle || 'Untitled Assignment'}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                            <span className="font-mono text-brand-primary">{id}</span>
                            {asgn.weekNumber && <span>· W{asgn.weekNumber}D{asgn.dayNumber || 1}</span>}
                            {asgn.monthNumber && <span>· M{asgn.monthNumber}</span>}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                            category === 'Technical'
                              ? 'bg-blue-50 text-brand-primary border border-blue-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {category}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-medium text-slate-700">
                          {asgn.tool || '—'}
                        </td>

                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {asgn.dueDate ? new Date(asgn.dueDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'No deadline'}
                        </td>

                        <td className="py-3 px-3 text-center font-bold text-slate-700">
                          {submissionsCount}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isClosed
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {/* View Details */}
                            <button
                              type="button"
                              onClick={() => setSelectedAssignment(asgn)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-primary hover:bg-blue-50 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Notify Students */}
                            <button
                              type="button"
                              onClick={() => handleNotify(id)}
                              disabled={notifyingId === id || isClosed}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-secondary hover:bg-orange-50 transition-colors disabled:opacity-40"
                              title="Send Email Notifications"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>

                            {/* Close Assignment */}
                            <button
                              type="button"
                              onClick={() => handleClose(id)}
                              disabled={closingId === id || isClosed}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                              title={isClosed ? 'Assignment Closed' : 'Close Assignment'}
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>

                            {/* Copy ID */}
                            <button
                              type="button"
                              onClick={() => handleCopyId(id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Copy Assignment ID"
                            >
                              {copiedId === id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Assignment Detail Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge-primary text-xs">{selectedAssignment.category || 'Technical'}</span>
                  <span className="font-mono text-xs text-slate-400">
                    {selectedAssignment.assignmentID || selectedAssignment.id}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedAssignment.title || selectedAssignment.assignmentTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Timing & Meta Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Tool</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedAssignment.tool || 'SoftSkills'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Max Score</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedAssignment.maxScore || 10} pts</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Max Files</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedAssignment.maxFilesAllowed || 1} file(s)</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Status</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedAssignment.status || 'Active'}</p>
              </div>
            </div>

            {/* Due Date Banner */}
            <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl flex items-center justify-between text-xs text-brand-secondary-dark">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-secondary" />
                <span>
                  Due Date: <strong>{selectedAssignment.dueDate ? new Date(selectedAssignment.dueDate).toLocaleString() : 'No deadline'}</strong>
                </span>
              </div>
            </div>

            {/* Description */}
            {selectedAssignment.description && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h4>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  {selectedAssignment.description}
                </p>
              </div>
            )}

            {/* Deliverables */}
            {selectedAssignment.deliverables && (
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Deliverables</h4>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  {selectedAssignment.deliverables}
                </p>
              </div>
            )}

            {/* Allowed Files */}
            {selectedAssignment.allowedFileTypes && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Allowed File Types</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAssignment.allowedFileTypes.split(',').map((ext, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200">
                      {ext.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Materials Download Links if available */}
            {selectedAssignment.materials && Array.isArray(selectedAssignment.materials) && selectedAssignment.materials.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Starter Materials</h4>
                <div className="space-y-1.5">
                  {selectedAssignment.materials.map((mat, i) => (
                    <a
                      key={i}
                      href={mat.url || mat.downloadUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-brand-primary hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand-primary" />
                        <span className="font-semibold">{mat.name || `Material ${i + 1}`}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="btn-secondary px-4 py-2 text-xs"
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
