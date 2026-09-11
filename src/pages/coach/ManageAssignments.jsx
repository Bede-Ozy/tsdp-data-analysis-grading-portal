import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getAllAssignments,
  notifyStudentsOfAssignment,
  closeAssignment,
  updateAssignment,
  deleteAssignment,
  restoreAssignment,
  getAssignmentSubmissionCount
} from '../../services/api';
import { TableSkeleton } from '../../components/SkeletonLoader';
import { TOOLS_LIST } from '../../utils/constants';
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
  AlertTriangle,
  ExternalLink,
  Download,
  Clock,
  X,
  CheckCircle2,
  FileBox,
  Pencil,
  Trash2,
  RotateCcw,
  Save
} from 'lucide-react';

export default function ManageAssignments() {
  const { user } = useAuth();
  const coachID = user?.coachID || user?.id || user?.email || 'COACH-01';

  const [assignments, setAssignments] = useState([]);
  const [submissionCounts, setSubmissionCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All'); // 'All' | 'Technical' | 'Professional'
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Active' | 'Closed' | 'Deleted'

  // Modal States
  const [selectedAssignment, setSelectedAssignment] = useState(null); // View Details Modal
  const [editingAssignment, setEditingAssignment] = useState(null); // Edit Modal
  const [deletingAssignment, setDeletingAssignment] = useState(null); // Delete Confirm Dialog

  // Edit Form State
  const [editForm, setEditForm] = useState({
    title: '',
    category: 'Technical',
    tool: 'Excel',
    deliverables: '',
    description: '',
    dueDate: '',
    maxScore: 10,
    allowedFileTypes: '',
    maxFilesAllowed: 1,
    status: 'Active',
    notes: ''
  });
  const [checkingSubmissions, setCheckingSubmissions] = useState(false);
  const [editSubmissionsCount, setEditSubmissionsCount] = useState(0);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  // Delete State
  const [deleteSubmissionsCount, setDeleteSubmissionsCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Action Loading States
  const [notifyingId, setNotifyingId] = useState(null);
  const [closingId, setClosingId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllAssignments();
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

  // Fetch submission counts for items that don't have it explicitly populated
  useEffect(() => {
    if (assignments.length > 0) {
      assignments.forEach((asgn) => {
        const id = asgn.assignmentID || asgn.id;
        if (id && asgn.submissionsCount === undefined && asgn.totalSubmissions === undefined && submissionCounts[id] === undefined) {
          getAssignmentSubmissionCount(id)
            .then((res) => {
              const count = typeof res === 'number' ? res : (res?.count ?? res?.submissionCount ?? res?.data?.count ?? 0);
              setSubmissionCounts(prev => ({ ...prev, [id]: count }));
            })
            .catch(() => {});
        }
      });
    }
  }, [assignments]);

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

  // --- EDIT ASSIGNMENT FLOW ---
  const handleOpenEdit = async (asgn) => {
    setEditingAssignment(asgn);
    setEditError(null);
    const asgnID = asgn.assignmentID || asgn.id;

    let formattedDate = '';
    if (asgn.dueDate) {
      const d = new Date(asgn.dueDate);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toISOString().slice(0, 16);
      }
    }

    setEditForm({
      title: asgn.title || asgn.assignmentTitle || '',
      category: asgn.category || 'Technical',
      tool: asgn.tool || 'Excel',
      deliverables: asgn.deliverables || '',
      description: asgn.description || '',
      dueDate: formattedDate,
      maxScore: asgn.maxScore ?? 10,
      allowedFileTypes: asgn.allowedFileTypes || '.xlsx, .pdf, .sql, .pbix, .py, .ipynb, .docx, .zip',
      maxFilesAllowed: asgn.maxFilesAllowed ?? 1,
      status: asgn.status || (asgn.isClosed ? 'Closed' : 'Active'),
      notes: asgn.notes || ''
    });

    // Fetch submission count for warning
    setCheckingSubmissions(true);
    try {
      const res = await getAssignmentSubmissionCount(asgnID);
      const count = typeof res === 'number' ? res : (res?.count ?? res?.submissionCount ?? res?.data?.count ?? 0);
      setEditSubmissionsCount(count);
      setSubmissionCounts(prev => ({ ...prev, [asgnID]: count }));
    } catch (err) {
      console.error('Error fetching submission count:', err);
      setEditSubmissionsCount(submissionCounts[asgnID] || 0);
    } finally {
      setCheckingSubmissions(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingAssignment) return;
    setSavingEdit(true);
    setEditError(null);

    try {
      const asgnID = editingAssignment.assignmentID || editingAssignment.id;
      const updates = {
        title: editForm.title.trim(),
        category: editForm.category,
        tool: editForm.tool,
        deliverables: editForm.deliverables,
        description: editForm.description,
        dueDate: editForm.dueDate,
        maxScore: Number(editForm.maxScore),
        allowedFileTypes: editForm.allowedFileTypes,
        maxFilesAllowed: Number(editForm.maxFilesAllowed),
        status: editForm.status,
        notes: editForm.notes
      };

      const res = await updateAssignment(asgnID, updates, coachID);
      if (res && res.success !== false) {
        setActionSuccess(`Assignment "${editForm.title}" updated successfully.`);
        setEditingAssignment(null);
        await fetchAssignments();
      } else {
        setEditError(res?.message || 'Failed to update assignment.');
      }
    } catch (err) {
      console.error(err);
      setEditError('Error saving assignment updates. Please check network.');
    } finally {
      setSavingEdit(false);
    }
  };

  // --- DELETE ASSIGNMENT FLOW ---
  const handleOpenDelete = async (asgn) => {
    setDeletingAssignment(asgn);
    const asgnID = asgn.assignmentID || asgn.id;
    try {
      const res = await getAssignmentSubmissionCount(asgnID);
      const count = typeof res === 'number' ? res : (res?.count ?? res?.submissionCount ?? res?.data?.count ?? 0);
      setDeleteSubmissionsCount(count);
      setSubmissionCounts(prev => ({ ...prev, [asgnID]: count }));
    } catch {
      setDeleteSubmissionsCount(submissionCounts[asgnID] || 0);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingAssignment) return;
    const asgnID = deletingAssignment.assignmentID || deletingAssignment.id;
    setIsDeleting(true);
    try {
      const res = await deleteAssignment(asgnID, coachID);
      if (res && res.success !== false) {
        setActionSuccess(`Assignment ${asgnID} has been deleted.`);
        setDeletingAssignment(null);
        await fetchAssignments();
      } else {
        setError(res?.message || 'Could not delete assignment.');
      }
    } catch (err) {
      console.error(err);
      setError('Error deleting assignment.');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- RESTORE ASSIGNMENT FLOW ---
  const handleRestore = async (asgn) => {
    const asgnID = asgn.assignmentID || asgn.id;
    setRestoringId(asgnID);
    setActionSuccess(null);
    setError(null);
    try {
      const res = await restoreAssignment(asgnID);
      if (res && res.success !== false) {
        setActionSuccess(`Assignment ${asgnID} has been restored to Active status.`);
        await fetchAssignments();
      } else {
        setError(res?.message || 'Could not restore assignment.');
      }
    } catch (err) {
      console.error(err);
      setError('Error restoring assignment.');
    } finally {
      setRestoringId(null);
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

    const status = (a.status || (a.isClosed ? 'Closed' : 'Active')).toLowerCase();
    const matchesStatus = statusFilter === 'All' || status === statusFilter.toLowerCase();

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
            Monitor syllabus deliverables, edit deadlines, track submission metrics, or manage deleted records.
          </p>
        </div>

        <Link
          to="/coach/create-assignment"
          className="btn-primary py-2.5 px-4 text-xs font-semibold self-start sm:self-auto flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Assignment</span>
        </Link>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between gap-2 text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="p-1 text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-brand-error/20 rounded-xl text-brand-error flex items-center justify-between gap-2 text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 text-red-600 hover:text-red-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
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
              className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-primary font-medium"
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
              className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-brand-primary font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Closed">Closed</option>
              <option value="Deleted">Deleted</option>
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
                    const rawStatus = asgn.status || (asgn.isClosed ? 'Closed' : 'Active');
                    const isDeleted = rawStatus.toLowerCase() === 'deleted';
                    const isClosed = rawStatus.toLowerCase() === 'closed';
                    const category = asgn.category || 'Technical';
                    const count = asgn.totalSubmissions ?? asgn.submissionsCount ?? submissionCounts[id] ?? '—';

                    return (
                      <tr
                        key={id}
                        className={`transition-colors ${
                          isDeleted
                            ? 'bg-red-50/20 hover:bg-red-50/40 opacity-75'
                            : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className={`font-semibold text-slate-800 line-clamp-1 ${isDeleted ? 'line-through text-slate-400' : ''}`}>
                            {asgn.title || asgn.assignmentTitle || 'Untitled Assignment'}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                            <span className="font-mono text-brand-primary">{id}</span>
                            {asgn.weekNumber && <span>· W{asgn.weekNumber}D{asgn.dayNumber || 1}</span>}
                            {asgn.monthNumber && <span>· M{asgn.monthNumber}</span>}
                            {asgn.type === 'ModuleProject' && (
                              <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-semibold text-[10px]">
                                Module Project
                              </span>
                            )}
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

                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[24px] px-2 py-0.5 rounded-full font-bold text-[11px] bg-slate-100 text-slate-700 border border-slate-200">
                            {count}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isDeleted
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : isClosed
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {rawStatus}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {/* If Deleted: Show Restore Action */}
                            {isDeleted ? (
                              <button
                                type="button"
                                onClick={() => handleRestore(asgn)}
                                disabled={restoringId === id}
                                className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition-colors disabled:opacity-40"
                                title="Restore Assignment"
                              >
                                {restoringId === id ? (
                                  <span className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin inline-block" />
                                ) : (
                                  <RotateCcw className="w-3.5 h-3.5" />
                                )}
                              </button>
                            ) : (
                              <>
                                {/* Edit Assignment */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(asgn)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-brand-primary hover:bg-blue-50 transition-colors"
                                  title="Edit Assignment"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>

                                {/* Soft Delete Assignment */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenDelete(asgn)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Delete Assignment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
                              </>
                            )}

                            {/* View Details */}
                            <button
                              type="button"
                              onClick={() => setSelectedAssignment(asgn)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-primary hover:bg-blue-50 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
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

      {/* ================= EDIT ASSIGNMENT MODAL ================= */}
      {editingAssignment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge-primary text-xs">Edit Deliverable</span>
                  <span className="font-mono text-xs text-slate-400">
                    {editingAssignment.assignmentID || editingAssignment.id}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  Modify Assignment Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAssignment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error in modal */}
            {editError && (
              <div className="p-3.5 bg-red-50 border border-brand-error/20 rounded-xl text-brand-error flex items-start gap-2 text-xs font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{editError}</span>
              </div>
            )}

            {/* SUBMISSION WARNING BANNER: If submissions > 0 */}
            {checkingSubmissions ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 animate-pulse">
                Verifying submission records...
              </div>
            ) : editSubmissionsCount > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-xs text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-950">
                    Submissions Detected ({editSubmissionsCount} Submission{editSubmissionsCount > 1 ? 's' : ''})
                  </p>
                  <p className="leading-relaxed text-amber-800">
                    This assignment has {editSubmissionsCount} submission{editSubmissionsCount > 1 ? 's' : ''}. Changing due date or max score will affect existing grades and student compliance records.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="form-label">Assignment Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="form-input text-xs"
                  required
                />
              </div>

              {/* Category, Tool, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                    className="form-input text-xs"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Tool / Domain</label>
                  <select
                    value={editForm.tool}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tool: e.target.value }))}
                    className="form-input text-xs"
                  >
                    {TOOLS_LIST.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="SoftSkills">SoftSkills</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="form-input text-xs"
                  >
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Due Date, Max Score, Max Files */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Due Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="form-input text-xs"
                  />
                </div>

                <div>
                  <label className="form-label">Max Score (Pts)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editForm.maxScore}
                    onChange={(e) => setEditForm(prev => ({ ...prev, maxScore: e.target.value }))}
                    className="form-input text-xs"
                  />
                </div>

                <div>
                  <label className="form-label">Max Files Allowed</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editForm.maxFilesAllowed}
                    onChange={(e) => setEditForm(prev => ({ ...prev, maxFilesAllowed: e.target.value }))}
                    className="form-input text-xs"
                  />
                </div>
              </div>

              {/* Allowed File Types */}
              <div>
                <label className="form-label">Allowed File Types</label>
                <input
                  type="text"
                  value={editForm.allowedFileTypes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, allowedFileTypes: e.target.value }))}
                  placeholder=".xlsx, .pdf, .sql, .pbix, .py, .docx, .zip"
                  className="form-input text-xs"
                />
              </div>

              {/* Description */}
              <div>
                <label className="form-label">Instructions / Description</label>
                <textarea
                  rows="3"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="form-input text-xs"
                  placeholder="Provide background, requirements, and scenario details..."
                />
              </div>

              {/* Deliverables */}
              <div>
                <label className="form-label">Expected Deliverables</label>
                <textarea
                  rows="2"
                  value={editForm.deliverables}
                  onChange={(e) => setEditForm(prev => ({ ...prev, deliverables: e.target.value }))}
                  className="form-input text-xs"
                  placeholder="Specify exact filenames and sheets expected..."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="form-label">Internal Coach Notes</label>
                <input
                  type="text"
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional grading notes or rubrics..."
                  className="form-input text-xs"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAssignment(null)}
                  disabled={savingEdit}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn-primary px-5 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {savingEdit ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION DIALOG ================= */}
      {deletingAssignment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Assignment?</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {deletingAssignment.assignmentID || deletingAssignment.id}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900">"{deletingAssignment.title || deletingAssignment.assignmentTitle}"</strong>?
              This will mark the assignment as <span className="font-semibold text-red-700">Deleted</span> and hide it from student pending views.
            </p>

            {deleteSubmissionsCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  Notice: <strong>{deleteSubmissionsCount} submission(s)</strong> have already been submitted for this assignment.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingAssignment(null)}
                disabled={isDeleting}
                className="btn-secondary px-4 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ASSIGNMENT DETAIL MODAL ================= */}
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
