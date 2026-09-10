import React, { useState, useEffect } from 'react';
import { getAllStudents, updateStudentStatus, getStudentPerformance } from '../../services/api';
import ScoreTable from '../../components/ScoreTable';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomSelect from '../../components/CustomSelect';
import {
  Users,
  Search,
  Power,
  Eye,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [notification, setNotification] = useState(null);

  // Profile modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentPerf, setStudentPerf] = useState(null);
  const [loadingPerf, setLoadingPerf] = useState(false);

  const loadStudents = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await getAllStudents();
      const list = Array.isArray(res) ? res : (res?.data || res?.students || []);
      setStudents(list);
    } catch (err) {
      console.error('Failed to load students:', err);
      setNotification({ type: 'error', message: err.message || 'Error connecting to database.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleToggleStatus = async (student) => {
    const currentStatus = String(student.status || 'Active').trim();
    const newStatus = currentStatus.toLowerCase() === 'active' ? 'Inactive' : 'Active';
    const sName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.studentID;

    setUpdatingId(student.studentID);
    setNotification(null);

    try {
      const res = await updateStudentStatus(student.studentID, newStatus);
      if (res && (res.success === true || !res.error)) {
        setNotification({
          type: 'success',
          message: `Status for ${sName} updated to ${newStatus}.`
        });
        await loadStudents();
      } else {
        setNotification({
          type: 'error',
          message: res?.message || `Failed to update status for ${sName}.`
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || `Error updating status for ${sName}.`
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleViewStudent = async (student) => {
    setSelectedStudent(student);
    setLoadingPerf(true);
    try {
      const res = await getStudentPerformance(student.studentID);
      if (res && res.success) {
        setStudentPerf(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPerf(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading resident roster from backend..." />;
  }

  const uniqueClassGroups = Array.from(new Set(students.map(s => s.classGroup).filter(Boolean)));
  const uniqueCapstoneGroups = Array.from(new Set(students.map(s => s.capstoneGroup).filter(Boolean)));

  const filtered = students.filter(s => {
    const sName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentID || '';
    const q = search.toLowerCase();
    const matchSearch =
      sName.toLowerCase().includes(q) ||
      (s.studentID && s.studentID.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.studentNumber && String(s.studentNumber).includes(q));

    const matchGroup = groupFilter === 'All' || s.classGroup === groupFilter || s.capstoneGroup === groupFilter;

    const sStatus = String(s.status || 'Active').trim();
    const matchStatus = statusFilter === 'All' || sStatus.toLowerCase() === statusFilter.toLowerCase();

    return matchSearch && matchGroup && matchStatus;
  });

  const activeCount = students.filter(s => String(s.status || 'Active').toLowerCase() === 'active').length;
  const inactiveCount = students.filter(s => String(s.status || '').toLowerCase() === 'inactive').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-neutral">Manage Residents (Students)</h1>
          <p className="text-sm text-brand-neutral-muted mt-1">
            Official roster of enrolled residents in the ITF-NECA-TSDP Data Analytics Cohort.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => loadStudents(true)}
            disabled={refreshing}
            className="btn-outline py-2 px-3 text-xs font-semibold flex items-center gap-1.5"
            title="Refresh student list from backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Database'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="portal-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-brand-primary flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-brand-neutral-muted font-medium">Total Residents</p>
            <p className="text-xl font-bold text-brand-neutral">{students.length}</p>
          </div>
        </div>

        <div className="portal-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-brand-neutral-muted font-medium">Active Residents</p>
            <p className="text-xl font-bold text-emerald-600">{activeCount}</p>
          </div>
        </div>

        <div className="portal-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-brand-neutral-muted font-medium">Inactive Residents</p>
            <p className="text-xl font-bold text-slate-700">{inactiveCount}</p>
          </div>
        </div>

        <div className="portal-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-brand-secondary flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-brand-neutral-muted font-medium">Class Groups</p>
            <p className="text-xl font-bold text-brand-secondary">{uniqueClassGroups.length}</p>
          </div>
        </div>
      </div>

      {/* Notifications Alert */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
          notification.type === 'error'
            ? 'bg-red-50 border-red-200 text-brand-error'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="portal-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, student number or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-10"
            />
          </div>

          <div>
            <CustomSelect
              value={groupFilter}
              onChange={(val) => setGroupFilter(val)}
              placeholder="Filter by group..."
              options={[
                { value: 'All', label: 'All Groups' },
                ...uniqueClassGroups.map(g => ({ value: g, label: g, sublabel: 'Class Group' })),
                ...uniqueCapstoneGroups.map(g => ({ value: g, label: g, sublabel: 'Capstone Group' }))
              ]}
            />
          </div>
        </div>
      </div>

      {/* Roster Table — Columns: StudentID, Name, Email, Class Group, Capstone Group, Status, Action */}
      <div className="bg-white rounded-xl border border-brand-neutral-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-100/80 border-b border-brand-neutral-border text-xs uppercase text-brand-neutral-muted font-bold">
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Class Group</th>
                <th className="py-3 px-4">Capstone Group</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Toggle Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-brand-neutral-muted text-sm">
                    {students.length === 0 ? 'No resident records found in database.' : 'No residents match your search criteria.'}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const sName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentID;
                  const isActive = String(s.status || 'Active').trim().toLowerCase() === 'active';
                  const isUpdating = updatingId === s.studentID;

                  return (
                    <tr key={s.studentID} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-xs text-brand-primary">
                        {s.studentID}
                      </td>
                      <td className="py-3 px-4 font-semibold text-brand-neutral">
                        {sName}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 truncate max-w-[180px]">
                        {s.email || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-brand-neutral">
                        {s.classGroup || '—'}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-brand-secondary">
                        {s.capstoneGroup || '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{s.status || 'Active'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleToggleStatus(s)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                            isActive
                              ? 'border-red-200 text-red-600 bg-red-50/60 hover:bg-red-100'
                              : 'border-emerald-200 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100'
                          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={isActive ? `Deactivate ${sName}` : `Activate ${sName}`}
                        >
                          <Power className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
                          <span>{isUpdating ? 'Updating...' : (isActive ? 'Deactivate' : 'Activate')}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleViewStudent(s)}
                          className="btn-outline py-1.5 px-3 text-xs font-medium hover:bg-brand-primary-light hover:text-brand-primary hover:border-brand-primary/30"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-brand-neutral-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge-primary">Resident Performance Profile</span>
                  <span className="text-xs text-brand-neutral-muted">TSDP 2026</span>
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mt-1">{selectedStudent.name || selectedStudent.studentID}</h2>
                <p className="text-xs font-mono text-brand-primary">
                  {selectedStudent.studentID} · {selectedStudent.email} · {selectedStudent.classGroup} · {selectedStudent.capstoneGroup}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-brand-neutral hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingPerf ? (
              <LoadingSpinner size="md" text="Loading performance records..." />
            ) : (
              <div className="space-y-5">
                <ScoreTable
                  breakdown={studentPerf?.breakdown}
                  totalScore={studentPerf?.finalScore || studentPerf?.overallScore || selectedStudent.overallScore}
                />
              </div>
            )}

            <div className="border-t border-brand-neutral-border pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="btn-primary py-2 px-5 text-xs font-bold"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
