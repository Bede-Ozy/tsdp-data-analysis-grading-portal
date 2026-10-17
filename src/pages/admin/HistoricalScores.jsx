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
  Award,
  Calculator,
  Info,
  Check
} from 'lucide-react';

export default function HistoricalScores() {
  const { user } = useAuth();
  const coachID = user?.coachID || user?.id || user?.adminID || user?.username || 'ADMIN';

  // Data states
  const [students, setStudents] = useState([]);
  const [attPercent, setAttPercent] = useState({});
  const [techPercent, setTechPercent] = useState({});
  const [profPercent, setProfPercent] = useState({});
  const [classActPercent, setClassActPercent] = useState({});
  const [socialPercent, setSocialPercent] = useState({});

  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All');
  const [notification, setNotification] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load students & historical scores
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

      // Initialize percentage state for each student
      const newAtt = {};
      const newTech = {};
      const newProf = {};
      const newClassAct = {};
      const newSocial = {};

      stdList.forEach((s) => {
        const sKey = String(s.studentID || s.id || '').trim().toLowerCase();
        const saved = histMap.get(sKey);

        if (saved) {
          // Saved points conversion:
          // Attendance% = (histAttendance / 10) * 100
          // Technical% = (histTechnical / 10) * 100
          // Professional% = (histProfessional / 5) * 100
          // ClassActivities% = (histClassActivities / 5) * 100
          // SocialMedia% = (histSocialMedia / 5) * 100
          const hAtt = Number(saved.histAttendance ?? saved.attendance ?? 0);
          const hTech = Number(saved.histTechnical ?? saved.technical ?? 0);
          const hProf = Number(saved.histProfessional ?? saved.professional ?? 0);
          const hClass = Number(saved.histClassActivities ?? saved.classActivities ?? 0);
          const hSocial = Number(saved.histSocialMedia ?? saved.socialMedia ?? 0);

          newAtt[s.studentID] = hAtt > 0 ? Math.round(((hAtt / 10) * 100) * 100) / 100 : 0;
          newTech[s.studentID] = hTech > 0 ? Math.round(((hTech / 10) * 100) * 100) / 100 : 0;
          newProf[s.studentID] = hProf > 0 ? Math.round(((hProf / 5) * 100) * 100) / 100 : 0;
          newClassAct[s.studentID] = hClass > 0 ? Math.round(((hClass / 5) * 100) * 100) / 100 : 0;
          newSocial[s.studentID] = hSocial > 0 ? Math.round(((hSocial / 5) * 100) * 100) / 100 : 0;
        } else {
          // Default all to 0
          newAtt[s.studentID] = 0;
          newTech[s.studentID] = 0;
          newProf[s.studentID] = 0;
          newClassAct[s.studentID] = 0;
          newSocial[s.studentID] = 0;
        }
      });

      setStudents(stdList);
      setAttPercent(newAtt);
      setTechPercent(newTech);
      setProfPercent(newProf);
      setClassActPercent(newClassAct);
      setSocialPercent(newSocial);
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

  // Compute live points helpers (rounded to 2 decimals)
  const calcAttPts = (pct) => (((Number(pct) || 0) / 100) * 10).toFixed(2);
  const calcTechPts = (pct) => (((Number(pct) || 0) / 100) * 10).toFixed(2);
  const calcProfPts = (pct) => (((Number(pct) || 0) / 100) * 5).toFixed(2);
  const calcClassActPts = (pct) => (((Number(pct) || 0) / 100) * 5).toFixed(2);
  const calcSocialPts = (pct) => (((Number(pct) || 0) / 100) * 5).toFixed(2);

  // Input change handler with 0-100 clamp
  const handlePercentChange = (setter, studentID, rawVal) => {
    let val = rawVal === '' ? '' : Number(rawVal);
    if (val !== '' && !isNaN(val)) {
      if (val < 0) val = 0;
      if (val > 100) val = 100;
    }
    setter((prev) => ({
      ...prev,
      [studentID]: val
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

  // Save All Historical Scores
  const handleSaveAll = async () => {
    setSaving(true);
    setNotification(null);

    try {
      const scoresArray = students.map((s) => {
        const attVal = Number(attPercent[s.studentID]) || 0;
        const techVal = Number(techPercent[s.studentID]) || 0;
        const profVal = Number(profPercent[s.studentID]) || 0;
        const classActVal = Number(classActPercent[s.studentID]) || 0;
        const socialVal = Number(socialPercent[s.studentID]) || 0;

        return {
          studentID: s.studentID,
          firstName: s.firstName || (s.name ? s.name.split(' ')[0] : '') || '',
          lastName: s.lastName || (s.name ? s.name.split(' ').slice(1).join(' ') : '') || '',
          histAttendance: Number(((attVal / 100) * 10).toFixed(2)),
          histTechnical: Number(((techVal / 100) * 10).toFixed(2)),
          histProfessional: Number(((profVal / 100) * 5).toFixed(2)),
          histClassActivities: Number(((classActVal / 100) * 5).toFixed(2)),
          histSocialMedia: Number(((socialVal / 100) * 5).toFixed(2)),
          notes: ''
        };
      });

      // Save to localStorage as immediate offline cache
      try {
        localStorage.setItem('tsdp_historical_scores_cache', JSON.stringify(scoresArray));
      } catch (e) {
        // Ignore storage errors
      }

      // Call backend API
      const res = await saveHistoricalScores(scoresArray, coachID);

      if (res && res.success !== false) {
        setNotification({
          type: 'success',
          message: res.message || `Updated ${scoresArray.length} students`
        });
        setHasUnsavedChanges(false);
        // Reload data from backend to confirm as requested
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

        {/* Action Controls Suite */}
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

      {/* Component Formula Legend Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-teal-800 text-xs font-bold">
            <span>Attendance</span>
            <span className="bg-teal-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">10 Pts</span>
          </div>
          <p className="text-[11px] text-teal-700 mt-1 font-mono">
            (Att% ÷ 100) × 10
          </p>
        </div>

        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-blue-800 text-xs font-bold">
            <span>Technical</span>
            <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">10 Pts</span>
          </div>
          <p className="text-[11px] text-blue-700 mt-1 font-mono">
            (Tech% ÷ 100) × 10
          </p>
        </div>

        <div className="bg-orange-50/70 border border-orange-200/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-orange-800 text-xs font-bold">
            <span>Professional</span>
            <span className="bg-orange-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">5 Pts</span>
          </div>
          <p className="text-[11px] text-orange-700 mt-1 font-mono">
            (Prof% ÷ 100) × 5
          </p>
        </div>

        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-indigo-800 text-xs font-bold">
            <span>Class Activities</span>
            <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">5 Pts</span>
          </div>
          <p className="text-[11px] text-indigo-700 mt-1 font-mono">
            (ClassAct% ÷ 100) × 5
          </p>
        </div>

        <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-3 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-purple-800 text-xs font-bold">
            <span>Social Media</span>
            <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">5 Pts</span>
          </div>
          <p className="text-[11px] text-purple-700 mt-1 font-mono">
            (Social% ÷ 100) × 5
          </p>
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

      {/* Unsaved Changes Floating Notice */}
      {hasUnsavedChanges && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-semibold">You have unsaved historical score edits.</span>
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

        {/* Group Filter & Counts */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
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
              Loading student roster and historical scores...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-brand-neutral-border text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 sticky left-0 bg-slate-100/95 z-10 min-w-[170px]">
                    Student Name
                  </th>
                  <th className="py-3.5 px-4 min-w-[110px]">
                    Student ID
                  </th>

                  {/* Attendance */}
                  <th className="py-3.5 px-3 bg-teal-50/50 text-teal-900 text-center border-l border-teal-100 min-w-[85px]">
                    Attendance %
                  </th>
                  <th className="py-3.5 px-3 bg-teal-50/50 text-teal-900 text-center min-w-[75px]">
                    Att Pts
                  </th>

                  {/* Technical */}
                  <th className="py-3.5 px-3 bg-blue-50/50 text-blue-900 text-center border-l border-blue-100 min-w-[85px]">
                    Technical %
                  </th>
                  <th className="py-3.5 px-3 bg-blue-50/50 text-blue-900 text-center min-w-[75px]">
                    Tech Pts
                  </th>

                  {/* Professional */}
                  <th className="py-3.5 px-3 bg-orange-50/50 text-orange-900 text-center border-l border-orange-100 min-w-[85px]">
                    Professional %
                  </th>
                  <th className="py-3.5 px-3 bg-orange-50/50 text-orange-900 text-center min-w-[75px]">
                    Prof Pts
                  </th>

                  {/* Class Activities */}
                  <th className="py-3.5 px-3 bg-indigo-50/50 text-indigo-900 text-center border-l border-indigo-100 min-w-[85px]">
                    Class Act %
                  </th>
                  <th className="py-3.5 px-3 bg-indigo-50/50 text-indigo-900 text-center min-w-[75px]">
                    Class Act Pts
                  </th>

                  {/* Social Media */}
                  <th className="py-3.5 px-3 bg-purple-50/50 text-purple-900 text-center border-l border-purple-100 min-w-[85px]">
                    Social Media %
                  </th>
                  <th className="py-3.5 px-3 bg-purple-50/50 text-purple-900 text-center min-w-[75px]">
                    Social Media Pts
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
                    const attVal = attPercent[s.studentID] ?? 0;
                    const techVal = techPercent[s.studentID] ?? 0;
                    const profVal = profPercent[s.studentID] ?? 0;
                    const classActVal = classActPercent[s.studentID] ?? 0;
                    const socialVal = socialPercent[s.studentID] ?? 0;

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

                        {/* Attendance % */}
                        <td className="py-2.5 px-3 text-center border-l border-slate-100 bg-teal-50/20">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={attVal}
                            onChange={(e) => handlePercentChange(setAttPercent, s.studentID, e.target.value)}
                            className="w-16 px-2 py-1 text-center font-mono font-semibold text-slate-800 bg-white border border-teal-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-xs"
                          />
                        </td>
                        {/* Att Pts (Disabled) */}
                        <td className="py-2.5 px-3 text-center bg-teal-50/20">
                          <input
                            type="text"
                            readOnly
                            disabled
                            value={calcAttPts(attVal)}
                            className="w-14 px-1.5 py-1 text-center font-mono font-bold text-teal-800 bg-teal-100/60 border border-teal-200/80 rounded-md cursor-not-allowed select-none text-xs"
                          />
                        </td>

                        {/* Technical % */}
                        <td className="py-2.5 px-3 text-center border-l border-slate-100 bg-blue-50/20">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={techVal}
                            onChange={(e) => handlePercentChange(setTechPercent, s.studentID, e.target.value)}
                            className="w-16 px-2 py-1 text-center font-mono font-semibold text-slate-800 bg-white border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-xs"
                          />
                        </td>
                        {/* Tech Pts (Disabled) */}
                        <td className="py-2.5 px-3 text-center bg-blue-50/20">
                          <input
                            type="text"
                            readOnly
                            disabled
                            value={calcTechPts(techVal)}
                            className="w-14 px-1.5 py-1 text-center font-mono font-bold text-blue-800 bg-blue-100/60 border border-blue-200/80 rounded-md cursor-not-allowed select-none text-xs"
                          />
                        </td>

                        {/* Professional % */}
                        <td className="py-2.5 px-3 text-center border-l border-slate-100 bg-orange-50/20">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={profVal}
                            onChange={(e) => handlePercentChange(setProfPercent, s.studentID, e.target.value)}
                            className="w-16 px-2 py-1 text-center font-mono font-semibold text-slate-800 bg-white border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 text-xs"
                          />
                        </td>
                        {/* Prof Pts (Disabled) */}
                        <td className="py-2.5 px-3 text-center bg-orange-50/20">
                          <input
                            type="text"
                            readOnly
                            disabled
                            value={calcProfPts(profVal)}
                            className="w-14 px-1.5 py-1 text-center font-mono font-bold text-orange-800 bg-orange-100/60 border border-orange-200/80 rounded-md cursor-not-allowed select-none text-xs"
                          />
                        </td>

                        {/* Class Activities % */}
                        <td className="py-2.5 px-3 text-center border-l border-slate-100 bg-indigo-50/20">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={classActVal}
                            onChange={(e) => handlePercentChange(setClassActPercent, s.studentID, e.target.value)}
                            className="w-16 px-2 py-1 text-center font-mono font-semibold text-slate-800 bg-white border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-xs"
                          />
                        </td>
                        {/* Class Act Pts (Disabled) */}
                        <td className="py-2.5 px-3 text-center bg-indigo-50/20">
                          <input
                            type="text"
                            readOnly
                            disabled
                            value={calcClassActPts(classActVal)}
                            className="w-14 px-1.5 py-1 text-center font-mono font-bold text-indigo-800 bg-indigo-100/60 border border-indigo-200/80 rounded-md cursor-not-allowed select-none text-xs"
                          />
                        </td>

                        {/* Social Media % */}
                        <td className="py-2.5 px-3 text-center border-l border-slate-100 bg-purple-50/20">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={socialVal}
                            onChange={(e) => handlePercentChange(setSocialPercent, s.studentID, e.target.value)}
                            className="w-16 px-2 py-1 text-center font-mono font-semibold text-slate-800 bg-white border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 text-xs"
                          />
                        </td>
                        {/* Social Media Pts (Disabled) */}
                        <td className="py-2.5 px-3 text-center bg-purple-50/20">
                          <input
                            type="text"
                            readOnly
                            disabled
                            value={calcSocialPts(socialVal)}
                            className="w-14 px-1.5 py-1 text-center font-mono font-bold text-purple-800 bg-purple-100/60 border border-purple-200/80 rounded-md cursor-not-allowed select-none text-xs"
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
            Points are calculated live based on component weights: Attendance (10), Technical (10), Professional (5), Class Activities (5), Social Media (5).
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
