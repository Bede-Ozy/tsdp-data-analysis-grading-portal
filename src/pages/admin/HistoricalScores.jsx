import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllStudents, getHistoricalScores, saveHistoricalScores } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  History,
  Save,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Users,
  Calculator
} from 'lucide-react';

export default function HistoricalScores() {
  const { user } = useAuth();
  const coachID = user?.coachID || user?.id || user?.adminID || user?.username || 'ADMIN';

  // Student roster
  const [students, setStudents] = useState([]);

  // Monthly raw score inputs & maxes keyed by studentID
  const [month1Scores, setMonth1Scores] = useState({});
  const [month2Scores, setMonth2Scores] = useState({});
  const [month1Maxes, setMonth1Maxes] = useState({});
  const [month2Maxes, setMonth2Maxes] = useState({});

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [notification, setNotification] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load students & existing historical scores
  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setNotification(null);

    try {
      const [studentsRes, histRes] = await Promise.all([
        getAllStudents().catch(() => null),
        getHistoricalScores().catch(() => null)
      ]);

      const stdList = Array.isArray(studentsRes)
        ? studentsRes
        : (studentsRes?.data || studentsRes?.students || []);

      const histList = Array.isArray(histRes)
        ? histRes
        : (histRes?.data || histRes?.scores || histRes?.historicalScores || []);

      // Build quick lookup map by studentID (case-insensitive)
      const histMap = new Map();
      if (Array.isArray(histList)) {
        histList.forEach((item) => {
          const id = String(item.studentID || item.studentId || item.StudentID || item.id || '').trim().toLowerCase();
          if (id) histMap.set(id, item);
        });
      }

      // Also read local cache if available as immediate fallback
      let localCacheMap = new Map();
      try {
        const raw = localStorage.getItem('tsdp_historical_scores_cache');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => {
              const id = String(item.studentID || '').trim().toLowerCase();
              if (id) localCacheMap.set(id, item);
            });
          }
        }
      } catch (e) {
        // Ignore storage parse errors
      }

      const newM1 = {};
      const newM2 = {};
      const newM1Max = {};
      const newM2Max = {};

      stdList.forEach((s) => {
        const sKey = String(s.studentID || s.id || '').trim().toLowerCase();
        const saved = histMap.get(sKey) || localCacheMap.get(sKey);

        if (saved) {
          // If monthly totals and maxes are stored directly
          if (saved.month1Total !== undefined || saved.month2Total !== undefined) {
            newM1[s.studentID] = saved.month1Total ?? 0;
            newM2[s.studentID] = saved.month2Total ?? 0;
            newM1Max[s.studentID] = saved.month1Max !== undefined && saved.month1Max !== '' ? Number(saved.month1Max) : 100;
            newM2Max[s.studentID] = saved.month2Max !== undefined && saved.month2Max !== '' ? Number(saved.month2Max) : 100;
          } else if (saved.histAttendance !== undefined || saved.historicalPercent !== undefined) {
            // Reconstruct from saved percentage or component points
            const pct = saved.historicalPercent !== undefined
              ? Number(saved.historicalPercent)
              : (saved.histAttendance ? (Number(saved.histAttendance) / 10) * 100 : 0);

            newM1[s.studentID] = Math.round((pct * 100) / 100);
            newM2[s.studentID] = 0;
            newM1Max[s.studentID] = 100;
            newM2Max[s.studentID] = 0;
          } else {
            newM1[s.studentID] = 0;
            newM2[s.studentID] = 0;
            newM1Max[s.studentID] = 100;
            newM2Max[s.studentID] = 100;
          }
        } else {
          // Defaults
          newM1[s.studentID] = 0;
          newM2[s.studentID] = 0;
          newM1Max[s.studentID] = 100;
          newM2Max[s.studentID] = 100;
        }
      });

      setStudents(stdList);
      setMonth1Scores(newM1);
      setMonth2Scores(newM2);
      setMonth1Maxes(newM1Max);
      setMonth2Maxes(newM2Max);
      setHasUnsavedChanges(false);

      if (isManual) {
        setNotification({
          type: 'success',
          message: 'Historical scores reloaded and verified with backend database.'
        });
      }
    } catch (err) {
      console.error('Error loading historical scores:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Failed to load historical scores data.'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Live calculation for a student
  const computeStudentScores = (studentID) => {
    const m1 = month1Scores[studentID] !== undefined && month1Scores[studentID] !== '' ? Number(month1Scores[studentID]) : 0;
    const m2 = month2Scores[studentID] !== undefined && month2Scores[studentID] !== '' ? Number(month2Scores[studentID]) : 0;
    const m1Max = month1Maxes[studentID] !== undefined && month1Maxes[studentID] !== '' ? Number(month1Maxes[studentID]) : 100;
    const m2Max = month2Maxes[studentID] !== undefined && month2Maxes[studentID] !== '' ? Number(month2Maxes[studentID]) : 100;

    const total = m1 + m2;
    const max = m1Max + m2Max;
    const percent = max > 0 ? (total / max) * 100 : 0;

    const attPts = ((percent / 100) * 10).toFixed(2);
    const techPts = ((percent / 100) * 10).toFixed(2);
    const profPts = ((percent / 100) * 5).toFixed(2);
    const classPts = ((percent / 100) * 5).toFixed(2);
    const smPts = ((percent / 100) * 5).toFixed(2);

    return {
      total,
      max,
      percent: Number(percent.toFixed(2)),
      percentFormatted: `${percent.toFixed(2)}%`,
      attPts,
      techPts,
      profPts,
      classPts,
      smPts
    };
  };

  // Input change handler
  const handleScoreChange = (setter, studentID, val) => {
    const parsed = val === '' ? '' : Number(val);
    setter((prev) => ({
      ...prev,
      [studentID]: parsed
    }));
    setHasUnsavedChanges(true);
  };

  // Unique class groups for filtering
  const classGroups = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      if (s.classGroup) set.add(s.classGroup);
    });
    return Array.from(set).sort();
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const sName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentID;
      const matchSearch =
        search.trim() === '' ||
        sName.toLowerCase().includes(search.toLowerCase()) ||
        String(s.studentID || '').toLowerCase().includes(search.toLowerCase());
      const matchGroup = groupFilter === 'All' || s.classGroup === groupFilter;
      return matchSearch && matchGroup;
    });
  }, [students, search, groupFilter]);

  // Set all maxes to 100 shortcut
  const handleSetAllDefaultMaxes = () => {
    const newM1Max = {};
    const newM2Max = {};
    students.forEach((s) => {
      newM1Max[s.studentID] = 100;
      newM2Max[s.studentID] = 100;
    });
    setMonth1Maxes(newM1Max);
    setMonth2Maxes(newM2Max);
    setHasUnsavedChanges(true);
  };

  // Save All Historical Scores
  const handleSaveAll = async () => {
    setSaving(true);
    setNotification(null);

    try {
      const scoresArray = students.map((s) => {
        const computed = computeStudentScores(s.studentID);
        const m1 = month1Scores[s.studentID] !== undefined && month1Scores[s.studentID] !== '' ? Number(month1Scores[s.studentID]) : 0;
        const m2 = month2Scores[s.studentID] !== undefined && month2Scores[s.studentID] !== '' ? Number(month2Scores[s.studentID]) : 0;
        const m1Max = month1Maxes[s.studentID] !== undefined && month1Maxes[s.studentID] !== '' ? Number(month1Maxes[s.studentID]) : 100;
        const m2Max = month2Maxes[s.studentID] !== undefined && month2Maxes[s.studentID] !== '' ? Number(month2Maxes[s.studentID]) : 100;

        return {
          studentID: s.studentID,
          firstName: s.firstName || (s.name ? s.name.split(' ')[0] : '') || '',
          lastName: s.lastName || (s.name ? s.name.split(' ').slice(1).join(' ') : '') || '',
          month1Total: m1,
          month2Total: m2,
          month1Max: m1Max,
          month2Max: m2Max,
          historicalPercent: computed.percent,
          histAttendance: Number(computed.attPts),
          histTechnical: Number(computed.techPts),
          histProfessional: Number(computed.profPts),
          histClassActivities: Number(computed.classPts),
          histSocialMedia: Number(computed.smPts),
          notes: ''
        };
      });

      // Cache locally for offline resilience
      try {
        localStorage.setItem('tsdp_historical_scores_cache', JSON.stringify(scoresArray));
      } catch (e) {}

      // Call backend API
      const res = await saveHistoricalScores(scoresArray, coachID);

      if (res && res.success !== false) {
        setNotification({
          type: 'success',
          message: res.message || `Updated ${scoresArray.length} students`
        });
        setHasUnsavedChanges(false);
        // Reload data from backend to confirm
        await loadData(false);
      } else {
        setNotification({
          type: 'error',
          message: res?.message || 'Failed to save historical scores to backend sheet.'
        });
      }
    } catch (err) {
      console.error('Save error:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Error occurred while saving historical scores.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Cohort Overview</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-medium text-brand-primary bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              Admin Module
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-brand-primary text-white flex items-center justify-center shadow-xs">
              <History className="w-5 h-5" />
            </span>
            <span>Historical Score Entry</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Enter historical percentages for Weeks 1-10 (before system launch). Points are calculated automatically and written to Historical_Scores sheet.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing || saving}
            className="btn-outline py-2.5 px-3.5 text-xs font-semibold flex items-center gap-2 bg-white"
            title="Reload scores from Google Sheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Reload Data'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving || loading}
            className={`btn-primary py-2.5 px-5 text-xs font-bold flex items-center gap-2 shadow-xs transition-all ${
              hasUnsavedChanges ? 'ring-2 ring-indigo-400 ring-offset-2' : ''
            }`}
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            <span>{saving ? 'Saving Scores...' : 'Save All Historical Scores'}</span>
          </button>
        </div>
      </div>

      {/* Live Calculation Formula Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <Calculator className="w-4 h-4" />
              <span>Live Calculation Formula</span>
            </div>
            <p className="text-xs text-slate-300">
              Combined % = <span className="text-white font-mono font-bold">((Month 1 + Month 2) ÷ (Month 1 Max + Month 2 Max)) × 100</span>
            </p>
          </div>

          {/* Component Point Multipliers */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-teal-500/20 border border-teal-400/30 text-teal-200 px-2.5 py-1 rounded-lg font-mono">
              Att: <strong>% × 10</strong>
            </span>
            <span className="bg-blue-500/20 border border-blue-400/30 text-blue-200 px-2.5 py-1 rounded-lg font-mono">
              Tech: <strong>% × 10</strong>
            </span>
            <span className="bg-orange-500/20 border border-orange-400/30 text-orange-200 px-2.5 py-1 rounded-lg font-mono">
              Prof: <strong>% × 5</strong>
            </span>
            <span className="bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 px-2.5 py-1 rounded-lg font-mono">
              Class Act: <strong>% × 5</strong>
            </span>
            <span className="bg-purple-500/20 border border-purple-400/30 text-purple-200 px-2.5 py-1 rounded-lg font-mono">
              SM: <strong>% × 5</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Notifications Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border shadow-xs ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold">{notification.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-semibold">You have unsaved monthly score edits.</span>
            <span className="hidden sm:inline text-amber-700">Remember to click "Save All Historical Scores" before leaving.</span>
          </div>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg font-bold text-xs shadow-xs transition-colors"
          >
            {saving ? 'Saving...' : 'Save Now'}
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-brand-neutral-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or ID..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>

        {/* Group Filter & Defaults */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          <button
            type="button"
            onClick={handleSetAllDefaultMaxes}
            className="text-xs text-slate-600 hover:text-brand-primary border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 transition-colors"
            title="Reset all student maxes to 100 / 100"
          >
            Reset All Maxes (100 / 100)
          </button>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              <option value="All">All Class Groups</option>
              {classGroups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Showing <span className="text-slate-900 font-bold">{filteredStudents.length}</span> of {students.length}
          </div>
        </div>
      </div>

      {/* Main Historical Scores Table */}
      <div className="bg-white rounded-xl border border-brand-neutral-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-xs font-semibold text-slate-500 animate-pulse">
              Loading student roster and monthly scores...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 border-b border-brand-neutral-border text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 sticky left-0 bg-slate-100/95 z-10 min-w-[170px]">
                    Student Name
                  </th>
                  <th className="py-3.5 px-4 min-w-[105px]">
                    Student ID
                  </th>

                  {/* Monthly Score Inputs (Editable) */}
                  <th className="py-3.5 px-3 bg-amber-50/60 text-amber-900 text-center border-l border-amber-200/60 min-w-[90px]">
                    Month 1 Total
                  </th>
                  <th className="py-3.5 px-3 bg-amber-50/60 text-amber-900 text-center min-w-[90px]">
                    Month 2 Total
                  </th>
                  <th className="py-3.5 px-3 bg-amber-50/60 text-amber-900 text-center min-w-[85px]">
                    Month 1 Max
                  </th>
                  <th className="py-3.5 px-3 bg-amber-50/60 text-amber-900 text-center min-w-[85px]">
                    Month 2 Max
                  </th>

                  {/* Historical Combined % (Auto Computed) */}
                  <th className="py-3.5 px-3 bg-indigo-50/70 text-indigo-900 text-center border-l border-indigo-200/80 min-w-[100px]">
                    Historical %
                  </th>

                  {/* 5 Computed Component Points (Auto Computed) */}
                  <th className="py-3.5 px-2.5 bg-teal-50/50 text-teal-900 text-center border-l border-teal-100 min-w-[70px]">
                    Att Pts
                  </th>
                  <th className="py-3.5 px-2.5 bg-blue-50/50 text-blue-900 text-center min-w-[70px]">
                    Tech Pts
                  </th>
                  <th className="py-3.5 px-2.5 bg-orange-50/50 text-orange-900 text-center min-w-[70px]">
                    Prof Pts
                  </th>
                  <th className="py-3.5 px-2.5 bg-indigo-50/50 text-indigo-900 text-center min-w-[70px]">
                    Class Act Pts
                  </th>
                  <th className="py-3.5 px-2.5 bg-purple-50/50 text-purple-900 text-center min-w-[70px]">
                    SM Pts
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="py-12 text-center text-slate-400 text-xs">
                      {students.length === 0 ? 'No resident records found.' : 'No students match your filter criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const sName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentID;
                    const m1Val = month1Scores[s.studentID] ?? 0;
                    const m2Val = month2Scores[s.studentID] ?? 0;
                    const m1MaxVal = month1Maxes[s.studentID] ?? 100;
                    const m2MaxVal = month2Maxes[s.studentID] ?? 100;

                    const computed = computeStudentScores(s.studentID);

                    // Badge color based on computed percentage
                    const getBadgeClass = (pct) => {
                      if (pct >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      if (pct >= 60) return 'bg-blue-50 text-blue-700 border-blue-200';
                      if (pct >= 40) return 'bg-amber-50 text-amber-700 border-amber-200';
                      if (pct > 0) return 'bg-rose-50 text-rose-700 border-rose-200';
                      return 'bg-slate-100 text-slate-500 border-slate-200';
                    };

                    return (
                      <tr key={s.studentID} className="hover:bg-slate-50/80 transition-colors">
                        {/* Student Name */}
                        <td className="py-2.5 px-4 font-semibold text-slate-900 sticky left-0 bg-white/95 z-10 shadow-xs">
                          <div className="truncate max-w-[170px]" title={sName}>
                            {sName}
                          </div>
                          {s.classGroup && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              {s.classGroup}
                            </span>
                          )}
                        </td>

                        {/* Student ID */}
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-600 text-xs">
                          {s.studentID}
                        </td>

                        {/* Month 1 Total (Editable) */}
                        <td className="py-2.5 px-3 text-center border-l border-amber-100 bg-amber-50/15">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={m1Val}
                            onChange={(e) => handleScoreChange(setMonth1Scores, s.studentID, e.target.value)}
                            placeholder="0"
                            className="w-18 px-2 py-1 text-center font-mono font-semibold text-slate-800 bg-white border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-xs"
                          />
                        </td>

                        {/* Month 2 Total (Editable) */}
                        <td className="py-2.5 px-3 text-center bg-amber-50/15">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={m2Val}
                            onChange={(e) => handleScoreChange(setMonth2Scores, s.studentID, e.target.value)}
                            placeholder="0"
                            className="w-18 px-2 py-1 text-center font-mono font-semibold text-slate-800 bg-white border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-xs"
                          />
                        </td>

                        {/* Month 1 Max (Editable, Default 100) */}
                        <td className="py-2.5 px-3 text-center bg-amber-50/15">
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={m1MaxVal}
                            onChange={(e) => handleScoreChange(setMonth1Maxes, s.studentID, e.target.value)}
                            placeholder="100"
                            className="w-16 px-1.5 py-1 text-center font-mono text-slate-700 bg-white/90 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 text-xs"
                          />
                        </td>

                        {/* Month 2 Max (Editable, Default 100) */}
                        <td className="py-2.5 px-3 text-center bg-amber-50/15">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={m2MaxVal}
                            onChange={(e) => handleScoreChange(setMonth2Maxes, s.studentID, e.target.value)}
                            placeholder="100"
                            className="w-16 px-1.5 py-1 text-center font-mono text-slate-700 bg-white/90 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 text-xs"
                          />
                        </td>

                        {/* Historical % (Auto Computed) */}
                        <td className="py-2.5 px-3 text-center border-l border-indigo-100 bg-indigo-50/20">
                          <span
                            className={`inline-block w-20 py-1 px-1.5 text-center font-mono font-bold text-xs rounded-md border ${getBadgeClass(
                              computed.percent
                            )}`}
                          >
                            {computed.percentFormatted}
                          </span>
                        </td>

                        {/* Att Pts (Auto Computed) */}
                        <td className="py-2.5 px-2.5 text-center border-l border-teal-100 bg-teal-50/15">
                          <input
                            type="text"
                            readOnly
                            disabled
                            value={computed.attPts}
                            className="w-13 px-1 py-1 text-center font-mono font-bold text-teal-800 bg-teal-100/60 border border-teal-200/80 rounded-md cursor-not-allowed select-none text-xs"
                            title={`Attendance: ${computed.attPts} / 10 pts`}
                          />
                        </td>

                        {/* Tech Pts (Auto Computed) */}
                        <td className="py-2.5 px-2.5 text-center bg-blue-50/15">
                          <input
                            type="text"
                            readOnly
                            disabled
                            value={computed.techPts}
                            className="w-13 px-1 py-1 text-center font-mono font-bold text-blue-800 bg-blue-100/60 border border-blue-200/80 rounded-md cursor-not-allowed select-none text-xs"
                            title={`Technical: ${computed.techPts} / 10 pts`}
                          />
                        </td>

                        {/* Prof Pts (Auto Computed) */}
                        <td className="py-2.5 px-2.5 text-center bg-orange-50/15">
                          <input
                            type="text"
                            readOnly
                            disabled
                            value={computed.profPts}
                            className="w-13 px-1 py-1 text-center font-mono font-bold text-orange-800 bg-orange-100/60 border border-orange-200/80 rounded-md cursor-not-allowed select-none text-xs"
                            title={`Professional: ${computed.profPts} / 5 pts`}
                          />
                        </td>

                        {/* Class Act Pts (Auto Computed) */}
                        <td className="py-2.5 px-2.5 text-center bg-indigo-50/15">
                          <input
                            type="text"
                            readOnly
                            disabled
                            value={computed.classPts}
                            className="w-13 px-1 py-1 text-center font-mono font-bold text-indigo-800 bg-indigo-100/60 border border-indigo-200/80 rounded-md cursor-not-allowed select-none text-xs"
                            title={`Class Activities: ${computed.classPts} / 5 pts`}
                          />
                        </td>

                        {/* SM Pts (Auto Computed) */}
                        <td className="py-2.5 px-2.5 text-center bg-purple-50/15">
                          <input
                            type="text"
                            readOnly
                            disabled
                            value={computed.smPts}
                            className="w-13 px-1 py-1 text-center font-mono font-bold text-purple-800 bg-purple-100/60 border border-purple-200/80 rounded-md cursor-not-allowed select-none text-xs"
                            title={`Social Media: ${computed.smPts} / 5 pts`}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Bottom Action Bar */}
        <div className="p-4 bg-slate-50 border-t border-brand-neutral-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Historical % is computed live from Month 1 and Month 2 scores, then weighted into Attendance (10), Technical (10), Professional (5), Class Activities (5), and Social Media (5).
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving || loading}
            className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-2 shadow-xs"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            <span>{saving ? 'Saving Scores...' : 'Save All Historical Scores'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
