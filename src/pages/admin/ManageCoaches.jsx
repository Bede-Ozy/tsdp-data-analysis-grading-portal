import React, { useState, useEffect } from 'react';
import { getAllCoaches, updateCoachStatus } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  UserCheck, 
  Mail, 
  Phone,
  Award, 
  CheckCircle2, 
  Search, 
  Power, 
  AlertCircle, 
  RefreshCw, 
  Users,
  ShieldCheck,
  UserX,
  X
} from 'lucide-react';

export default function ManageCoaches() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [notification, setNotification] = useState(null);

  const loadCoaches = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }
    try {
      const response = await getAllCoaches();
      if (response && Array.isArray(response)) {
        setCoaches(response);
      } else if (response && response.success && Array.isArray(response.data)) {
        setCoaches(response.data);
      } else if (response && response.success && Array.isArray(response.result)) {
        setCoaches(response.result);
      } else if (response && Array.isArray(response.coaches)) {
        setCoaches(response.coaches);
      } else {
        setCoaches([]);
      }
    } catch (err) {
      console.error('Error fetching coaches:', err);
      setCoaches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCoaches();
  }, []);

  const handleToggleStatus = async (coach) => {
    const currentStatus = String(coach.status || 'Active').trim();
    const newStatus = currentStatus.toLowerCase() === 'active' ? 'Inactive' : 'Active';
    const fullName = `${coach.firstName || ''} ${coach.lastName || ''}`.trim() || coach.coachID;

    setUpdatingId(coach.coachID);
    setNotification(null);

    try {
      const res = await updateCoachStatus(coach.coachID, newStatus);
      if (res && (res.success === true || !res.error)) {
        setNotification({
          type: 'success',
          message: `Status for ${fullName} updated to ${newStatus}.`
        });
        await loadCoaches();
      } else {
        setNotification({
          type: 'error',
          message: res?.message || `Failed to update status for ${fullName}.`
        });
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || `Error updating status for ${fullName}.`
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading instructional staff from COACHES_MASTER..." />;
  }

  // Filter coaches based on search query, role filter, and status filter
  const filteredCoaches = coaches.filter(coach => {
    const fullName = `${coach.firstName || ''} ${coach.lastName || ''}`.trim();
    const q = search.toLowerCase();
    const matchSearch = (
      fullName.toLowerCase().includes(q) ||
      (coach.coachID && coach.coachID.toLowerCase().includes(q)) ||
      (coach.email && coach.email.toLowerCase().includes(q)) ||
      (coach.phone && String(coach.phone).includes(q)) ||
      (coach.track && coach.track.toLowerCase().includes(q)) ||
      (coach.role && coach.role.toLowerCase().includes(q))
    );

    const matchRole = roleFilter === 'All' || 
      (coach.role && coach.role.toLowerCase() === roleFilter.toLowerCase());

    const coachStatus = String(coach.status || 'Active').trim();
    const matchStatus = statusFilter === 'All' ||
      coachStatus.toLowerCase() === statusFilter.toLowerCase();

    return matchSearch && matchRole && matchStatus;
  });

  const activeCount = coaches.filter(c => String(c.status || '').toLowerCase() === 'active').length;
  const inactiveCount = coaches.filter(c => String(c.status || '').toLowerCase() === 'inactive').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-neutral">Manage Coaches & Instructors</h1>
          <p className="text-sm text-brand-neutral-muted mt-1">
            Real-time instructional and administrative team records from <strong className="font-mono text-slate-700">COACHES_MASTER</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => loadCoaches(true)}
            disabled={refreshing}
            className="btn-outline py-2 px-3 text-xs font-semibold flex items-center gap-1.5"
            title="Refresh coach list from backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Database'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="portal-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-brand-secondary flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-brand-neutral-muted font-medium">Total Staff</p>
            <p className="text-xl font-bold text-brand-neutral">{coaches.length}</p>
          </div>
        </div>

        <div className="portal-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-brand-neutral-muted font-medium">Active Staff</p>
            <p className="text-xl font-bold text-emerald-600">{activeCount}</p>
          </div>
        </div>

        <div className="portal-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-brand-neutral-muted font-medium">Inactive Staff</p>
            <p className="text-xl font-bold text-slate-700">{inactiveCount}</p>
          </div>
        </div>

        <div className="portal-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-brand-primary flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-brand-neutral-muted font-medium">Administrators</p>
            <p className="text-xl font-bold text-brand-primary">
              {coaches.filter(c => String(c.role || '').toLowerCase() === 'admin').length}
            </p>
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

      {/* Controls Bar: Search + Filters */}
      <div className="portal-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name, Coach ID, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none outline-none focus:ring-0 text-slate-800 placeholder-slate-400 text-sm p-0"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-slate-400 font-medium whitespace-nowrap mr-1">Role:</span>
            {['All', 'Technical', 'Admin', 'Professional'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  roleFilter === role
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-slate-400 font-medium whitespace-nowrap mr-1">Status:</span>
            {['All', 'Active', 'Inactive'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Coaches Table View */}
      {filteredCoaches.length === 0 ? (
        <div className="portal-card text-center py-16 text-brand-neutral-muted space-y-3">
          <UserCheck className="w-12 h-12 mx-auto text-slate-300" />
          <p className="font-semibold text-base text-slate-700">
            {coaches.length === 0 ? 'No coaches found in COACHES_MASTER.' : 'No coaches match your search filters.'}
          </p>
          {coaches.length === 0 ? (
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Please check your Google Sheet backend deployment and confirm that the <strong className="font-mono">COACHES_MASTER</strong> sheet contains records.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => { setSearch(''); setRoleFilter('All'); setStatusFilter('All'); }}
              className="text-xs text-brand-primary underline"
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-brand-neutral-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-100/80 border-b border-brand-neutral-border text-xs uppercase text-brand-neutral-muted font-bold">
                  <th className="py-3 px-4">Coach ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Track</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Toggle Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCoaches.map((coach) => {
                  const fullName = `${coach.firstName || ''} ${coach.lastName || ''}`.trim() || coach.coachID || 'Instructor';
                  const isActive = String(coach.status || 'Active').trim().toLowerCase() === 'active';
                  const isUpdating = updatingId === coach.coachID;

                  return (
                    <tr key={coach.coachID} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-brand-primary">
                        {coach.coachID}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-brand-neutral">
                        {fullName}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {coach.email || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          coach.role?.toLowerCase() === 'admin'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-brand-primary border-blue-200'
                        }`}>
                          {coach.role || 'Staff'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                        {coach.track || (coach.role?.toLowerCase() === 'admin' ? 'Administration' : 'Data Analytics')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{coach.status || 'Active'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleToggleStatus(coach)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                            isActive
                              ? 'border-red-200 text-red-600 bg-red-50/60 hover:bg-red-100'
                              : 'border-emerald-200 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100'
                          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={isActive ? `Deactivate ${fullName}` : `Activate ${fullName}`}
                        >
                          <Power className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
                          <span>{isUpdating ? 'Updating...' : (isActive ? 'Deactivate' : 'Activate')}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
