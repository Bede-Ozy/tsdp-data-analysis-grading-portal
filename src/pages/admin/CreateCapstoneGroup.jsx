import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  createCapstoneGroup,
  getAllCapstoneGroups,
  getAllClassGroups
} from '../../services/api';
import { TableSkeleton } from '../../components/SkeletonLoader';
import {
  Layers,
  Users,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  FileText,
  Plus,
  Sparkles,
  Info
} from 'lucide-react';

export default function CreateCapstoneGroup() {
  const { user } = useAuth();
  const coachID = user?.coachID || user?.id || user?.name || 'ADMIN';

  // Available class groups & existing capstone groups
  const [classGroups, setClassGroups] = useState([]);
  const [capstoneGroups, setCapstoneGroups] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form state
  const [capstoneGroupName, setCapstoneGroupName] = useState('');
  const [selectedClassGroups, setSelectedClassGroups] = useState([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [notes, setNotes] = useState('');

  // Submit / status state
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  const loadData = async () => {
    setLoadingInitial(true);
    setError(null);
    try {
      const [groupsRes, capstoneRes] = await Promise.all([
        getAllClassGroups(),
        getAllCapstoneGroups()
      ]);

      // Parse class groups
      let cGroups = [];
      if (groupsRes && groupsRes.success !== false) {
        cGroups = Array.isArray(groupsRes) ? groupsRes : (groupsRes.data || groupsRes.classGroups || []);
      }
      // Fallback default list if empty
      if (cGroups.length === 0) {
        cGroups = ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5', 'Group 6', 'Group 7', 'Group 8'];
      }
      setClassGroups(cGroups);

      // Parse existing capstone groups
      let capList = [];
      if (capstoneRes && capstoneRes.success !== false) {
        capList = Array.isArray(capstoneRes) ? capstoneRes : (capstoneRes.data || capstoneRes.capstoneGroups || []);
      }
      setCapstoneGroups(capList);
    } catch (err) {
      console.error('Error loading capstone data:', err);
      setError('Unable to load class and capstone groups. Using defaults.');
      setClassGroups(['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5', 'Group 6']);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleClassGroup = (grp) => {
    setSelectedClassGroups(prev => {
      if (prev.includes(grp)) {
        return prev.filter(g => g !== grp);
      } else {
        return [...prev, grp];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessResult(null);

    if (!capstoneGroupName.trim()) {
      setError('Please provide a Capstone Group Name.');
      return;
    }

    if (selectedClassGroups.length < 2) {
      setError('Please select at least 2 class groups to merge into this Capstone Group.');
      return;
    }

    if (!projectTitle.trim()) {
      setError('Please provide a Project Title.');
      return;
    }

    setLoadingSubmit(true);
    try {
      const res = await createCapstoneGroup(
        capstoneGroupName.trim(),
        selectedClassGroups,
        projectTitle.trim(),
        problemStatement.trim(),
        notes.trim(),
        coachID
      );

      if (res && res.success !== false) {
        const assignedCount = res.studentsAssigned || res.data?.studentsAssigned || res.assignedCount || 'multiple';
        setSuccessResult({
          message: res.message || `Capstone group "${capstoneGroupName}" created successfully.`,
          studentsAssigned: assignedCount,
          name: capstoneGroupName,
          groups: selectedClassGroups
        });

        // Reset form
        setCapstoneGroupName('');
        setSelectedClassGroups([]);
        setProjectTitle('');
        setProblemStatement('');
        setNotes('');

        // Refresh list
        loadData();
      } else {
        setError(res?.message || 'Failed to create Capstone Group. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error creating Capstone Group.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-brand-neutral">Capstone Group Formation</h1>
          <span className="badge-primary text-xs">Cohort Structure</span>
        </div>
        <p className="text-sm text-brand-neutral-muted mt-1">
          Merge two or more standard class groups into unified Capstone teams and assign industry project briefs.
        </p>
      </div>

      {/* Success Banner */}
      {successResult && (
        <div className="portal-card bg-emerald-50/80 border-emerald-200 p-5 space-y-2">
          <div className="flex items-center gap-2.5 text-emerald-900 font-bold text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Capstone Group Created!</span>
          </div>
          <p className="text-xs text-emerald-700">
            <strong>{successResult.name}</strong> was formed by merging {successResult.groups?.join(', ')}.
            {' '}<span className="font-semibold">{successResult.studentsAssigned} students</span> were successfully assigned.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-brand-error/20 rounded-xl text-brand-error flex items-start gap-2 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Creation Form */}
      <div className="portal-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Create New Capstone Group
            </h2>
            <span className="text-xs text-brand-neutral-muted">Step 1 of Capstone Lifecycle</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Capstone Group Name */}
            <div>
              <label className="form-label">Capstone Group Name *</label>
              <input
                type="text"
                value={capstoneGroupName}
                onChange={(e) => setCapstoneGroupName(e.target.value)}
                placeholder="e.g. Capstone Team Alpha (FinTech)"
                className="form-input"
                required
              />
            </div>

            {/* Project Title */}
            <div>
              <label className="form-label">Project Title *</label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. Predictive Customer Churn & Lifetime Value Engine"
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Multi-Select Class Groups to Merge */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="form-label mb-0">Class Groups to Merge (Select at least 2) *</label>
              <span className="text-xs font-semibold text-brand-primary">
                {selectedClassGroups.length} selected
              </span>
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-brand-primary-dark flex items-start gap-2">
              <Info className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
              <p>
                Click to toggle class groups. All enrolled students in selected groups will be automatically mapped to this Capstone Team.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
              {classGroups.map((grp, idx) => {
                const grpName = typeof grp === 'object' ? (grp.groupName || grp.name || `Group ${idx + 1}`) : grp;
                const isSelected = selectedClassGroups.includes(grpName);

                return (
                  <button
                    key={grpName}
                    type="button"
                    onClick={() => handleToggleClassGroup(grpName)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-brand-primary bg-blue-50/70 text-brand-primary shadow-xs font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className={`w-4 h-4 ${isSelected ? 'text-brand-primary' : 'text-slate-400'}`} />
                      <span className="text-xs">{grpName}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-primary flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Problem Statement */}
          <div>
            <label className="form-label">Problem Statement / Research Objective</label>
            <textarea
              rows={3}
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="Outline the client business challenge, dataset domains, and required analytical milestones..."
              className="form-input resize-y"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="form-label">Internal Notes / Mentorship Guidelines (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Requires Python ETL pipeline + PowerBI client dashboard"
              className="form-input"
            />
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loadingSubmit}
              className="btn-primary px-7 py-2.5 text-sm font-semibold flex items-center gap-2 shadow-sm hover:shadow"
            >
              {loadingSubmit ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Capstone Group...</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  <span>Form Capstone Group</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Capstone Groups Roster */}
      <div className="portal-card space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-brand-primary" />
              <span>Existing Capstone Groups</span>
            </h2>
            <p className="text-xs text-brand-neutral-muted mt-0.5">Active multi-group teams in current cohort</p>
          </div>
          <span className="badge-secondary text-xs">{capstoneGroups.length} Groups</span>
        </div>

        {loadingInitial ? (
          <TableSkeleton rows={4} />
        ) : (
          <div className="overflow-x-auto">
            {capstoneGroups.length === 0 ? (
              <div className="py-10 text-center text-xs text-brand-neutral-muted">
                No capstone groups created yet. Use the form above to form the first team.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 text-slate-400 uppercase font-semibold">
                    <th className="py-2.5 px-3">Capstone Team Name</th>
                    <th className="py-2.5 px-3">Members From (Class Groups)</th>
                    <th className="py-2.5 px-3">Project Title</th>
                    <th className="py-2.5 px-3 text-center">Students Assigned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {capstoneGroups.map((cg, idx) => {
                    const name = cg.capstoneGroupName || cg.name || `Capstone Team ${idx + 1}`;
                    const membersFrom = Array.isArray(cg.classGroups)
                      ? cg.classGroups.join(', ')
                      : (cg.membersFrom || cg.classGroups || '—');
                    const title = cg.projectTitle || cg.title || '—';
                    const assigned = cg.studentsAssigned ?? cg.studentCount ?? '—';

                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {name}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {membersFrom}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700 max-w-xs truncate">
                          {title}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-brand-primary">
                          {assigned}
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
    </div>
  );
}
